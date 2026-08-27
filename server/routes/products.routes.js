// routes/products.routes.js
const express = require('express');
const router = express.Router();
const slugify = require('slugify');
const prisma = require('../lib/prisma');
const { requireSeller, requireAdmin, requireAuth } = require('../middleware/auth');

// ✅ Get products for ADMIN (shows ALL including hidden)
router.get('/admin/all', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 12, search, categoryId, subCategoryId, status, visibility } = req.query;

    const where = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (categoryId) where.categoryId = categoryId;
    if (subCategoryId) where.subCategoryId = subCategoryId;
    if (status) where.status = status;
    if (visibility) where.visibility = visibility;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          category: { select: { id: true, name: true, slug: true, status: true } },
          subCategory: { select: { id: true, name: true, slug: true, status: true } },
        },
      }),
      prisma.product.count({ where }),
    ]);

    res.json({
      products,
      total,
      pages: Math.ceil(total / parseInt(limit)),
      page: parseInt(page),
    });
  } catch (error) {
    console.error('Error fetching admin products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// ✅ Get products for USERS (only VISIBLE and APPROVED)
router.get('/public', async (req, res) => {
  try {
    const { page = 1, limit = 12, search, categoryId, subCategoryId, sort } = req.query;

    const where = {
      visibility: 'VISIBLE',
      status: 'APPROVED',
      category: {
        status: 'APPROVED'
      },
      ...(subCategoryId ? { subCategory: { status: 'APPROVED' } } : {})
    };

    if (categoryId) where.categoryId = categoryId;
    if (subCategoryId) where.subCategoryId = subCategoryId;

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    let orderBy = { createdAt: 'desc' };
    if (sort === 'price_asc') orderBy = { price: 'asc' };
    if (sort === 'price_desc') orderBy = { price: 'desc' };
    if (sort === 'name_asc') orderBy = { name: 'asc' };
    if (sort === 'name_desc') orderBy = { name: 'desc' };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          subCategory: { select: { id: true, name: true, slug: true } },
        },
      }),
      prisma.product.count({ where }),
    ]);

    res.json({
      products,
      total,
      pages: Math.ceil(total / parseInt(limit)),
      page: parseInt(page),
    });
  } catch (error) {
    console.error('Error fetching public products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// ✅ Get all products (shared for backward compatibility)
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      search,
      sort = 'newest',
      minPrice,
      maxPrice,
      condition,
      brand,
      status: statusParam,
      all = false
    } = req.query;

    const where = {};

    // If not admin and not requesting all, only show visible & approved
    if (!all && !statusParam) {
      where.status = 'APPROVED';
      where.visibility = 'VISIBLE';
      where.category = { status: 'APPROVED' };
    } else if (statusParam && statusParam !== 'ALL') {
      where.status = statusParam;
    }

    if (category) {
      where.category = { slug: category };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { hasSome: [search] } },
      ];
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    if (condition) where.condition = condition;
    if (brand) where.brand = brand;

    const orderBy = sort === 'price_asc' ? { price: 'asc' }
      : sort === 'price_desc' ? { price: 'desc' }
      : { createdAt: 'desc' };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
        include: {
          category: {
            select: { id: true, name: true, slug: true, description: true, image: true, parentId: true, status: true }
          },
          subCategory: {
            select: { id: true, name: true, slug: true, status: true }
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    const productsWithDetails = products.map(product => ({
      ...product,
      price: Number(product.price),
      discountPrice: product.discountPrice ? Number(product.discountPrice) : null,
      pricePerUnit: product.pricePerUnit ? Number(product.pricePerUnit) : null,
      salePrice: product.discountPrice ? Number(product.discountPrice) : null,
    }));

    res.json({
      products: productsWithDetails,
      total,
      pages: Math.ceil(total / parseInt(limit)),
      page: parseInt(page),
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// ✅ Get single product (respects visibility for non-admins)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        category: true,
        subCategory: true,
        reviews: {
          include: {
            user: { select: { name: true, avatar: true } },
          },
        },
      },
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check if product is visible to public
    const authHeader = req.headers.authorization;
    let isAdmin = false;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');
        isAdmin = decoded.role === 'ADMIN';
      } catch (err) {
        // Token invalid, treat as non-admin
      }
    }

    // If product is hidden and user is not admin, return 404
    if (product.visibility === 'HIDDEN' && !isAdmin) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({
      ...product,
      price: Number(product.price),
      discountPrice: product.discountPrice ? Number(product.discountPrice) : null,
      pricePerUnit: product.pricePerUnit ? Number(product.pricePerUnit) : null,
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// ✅ Update product visibility (Admin only)
// CORRECT LOGIC:
// - visibility = 'VISIBLE' → Product is SHOWN to users
// - visibility = 'HIDDEN' → Product is HIDDEN from users
router.patch('/:id/visibility', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { visibility } = req.body;

    if (!visibility || !['VISIBLE', 'HIDDEN'].includes(visibility)) {
      return res.status(400).json({ error: 'Invalid visibility value' });
    }

    const product = await prisma.product.update({
      where: { id },
      data: { visibility },
    });

    res.json({
      success: true,
      // ✅ CORRECT: If visibility is VISIBLE → "shown", if HIDDEN → "hidden"
      message: `Product ${visibility === 'VISIBLE' ? 'shown' : 'hidden'} successfully`,
      product,
    });
  } catch (error) {
    console.error('Error updating product visibility:', error);
    res.status(500).json({ error: 'Failed to update product visibility' });
  }
});

// ✅ Bulk update visibility (Admin only)
router.post('/bulk-visibility', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { visibility, scope, categoryId } = req.body;

    if (!visibility || !['VISIBLE', 'HIDDEN'].includes(visibility)) {
      return res.status(400).json({ error: 'Invalid visibility value' });
    }

    let result;

    if (scope === 'all') {
      // Update ALL products
      result = await prisma.product.updateMany({
        data: { visibility },
      });
    } else if (scope === 'category' && categoryId) {
      // Update products in a specific category
      result = await prisma.product.updateMany({
        where: { categoryId },
        data: { visibility },
      });
    } else {
      return res.status(400).json({ error: 'Invalid scope or missing categoryId' });
    }

    res.json({
      success: true,
      // ✅ CORRECT: If visibility is VISIBLE → "shown", if HIDDEN → "hidden"
      message: `Products ${visibility === 'VISIBLE' ? 'shown' : 'hidden'} successfully`,
      count: result.count,
    });
  } catch (error) {
    console.error('Error bulk updating visibility:', error);
    res.status(500).json({ error: 'Failed to update product visibility' });
  }
});

