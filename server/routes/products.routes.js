const express = require('express');
const router = express.Router();
const slugify = require('slugify');
const prisma = require('../lib/prisma');
const { requireSeller, requireAdmin, requireAuth } = require('../middleware/auth');

// Get products
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

    if (!all && !statusParam) {
      where.status = 'APPROVED';
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
            select: { id: true, name: true, slug: true, description: true, image: true, parentId: true }
          },
          seller: {
            select: {
              shopName: true,
              isVerified: true,
              totalSales: true
            }
          },
          reviews: {
            select: { rating: true }
          }
        },
      }),
      prisma.product.count({ where }),
    ]);

    const productsWithDetails = products.map(product => ({
      ...product,
      price: Number(product.price),
      discountPrice: product.discountPrice ? Number(product.discountPrice) : null,
      salePrice: product.discountPrice ? Number(product.discountPrice) : null,
      averageRating: product.reviews.length > 0
        ? product.reviews.reduce((acc, review) => acc + review.rating, 0) / product.reviews.length
        : 0,
      reviewCount: product.reviews.length,
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

// Get seller's products
router.get('/seller', requireAuth, async (req, res) => {
  try {
    const seller = await prisma.sellerProfile.findUnique({
      where: { userId: req.session.user.id }
    });

    if (!seller) {
      return res.status(404).json({ error: 'Seller profile not found' });
    }

    const products = await prisma.product.findMany({
      where: { sellerId: seller.id },
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
        subCategory: true,
      }
    });

    res.json(products);
  } catch (error) {
    console.error('Error fetching seller products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Create product
router.post('/', requireSeller, async (req, res) => {
  try {
    const body = req.body;

    // Handle sale price mapping
    let discountPriceValue = body.discountPrice;
    if (body.salePrice !== undefined && body.salePrice !== null && body.salePrice !== '') {
      discountPriceValue = parseFloat(body.salePrice);
    }
    if (discountPriceValue === '' || discountPriceValue === null || discountPriceValue === undefined) {
      discountPriceValue = null;
    }

    const productData = {
      name: body.name,
      description: body.description,
      price: typeof body.price === 'string' ? parseFloat(body.price) : body.price,
      discountPrice: discountPriceValue,
      stock: typeof body.stock === 'string' ? parseInt(body.stock) : (body.stock || 0),
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
    };

    // Get or create seller profile
    let seller = await prisma.sellerProfile.findUnique({
      where: { userId: req.session.user.id }
    });

    if (!seller) {
      if (req.session.user.role === 'ADMIN') {
        seller = await prisma.sellerProfile.create({
          data: {
            userId: req.session.user.id,
            shopName: 'Genesis Agri Store',
            shopDesc: 'Official Genesis Agri Store',
            isVerified: true,
          }
        });
      } else {
        return res.status(404).json({
          error: 'Seller profile not found. Please complete your seller profile first.'
        });
      }
    }

    // Check SKU
    const existingSku = await prisma.product.findUnique({
      where: { sku: productData.sku }
    });
    if (existingSku) {
      productData.sku = `${productData.sku}-${Date.now().toString().slice(-4)}`;
    }

    // Generate slug
    const baseSlug = slugify(productData.name, { lower: true, strict: true, trim: true }) || `product-${Date.now()}`;
    let slug = baseSlug;
    let counter = 1;
    while (await prisma.product.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

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

    const isAdmin = req.session.user.role === 'ADMIN';

    const product = await prisma.product.create({
      data: {
        ...productData,
        slug,
        sellerId: seller.id,
        categoryId: resolvedCategory.id,
        subCategoryId: resolvedSubCategoryId,
        status: isAdmin ? 'APPROVED' : 'PENDING',
      },
      include: {
        category: true,
        subCategory: true,
        seller: {
          select: {
            shopName: true,
            isVerified: true,
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      product: {
        ...product,
        price: Number(product.price),
        discountPrice: product.discountPrice ? Number(product.discountPrice) : null,
      },
      message: isAdmin ? 'Product created and published!' : 'Product submitted for admin approval'
    });
  } catch (error) {
    console.error('Product creation error:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// Get single product
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
        seller: {
          select: {
            shopName: true,
            isVerified: true,
          },
        },
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
      discountPrice: product.discountPrice ? Number(product.discountPrice) : null,
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Update product
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;

    const existingProduct = await prisma.product.findUnique({
      where: { id },
      include: { seller: true }
    });

    if (!existingProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check ownership
    if (req.session.user.role !== 'ADMIN') {
      const seller = await prisma.sellerProfile.findUnique({
        where: { userId: req.session.user.id }
      });
      if (existingProduct.sellerId !== seller?.id) {
        return res.status(403).json({ error: 'Forbidden' });
      }
    }

    // Prepare update data
    const updateData = {};

    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.price !== undefined) updateData.price = parseFloat(body.price);
    if (body.discountPrice !== undefined) {
      updateData.discountPrice = body.discountPrice ? parseFloat(body.discountPrice) : null;
    }
    if (body.stock !== undefined) updateData.stock = parseInt(body.stock, 10);
    if (body.images !== undefined) updateData.images = body.images;
    if (body.tags !== undefined) updateData.tags = Array.isArray(body.tags) ? body.tags : [];
    if (body.condition !== undefined) updateData.condition = body.condition;
    if (body.brand !== undefined) updateData.brand = body.brand || null;
    if (body.warranty !== undefined) updateData.warranty = body.warranty || null;
    if (body.videoUrl !== undefined) updateData.videoUrl = body.videoUrl || null;
    if (body.unitOfMeasurement !== undefined) updateData.unitOfMeasurement = body.unitOfMeasurement;

    if (body.status !== undefined && req.session.user.role === 'ADMIN') {
      updateData.status = body.status;
    }
    if (body.rejectionReason !== undefined && req.session.user.role === 'ADMIN') {
      updateData.rejectionReason = body.rejectionReason;
    }

    if (body.categoryId) {
      const cat = await prisma.category.findFirst({
        where: { OR: [{ id: body.categoryId }, { slug: body.categoryId }] },
      });
      if (cat) updateData.categoryId = cat.id;
    }

    const updated = await prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        seller: { select: { shopName: true } },
      },
    });

    res.json({
      success: true,
      product: {
        ...updated,
        price: Number(updated.price),
        discountPrice: updated.discountPrice ? Number(updated.discountPrice) : null,
      },
      message: 'Product updated successfully',
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Delete product
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const existingProduct = await prisma.product.findUnique({
      where: { id },
      include: { seller: true }
    });

    if (!existingProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (req.session.user.role !== 'ADMIN') {
      const seller = await prisma.sellerProfile.findUnique({
        where: { userId: req.session.user.id }
      });
      if (existingProduct.sellerId !== seller?.id) {
        return res.status(403).json({ error: 'Forbidden' });
      }
    }

    await prisma.product.delete({
      where: { id },
    });

    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

module.exports = router;