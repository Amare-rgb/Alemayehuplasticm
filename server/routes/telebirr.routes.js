// routes/telebirr.routes.js
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const prisma = require('../lib/prisma'); // ✅ shared client — no new PrismaClient()

// ═══════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════

function getCleanPublicKey() {
  let key = process.env.TELEBIRR_PUBLIC_KEY || '';
  if (!key) return null;

  key = key.replace(/\\n/g, '\n').replace(/\\r/g, '\r').trim();
  if (key.startsWith('"') && key.endsWith('"')) key = key.slice(1, -1);

  if (!key.includes('-----BEGIN PUBLIC KEY-----')) {
    const body = key.replace(/\s+/g, '');
    const wrapped = body.match(/.{1,64}/g)?.join('\n') || body;
    key = `-----BEGIN PUBLIC KEY-----\n${wrapped}\n-----END PUBLIC KEY-----`;
  }
  return key;
}

function buildSignString(obj, exclude = ['sign', 'sign_type']) {
  const sortedKeys = Object.keys(obj).sort();
  const signParams = [];

  for (const key of sortedKeys) {
    if (exclude.includes(key)) continue;
    const value = obj[key];
    if (value !== undefined && value !== null && value !== '') {
      if (typeof value === 'object') {
        signParams.push(`${key}=${JSON.stringify(value)}`);
      } else {
        signParams.push(`${key}=${value}`);
      }
    }
  }
  return signParams.join('&');
}

function verifyRSA(text, signature, publicKey) {
  try {
    const verifier = crypto.createVerify('SHA256');
    verifier.update(text);
    return verifier.verify(publicKey, signature, 'base64');
  } catch (err) {
    console.error('❌ RSA Verification Error:', err.message);
    return false;
  }
}

/**
 * 🔍 Robust 3-step order lookup (solves Telebirr String/Int mismatch):
 *   1. Prisma CUID (`order.id`)
 *   2. Numeric `order.orderNumber`
 *   3. Unique string `order.paymentRef`
 */
async function findOrderByIdentifier(identifier) {
  if (!identifier) return null;

  const searchStr = String(identifier).trim();

  // 1. Primary key (CUID string)
  let order = await prisma.order.findUnique({
    where: { id: searchStr },
  });
  if (order) return order;

  // 2. Integer orderNumber (if numeric input)
  const numericId = Number(searchStr);
  if (!isNaN(numericId) && Number.isInteger(numericId)) {
    order = await prisma.order.findUnique({
      where: { orderNumber: numericId },
    });
    if (order) return order;
  }

  // 3. paymentRef (unique string — we store String(orderNumber) there)
  order = await prisma.order.findFirst({
    where: { paymentRef: searchStr },
  });

  return order;
}

