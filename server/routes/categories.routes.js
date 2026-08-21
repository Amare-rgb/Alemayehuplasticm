const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { requireAdmin, requireAuth } = require('../middleware/auth');
const { getServerSession } = require('../lib/auth');

// Get categories
router.get('/', async (req, res) => {
  try {
    const { parentId, includeChildren, includeProducts } = req.query;
    const session = await getServerSession(req);

    if (parentId) {
      const subcategories = await prisma.category.findMany({
        where: { parentId: parentId },
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
        where: { parentId: null },
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
                where: { status: 'APPROVED' },
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

// Request new category
router.post('/request', requireAuth, async (req, res) => {
  try {
    const { name, slug, description } = req.body;

    if (!name || !slug) {
      return res.status(400).json({ error: 'name and slug required' });
    }

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        description: description || null,
        status: 'PENDING',
        createdBy: req.session.user.id,
      }
    });

    res.status(201).json({ success: true, category });
  } catch (error) {
    console.error('Category request error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;