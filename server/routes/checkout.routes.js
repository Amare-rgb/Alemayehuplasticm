// routes/checkout.routes.js
const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { requireAuth } = require('../middleware/auth');

// ============================================
// CREATE CHECKOUT (No Stripe)
// POST /api/checkout
// ============================================
router.post('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, quantity = 1 } = req.body;

    let items = [];

    // Single product checkout
    if (productId) {
      const product = await prisma.product.findUnique({ 
        where: { id: productId } 
      });
      
      if (!product) {
        return res.status(404).json({ 
          success: false,
          error: 'Product not found' 
        });
      }

      const finalPrice = product.discountPrice && product.discountPrice > 0 && product.discountPrice < product.price
        ? Number(product.discountPrice)
        : Number(product.price);

      items.push({
        productId: product.id,
        name: product.name,
        price: finalPrice,
        quantity: quantity,
        image: product.images?.[0] || null
      });
    } 
    // Cart checkout
    else {
      const cart = await prisma.cart.findUnique({
        where: { userId: userId }
      });

      if (!cart) {
        return res.status(400).json({
          success: false,
          error: 'Cart not found'
        });
      }

      const cartItems = await prisma.cartItem.findMany({
        where: { cartId: cart.id },
        include: { product: true }
      });

      if (!cartItems || cartItems.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Cart is empty'
        });
      }

      items = cartItems.map(cartItem => {
        const finalPrice = cartItem.product.discountPrice && 
          cartItem.product.discountPrice > 0 && 
          cartItem.product.discountPrice < cartItem.product.price
          ? Number(cartItem.product.discountPrice)
          : Number(cartItem.product.price);

        return {
          productId: cartItem.productId,
          name: cartItem.product.name,
          price: finalPrice,
          quantity: cartItem.quantity,
          image: cartItem.product.images?.[0] || null
        };
      });
    }

    // Calculate total
    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Get user's default address
    const defaultAddress = await prisma.address.findFirst({
      where: { 
        userId: userId,
        isDefault: true 
      }
    });

    if (!defaultAddress) {
      return res.status(400).json({
        success: false,
        error: 'Please add a shipping address before checkout'
      });
    }

    // Create order
    const order = await prisma.order.create({
      data: {
        userId: userId,
        total: total,
        status: 'PENDING',
        paymentStatus: 'UNPAID',
        addressId: defaultAddress.id,
        items: {
          create: items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price
          }))
        }
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
                images: true
              }
            }
          }
        },
        address: true,
        user: {
          select: {
            name: true,
            email: true,
            phone: true
          }
        }
      }
    });

    // Clear cart items after order creation
    if (!productId) {
      await prisma.cartItem.deleteMany({
        where: { userId: userId }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: {
        order,
        items: items
      }
    });

  } catch (error) {
    console.error('❌ Checkout error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create order',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ============================================
// GET CHECKOUT STATUS
// GET /api/checkout
// ============================================
router.get('/', (req, res) => {
  res.json({
    success: true,
    configured: true,
    message: 'Checkout is configured for manual order processing',
    paymentMethods: ['Cash on Delivery', 'Bank Transfer'],
    status: 'available'
  });
});

// ============================================
// GET CHECKOUT SUMMARY
// GET /api/checkout/summary
// ============================================
router.get('/summary', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's cart
    const cart = await prisma.cart.findUnique({
      where: { userId: userId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                discountPrice: true,
                images: true,
                stock: true
              }
            }
          }
        }
      }
    });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Cart is empty'
      });
    }

    // Calculate totals
    let subtotal = 0;
    const items = cart.items.map(item => {
      const price = item.product.discountPrice && 
        item.product.discountPrice > 0 && 
        item.product.discountPrice < item.product.price
        ? Number(item.product.discountPrice)
        : Number(item.product.price);
      
      subtotal += price * item.quantity;
      
      return {
        productId: item.productId,
        name: item.product.name,
        price: price,
        quantity: item.quantity,
        image: item.product.images?.[0] || null,
        stock: item.product.stock
      };
    });

    // Get user's addresses
    const addresses = await prisma.address.findMany({
      where: { userId: userId },
      orderBy: { isDefault: 'desc' }
    });

    // Calculate tax (assuming 16% tax)
    const taxRate = 0.16;
    const tax = subtotal * taxRate;
    const total = subtotal + tax;

    res.json({
      success: true,
      data: {
        items,
        subtotal: subtotal,
        tax: tax,
        taxRate: taxRate,
        total: total,
        addresses: addresses,
        paymentMethods: ['Cash on Delivery', 'Bank Transfer']
      }
    });

  } catch (error) {
    console.error('❌ Checkout summary error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get checkout summary'
    });
  }
});

// ============================================
// COMPLETE ORDER (Manual Payment)
// POST /api/checkout/complete/:orderId
// ============================================
router.post('/complete/:orderId', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderId } = req.params;
    const { paymentMethod, paymentRef } = req.body;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    if (order.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    if (order.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        error: 'Order cannot be completed'
      });
    }

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'PROCESSING',
        paymentStatus: 'PAID',
        paymentRef: paymentRef || 'Manual payment'
      },
      include: {
        items: {
          include: {
            product: true
          }
        },
        address: true
      }
    });

    // Update product stock
    for (const item of updatedOrder.items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: { decrement: item.quantity }
        }
      });
    }

    res.json({
      success: true,
      message: 'Order completed successfully',
      data: updatedOrder
    });

  } catch (error) {
    console.error('❌ Complete order error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete order'
    });
  }
});

// ============================================
// GET ORDER BY ID
// GET /api/checkout/order/:orderId
// ============================================
router.get('/order/:orderId', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderId } = req.params;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                images: true,
                seller: {
                  include: {
                    user: {
                      select: {
                        name: true,
                        email: true
                      }
                    }
                  }
                }
              }
            }
          }
        },
        address: true,
        user: {
          select: {
            name: true,
            email: true,
            phone: true
          }
        }
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    if (order.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    res.json({
      success: true,
      data: order
    });

  } catch (error) {
    console.error('❌ Get order error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get order'
    });
  }
});

// ============================================
// CANCEL ORDER
// POST /api/checkout/cancel/:orderId
// ============================================
router.post('/cancel/:orderId', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderId } = req.params;

    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    if (order.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    if (order.status === 'DELIVERED') {
      return res.status(400).json({
        success: false,
        error: 'Cannot cancel delivered order'
      });
    }

    const cancelledOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'CANCELLED',
        paymentStatus: 'REFUNDED'
      }
    });

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      data: cancelledOrder
    });

  } catch (error) {
    console.error('❌ Cancel order error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel order'
    });
  }
});

module.exports = router;