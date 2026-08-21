const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const prisma = require('../lib/prisma');

const STRIPE_KEY = process.env.STRIPE_SECRET_KEY || '';
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';
const stripe = STRIPE_KEY ? new Stripe(STRIPE_KEY) : null;

// Stripe webhook
router.post('/', async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ error: 'Stripe not configured' });
    }

    if (!WEBHOOK_SECRET) {
      return res.status(500).json({ error: 'Webhook secret not configured' });
    }

    const sig = req.headers['stripe-signature'];
    const body = req.body;

    let event;
    try {
      event = stripe.webhooks.constructEvent(body, sig, WEBHOOK_SECRET);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).json({ error: 'Invalid signature' });
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;

      // Check idempotency
      const existing = await prisma.order.findFirst({
        where: { paymentRef: session.id }
      });

      if (existing) {
        return res.json({ ok: true });
      }

      let metadataItems = [];
      try {
        if (session.metadata && session.metadata.items) {
          metadataItems = JSON.parse(session.metadata.items);
        }
      } catch (e) {
        metadataItems = [];
      }

      const userId = session.metadata?.userId;

      if (!userId) {
        console.error('Webhook: missing userId in session metadata');
        return res.status(400).json({ error: 'Missing userId' });
      }

      // Get or create address
      let addressId = null;
      const userAddresses = await prisma.address.findMany({
        where: { userId }
      });

      if (userAddresses && userAddresses.length) {
        addressId = userAddresses[0].id;
      } else if (session.customer_details) {
        const cd = session.customer_details;
        const newAddr = await prisma.address.create({
          data: {
            userId,
            fullName: cd.name || 'Customer',
            phone: cd.phone || '',
            street: cd.address?.line1 || '',
            city: cd.address?.city || '',
            state: cd.address?.state || '',
            zip: cd.address?.postal_code || '',
            country: cd.address?.country || '',
          }
        });
        addressId = newAddr.id;
      } else {
        console.error('Webhook: could not determine address for user', userId);
        return res.status(400).json({ error: 'No address for user' });
      }

      const totalCents = session.amount_total || 0;
      const total = (totalCents / 100).toFixed(2);

      try {
        const order = await prisma.$transaction(async (tx) => {
          const newOrder = await tx.order.create({
            data: {
              userId,
              addressId,
              total: total,
              paymentRef: session.id,
              status: 'PROCESSING',
              items: {
                create: metadataItems.map(it => ({
                  productId: it.productId,
                  quantity: it.qty,
                  price: it.price,
                })),
              },
            }
          });

          for (const it of metadataItems) {
            await tx.product.update({
              where: { id: it.productId },
              data: { stock: { decrement: it.qty } }
            });
          }

          await tx.cartItem.deleteMany({ where: { userId } });

          return newOrder;
        });

        console.log('✅ Created order from Stripe session:', order.id);
        res.json({ ok: true });
      } catch (err) {
        console.error('Error creating order from webhook', err);
        res.status(500).json({ error: 'Order creation failed' });
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

module.exports = router;