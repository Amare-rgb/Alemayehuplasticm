// routes/checkout.routes.js
const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { requireAuth, optionalAuth } = require('../middleware/auth');

// ============================================
// CREATE CHECKOUT (Supports both Auth & Guest)
// POST /api/checkout
// ============================================
router.post('/', optionalAuth, async (req, res) => {
  try {
    const userId = req.user?.id || null;

    // ✅ NEW: paymentRef + paymentProof are now read from the request
    const {
      productId,
      quantity = 1,
      guestInfo,
      addressId,
      notes,
      paymentMethod,
      paymentRef,
      paymentProof,
      items: requestItems,
    } = req.body;

    let items = [];
    let finalAddressId = null;
    let finalUserId = userId;
    let sourceCartId = null;

    // ── PRIORITY 1: Use items from request (frontend cart) ──
    if (requestItems && Array.isArray(requestItems) && requestItems.length > 0) {
      items = requestItems.map(item => ({
        productId: item.productId,
        name: item.name || 'Product',
        price: Number(item.price),
        quantity: Number(item.quantity) || 1,
        image: item.image || null,
      }));
    }
    // ── PRIORITY 2: Single product checkout ──
    else if (productId) {
      const product = await prisma.product.findUnique({ where: { id: productId } });

      if (!product) {
        return res.status(404).json({ success: false, error: 'Product not found' });
      }

      const finalPrice =
        product.discountPrice &&
        product.discountPrice > 0 &&
        product.discountPrice < product.price
          ? Number(product.discountPrice)
          : Number(product.price);

      items.push({
        productId: product.id,
        name: product.name,
        price: finalPrice,
        quantity: quantity || 1,
        image: product.images?.[0] || null,
      });
    }
    // ── PRIORITY 3: Get items from database cart ──
    else if (userId) {
      let cart = await prisma.cart.findUnique({
        where: { userId: userId },
        include: { items: { include: { product: true } } },
      });

      if (!cart) {
        cart = await prisma.cart.create({
          data: { userId: userId },
          include: { items: { include: { product: true } } },
        });
      }

      if (!cart.items || cart.items.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Your cart is empty. Please add items before checking out.',
        });
      }

      sourceCartId = cart.id;

      items = cart.items.map(cartItem => {
        const finalPrice =
          cartItem.product.discountPrice &&
          cartItem.product.discountPrice > 0 &&
          cartItem.product.discountPrice < cartItem.product.price
            ? Number(cartItem.product.discountPrice)
            : Number(cartItem.product.price);

        return {
          productId: cartItem.productId,
          name: cartItem.product.name,
          price: finalPrice,
          quantity: cartItem.quantity,
          image: cartItem.product.images?.[0] || null,
        };
      });
    } else {
      return res.status(400).json({
        success: false,
        error: 'Please add items to your cart before checking out.',
      });
    }

    // ── Validate items ──
    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No items to checkout. Please add items to your cart.',
      });
    }

    for (const item of items) {
      if (!item.productId) {
        return res.status(400).json({ success: false, error: 'Each item requires a productId' });
      }
      if (!Number.isFinite(item.price) || item.price <= 0) {
        return res.status(400).json({ success: false, error: `Invalid price for item ${item.productId}` });
      }
      if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
        return res.status(400).json({ success: false, error: `Invalid quantity for item ${item.productId}` });
      }
    }

    // ── Verify every productId exists ──
    const productIds = [...new Set(items.map(item => item.productId))];
    const existingProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true },
    });
    const existingIds = new Set(existingProducts.map(p => p.id));
    const missingIds = productIds.filter(id => !existingIds.has(id));

    if (missingIds.length > 0) {
      console.warn('⚠️ Checkout referenced missing product id(s):', missingIds);
      return res.status(400).json({
        success: false,
        error:
          'Some items in your cart are no longer available and were removed. Please refresh your cart and try again.',
        missingProductIds: missingIds,
      });
    }

    // ── Handle Address ──
    if (userId) {
      if (addressId) {
        const address = await prisma.address.findFirst({
          where: { id: addressId, userId: userId },
        });
        if (address) {
          finalAddressId = address.id;
        } else {
          return res.status(400).json({ success: false, error: 'Invalid address selected' });
        }
      } else {
        const userAddresses = await prisma.address.findMany({ where: { userId: userId } });

        if (userAddresses.length === 0) {
          if (guestInfo && guestInfo.address) {
            const newAddress = await prisma.address.create({
              data: {
                userId: userId,
                fullName: guestInfo.name || req.user?.name || 'Valued Customer',
                phone: guestInfo.phone || req.user?.phone || 'N/A',
                street: guestInfo.address,
                city: guestInfo.city || 'Addis Ababa',
                state: 'Ethiopia',
                zip: '0000',
                country: 'Ethiopia',
                isDefault: true,
              },
            });
            finalAddressId = newAddress.id;
          } else {
            return res.status(400).json({
              success: false,
              error:
                'Please add a shipping address. You can add one in your profile or enter it manually.',
            });
          }
        } else {
          finalAddressId = userAddresses[0].id;
        }
      }
    } else {
      // ── Guest checkout ──
      if (!guestInfo) {
        return res.status(400).json({
          success: false,
          error: 'Guest information is required for checkout',
        });
      }

      if (!guestInfo.name || !guestInfo.phone || !guestInfo.address) {
        return res.status(400).json({
          success: false,
          error: 'Name, phone, and address are required for guest checkout',
        });
      }

      const guestUser = await prisma.user.create({
        data: {
          name: guestInfo.name,
          email: guestInfo.email || `guest_${Date.now()}@temp.com`,
          phone: guestInfo.phone,
          password: 'GUEST_TEMP_' + Date.now(),
          role: 'USER',
        },
      });

      finalUserId = guestUser.id;

      const guestAddress = await prisma.address.create({
        data: {
          userId: guestUser.id,
          fullName: guestInfo.name,
          phone: guestInfo.phone,
          street: guestInfo.address,
          city: guestInfo.city || 'Addis Ababa',
          state: 'Ethiopia',
          zip: '0000',
          country: 'Ethiopia',
          isDefault: true,
        },
      });

      finalAddressId = guestAddress.id;
    }

    // ── Calculate total ──
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    if (total <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Order total must be greater than 0',
      });
    }

    // ── Build payment proof data URL if provided ──
    // Frontend sends: paymentProof = { fileName, mimeType, base64 }
    // We store as:   "data:<mime>;base64,<base64>"
    let paymentProofDataUrl = null;
    if (paymentProof && paymentProof.base64 && paymentProof.mimeType) {
      paymentProofDataUrl = `data:${paymentProof.mimeType};base64,${paymentProof.base64}`;
    }

    // ── Create order (inside a transaction) ──
    const order = await prisma.$transaction(async tx => {
      const createdOrder = await tx.order.create({
        data: {
          userId: finalUserId,
          total: total,
          status: 'PENDING',
          paymentStatus: 'PENDING',
          addressId: finalAddressId,
          notes: notes || '',

          // ✅ NEW: persist payment fields
          paymentMethod: paymentMethod || null,
          paymentRef: paymentRef || null,
          paymentProof: paymentProofDataUrl,

          items: {
            create: items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
            })),
          },
        },
        include: {
          items: {
            include: {
              product: { select: { name: true, images: true } },
            },
          },
          address: true,
          user: { select: { name: true, email: true, phone: true } },
        },
      });

      if (sourceCartId) {
        await tx.cartItem.deleteMany({ where: { cartId: sourceCartId } });
      }

      return createdOrder;
    });

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: {
        order,
        items: items,
        isGuest: !userId,
      },
    });
  } catch (error) {
    console.error('❌ Checkout error:', error.code || '', error.message, error);
    res.status(500).json({
      success: false,
      error: 'Failed to create order',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
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
    paymentMethods: ['Cash on Delivery', 'Bank Transfer', 'Telebirr'],
    status: 'available',
  });
});

