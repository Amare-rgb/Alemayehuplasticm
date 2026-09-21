// routes/orders.routes.js
const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// ✅ Allowable statuses (NO PROCESSING)
const ALLOWED_STATUSES = ['PENDING', 'SHIPPED', 'COMPLETED', 'CANCELLED', 'REJECTED'];

// ============================================================
// GET /api/orders - Get orders with filters & pagination
// ============================================================
router.get('/', requireAuth, async (req, res) => {
  try {
    const {
      status,
      paymentStatus,
      search,
      page = 1,
      limit = 10,
      sortBy = 'orderNumber',
      sortOrder = 'asc',
    } = req.query;

    const isAdmin = req.session.user?.role === 'ADMIN';
    const userId = req.session.user.id;

    const where = {};

    if (!isAdmin) {
      where.userId = userId;
    }

    if (status && status !== 'ALL') {
      if (!ALLOWED_STATUSES.includes(status)) {
        return res.status(400).json({ error: 'Invalid order status' });
      }
      where.status = status;
    }

    if (paymentStatus && paymentStatus !== 'ALL') {
      where.paymentStatus = paymentStatus;
    }

    if (search) {
      const numeric = Number(search);
      const orConditions = [
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
      if (!Number.isNaN(numeric) && Number.isFinite(numeric)) {
        orConditions.push({ orderNumber: numeric });
      }
      where.OR = orConditions;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);
    const orderBy = {};
    orderBy[sortBy] = sortOrder.toLowerCase() === 'desc' ? 'desc' : 'asc';

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          user: { select: { id: true, name: true, email: true, phone: true, role: true } },
          items: {
            include: {
              product: {
                select: { id: true, name: true, images: true, slug: true, price: true, stock: true },
              },
            },
          },
          address: true,
        },
      }),
      prisma.order.count({ where }),
    ]);

    const serializedOrders = orders.map((order) => ({
      ...order,
      total: Number(order.total),
      paymentMethod: order.paymentMethod || null,
      paymentRef: order.paymentRef || null,
      paymentProof: order.paymentProof || null,
      stripeSessionId: order.stripeSessionId || null,
      items: order.items.map((item) => ({
        ...item,
        price: Number(item.price),
        product: {
          ...item.product,
          price: Number(item.product.price),
          images: item.product.images || [],
        },
      })),
    }));

    res.json({
      orders: serializedOrders,
      total,
      pages: Math.ceil(total / parseInt(limit)),
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error('❌ Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// ============================================================
// GET /api/orders/:orderId - Get single order
// ============================================================
router.get('/:orderId', requireAuth, async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.session.user.id;
    const isAdmin = req.session.user?.role === 'ADMIN';

    const where = { id: orderId };
    if (!isAdmin) {
      where.userId = userId;
    }

    const order = await prisma.order.findFirst({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, role: true } },
        items: {
          include: {
            product: {
              select: { id: true, name: true, images: true, slug: true, price: true, stock: true },
            },
          },
        },
        address: true,
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({
      ...order,
      total: Number(order.total),
      paymentMethod: order.paymentMethod || null,
      paymentRef: order.paymentRef || null,
      paymentProof: order.paymentProof || null,
      items: order.items.map((item) => ({
        ...item,
        price: Number(item.price),
        product: {
          ...item.product,
          price: Number(item.product.price),
          images: item.product.images || [],
        },
      })),
    });
  } catch (error) {
    console.error('❌ Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// ============================================================
// POST /api/orders - Create new order
// ============================================================
router.post('/', requireAuth, async (req, res) => {
  try {
    const { addressId, paymentMethod, paymentRef, paymentStatus = 'PENDING', notes } = req.body;
    const userId = req.session.user.id;

    const cartItems = await prisma.cartItem.findMany({
      where: { userId },
      include: { product: true },
    });

    if (cartItems.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    let finalAddressId = addressId;
    if (!finalAddressId) {
      const defaultAddr = await prisma.address.findFirst({
        where: { userId },
        orderBy: { isDefault: 'desc' },
      });

      if (defaultAddr) {
        finalAddressId = defaultAddr.id;
      } else {
        const createdAddr = await prisma.address.create({
          data: {
            userId,
            fullName: req.session.user.name || 'Valued Customer',
            phone: req.session.user.phone || '+251 911 234 567',
            street: 'Main Farm Road',
            city: 'Addis Ababa',
            state: 'Bole',
            zip: '1000',
            country: 'Ethiopia',
            isDefault: true,
          },
        });
        finalAddressId = createdAddr.id;
      }
    }

    for (const item of cartItems) {
      if (item.product.stock < item.quantity) {
        return res.status(400).json({
          error: `Insufficient stock for ${item.product.name}. Available: ${item.product.stock}`,
        });
      }
    }

    const total = cartItems.reduce((sum, item) => {
      const price = Number(item.product.discountPrice ?? item.product.price);
      return sum + price * item.quantity;
    }, 0);

    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          userId,
          addressId: finalAddressId,
          total,
          status: 'PENDING',
          paymentStatus: paymentStatus || 'PENDING',
          paymentMethod: paymentMethod || 'Cash on Delivery',
          paymentRef: paymentRef || null,
          notes: notes || null,
          items: {
            create: cartItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: Number(item.product.discountPrice ?? item.product.price),
            })),
          },
        },
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
          items: {
            include: {
              product: {
                select: { id: true, name: true, images: true, slug: true, price: true, stock: true },
              },
            },
          },
          address: true,
        },
      });

      for (const item of cartItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      await tx.cartItem.deleteMany({ where: { userId } });

      return newOrder;
    });

    res.status(201).json({
      success: true,
      order: {
        ...order,
        total: Number(order.total),
        paymentMethod: order.paymentMethod || null,
        paymentRef: order.paymentRef || null,
        paymentProof: order.paymentProof || null,
        items: order.items.map((item) => ({
          ...item,
          price: Number(item.price),
          product: {
            ...item.product,
            price: Number(item.product.price),
            images: item.product.images || [],
          },
        })),
      },
      message: 'Order created successfully',
    });
  } catch (error) {
    console.error('❌ Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// ============================================================
// PATCH /api/orders - Update order status (Admin only)
// Handles: SHIPPED, COMPLETED, CANCELLED, REJECTED
// ============================================================
router.patch('/', requireAdmin, async (req, res) => {
  try {
    const { orderId, status, paymentStatus, notes } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    if (status === 'PROCESSING') {
      return res.status(400).json({
        error: 'PROCESSING is no longer a valid status. Use COMPLETED.',
      });
    }

    if (status && !ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({ error: `Invalid status: ${status}` });
    }

    const existingOrder = await prisma.order.findUnique({ where: { id: orderId } });

    if (!existingOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;
    if (notes !== undefined) updateData.notes = notes;

    // Auto-sync payment status with order status
    if (status === 'COMPLETED' && !paymentStatus) {
      updateData.paymentStatus = 'PAID';
    }
    if (status === 'CANCELLED' && !paymentStatus) {
      updateData.paymentStatus = 'REFUNDED';
    }
    if (status === 'REJECTED' && !paymentStatus) {
      updateData.paymentStatus = 'FAILED';
    }

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.order.update({
        where: { id: orderId },
        data: updateData,
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
          items: {
            include: {
              product: {
                select: { id: true, name: true, images: true, slug: true, price: true },
              },
            },
          },
          address: true,
        },
      });

      // If the order is being rejected, restore stock
      if (status === 'REJECTED' && existingOrder.status === 'PENDING') {
        const items = await tx.orderItem.findMany({ where: { orderId } });
        for (const item of items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }
      }

      return result;
    });

    res.json({
      success: true,
      order: {
        ...updated,
        total: Number(updated.total),
        paymentMethod: updated.paymentMethod || null,
        paymentRef: updated.paymentRef || null,
        paymentProof: updated.paymentProof || null,
        items: updated.items.map((item) => ({
          ...item,
          price: Number(item.price),
          product: {
            ...item.product,
            price: Number(item.product.price),
            images: item.product.images || [],
          },
        })),
      },
      message: `Order ${orderId} updated successfully`,
    });
  } catch (error) {
    console.error('❌ Error updating order:', error);
    return res.status(500).json({ error: error.message || 'Failed to update order' });
  }
});

