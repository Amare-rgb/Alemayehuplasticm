// routes/categories.routes.js
const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { requireAdmin, requireAuth } = require('../middleware/auth');

// Shared select so every endpoint returns the same shape
const CATEGORY_PUBLIC_SELECT = {
  id: true,
  name: true,
  slug: true,
  description: true,
  image: true,
  icon: true,
  color: true,
  parentId: true,
  status: true,
  createdAt: true,
  updatedAt: true,
};

// ============================================================
// ADMIN — Get ALL categories (no status filter)
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
// PUBLIC — Get only APPROVED categories with images
// GET /api/categories/public
// ============================================================
router.get('/public', async (req, res) => {
  try {
    // Fetch all approved categories (parents + children) in one query
    const categories = await prisma.category.findMany({
      where: { status: 'APPROVED' },
      orderBy: [{ parentId: 'asc' }, { name: 'asc' }],
      select: {
        ...CATEGORY_PUBLIC_SELECT,
        _count: {
          select: {
            products: {
              where: { visibility: 'VISIBLE', status: 'APPROVED' },
            },
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
// SHARED — Get categories (flat, or nested, or by parent)
// GET /api/categories
// GET /api/categories?parentId=xxx
// GET /api/categories?includeChildren=true
// ============================================================
router.get('/', async (req, res) => {
  try {
    const { parentId, includeChildren, includeProducts } = req.query;

    // ── Subcategories of a given parent ──
    if (parentId) {
      const subcategories = await prisma.category.findMany({
        where: { parentId, status: 'APPROVED' },
        orderBy: { name: 'asc' },
        select: CATEGORY_PUBLIC_SELECT,
      });
      return res.json(subcategories);
    }

    // ── Nested parent/children ──
    if (includeChildren === 'true') {
      const categories = await prisma.category.findMany({
        where: { parentId: null, status: 'APPROVED' },
        select: {
          ...CATEGORY_PUBLIC_SELECT,
          children: {
            where: { status: 'APPROVED' },
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
                  where: { status: 'APPROVED', visibility: 'VISIBLE' },
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
      where: { status: 'APPROVED' },
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
// GET /api/categories/:id — Single category with children + products
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
          where: { visibility: 'VISIBLE', status: 'APPROVED' },
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
    const {
      name,
      slug,
      description,
      parentId,
      image,
      icon,
      color,
      status,
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    if (!slug) {
      return res.status(400).json({ error: 'Slug is required' });
    }

    const userId = req.session.user?.id || req.session.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!existingUser) {
      return res
        .status(401)
        .json({ error: 'Invalid user session. Please login again.' });
    }

    // ✅ Normalize image path — keep it relative so the frontend can
    //    resolve it via the /uploads rewrite in next.config.ts.
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
        status: status || 'APPROVED',
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
//   Required for the admin to change an existing category's image.
// ============================================================
router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      slug,
      description,
      parentId,
      image,
      icon,
      color,
      status,
    } = req.body;

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
    if (status !== undefined) data.status = status;

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
// PATCH /api/categories/:id/status — Admin only
// ============================================================
router.patch('/:id/status', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (
      !status ||
      !['APPROVED', 'INACTIVE', 'HIDDEN', 'REJECTED', 'PENDING'].includes(
        status
      )
    ) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const category = await prisma.category.update({
      where: { id },
      data: { status },
    });

    if (status === 'HIDDEN' || status === 'INACTIVE') {
      await prisma.product.updateMany({
        where: { categoryId: id },
        data: { visibility: 'HIDDEN' },
      });
      await prisma.category.updateMany({
        where: { parentId: id },
        data: { status: 'INACTIVE' },
      });
    }

    if (status === 'APPROVED') {
      await prisma.product.updateMany({
        where: { categoryId: id },
        data: { visibility: 'VISIBLE' },
      });
      await prisma.category.updateMany({
        where: { parentId: id },
        data: { status: 'APPROVED' },
      });
    }

    res.json({
      success: true,
      message: `Category ${
        status === 'APPROVED' ? 'shown' : 'hidden'
      } successfully`,
      category,
    });
  } catch (error) {
    console.error('Error updating category status:', error);
    res.status(500).json({ error: 'Failed to update category status' });
  }
});

// ============================================================
// PATCH /api/categories/bulk-visibility — Admin only
// ============================================================
router.patch('/bulk-visibility', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { visibility, categoryIds } = req.body;

    if (!visibility || !['VISIBLE', 'HIDDEN'].includes(visibility)) {
      return res.status(400).json({ error: 'Invalid visibility value' });
    }

    if (!categoryIds || !Array.isArray(categoryIds) || categoryIds.length === 0) {
      return res.status(400).json({ error: 'Category IDs are required' });
    }

    await prisma.category.updateMany({
      where: { id: { in: categoryIds } },
      data: { status: visibility === 'VISIBLE' ? 'APPROVED' : 'HIDDEN' },
    });

    const result = await prisma.product.updateMany({
      where: { categoryId: { in: categoryIds } },
      data: { visibility },
    });

    res.json({
      success: true,
      message: `Products in ${categoryIds.length} categor${
        categoryIds.length === 1 ? 'y' : 'ies'
      } ${visibility === 'VISIBLE' ? 'shown' : 'hidden'} successfully`,
      count: result.count,
    });
  } catch (error) {
    console.error('Error bulk updating category visibility:', error);
    res.status(500).json({ error: 'Failed to update category visibility' });
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