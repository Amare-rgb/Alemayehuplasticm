// routes/orders.routes.js
const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// Get orders with transaction/payment details
router.get('/', requireAuth, async (req, res) => {
  try {
    const { status, paymentStatus, search, page = 1, limit = 10 } = req.query;
    const isAdmin = req.session.user.role === 'ADMIN';

    const where = {};
    
    if (!isAdmin) {
      where.userId = req.session.user.id;
    }
    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (paymentStatus && paymentStatus !== 'ALL') {
      where.paymentStatus = paymentStatus;
    }
    if (search) {
      where.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, name: true, email: true, phone: true }
          },
          items: {
            include: {
              product: { select: { id: true, name: true, images: true, slug: true, price: true } },
            },
          },
          address: true,
        },
      }),
      prisma.order.count({ where }),
    ]);

    const serialized = orders.map(o => ({
      ...o,
      total: Number(o.total),
      paymentMethod: o.paymentMethod || null,
      paymentRef: o.paymentRef || null,
      stripeSessionId: o.stripeSessionId || null,
      items: o.items.map(it => ({
        ...it,
        price: Number(it.price),
        product: {
          id: it.product.id,
          name: it.product.name,
          images: it.product.images,
          slug: it.product.slug,
          price: Number(it.product.price),
        },
      })),
    }));

    // Return paginated response for admin, array for regular users
    if (isAdmin) {
      res.json({
        orders: serialized,
        total,
        pages: Math.ceil(total / parseInt(limit)),
        page: parseInt(page),
      });
    } else {
      res.json(serialized);
    }
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Create order
router.post('/', requireAuth, async (req, res) => {
  try {
    const { addressId, paymentMethod, paymentRef } = req.body;

    const cartItems = await prisma.cartItem.findMany({
      where: { userId: req.session.user.id },
      include: { product: true },
    });

    if (cartItems.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    let finalAddressId = addressId;
    if (!finalAddressId) {
      const defaultAddr = await prisma.address.findFirst({
        where: { userId: req.session.user.id },
        orderBy: { isDefault: 'desc' }
      });
      if (defaultAddr) {
        finalAddressId = defaultAddr.id;
      } else {
        const createdAddr = await prisma.address.create({
          data: {
            userId: req.session.user.id,
            fullName: req.session.user.name || 'Valued Customer',
            phone: '+1 555-0100',
            street: 'Main Farm Road',
            city: 'Farmington',
            state: 'State',
            zip: '12345',
            country: 'US',
            isDefault: true,
          }
        });
        finalAddressId = createdAddr.id;
      }
    }

    for (const item of cartItems) {
      if (item.product.stock < item.quantity) {
        return res.status(400).json({
          error: `Insufficient stock for ${item.product.name}`
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
          userId: req.session.user.id,
          addressId: finalAddressId,
          total,
          status: 'PENDING',
          paymentStatus: 'PAID',
          paymentMethod: paymentMethod || 'Credit Card',
          paymentRef: paymentRef || null,
          items: {
            create: cartItems.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.product.discountPrice ?? item.product.price,
            })),
          },
        },
        include: {
          user: {
            select: { id: true, name: true, email: true, phone: true }
          },
          items: {
            include: {
              product: { select: { id: true, name: true, images: true, slug: true, price: true } },
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

      await tx.cartItem.deleteMany({
        where: { userId: req.session.user.id }
      });

      return newOrder;
    });

    res.status(201).json({
      success: true,
      order: {
        ...order,
        total: Number(order.total),
      },
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Update order (Admin only)
router.patch('/', requireAdmin, async (req, res) => {
  try {
    const { orderId, status, paymentStatus, notes } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;
    if (notes !== undefined) updateData.notes = notes;

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: {
        user: { select: { name: true, email: true } },
        items: { include: { product: true } },
        address: true,
      },
    });

    res.json({
      success: true,
      order: {
        ...updated,
        total: Number(updated.total),
      },
      message: `Order updated to ${status || 'new state'}`,
    });
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

module.exports = router;