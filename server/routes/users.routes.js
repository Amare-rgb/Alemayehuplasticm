// routes/users.routes.js
const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// ============================================================
// Helper — get the authenticated user's ID
// Works with JWT middleware (req.user.id or req.userId)
// ============================================================
function getAuthUserId(req) {
  return req.user?.id || req.userId || null;
}

// ============================================================
// GET /api/users — list all users (Admin only)
// ============================================================
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, role, search } = req.query;

    const where = {};

    // ✅ Only two roles exist: USER and ADMIN
    if (role && role !== 'ALL') {
      where.role = role;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          avatar: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: { orders: true },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      users,
      total,
      pages: Math.ceil(total / parseInt(limit)),
      page: parseInt(page),
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// ============================================================
// GET /api/users/:id — single user (Admin only)
// ============================================================
router.get('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        avatar: true,
        address: true,
        bio: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { orders: true },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// ============================================================
// PATCH /api/users/:id — update user (Admin only)
// ============================================================
router.patch('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { role, name, phone, avatar, address, bio } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { id } });

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // ✅ Only accept USER or ADMIN
    const updateData = {};

    if (role !== undefined) {
      const normalizedRole = String(role).toUpperCase();
      if (normalizedRole !== 'USER' && normalizedRole !== 'ADMIN') {
        return res.status(400).json({
          error: 'Invalid role. Allowed values: USER, ADMIN',
        });
      }
      updateData.role = normalizedRole;
    }

    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (address !== undefined) updateData.address = address;
    if (bio !== undefined) updateData.bio = bio;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        avatar: true,
        address: true,
        bio: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({
      success: true,
      user: updatedUser,
      message: 'User updated successfully',
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// ============================================================
// DELETE /api/users/:id — delete user (Admin only)
// ============================================================
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const authUserId = getAuthUserId(req);

    // ✅ Prevent deleting yourself
    if (authUserId && id === authUserId) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const existingUser = await prisma.user.findUnique({ where: { id } });

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // ✅ Delete related records first
    await prisma.$transaction([
      prisma.review.deleteMany({ where: { userId: id } }),
      prisma.cartItem.deleteMany({ where: { userId: id } }),
      prisma.address.deleteMany({ where: { userId: id } }),
      prisma.orderItem.deleteMany({
        where: { order: { userId: id } },
      }),
      prisma.order.deleteMany({ where: { userId: id } }),
      prisma.chatMessage.deleteMany({ where: { userId: id } }),
    ]);

    // Then delete the user
    await prisma.user.delete({ where: { id } });

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

module.exports = router;