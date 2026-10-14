// routes/admin.routes.js
const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { requireAdmin } = require('../middleware/auth');

// ═══════════════════════════════════════════════════════════
// NOTE: Order, OrderItem, Article, Cart, CartItem models were
// REMOVED. This file no longer queries them.
// ═══════════════════════════════════════════════════════════

// ============================================================
// GET /api/admin/users — list all users
// ============================================================
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        avatar: true,
        createdAt: true,
      },
    });

    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================================
// PATCH /api/admin/users — update a user's role
// Only USER and ADMIN are valid roles.
// ============================================================
router.patch('/users', requireAdmin, async (req, res) => {
  try {
    const { userId, role } = req.body;

    if (!userId || !role) {
      return res.status(400).json({ error: 'Missing parameters' });
    }

    const normalizedRole = String(role).toUpperCase();
    if (normalizedRole !== 'USER' && normalizedRole !== 'ADMIN') {
      return res.status(400).json({
        error: 'Invalid role. Allowed values: USER, ADMIN',
      });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { role: normalizedRole },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    res.json({ success: true, user: updated });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================================
// GET /api/admin/stats — dashboard overview counts
// Orders removed — only counts that still exist.
// ============================================================
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const [totalUsers, totalProducts, totalCategories] = await Promise.all([
      prisma.user.count(),
      prisma.product.count(),
      prisma.category.count(),
    ]);

    res.json({
      totalUsers,
      totalProducts,
      totalCategories,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;