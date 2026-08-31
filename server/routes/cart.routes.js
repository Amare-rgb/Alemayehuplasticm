const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { requireAuth } = require('../middleware/auth');

// Get cart
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.session.user?.id || req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const items = await prisma.cartItem.findMany({
      where: { userId: userId },
      include: {
        product: {
          include: {
            category: true,
            subCategory: true,
            // ❌ REMOVED: seller (no longer exists)
          },
        },
      },
    });

    res.json({ items });
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({ error: 'Failed to fetch cart' });
  }
});

// Add to cart
router.post('/', requireAuth, async (req, res) => {
  try {
    const userId = req.session.user?.id || req.user?.id;
    const { productId, quantity = 1 } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    const product = await prisma.product.findUnique({ 
      where: { id: productId } 
    });
    
    if (!product || product.status !== 'APPROVED' || product.visibility !== 'VISIBLE') {
      return res.status(404).json({ error: 'Product not available' });
    }

    // Check if user has a cart, if not create one
    let cart = await prisma.cart.findUnique({
      where: { userId: userId }
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: userId }
      });
    }

    const item = await prisma.cartItem.upsert({
      where: { 
        userId_productId: { 
          userId: userId, 
          productId: productId 
        } 
      },
      update: { 
        quantity: { increment: quantity } 
      },
      create: { 
        userId: userId, 
        productId: productId, 
        quantity: quantity, 
        cartId: cart.id 
      },
    });

    res.json({ item });
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ error: 'Failed to add to cart' });
  }
});

// Update cart item by itemId
router.patch('/', requireAuth, async (req, res) => {
  try {
    const userId = req.session.user?.id || req.user?.id;
    const { itemId, quantity } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!itemId || typeof quantity !== 'number') {
      return res.status(400).json({ error: 'Missing parameters' });
    }

    const item = await prisma.cartItem.findUnique({ 
      where: { id: itemId } 
    });
    
    if (!item || item.userId !== userId) {
      return res.status(404).json({ error: 'Not found' });
    }

    if (quantity <= 0) {
      await prisma.cartItem.delete({ where: { id: itemId } });
      return res.json({ success: true });
    }

    const updated = await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity }
    });

    res.json({ item: updated });
  } catch (error) {
    console.error('Error updating cart:', error);
    res.status(500).json({ error: 'Failed to update cart' });
  }
});

// Update cart by productId
router.put('/', requireAuth, async (req, res) => {
  try {
    const userId = req.session.user?.id || req.user?.id;
    const { productId, quantity } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!productId || typeof quantity !== 'number') {
      return res.status(400).json({ error: 'Missing parameters' });
    }

    if (quantity <= 0) {
      await prisma.cartItem.deleteMany({
        where: { userId: userId, productId: productId }
      });
      return res.json({ success: true });
    }

    const updated = await prisma.cartItem.updateMany({
      where: { userId: userId, productId: productId },
      data: { quantity },
    });

    res.json({ success: true, count: updated.count });
  } catch (error) {
    console.error('Error updating cart:', error);
    res.status(500).json({ error: 'Failed to update cart' });
  }
});

// Delete from cart
router.delete('/', requireAuth, async (req, res) => {
  try {
    const userId = req.session.user?.id || req.user?.id;
    const { productId, itemId } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (itemId) {
      await prisma.cartItem.deleteMany({
        where: { id: itemId, userId: userId }
      });
      return res.json({ success: true });
    }

    if (productId) {
      await prisma.cartItem.deleteMany({
        where: { userId: userId, productId: productId }
      });
      return res.json({ success: true });
    }

    return res.status(400).json({ error: 'Missing productId or itemId' });
  } catch (error) {
    console.error('Error deleting from cart:', error);
    res.status(500).json({ error: 'Failed to delete from cart' });
  }
});

module.exports = router;