// ============================================
// GET CHECKOUT SUMMARY
// GET /api/checkout/summary
// ============================================
router.get('/summary', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    let cart = await prisma.cart.findUnique({
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
                stock: true,
              },
            },
          },
        },
      },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: userId },
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
                  stock: true,
                },
              },
            },
          },
        },
      });
    }

    const addresses = await prisma.address.findMany({
      where: { userId: userId },
      orderBy: { isDefault: 'desc' },
    });

    if (!cart.items || cart.items.length === 0) {
      return res.json({
        success: true,
        data: {
          items: [],
          subtotal: 0,
          tax: 0,
          taxRate: 0.16,
          total: 0,
          addresses: addresses,
          paymentMethods: ['Cash on Delivery', 'Bank Transfer', 'Telebirr'],
          cartEmpty: true,
        },
      });
    }

    let subtotal = 0;
    const items = cart.items.map(item => {
      const price =
        item.product.discountPrice &&
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
        stock: item.product.stock,
      };
    });

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
        paymentMethods: ['Cash on Delivery', 'Bank Transfer', 'Telebirr'],
        cartEmpty: false,
      },
    });
  } catch (error) {
    console.error('❌ Checkout summary error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get checkout summary',
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
    const { paymentMethod, paymentRef, paymentProof } = req.body;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { product: true } } },
    });

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    if (order.userId !== userId) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    if (order.status !== 'PENDING') {
      return res.status(400).json({ success: false, error: 'Order cannot be completed' });
    }

    // Build payment proof data URL if provided
    let paymentProofDataUrl = order.paymentProof;
    if (paymentProof && paymentProof.base64 && paymentProof.mimeType) {
      paymentProofDataUrl = `data:${paymentProof.mimeType};base64,${paymentProof.base64}`;
    }

    const updatedOrder = await prisma.$transaction(async tx => {
      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'COMPLETED',
          paymentStatus: 'PAID',
          paymentMethod: paymentMethod || order.paymentMethod,
          paymentRef: paymentRef || order.paymentRef || 'Manual payment',
          paymentProof: paymentProofDataUrl,
        },
        include: {
          items: { include: { product: true } },
          address: true,
        },
      });

      for (const item of updated.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      return updated;
    });

    res.json({
      success: true,
      message: 'Order completed successfully',
      data: updatedOrder,
    });
  } catch (error) {
    console.error('❌ Complete order error:', error.code || '', error.message, error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete order',
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
              // ✅ FIXED: removed invalid `seller` relation that doesn't exist
              // on the Product model (it was causing a Prisma error).
              select: {
                id: true,
                name: true,
                images: true,
              },
            },
          },
        },
        address: true,
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    // Allow the owner OR an admin to view
    const isOwner = order.userId === userId;
    const isAdmin = req.user?.role === 'ADMIN';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('❌ Get order error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get order',
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

    const order = await prisma.order.findUnique({ where: { id: orderId } });

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    if (order.userId !== userId) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    if (order.status === 'COMPLETED') {
      return res.status(400).json({
        success: false,
        error: 'Cannot cancel completed order',
      });
    }

    const cancelledOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'CANCELLED',
        paymentStatus: 'REFUNDED',
      },
    });

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      data: cancelledOrder,
    });
  } catch (error) {
    console.error('❌ Cancel order error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel order',
    });
  }
});

module.exports = router;