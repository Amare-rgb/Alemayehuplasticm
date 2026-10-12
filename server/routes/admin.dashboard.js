// routes/admin.dashboard.js
const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// ═══════════════════════════════════════════════════════════
// NOTE: OrderStatus / PaymentStatus / ProductStatus enums were
// REMOVED from the Prisma schema. This file now works without them.
// ═══════════════════════════════════════════════════════════

// ============================================================
// GET /api/admin/dashboard - Main dashboard stats
// ============================================================
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    console.log('🔍 Fetching dashboard data...');

    // ---------------------------------------------------------
    // 1. BASIC COUNTS
    // ---------------------------------------------------------
    const [totalProducts, totalOrders, totalCustomers] = await Promise.all([
      prisma.product.count(),
      prisma.order.count(),
      prisma.user.count({ where: { role: 'USER' } }),
    ]);

    // ---------------------------------------------------------
    // 2. TOTAL REVENUE (sum of every order — no status filter)
    // ---------------------------------------------------------
    const revenueAgg = await prisma.order.aggregate({
      _sum: { total: true },
    });
    const totalRevenue = Number(revenueAgg._sum.total || 0);

    // ---------------------------------------------------------
    // 3. RECENT ORDERS (last 10, newest first)
    // ---------------------------------------------------------
    const recentOrders = await prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        items: {
          include: {
            product: {
              select: { id: true, name: true, price: true },
            },
          },
        },
      },
    });

    // ---------------------------------------------------------
    // 4. WEEKLY SALES (last 7 days)
    // ---------------------------------------------------------
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const recentOrdersForWeekly = await prisma.order.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { total: true, createdAt: true },
    });

    // Build a map of the last 7 days (including days with 0 orders)
    const weeklySalesMap = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const key = d.toISOString().split('T')[0];
      weeklySalesMap[key] = { date: key, orders: 0, revenue: 0 };
    }

    for (const o of recentOrdersForWeekly) {
      const key = new Date(o.createdAt).toISOString().split('T')[0];
      if (weeklySalesMap[key]) {
        weeklySalesMap[key].orders += 1;
        weeklySalesMap[key].revenue += Number(o.total || 0);
      }
    }

    const weeklySales = Object.values(weeklySalesMap);

    // ---------------------------------------------------------
    // 5. FORMAT RECENT ORDERS
    // ---------------------------------------------------------
    const formattedRecentOrders = recentOrders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      user: {
        name: order.user?.name || 'Unknown User',
        email: order.user?.email || 'No email',
      },
      items: order.items.map((item) => ({
        product: {
          name: item.product?.name || 'Unknown Product',
        },
        quantity: item.quantity,
      })),
      total: Number(order.total),
      createdAt: order.createdAt,
    }));

    console.log('📊 Dashboard data fetched successfully');

    // ---------------------------------------------------------
    // 6. RESPONSE
    // ---------------------------------------------------------
    res.json({
      success: true,
      stats: {
        revenue: totalRevenue,
        products: totalProducts,
        orders: totalOrders,
        customers: totalCustomers,
        // Kept as 0 placeholders since status tracking was removed
        pendingOrders: 0,
        completedOrders: totalOrders,
      },
      recentOrders: formattedRecentOrders,
      weeklySales: weeklySales.map((day) => ({
        date: day.date,
        orders: Number(day.orders) || 0,
        revenue: Number(day.revenue) || 0,
      })),
    });
  } catch (error) {
    console.error('❌ Dashboard API Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard data',
      message:
        process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// ============================================================
// GET /api/admin/dashboard/overview - Period overview
// ============================================================
router.get('/overview', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { period = 'week' } = req.query;

    const dateFilter = new Date();
    switch (period) {
      case 'week':
        dateFilter.setDate(dateFilter.getDate() - 7);
        break;
      case 'month':
        dateFilter.setMonth(dateFilter.getMonth() - 1);
        break;
      case 'year':
        dateFilter.setFullYear(dateFilter.getFullYear() - 1);
        break;
      default:
        dateFilter.setDate(dateFilter.getDate() - 7);
    }

    const orders = await prisma.order.findMany({
      where: { createdAt: { gte: dateFilter } },
      select: {
        id: true,
        orderNumber: true,
        total: true,
        createdAt: true,
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Total revenue = sum of every order in the period
    const totalRevenue = orders.reduce(
      (sum, o) => sum + Number(o.total || 0),
      0
    );

    const orderStats = {
      total: orders.length,
      completed: orders.length, // every order counts as complete now
      pending: 0,
      shipped: 0,
      cancelled: 0,
    };

    res.json({
      success: true,
      data: {
        period,
        totalRevenue,
        orderStats,
        orders: orders.map((o) => ({ ...o, total: Number(o.total) })),
      },
    });
  } catch (error) {
    console.error('❌ Dashboard Overview Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch overview data',
    });
  }
});

// ============================================================
// GET /api/admin/dashboard/recent-activity
// ============================================================
router.get('/recent-activity', requireAuth, requireAdmin, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const recentOrders = await prisma.order.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
    });

    const recentUsers = await prisma.user.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      where: { role: 'USER' },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    const activities = [
      ...recentOrders.map((order) => ({
        type: 'order',
        id: order.id,
        orderNumber: order.orderNumber,
        user: order.user?.name || order.user?.email || 'Unknown User',
        details: `Placed an order worth ETB ${Number(order.total).toFixed(2)}`,
        timestamp: order.createdAt,
      })),
      ...recentUsers.map((user) => ({
        type: 'user',
        id: user.id,
        user: user.name || user.email,
        details: 'New user registered',
        timestamp: user.createdAt,
      })),
    ]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);

    res.json({
      success: true,
      data: activities,
    });
  } catch (error) {
    console.error('❌ Recent Activity Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recent activity',
    });
  }
});

module.exports = router;