// ============================================================
// DELETE /api/orders/:orderId - Cancel or delete an order
// Regular users can cancel PENDING orders.
// Admins can delete any order (hard delete from DB).
// ============================================================
router.delete('/:orderId', requireAuth, async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.session.user.id;
    const isAdmin = req.session.user?.role === 'ADMIN';

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        ...(!isAdmin && { userId }),
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Admin hard delete
    if (isAdmin) {
      // Restore stock first (order is being removed)
      await prisma.$transaction(async (tx) => {
        const items = await tx.orderItem.findMany({
          where: { orderId },
          select: { productId: true, quantity: true },
        });

        for (const item of items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }

        await tx.orderItem.deleteMany({ where: { orderId } });
        await tx.order.delete({ where: { id: orderId } });
      });

      return res.json({
        success: true,
        message: 'Order deleted successfully',
      });
    }

    // Regular user: can only cancel PENDING orders
    if (order.status !== 'PENDING') {
      return res.status(400).json({
        error: 'Only pending orders can be cancelled',
      });
    }

    await prisma.$transaction(async (tx) => {
      const items = await tx.orderItem.findMany({
        where: { orderId },
        select: { productId: true, quantity: true },
      });

      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }

      await tx.order.update({
        where: { id: orderId },
        data: { status: 'CANCELLED', paymentStatus: 'REFUNDED' },
      });
    });

    res.json({
      success: true,
      message: 'Order cancelled successfully',
    });
  } catch (error) {
    console.error('❌ Error cancelling order:', error);
    res.status(500).json({ error: 'Failed to cancel order' });
  }
});

module.exports = router;