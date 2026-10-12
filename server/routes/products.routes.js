// routes/products.routes.js
const express = require('express');
const router = express.Router();
const slugify = require('slugify');
const prisma = require('../lib/prisma');
const {
  requireAdmin,
  requireAuth,
} = require('../middleware/auth');

// ═══════════════════════════════════════════════════════════
// NOTE: `status` and `visibility` fields were REMOVED from
// Product and Category models. All products are public now.
// ═══════════════════════════════════════════════════════════

// ============================================================
// GET /api/products/admin/all — Admin view (all products)
// ============================================================
router.get('/admin/all', requireAuth, requireAdmin, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      search,
      categoryId,
      subCategoryId,
    } = req.query;

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

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          category: { select: { id: true, name: true, slug: true } },
          subCategory: { select: { id: true, name: true, slug: true } },
        },
      }),
      prisma.product.count({ where }),
    ]);

    const productsWithNumbers = products.map((p) => ({
      ...p,
      price: Number(p.price),
      discountPrice: p.discountPrice ? Number(p.discountPrice) : null,
      pricePerUnit: p.pricePerUnit ? Number(p.pricePerUnit) : null,
    }));

    res.json({
      products: productsWithNumbers,
      total,
      pages: Math.ceil(total / parseInt(limit)),
      page: parseInt(page),
    });
  } catch (error) {
    console.error('Error fetching admin products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// ============================================================
// GET /api/products/public — Public product list
// ============================================================
router.get('/public', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      search,
      categoryId,
      subCategoryId,
      sort,
    } = req.query;

    const where = {};

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

    const productsWithNumbers = products.map((p) => ({
      ...p,
      price: Number(p.price),
      discountPrice: p.discountPrice ? Number(p.discountPrice) : null,
      pricePerUnit: p.pricePerUnit ? Number(p.pricePerUnit) : null,
      salePrice: p.discountPrice ? Number(p.discountPrice) : null,
    }));

    res.json({
      products: productsWithNumbers,
      total,
      pages: Math.ceil(total / parseInt(limit)),
      page: parseInt(page),
    });
  } catch (error) {
    console.error('Error fetching public products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// ============================================================
// GET /api/products — Backward-compatible product list
// ============================================================
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
      brand,
    } = req.query;

    const where = {};

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

    if (brand) where.brand = brand;

    const orderBy =
      sort === 'price_asc'
        ? { price: 'asc' }
        : sort === 'price_desc'
        ? { price: 'desc' }
        : { createdAt: 'desc' };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
              description: true,
              image: true,
              parentId: true,
            },
          },
          subCategory: {
            select: { id: true, name: true, slug: true },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    const productsWithDetails = products.map((product) => ({
      ...product,
      price: Number(product.price),
      discountPrice: product.discountPrice
        ? Number(product.discountPrice)
        : null,
      pricePerUnit: product.pricePerUnit
        ? Number(product.pricePerUnit)
        : null,
      salePrice: product.discountPrice
        ? Number(product.discountPrice)
        : null,
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

// ============================================================
// GET /api/products/:id — Single product
// ============================================================
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

    res.json({
      ...product,
      price: Number(product.price),
      discountPrice: product.discountPrice
        ? Number(product.discountPrice)
        : null,
      pricePerUnit: product.pricePerUnit
        ? Number(product.pricePerUnit)
        : null,
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// ============================================================
// POST /api/products — Create product
// ============================================================
router.post('/', requireAuth, async (req, res) => {
  try {
    const body = req.body;
    const userId =
      req.user?.id || req.user?.userId || req.session?.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Handle sale price mapping
    let discountPriceValue = body.discountPrice;
    if (
      body.salePrice !== undefined &&
      body.salePrice !== null &&
      body.salePrice !== ''
    ) {
      discountPriceValue = parseFloat(body.salePrice);
    }
    if (
      discountPriceValue === '' ||
      discountPriceValue === null ||
      discountPriceValue === undefined
    ) {
      discountPriceValue = null;
    }

    // Handle stock
    let stockValue = 0;
    if (body.stock !== undefined && body.stock !== null && body.stock !== '') {
      stockValue =
        typeof body.stock === 'string' ? parseInt(body.stock, 10) : body.stock;
    }

    const productData = {
      name: body.name,
      description: body.description,
      price:
        typeof body.price === 'string' ? parseFloat(body.price) : body.price,
      discountPrice: discountPriceValue,
      stock: stockValue,
      sku:
        body.sku ||
        `SKU-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      images:
        Array.isArray(body.images) && body.images.length > 0
          ? body.images
          : ['/banners/carplastik.jpg'],
      tags: Array.isArray(body.tags) ? body.tags : [],
      warranty: body.warranty || null,
      videoUrl: body.videoUrl || null,
      sizes: body.sizes || null,
      colors: body.colors || null,
      brand: body.brand || null,
      weight: body.weight
        ? typeof body.weight === 'string'
          ? parseFloat(body.weight)
          : body.weight
        : null,
      estimatedDelivery: body.estimatedDelivery || null,
      unitOfMeasurement: body.unitOfMeasurement || 'pcs',
      durationTime: body.durationTime || '1h',
      pricePerUnit: body.pricePerUnit
        ? typeof body.pricePerUnit === 'string'
          ? parseFloat(body.pricePerUnit)
          : body.pricePerUnit
        : null,
    };

    // Resolve category
    let resolvedCategory = await prisma.category.findFirst({
      where: {
        OR: [{ id: body.categoryId }, { slug: body.categoryId }],
      },
    });

    if (!resolvedCategory) {
      resolvedCategory = await prisma.category.findFirst();
      if (!resolvedCategory) {
        resolvedCategory = await prisma.category.create({
          data: {
            name: 'General Plastic Products',
            slug: 'general-plastic-products',
            description: 'General plastic product category',
          },
        });
      }
    }

    let resolvedSubCategoryId = null;
    if (body.subCategoryId) {
      const foundSub = await prisma.category.findFirst({
        where: {
          OR: [{ id: body.subCategoryId }, { slug: body.subCategoryId }],
        },
      });
      if (foundSub) resolvedSubCategoryId = foundSub.id;
    }

    // Generate slug
    const baseSlug =
      slugify(productData.name, {
        lower: true,
        strict: true,
        trim: true,
      }) || `product-${Date.now()}`;
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
      },
      include: {
        category: true,
        subCategory: true,
      },
    });

    // Auto-fill category image if empty
    try {
      const firstImage =
        Array.isArray(productData.images) && productData.images.length > 0
          ? productData.images[0]
          : null;

      const isPlaceholder =
        !firstImage || firstImage === '/banners/carplastik.jpg';

      if (resolvedCategory && !resolvedCategory.image && !isPlaceholder) {
        const normalizedImage = firstImage.startsWith('http')
          ? firstImage
          : firstImage.startsWith('/')
          ? firstImage
          : `/${firstImage}`;

        await prisma.category.update({
          where: { id: resolvedCategory.id },
          data: { image: normalizedImage },
        });

        console.log(
          `🖼️ Category "${resolvedCategory.name}" image auto-set from product: ${normalizedImage}`
        );
      }
    } catch (categoryImgErr) {
      console.warn(
        '⚠️ Could not auto-assign category image:',
        categoryImgErr
      );
    }

    res.status(201).json({
      success: true,
      product: {
        ...product,
        price: Number(product.price),
        discountPrice: product.discountPrice
          ? Number(product.discountPrice)
          : null,
        pricePerUnit: product.pricePerUnit
          ? Number(product.pricePerUnit)
          : null,
      },
      message: 'Product created successfully!',
    });
  } catch (error) {
    console.error('Product creation error:', error);
    res.status(500).json({
      error: 'Failed to create product',
      details: error.message,
    });
  }
});

// ============================================================
// PUT /api/products/:id — Update product
// ============================================================
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;
    const userId =
      req.user?.id || req.user?.userId || req.session?.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const updateData = {};

    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined)
      updateData.description = body.description;
    if (body.price !== undefined)
      updateData.price = parseFloat(body.price);
    if (body.discountPrice !== undefined) {
      updateData.discountPrice = body.discountPrice
        ? parseFloat(body.discountPrice)
        : null;
    }
    if (body.pricePerUnit !== undefined) {
      updateData.pricePerUnit = body.pricePerUnit
        ? parseFloat(body.pricePerUnit)
        : null;
    }
    if (body.stock !== undefined) {
      updateData.stock =
        typeof body.stock === 'string'
          ? parseInt(body.stock, 10)
          : body.stock;
    }
    if (body.images !== undefined) updateData.images = body.images;
    if (body.tags !== undefined)
      updateData.tags = Array.isArray(body.tags) ? body.tags : [];
    if (body.brand !== undefined) updateData.brand = body.brand || null;
    if (body.warranty !== undefined)
      updateData.warranty = body.warranty || null;
    if (body.videoUrl !== undefined)
      updateData.videoUrl = body.videoUrl || null;
    if (body.unitOfMeasurement !== undefined)
      updateData.unitOfMeasurement = body.unitOfMeasurement;
    if (body.durationTime !== undefined)
      updateData.durationTime = body.durationTime || '1h';
    if (body.weight !== undefined) {
      updateData.weight = body.weight
        ? typeof body.weight === 'string'
          ? parseFloat(body.weight)
          : body.weight
        : null;
    }

    if (body.categoryId) {
      const cat = await prisma.category.findFirst({
        where: {
          OR: [{ id: body.categoryId }, { slug: body.categoryId }],
        },
      });
      if (cat) updateData.categoryId = cat.id;
    }

    if (body.subCategoryId) {
      const subCat = await prisma.category.findFirst({
        where: {
          OR: [{ id: body.subCategoryId }, { slug: body.subCategoryId }],
        },
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

    // Auto-fill category image if empty
    try {
      const firstImage =
        Array.isArray(updateData.images) && updateData.images.length > 0
          ? updateData.images[0]
          : null;

      const isPlaceholder =
        !firstImage || firstImage === '/banners/carplastik.jpg';

      if (
        updated.category &&
        !updated.category.image &&
        !isPlaceholder &&
        firstImage
      ) {
        const normalizedImage = firstImage.startsWith('http')
          ? firstImage
          : firstImage.startsWith('/')
          ? firstImage
          : `/${firstImage}`;

        await prisma.category.update({
          where: { id: updated.category.id },
          data: { image: normalizedImage },
        });
      }
    } catch (categoryImgErr) {
      console.warn(
        '⚠️ Could not auto-assign category image on update:',
        categoryImgErr
      );
    }

    res.json({
      success: true,
      product: {
        ...updated,
        price: Number(updated.price),
        discountPrice: updated.discountPrice
          ? Number(updated.discountPrice)
          : null,
        pricePerUnit: updated.pricePerUnit
          ? Number(updated.pricePerUnit)
          : null,
      },
      message: 'Product updated successfully',
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// ============================================================
// DELETE /api/products/:id — Delete product
// ============================================================
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId =
      req.user?.id || req.user?.userId || req.session?.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await prisma.$transaction([
      prisma.review.deleteMany({ where: { productId: id } }),
      prisma.cartItem.deleteMany({ where: { productId: id } }),
      prisma.orderItem.deleteMany({ where: { productId: id } }),
    ]);

    await prisma.product.delete({ where: { id } });

    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

module.exports = router;