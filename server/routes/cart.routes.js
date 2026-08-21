const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { requireAuth } = require('../middleware/auth');

// Get cart
router.get('/', requireAuth, async (req, res) => {
  try {
    const items = await prisma.cartItem.findMany({
      where: { userId: req.session.user.id },
      include: {
        product: {
          include: { seller: { select: { shopName: true } } },
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
    const { productId, quantity = 1 } = req.body;

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product || product.status !== 'APPROVED') {
      return res.status(404).json({ error: 'Product not available' });
    }

    const cart = await prisma.cart.upsert({
      where: { userId: req.session.user.id },
      update: {},
      create: { userId: req.session.user.id },
    });

    const item = await prisma.cartItem.upsert({
      where: { userId_productId: { userId: req.session.user.id, productId } },
      update: { quantity: { increment: quantity } },
      create: { userId: req.session.user.id, productId, quantity, cartId: cart.id },
    });

    res.json({ item });
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ error: 'Failed to add to cart' });
  }
});

// Update cart item
router.patch('/', requireAuth, async (req, res) => {
  try {
    const { itemId, quantity } = req.body;

    if (!itemId || typeof quantity !== 'number') {
      return res.status(400).json({ error: 'Missing parameters' });
    }

    const item = await prisma.cartItem.findUnique({ where: { id: itemId } });
    if (!item || item.userId !== req.session.user.id) {
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
    const { productId, quantity } = req.body;

    if (!productId || typeof quantity !== 'number') {
      return res.status(400).json({ error: 'Missing parameters' });
    }

    if (quantity <= 0) {
      await prisma.cartItem.deleteMany({
        where: { userId: req.session.user.id, productId }
      });
      return res.json({ success: true });
    }

    await prisma.cartItem.updateMany({
      where: { userId: req.session.user.id, productId },
      data: { quantity },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating cart:', error);
    res.status(500).json({ error: 'Failed to update cart' });
  }
});

// Delete from cart
router.delete('/', requireAuth, async (req, res) => {
  try {
    const { productId, itemId } = req.body;

    if (itemId) {
      await prisma.cartItem.deleteMany({
        where: { id: itemId, userId: req.session.user.id }
      });
      return res.json({ success: true });
    }

    if (productId) {
      await prisma.cartItem.deleteMany({
        where: { userId: req.session.user.id, productId }
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