// routes/admin.dashboard.js
const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// ═══════════════════════════════════════════════════════════
// Order / OrderItem / Article / Cart / CartItem models were
// REMOVED from the Prisma schema. This file no longer queries
// them. The dashboard shows: total products, total customers,
// and recent products.
// ═══════════════════════════════════════════════════════════

// ============================================================
// GET /api/admin/dashboard — Main dashboard stats
// ============================================================
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    console.log('🔍 Fetching dashboard data...');

    // ---------------------------------------------------------
    // 1. BASIC COUNTS (no orders — model removed)
    // ---------------------------------------------------------
    const [totalProducts, totalCustomers] = await Promise.all([
      prisma.product.count(),
      prisma.user.count({ where: { role: 'USER' } }),
    ]);

    // ---------------------------------------------------------
    // 2. RECENT PRODUCTS (last 5, newest first)
    // ---------------------------------------------------------
    const recentProducts = await prisma.product.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        price: true,
        discountPrice: true,
        stock: true,
        sku: true,
        images: true, // String[] — Cloudinary URLs
        createdAt: true,
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    // ---------------------------------------------------------
    // 3. FORMAT RECENT PRODUCTS
    // ---------------------------------------------------------
    const formattedRecentProducts = recentProducts.map((p) => ({
      id: p.id,
      name: p.name,
      price: Number(p.price || 0),
      discountPrice: p.discountPrice ? Number(p.discountPrice) : null,
      stock: typeof p.stock === 'number' ? p.stock : 0,
      sku: p.sku,
      images: Array.isArray(p.images) ? p.images : [],
      category: p.category
        ? { name: p.category.name, slug: p.category.slug }
        : null,
      createdAt: p.createdAt,
    }));

    console.log(
      `📊 Dashboard data fetched (${totalProducts} products, ${totalCustomers} customers, ${formattedRecentProducts.length} recent)`
    );

    // ---------------------------------------------------------
    // 4. RESPONSE
    // ---------------------------------------------------------
    res.json({
      success: true,
      stats: {
        products: totalProducts,
        customers: totalCustomers,
      },
      recentProducts: formattedRecentProducts,
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

module.exports = router;