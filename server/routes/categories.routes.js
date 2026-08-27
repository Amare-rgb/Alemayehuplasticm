// routes/categories.routes.js
const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { requireAdmin, requireAuth } = require('../middleware/auth');

// ✅ FIXED: Get categories for ADMIN (shows ALL including hidden)
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

// ✅ FIXED: Get categories for USERS (only APPROVED)
router.get('/public', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      where: { status: 'APPROVED' },
      orderBy: { name: 'asc' },
      include: {
        children: {
          where: { status: 'APPROVED' },
          orderBy: { name: 'asc' },
        },
        _count: {
          select: { products: { where: { visibility: 'VISIBLE', status: 'APPROVED' } } },
        },
      },
    });

    res.json(categories);
  } catch (error) {
    console.error('Error fetching public categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Get all categories (shared)
router.get('/', async (req, res) => {
  try {
    const { parentId, includeChildren, includeProducts } = req.query;

    if (parentId) {
      const subcategories = await prisma.category.findMany({
        where: { parentId: parentId, status: 'APPROVED' },
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          image: true,
          icon: true,
          parentId: true,
        }
      });
      return res.json(subcategories);
    }

    if (includeChildren === 'true') {
      const categories = await prisma.category.findMany({
        where: { parentId: null, status: 'APPROVED' },
        select: {
          id: true,
          name: true,
          slug: true,
          image: true,
          icon: true,
          children: {
            select: {
              id: true,
              name: true,
              slug: true,
              image: true,
              icon: true,
            },
            orderBy: { name: 'asc' }
          },
          products: includeProducts === 'true'
            ? {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  images: true,
                  price: true,
                  discountPrice: true,
                },
                where: { status: 'APPROVED', visibility: 'VISIBLE' },
                orderBy: { createdAt: 'desc' },
                take: 4,
              }
            : false,
        },
        orderBy: { name: 'asc' }
      });

      return res.json(categories);
    }

    const categories = await prisma.category.findMany({
      where: { status: 'APPROVED' },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        image: true,
        icon: true,
        parentId: true,
        createdBy: true,
      }
    });

    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// ✅ FIXED: Get single category
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        children: true,
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

// ✅ FIXED: Update category status (Admin only)
router.patch('/:id/status', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['APPROVED', 'INACTIVE', 'HIDDEN', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const category = await prisma.category.update({
      where: { id },
      data: { status },
    });

    // If category is hidden/inactive, hide all products in this category
    if (status === 'HIDDEN' || status === 'INACTIVE') {
      await prisma.product.updateMany({
        where: { categoryId: id },
        data: { visibility: 'HIDDEN' },
      });

      // Also hide subcategories
      await prisma.category.updateMany({
        where: { parentId: id },
        data: { status: 'INACTIVE' },
      });
    }

    // If category is approved, show all products in this category
    if (status === 'APPROVED') {
      await prisma.product.updateMany({
        where: { categoryId: id },
        data: { visibility: 'VISIBLE' },
      });

      // Also show subcategories
      await prisma.category.updateMany({
        where: { parentId: id },
        data: { status: 'APPROVED' },
      });
    }

    res.json({
      success: true,
      message: `Category ${status === 'APPROVED' ? 'shown' : 'hidden'} successfully`,
      category,
    });
  } catch (error) {
    console.error('Error updating category status:', error);
    res.status(500).json({ error: 'Failed to update category status' });
  }
});

// ✅ NEW: Bulk update category visibility (Admin only)
router.patch('/bulk-visibility', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { visibility, categoryIds } = req.body;

    if (!visibility || !['VISIBLE', 'HIDDEN'].includes(visibility)) {
      return res.status(400).json({ error: 'Invalid visibility value' });
    }

    if (!categoryIds || !Array.isArray(categoryIds) || categoryIds.length === 0) {
      return res.status(400).json({ error: 'Category IDs are required' });
    }

    // Update all categories
    await prisma.category.updateMany({
      where: { id: { in: categoryIds } },
      data: { status: visibility === 'VISIBLE' ? 'APPROVED' : 'HIDDEN' },
    });

    // Update all products in these categories
    const result = await prisma.product.updateMany({
      where: { categoryId: { in: categoryIds } },
      data: { visibility },
    });

    res.json({
      success: true,
      message: `Products in ${categoryIds.length} categor${categoryIds.length === 1 ? 'y' : 'ies'} ${visibility === 'VISIBLE' ? 'shown' : 'hidden'} successfully`,
      count: result.count,
    });
  } catch (error) {
    console.error('Error bulk updating category visibility:', error);
    res.status(500).json({ error: 'Failed to update category visibility' });
  }
});

// Create category
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { name, slug, description, parentId, image, icon } = req.body;

    if (!name || !slug) {
      return res.status(400).json({ error: 'Name and slug are required' });
    }

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        description,
        parentId,
        image,
        icon,
        createdBy: req.session.user.id,
        status: 'APPROVED',
      }
    });

    res.status(201).json(category);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

module.exports = router;