// ═══════════════════════════════════════════════════════════
// POST /api/telebirr/notify
// Telebirr's server calls this after payment execution.
// Must return the exact string "success" to acknowledge.
// ═══════════════════════════════════════════════════════════
router.post(
  '/notify',
  express.urlencoded({ extended: true }),
  express.json(),
  express.text({ type: '*/*' }),
  async (req, res) => {
    try {
      let payload = req.body || {};

      // 1. Safe body parsing (string → JSON)
      if (typeof payload === 'string') {
        try {
          payload = JSON.parse(payload);
        } catch (e) {
          console.warn('⚠️ Could not parse string body as JSON:', e.message);
        }
      }

      console.log('📩 Telebirr notify raw payload:', JSON.stringify(payload, null, 2));

      // 2. Unpack biz_content if serialized
      if (typeof payload?.biz_content === 'string') {
        try {
          payload = { ...payload, ...JSON.parse(payload.biz_content) };
        } catch (e) {
          console.warn('⚠️ Could not parse biz_content string:', e.message);
        }
      } else if (payload?.biz_content && typeof payload.biz_content === 'object') {
        payload = { ...payload, ...payload.biz_content };
      }

      // 3. Signature verification (skip if public key not configured)
      const publicKey = getCleanPublicKey();
      if (publicKey && payload.sign) {
        const signStr = buildSignString(payload);
        const isValid = verifyRSA(signStr, payload.sign, publicKey);
        if (!isValid) {
          console.error('❌ Telebirr notify signature verification failed!');
          return res.status(400).json({ code: 'SIGN_ERROR', message: 'Invalid Signature' });
        }
        console.log('✅ Telebirr signature verified successfully.');
      } else if (!publicKey) {
        console.warn('⚠️ TELEBIRR_PUBLIC_KEY not set — skipping signature verification.');
      }

      // 4. Extract key fields
      const outTradeNo =
        payload.outTradeNo ||
        payload.out_trade_no ||
        payload.merch_order_id ||
        payload.merchOrderId ||
        payload.merch_order_no;

      const tradeStatus =
        payload.trade_status ||
        payload.tradeStatus ||
        payload.status;

      const transId =
        payload.transId ||
        payload.trans_id ||
        payload.transactionId ||
        payload.trade_no;

      if (!outTradeNo) {
        console.warn('⚠️ Notify payload missing outTradeNo:', payload);
        return res.status(400).send('MISSING_ORDER_ID');
      }

      // 5. Multi-fallback order lookup
      const order = await findOrderByIdentifier(outTradeNo);

      if (!order) {
        console.warn('⚠️ Order not found in DB for outTradeNo:', outTradeNo);
        return res.status(404).send('ORDER_NOT_FOUND');
      }

      // 6. Determine success
      const isSuccess =
        tradeStatus === 'Completed' ||
        tradeStatus === 'PAY_SUCCESS' ||
        tradeStatus === 'SUCCESS' ||
        tradeStatus === 'TRADE_SUCCESS' ||
        tradeStatus === '2' ||
        tradeStatus === 2;

      if (isSuccess) {
        // Idempotency — already PAID
        if (order.paymentStatus === 'PAID') {
          console.log(
            `ℹ️ Order #${order.id} (OrderNo: ${order.orderNumber}) is already marked as PAID.`
          );
          return res.send('success');
        }

        // Store the real Telebirr transaction ID as paymentRef (falls back to
        // the current paymentRef or outTradeNo if transId is missing).
        const updatedPaymentRef = transId
          ? String(transId)
          : order.paymentRef || String(outTradeNo);

        // Atomic transaction: mark PAID + decrement stock
        await prisma.$transaction(async (tx) => {
          await tx.order.update({
            where: { id: order.id },
            data: {
              status: 'COMPLETED',
              paymentStatus: 'PAID',
              paymentRef: updatedPaymentRef,
              paymentMethod: 'TELEBIRR',
            },
          });

          const items = await tx.orderItem.findMany({ where: { orderId: order.id } });
          for (const item of items) {
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { decrement: item.quantity } },
            });
          }
        });

        console.log(
          `✅ Order #${order.id} (OrderNo: ${order.orderNumber}) successfully marked as PAID.`
        );
      } else {
        // Payment failed / cancelled
        await prisma.order.update({
          where: { id: order.id },
          data: { paymentStatus: 'FAILED' },
        });
        console.log(`❌ Order #${order.id} payment failed with status: ${tradeStatus}`);
      }

      // Telebirr requires the exact string "success" response
      return res.send('success');
    } catch (error) {
      console.error('❌ Telebirr notify endpoint error:', error);
      return res.status(500).send('error');
    }
  }
);

// ═══════════════════════════════════════════════════════════
// GET /api/telebirr/return
// User is redirected here after paying (or cancelling) in the
// Telebirr app / H5 flow. We look up the order, check the DB
// payment status, then redirect to the frontend with a
// `status=success|pending` param so the UI can show the right toast.
// ═══════════════════════════════════════════════════════════
router.get('/return', async (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

  try {
    const outTradeNo =
      req.query.outTradeNo ||
      req.query.out_trade_no ||
      req.query.merch_order_id ||
      req.query.merchOrderId ||
      req.query.merch_order_no;

    const tradeStatus =
      req.query.trade_status ||
      req.query.tradeStatus ||
      req.query.status;

    let targetIdentifier = outTradeNo ? String(outTradeNo) : '';
    let resolvedOrder = null;
    let paymentStatus = 'PENDING';

    // Look up the order to determine the actual status
    if (outTradeNo) {
      resolvedOrder = await findOrderByIdentifier(outTradeNo);
      if (resolvedOrder) {
        targetIdentifier = resolvedOrder.id;
        paymentStatus = resolvedOrder.paymentStatus || 'PENDING';
      }
    }

    // Determine success: Telebirr may or may not append trade_status to the
    // redirect query. If we can't tell from the query, fall back to the DB
    // status (which the /notify webhook updates).
    const isSuccess =
      tradeStatus === 'Completed' ||
      tradeStatus === 'SUCCESS' ||
      tradeStatus === 'PAY_SUCCESS' ||
      tradeStatus === 'TRADE_SUCCESS' ||
      paymentStatus === 'PAID';

    const status = isSuccess ? 'success' : 'pending';

    console.log(
      `↩️ Telebirr return — order: ${targetIdentifier || 'unknown'}, ` +
        `query_status: ${tradeStatus || 'n/a'}, db_status: ${paymentStatus}, ` +
        `→ redirecting with status=${status}`
    );

    return res.redirect(
      `${frontendUrl}/orders?highlight=${encodeURIComponent(
        targetIdentifier
      )}&status=${status}`
    );
  } catch (error) {
    console.error('❌ Telebirr return endpoint error:', error);
    return res.redirect(`${frontendUrl}/orders?status=error`);
  }
});

module.exports = router;