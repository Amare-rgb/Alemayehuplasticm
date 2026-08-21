const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const prisma = require('../lib/prisma');
const { requireAuth } = require('../middleware/auth');

const STRIPE_KEY = process.env.STRIPE_SECRET_KEY || '';
const stripe = STRIPE_KEY ? new Stripe(STRIPE_KEY) : null;

// Create checkout session
router.post('/', requireAuth, async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ error: 'Stripe not configured' });
    }

    const { productId, quantity = 1 } = req.body;

    let items = [];

    if (productId) {
      const p = await prisma.product.findUnique({ where: { id: productId } });
      if (!p) return res.status(404).json({ error: 'Product not found' });

      const finalPrice = p.discountPrice && p.discountPrice > 0 && p.discountPrice < p.price
        ? Number(p.discountPrice)
        : Number(p.price);

      items.push({
        productId: p.id,
        name: p.name,
        price: finalPrice,
        qty: quantity,
        image: p.images?.[0]
      });
    } else {
      const cart = await prisma.cart.findUnique({
        where: { userId: req.session.user.id }
      });

      if (!cart) {
        return res.status(400).json({ error: 'Cart is empty' });
      }

      const cartItems = await prisma.cartItem.findMany({
        where: { cartId: cart.id },
        include: { product: true }
      });

      if (!cartItems || cartItems.length === 0) {
        return res.status(400).json({ error: 'Cart is empty' });
      }

      items = cartItems.map(ci => {
        const finalPrice = ci.product.discountPrice && ci.product.discountPrice > 0 && ci.product.discountPrice < ci.product.price
          ? Number(ci.product.discountPrice)
          : Number(ci.product.price);

        return {
          productId: ci.productId,
          name: ci.product.name,
          price: finalPrice,
          qty: ci.quantity,
          image: ci.product.images?.[0]
        };
      });
    }

    const line_items = items.map(i => ({
      price_data: {
        currency: 'eur',
        product_data: {
          name: i.name,
          ...(i.image ? { images: [i.image] } : {}),
        },
        unit_amount: Math.round(i.price * 100),
      },
      quantity: i.qty,
    }));

    const metadata = {
      userId: req.session.user.id,
      items: JSON.stringify(items.map(i => ({ productId: i.productId, qty: i.qty, price: i.price })))
    };

    const checkout = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items,
      success_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/order/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/cart`,
      metadata,
    });

    res.json({ url: checkout.url });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ error: error.message || 'Checkout failed' });
  }
});

// Checkout status
router.get('/', (req, res) => {
  res.json({ configured: !!STRIPE_KEY });
});

module.exports = router;