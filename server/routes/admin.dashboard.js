// routes/admin.dashboard.js
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { requireAuth, requireAdmin } = require('../middleware/auth');

// GET /api/admin/dashboard - Main dashboard stats
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    console.log('🔍 Fetching dashboard data...');

    // Get real-time statistics
    const [
      totalRevenue,
      totalProducts,
      totalOrders,
      totalCustomers,
      pendingOrders,
      completedOrders,
      recentOrders,
      weeklySales
    ] = await Promise.all([
      // Total Revenue from completed orders
      prisma.order.aggregate({
        where: { 
          status: 'COMPLETED',
          paymentStatus: 'PAID'
        },
        _sum: { 
          total: true 
        }
      }),
      
      // Total Products (approved)
      prisma.product.count({
        where: { 
          status: 'APPROVED' 
        }
      }),
      
      // Total Orders
      prisma.order.count(),
      
      // Total Customers (users with role USER)
      prisma.user.count({
        where: { 
          role: 'USER' 
        }
      }),
      
      // Pending Orders
      prisma.order.count({
        where: { 
          status: 'PENDING' 
        }
      }),
      
      // Completed Orders
      prisma.order.count({
        where: { 
          status: 'COMPLETED' 
        }
      }),
      
      // Recent Orders (last 10)
      prisma.order.findMany({
        take: 10,
        orderBy: { 
          createdAt: 'desc' 
        },
        include: {
          user: {
            select: { 
              id: true,
              name: true, 
              email: true 
            }
          },
          items: {
            include: {
              product: {
                select: { 
                  id: true,
                  name: true,
                  price: true
                }
              }
            }
          }
        }
      }),
      
      // Weekly Sales Data (last 7 days) - Using correct table name "orders"
      prisma.$queryRaw`
        SELECT 
          DATE("createdAt") as date,
          COUNT(*) as orders,
          SUM(total) as revenue
        FROM "orders"
        WHERE "createdAt" >= NOW() - INTERVAL '7 days'
          AND status = 'COMPLETED'
          AND "paymentStatus" = 'PAID'
        GROUP BY DATE("createdAt")
        ORDER BY date ASC
      `
    ]);

    console.log('📊 Data fetched successfully');

    // Format the response
    const formattedRecentOrders = recentOrders.map(order => ({
      id: order.id,
      user: {
        name: order.user?.name || 'Unknown User',
        email: order.user?.email || 'No email'
      },
      items: order.items.map(item => ({
        product: {
          name: item.product?.name || 'Unknown Product'
        },
        quantity: item.quantity
      })),
      total: order.total,
      status: order.status,
      paymentMethod: order.paymentMethod || 'Not specified',
      createdAt: order.createdAt
    }));

    res.json({
      success: true,
      stats: {
        revenue: totalRevenue._sum.total || 0,
        products: totalProducts,
        orders: totalOrders,
        customers: totalCustomers,
        pendingOrders: pendingOrders,
        completedOrders: completedOrders
      },
      recentOrders: formattedRecentOrders,
      weeklySales: weeklySales.map(day => ({
        date: day.date,
        orders: Number(day.orders) || 0,
        revenue: Number(day.revenue) || 0
      }))
    });

  } catch (error) {
    console.error('❌ Dashboard API Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard data',
      message: error.message
    });
  }
});

// GET /api/admin/dashboard/overview - Period overview
router.get('/overview', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { period = 'week' } = req.query;
    
    let dateFilter = new Date();
    switch(period) {
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
      where: {
        createdAt: {
          gte: dateFilter
        }
      },
      select: {
        id: true,
        total: true,
        status: true,
        paymentStatus: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const totalRevenue = orders
      .filter(o => o.status === 'COMPLETED' && o.paymentStatus === 'PAID')
      .reduce((sum, o) => sum + Number(o.total), 0);

    const orderStats = {
      total: orders.length,
      completed: orders.filter(o => o.status === 'COMPLETED').length,
      pending: orders.filter(o => o.status === 'PENDING').length,
      cancelled: orders.filter(o => o.status === 'CANCELLED').length
    };

    res.json({
      success: true,
      data: {
        period,
        totalRevenue,
        orderStats,
        orders
      }
    });

  } catch (error) {
    console.error('❌ Dashboard Overview Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch overview data'
    });
  }
});

// GET /api/admin/dashboard/recent-activity - Recent activity
router.get('/recent-activity', requireAuth, requireAdmin, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const recentOrders = await prisma.order.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    const recentUsers = await prisma.user.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      where: {
        role: 'USER'
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true
      }
    });

    // Combine and format activity
    const activities = [
      ...recentOrders.map(order => ({
        type: 'order',
        id: order.id,
        user: order.user?.name || order.user?.email || 'Unknown User',
        details: `Placed an order worth $${Number(order.total).toFixed(2)}`,
        timestamp: order.createdAt,
        status: order.status
      })),
      ...recentUsers.map(user => ({
        type: 'user',
        id: user.id,
        user: user.name || user.email,
        details: 'New user registered',
        timestamp: user.createdAt
      }))
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
     .slice(0, limit);

    res.json({
      success: true,
      data: activities
    });

  } catch (error) {
    console.error('❌ Recent Activity Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recent activity'
    });
  }
});

module.exports = router;