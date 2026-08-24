// routes/seller.routes.js
const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { requireAuth } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/products');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `product-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: fileFilter
});

// ==================== SELLER REGISTRATION ====================

// Register as a seller
router.post('/register', requireAuth, async (req, res) => {
  try {
    const { shopName, shopDesc, phone, address } = req.body;
    const userId = req.user.id;

    // Check if user already has a seller profile
    const existingProfile = await prisma.sellerProfile.findUnique({
      where: { userId }
    });

    if (existingProfile) {
      return res.status(400).json({ error: 'You already have a seller account' });
    }

    // Check if user is already a seller
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (user.role === 'SELLER') {
      return res.status(400).json({ error: 'User is already a seller' });
    }

    // Create seller profile
    const sellerProfile = await prisma.sellerProfile.create({
      data: {
        userId,
        shopName,
        shopDesc,
        phone: phone || user.phone,
        address,
        isVerified: false
      }
    });

    // Update user role to SELLER
    await prisma.user.update({
      where: { id: userId },
      data: { role: 'SELLER' }
    });

    res.status(201).json({
      success: true,
      message: 'Seller account created successfully. Waiting for admin approval.',
      sellerProfile
    });
  } catch (error) {
    console.error('Error registering seller:', error);
    res.status(500).json({ error: 'Failed to register as seller' });
  }
});

// ==================== SELLER PROFILE ====================

// Get seller profile
router.get('/profile', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    const profile = await prisma.sellerProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true
          }
        }
      }
    });

    if (!profile) {
      return res.status(404).json({ error: 'Seller profile not found' });
    }

    res.json(profile);
  } catch (error) {
    console.error('Error fetching seller profile:', error);
    res.status(500).json({ error: 'Failed to fetch seller profile' });
  }
});

// Update seller profile
router.put('/profile', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { shopName, shopDesc, phone, address, logo, banner } = req.body;

    const profile = await prisma.sellerProfile.update({
      where: { userId },
      data: {
        shopName,
        shopDesc,
        phone,
        address,
        logo,
        banner
      }
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      profile
    });
  } catch (error) {
    console.error('Error updating seller profile:', error);
    res.status(500).json({ error: 'Failed to update seller profile' });
  }
});

// ==================== SELLER PRODUCT MANAGEMENT ====================

