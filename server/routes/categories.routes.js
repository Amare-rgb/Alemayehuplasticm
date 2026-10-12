// routes/categories.routes.js
const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// ============================================================
// Shared select — same shape for every endpoint
// ✅ `status` and `visibility` fields REMOVED (not in schema)
// ============================================================
const CATEGORY_PUBLIC_SELECT = {
  id: true,
  name: true,
  slug: true,
  description: true,
  image: true,
  icon: true,
  color: true,
  parentId: true,
  createdAt: true,
  updatedAt: true,
};

// ============================================================
// Helper — get authenticated user ID (JWT-aware)
// ============================================================
function getAuthUserId(req) {
  return req.user?.id || req.userId || null;
}

// ============================================================
// ADMIN — Get ALL categories
// GET /api/categories/admin/all
// ============================================================
router.get('/admin/all', requireAuth, requireAdmin, async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: {
        children: {
          orderBy: { name: 'asc' },
        },
        _count: {
          select: { products: true },
        },
      },
    });

    res.json(categories);
  } catch (error) {
    console.error('Error fetching admin categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// ============================================================
// PUBLIC — Get all categories (no status filter anymore)
// GET /api/categories/public
// ============================================================
router.get('/public', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: [{ parentId: 'asc' }, { name: 'asc' }],
      select: {
        ...CATEGORY_PUBLIC_SELECT,
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    res.json(categories);
  } catch (error) {
    console.error('Error fetching public categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// ============================================================
// SHARED — Get categories (flat, nested, or by parent)
// ============================================================
router.get('/', async (req, res) => {
  try {
    const { parentId, includeChildren, includeProducts } = req.query;

    // ── Subcategories of a given parent ──
    if (parentId) {
      const subcategories = await prisma.category.findMany({
        where: { parentId },
        orderBy: { name: 'asc' },
        select: CATEGORY_PUBLIC_SELECT,
      });
      return res.json(subcategories);
    }

    // ── Nested parent/children ──
    if (includeChildren === 'true') {
      const categories = await prisma.category.findMany({
        where: { parentId: null },
        select: {
          ...CATEGORY_PUBLIC_SELECT,
          children: {
            select: {
              id: true,
              name: true,
              slug: true,
              description: true,
              image: true,
              icon: true,
              parentId: true,
            },
            orderBy: { name: 'asc' },
          },
          ...(includeProducts === 'true'
            ? {
                products: {
                  orderBy: { createdAt: 'desc' },
                  take: 4,
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                    images: true,
                    price: true,
                    discountPrice: true,
                  },
                },
              }
            : {}),
        },
        orderBy: { name: 'asc' },
      });

      return res.json(categories);
    }

    // ── Flat list ──
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      select: {
        ...CATEGORY_PUBLIC_SELECT,
        createdBy: true,
      },
    });

    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// ============================================================
// GET /api/categories/:id — single category with children + products
// ============================================================
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const category = await prisma.category.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        children: { orderBy: { name: 'asc' } },
        products: {
          select: {
            id: true,
            name: true,
            price: true,
            images: true,
          },
        },
      },
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json(category);
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ error: 'Failed to fetch category' });
  }
});

// ============================================================
// CREATE — POST /api/categories
// ============================================================
router.post('/', requireAuth, async (req, res) => {
  try {
    const { name, slug, description, parentId, image, icon, color } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    if (!slug) {
      return res.status(400).json({ error: 'Slug is required' });
    }

    // ✅ Get user ID from JWT middleware (not session)
    const userId = getAuthUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Verify user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!existingUser) {
      return res
        .status(401)
        .json({ error: 'Invalid user session. Please login again.' });
    }

    // Normalize image path
    let normalizedImage = image || null;
    if (normalizedImage && typeof normalizedImage === 'string') {
      normalizedImage = normalizedImage.trim();
      if (!normalizedImage.startsWith('http')) {
        normalizedImage = normalizedImage.startsWith('/')
          ? normalizedImage
          : `/${normalizedImage}`;
      }
      if (!normalizedImage) normalizedImage = null;
    }

    // ✅ `status` field REMOVED from create
    const category = await prisma.category.create({
      data: {
        name,
        slug,
        description: description || null,
        parentId: parentId || null,
        image: normalizedImage,
        icon: icon || null,
        color: color || null,
        createdBy: existingUser.id,
      },
    });

    res.status(201).json(category);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// ============================================================
// UPDATE — PUT /api/categories/:id
// ============================================================
router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, description, parentId, image, icon, color } = req.body;

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const data = {};
    if (name !== undefined) data.name = name;
    if (slug !== undefined) data.slug = slug;
    if (description !== undefined) data.description = description || null;
    if (parentId !== undefined) data.parentId = parentId || null;
    if (icon !== undefined) data.icon = icon || null;
    if (color !== undefined) data.color = color || null;

    if (image !== undefined) {
      let normalizedImage = image;
      if (normalizedImage && typeof normalizedImage === 'string') {
        normalizedImage = normalizedImage.trim();
        if (normalizedImage && !normalizedImage.startsWith('http')) {
          normalizedImage = normalizedImage.startsWith('/')
            ? normalizedImage
            : `/${normalizedImage}`;
        }
        if (!normalizedImage) normalizedImage = null;
      }
      data.image = normalizedImage;
    }

    const updated = await prisma.category.update({
      where: { id },
      data,
    });

    res.json(updated);
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// ============================================================
// DELETE — DELETE /api/categories/:id
// ============================================================
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { products: true, children: true } } },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Category not found' });
    }

    if (existing._count.products > 0) {
      return res.status(400).json({
        error:
          'Cannot delete a category that still has products. Move or delete the products first.',
      });
    }

    if (existing._count.children > 0) {
      return res.status(400).json({
        error:
          'Cannot delete a category that has subcategories. Delete the subcategories first.',
      });
    }

    await prisma.category.delete({ where: { id } });

    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

module.exports = router;