// ✅ Create product
router.post('/', requireAuth, async (req, res) => {
  try {
    const body = req.body;
    const userId = req.session.user?.id || req.session.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Handle sale price mapping
    let discountPriceValue = body.discountPrice;
    if (body.salePrice !== undefined && body.salePrice !== null && body.salePrice !== '') {
      discountPriceValue = parseFloat(body.salePrice);
    }
    if (discountPriceValue === '' || discountPriceValue === null || discountPriceValue === undefined) {
      discountPriceValue = null;
    }

    // Handle stock
    let stockValue = 0;
    if (body.stock !== undefined && body.stock !== null && body.stock !== '') {
      stockValue = typeof body.stock === 'string' ? parseInt(body.stock, 10) : body.stock;
    }

    const productData = {
      name: body.name,
      description: body.description,
      price: typeof body.price === 'string' ? parseFloat(body.price) : body.price,
      discountPrice: discountPriceValue,
      stock: stockValue,
      sku: body.sku || `SKU-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      images: Array.isArray(body.images) && body.images.length > 0 ? body.images : ['/banners/images.jpeg'],
      tags: Array.isArray(body.tags) ? body.tags : [],
      condition: body.condition || 'NEW',
      warranty: body.warranty || null,
      videoUrl: body.videoUrl || null,
      sizes: body.sizes || null,
      colors: body.colors || null,
      brand: body.brand || null,
      weight: body.weight ? (typeof body.weight === 'string' ? parseFloat(body.weight) : body.weight) : null,
      estimatedDelivery: body.estimatedDelivery || null,
      unitOfMeasurement: body.unitOfMeasurement || 'pcs',
      durationTime: body.durationTime || '1h',
      pricePerUnit: body.pricePerUnit ? (typeof body.pricePerUnit === 'string' ? parseFloat(body.pricePerUnit) : body.pricePerUnit) : null,
      visibility: body.visibility || 'VISIBLE', // ✅ Set visibility (default VISIBLE)
    };

    // Resolve category
    let resolvedCategory = await prisma.category.findFirst({
      where: { OR: [{ id: body.categoryId }, { slug: body.categoryId }] }
    });

    if (!resolvedCategory) {
      resolvedCategory = await prisma.category.findFirst();
      if (!resolvedCategory) {
        resolvedCategory = await prisma.category.create({
          data: {
            name: 'General Agriculture',
            slug: 'general-agriculture',
            description: 'General farm and agricultural supplies',
            status: 'APPROVED',
          }
        });
      }
    }

    let resolvedSubCategoryId = null;
    if (body.subCategoryId) {
      const foundSub = await prisma.category.findFirst({
        where: { OR: [{ id: body.subCategoryId }, { slug: body.subCategoryId }] }
      });
      if (foundSub) resolvedSubCategoryId = foundSub.id;
    }

    const isAdmin = req.session.user?.role === 'ADMIN';

    // Generate slug
    const baseSlug = slugify(productData.name, { lower: true, strict: true, trim: true }) || `product-${Date.now()}`;
    let slug = baseSlug;
    let counter = 1;
    while (await prisma.product.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const product = await prisma.product.create({
      data: {
        ...productData,
        slug,
        categoryId: resolvedCategory.id,
        subCategoryId: resolvedSubCategoryId,
        status: isAdmin ? 'APPROVED' : 'PENDING',
      },
      include: {
        category: true,
        subCategory: true,
      }
    });

    res.status(201).json({
      success: true,
      product: {
        ...product,
        price: Number(product.price),
        discountPrice: product.discountPrice ? Number(product.discountPrice) : null,
        pricePerUnit: product.pricePerUnit ? Number(product.pricePerUnit) : null,
      },
      message: isAdmin ? 'Product created and published!' : 'Product submitted for admin approval'
    });
  } catch (error) {
    console.error('Product creation error:', error);
    res.status(500).json({ 
      error: 'Failed to create product',
      details: error.message,
    });
  }
});

// ✅ Update product
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;
    const userId = req.session.user?.id || req.session.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const existingProduct = await prisma.product.findUnique({ where: { id } });

    if (!existingProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check ownership
    const isAdmin = req.session.user?.role === 'ADMIN';
    if (!isAdmin) {
      // Non-admin can only update their own products
    }

    // Prepare update data
    const updateData = {};

    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.price !== undefined) updateData.price = parseFloat(body.price);
    if (body.discountPrice !== undefined) {
      updateData.discountPrice = body.discountPrice ? parseFloat(body.discountPrice) : null;
    }
    if (body.pricePerUnit !== undefined) {
      updateData.pricePerUnit = body.pricePerUnit ? parseFloat(body.pricePerUnit) : null;
    }
    if (body.stock !== undefined) {
      updateData.stock = typeof body.stock === 'string' ? parseInt(body.stock, 10) : body.stock;
    }
    if (body.images !== undefined) updateData.images = body.images;
    if (body.tags !== undefined) updateData.tags = Array.isArray(body.tags) ? body.tags : [];
    if (body.condition !== undefined) updateData.condition = body.condition;
    if (body.brand !== undefined) updateData.brand = body.brand || null;
    if (body.warranty !== undefined) updateData.warranty = body.warranty || null;
    if (body.videoUrl !== undefined) updateData.videoUrl = body.videoUrl || null;
    if (body.unitOfMeasurement !== undefined) updateData.unitOfMeasurement = body.unitOfMeasurement;
    if (body.durationTime !== undefined) updateData.durationTime = body.durationTime || '1h';
    if (body.weight !== undefined) {
      updateData.weight = body.weight ? (typeof body.weight === 'string' ? parseFloat(body.weight) : body.weight) : null;
    }
    if (body.visibility !== undefined && isAdmin) {
      updateData.visibility = body.visibility;
    }
    if (body.status !== undefined && isAdmin) {
      updateData.status = body.status;
    }

    if (body.categoryId) {
      const cat = await prisma.category.findFirst({
        where: { OR: [{ id: body.categoryId }, { slug: body.categoryId }] },
      });
      if (cat) updateData.categoryId = cat.id;
    }

    if (body.subCategoryId) {
      const subCat = await prisma.category.findFirst({
        where: { OR: [{ id: body.subCategoryId }, { slug: body.subCategoryId }] },
      });
      if (subCat) updateData.subCategoryId = subCat.id;
    }

    const updated = await prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        subCategory: true,
      },
    });

    res.json({
      success: true,
      product: {
        ...updated,
        price: Number(updated.price),
        discountPrice: updated.discountPrice ? Number(updated.discountPrice) : null,
        pricePerUnit: updated.pricePerUnit ? Number(updated.pricePerUnit) : null,
      },
      message: 'Product updated successfully',
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// ✅ Delete product
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.session.user?.id || req.session.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const existingProduct = await prisma.product.findUnique({ where: { id } });

    if (!existingProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Delete related records
    await prisma.$transaction([
      prisma.review.deleteMany({ where: { productId: id } }),
      prisma.cartItem.deleteMany({ where: { productId: id } }),
      prisma.orderItem.deleteMany({ where: { productId: id } }),
    ]);

    // Delete product
    await prisma.product.delete({ where: { id } });

    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

module.exports = router;