// Create product (seller only)
router.post('/products', requireAuth, upload.array('images', 5), async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      name,
      description,
      price,
      discountPrice,
      stock,
      sku,
      categoryId,
      subCategoryId,
      tags,
      warranty,
      condition,
      videoUrl,
      unitOfMeasurement,
      sizes,
      colors,
      brand,
      weight,
      estimatedDelivery,
      durationTime,
      pricePerUnit
    } = req.body;

    // Check if user has a seller profile
    const sellerProfile = await prisma.sellerProfile.findUnique({
      where: { userId }
    });

    if (!sellerProfile) {
      return res.status(403).json({ error: 'You must be a seller to create products' });
    }

    if (!sellerProfile.isVerified) {
      return res.status(403).json({ error: 'Your seller account is not yet verified by admin' });
    }

    // Process uploaded images
    const imageUrls = req.files ? req.files.map(file => `/uploads/products/${file.filename}`) : [];

    // Create product with PENDING status
    const product = await prisma.product.create({
      data: {
        name,
        slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description,
        price: parseFloat(price),
        discountPrice: discountPrice ? parseFloat(discountPrice) : null,
        stock: parseInt(stock),
        sku,
        images: imageUrls,
        status: 'PENDING',
        sellerId: sellerProfile.id,
        categoryId,
        subCategoryId: subCategoryId || null,
        tags: tags ? tags.split(',').map(t => t.trim()) : [],
        warranty: warranty || null,
        condition: condition || 'NEW',
        videoUrl: videoUrl || null,
        unitOfMeasurement: unitOfMeasurement || 'pcs',
        sizes: sizes || null,
        colors: colors || null,
        brand: brand || null,
        weight: weight ? parseFloat(weight) : null,
        estimatedDelivery: estimatedDelivery || null,
        durationTime: durationTime || '1h',
        pricePerUnit: pricePerUnit ? parseFloat(pricePerUnit) : null
      }
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully. Waiting for admin approval.',
      product
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// Get seller's products
router.get('/products', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;

    const sellerProfile = await prisma.sellerProfile.findUnique({
      where: { userId }
    });

    if (!sellerProfile) {
      return res.status(403).json({ error: 'Seller profile not found' });
    }

    const whereClause = {
      sellerId: sellerProfile.id
    };

    if (status) {
      whereClause.status = status;
    }

    const products = await prisma.product.findMany({
      where: whereClause,
      include: {
        category: true,
        subCategory: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(products);
  } catch (error) {
    console.error('Error fetching seller products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get single product (seller)
router.get('/products/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const sellerProfile = await prisma.sellerProfile.findUnique({
      where: { userId }
    });

    if (!sellerProfile) {
      return res.status(403).json({ error: 'Seller profile not found' });
    }

    const product = await prisma.product.findFirst({
      where: {
        id,
        sellerId: sellerProfile.id
      },
      include: {
        category: true,
        subCategory: true
      }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Update product (seller only)
router.put('/products/:id', requireAuth, upload.array('images', 5), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const {
      name,
      description,
      price,
      discountPrice,
      stock,
      sku,
      categoryId,
      subCategoryId,
      tags,
      warranty,
      condition,
      videoUrl,
      unitOfMeasurement,
      sizes,
      colors,
      brand,
      weight,
      estimatedDelivery,
      durationTime,
      pricePerUnit,
      existingImages
    } = req.body;

    const sellerProfile = await prisma.sellerProfile.findUnique({
      where: { userId }
    });

    if (!sellerProfile) {
      return res.status(403).json({ error: 'Seller profile not found' });
    }

    // Check if product belongs to seller
    const existingProduct = await prisma.product.findFirst({
      where: {
        id,
        sellerId: sellerProfile.id
      }
    });

    if (!existingProduct) {
      return res.status(404).json({ error: 'Product not found or unauthorized' });
    }

    // Process new images
    let imageUrls = existingProduct.images || [];
    
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => `/uploads/products/${file.filename}`);
      imageUrls = [...imageUrls, ...newImages];
    }

    // If existingImages is provided, use it
    if (existingImages) {
      imageUrls = JSON.parse(existingImages);
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        name,
        slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description,
        price: parseFloat(price),
        discountPrice: discountPrice ? parseFloat(discountPrice) : null,
        stock: parseInt(stock),
        sku,
        images: imageUrls,
        status: 'PENDING', // Reset to pending for re-review
        categoryId,
        subCategoryId: subCategoryId || null,
        tags: tags ? tags.split(',').map(t => t.trim()) : [],
        warranty: warranty || null,
        condition: condition || 'NEW',
        videoUrl: videoUrl || null,
        unitOfMeasurement: unitOfMeasurement || 'pcs',
        sizes: sizes || null,
        colors: colors || null,
        brand: brand || null,
        weight: weight ? parseFloat(weight) : null,
        estimatedDelivery: estimatedDelivery || null,
        durationTime: durationTime || '1h',
        pricePerUnit: pricePerUnit ? parseFloat(pricePerUnit) : null,
        adminNote: null,
        rejectionReason: null
      }
    });

    res.json({
      success: true,
      message: 'Product updated successfully. Waiting for admin approval.',
      product
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Delete product (seller only)
router.delete('/products/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const sellerProfile = await prisma.sellerProfile.findUnique({
      where: { userId }
    });

    if (!sellerProfile) {
      return res.status(403).json({ error: 'Seller profile not found' });
    }

    // Check if product belongs to seller
    const product = await prisma.product.findFirst({
      where: {
        id,
        sellerId: sellerProfile.id
      }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found or unauthorized' });
    }

    // Delete product
    await prisma.product.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// ==================== SELLER STATISTICS ====================

// Get seller statistics
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    const sellerProfile = await prisma.sellerProfile.findUnique({
      where: { userId }
    });

    if (!sellerProfile) {
      return res.status(403).json({ error: 'Seller profile not found' });
    }

    const totalProducts = await prisma.product.count({
      where: { sellerId: sellerProfile.id }
    });

    const pendingProducts = await prisma.product.count({
      where: {
        sellerId: sellerProfile.id,
        status: 'PENDING'
      }
    });

    const approvedProducts = await prisma.product.count({
      where: {
        sellerId: sellerProfile.id,
        status: 'APPROVED'
      }
    });

    const rejectedProducts = await prisma.product.count({
      where: {
        sellerId: sellerProfile.id,
        status: 'REJECTED'
      }
    });

    res.json({
      totalProducts,
      pendingProducts,
      approvedProducts,
      rejectedProducts,
      shopName: sellerProfile.shopName,
      isVerified: sellerProfile.isVerified,
      totalSales: sellerProfile.totalSales
    });
  } catch (error) {
    console.error('Error fetching seller stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

module.exports = router;