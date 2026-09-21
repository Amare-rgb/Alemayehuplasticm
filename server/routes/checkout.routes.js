// routes/checkout.routes.js
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const axios = require('axios');
const rateLimit = require('express-rate-limit');
const prisma = require('../lib/prisma');
const { requireAuth, optionalAuth } = require('../middleware/auth');

// ═══════════════════════════════════════════════════════════
// TELEBIRR HELPERS (inline — no SDK)
// ═══════════════════════════════════════════════════════════

function cleanEnv(name) {
  const raw = process.env[name] || '';
  return String(raw).replace(/[^\x20-\x7E\r\n]/g, '').trim();
}

function getCleanPrivateKey() {
  let key = process.env.TELEBIRR_PRIVATE_KEY || '';
  if (!key) throw new Error('TELEBIRR_PRIVATE_KEY missing in env');

  key = key.replace(/\\n/g, '\n').replace(/\\r/g, '\r').trim();
  if (key.startsWith('"') && key.endsWith('"')) key = key.slice(1, -1);

  if (!key.includes('-----BEGIN PRIVATE KEY-----')) {
    const body = key.replace(/\s+/g, '');
    const wrapped = body.match(/.{1,64}/g)?.join('\n') || body;
    key = `-----BEGIN PRIVATE KEY-----\n${wrapped}\n-----END PRIVATE KEY-----`;
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

function signRSA(text, privateKey) {
  const signer = crypto.createSign('SHA256');
  signer.update(text);
  return signer.sign(privateKey, 'base64');
}

async function getFabricToken() {
  const baseUrl =
    cleanEnv('TELEBIRR_BASE_URL') ||
    'https://developerportal.ethiotelecom.et:38443/apiaccess/payment/gateway';
  const appId = cleanEnv('TELEBIRR_FABRIC_APP_ID');
  const appSecret = cleanEnv('TELEBIRR_FABRIC_APP_SECRET');

  if (!appId || !appSecret) {
    throw new Error('TELEBIRR_FABRIC_APP_ID or TELEBIRR_FABRIC_APP_SECRET missing');
  }

  console.log('🔧 Fetching Telebirr Fabric token...');

  const response = await axios.post(
    `${baseUrl}/payment/v1/token`,
    { appSecret },
    {
      headers: {
        'Content-Type': 'application/json',
        'X-APP-Key': appId,
      },
      timeout: 30000,
    }
  );

  const token =
    response.data?.token ||
    response.data?.data?.token ||
    response.data?.access_token;

  if (!token) {
    throw new Error(`Token field missing in response: ${JSON.stringify(response.data)}`);
  }

  console.log('✅ Fabric token obtained.');
  return token;
}

// ═══════════════════════════════════════════════════════════
// TELEBIRR CHECKOUT CREATION
// ═══════════════════════════════════════════════════════════
async function createTelebirrCheckout({ orderId, orderNumber, amount, title }) {
  const baseUrl =
    cleanEnv('TELEBIRR_BASE_URL') ||
    'https://developerportal.ethiotelecom.et:38443/apiaccess/payment/gateway';
  const appId = cleanEnv('TELEBIRR_FABRIC_APP_ID');
  const merchantCode = cleanEnv('TELEBIRR_MERCHANT_CODE');

  const backendUrl = cleanEnv('BACKEND_URL') || 'http://localhost:5000';

  const notifyUrl =
    cleanEnv('TELEBIRR_NOTIFY_URL') || `${backendUrl}/api/telebirr/notify`;
  const redirectUrl =
    cleanEnv('TELEBIRR_REDIRECT_URL') || `${backendUrl}/api/telebirr/return`;

  const token = await getFabricToken();

  // Telebirr requires merch_order_id to be UNIQUE and numeric.
  const merchOrderId = String(orderNumber ?? orderId);

  const bizContent = {
    merch_order_id: merchOrderId,
    total_amount: Number(amount).toFixed(2),
    title: title || `Order #${merchOrderId}`,
    notify_url: notifyUrl,
    redirect_url: redirectUrl,
    merch_code: merchantCode,
    appid: appId,
    trade_type: 'InApp',
  };

  const reqBody = {
    timestamp: Math.floor(Date.now() / 1000).toString(),
    nonce_str: crypto.randomBytes(16).toString('hex'),
    method: 'telebirr.pay',
    version: '1.0',
    biz_content: bizContent,
  };

  const signOriginStr = buildSignString(reqBody);
  const privateKey = getCleanPrivateKey();
  reqBody.sign = signRSA(signOriginStr, privateKey);
  reqBody.sign_type = 'SHA256WithRSA';

  console.log('🔧 Sending payOrder to Telebirr Gateway...');
  console.log('   merch_order_id:', merchOrderId);
  console.log('   notify_url    :', notifyUrl);
  console.log('   redirect_url  :', redirectUrl);

  const response = await axios.post(
    `${baseUrl}/payment/v1/merchant/payOrder`,
    reqBody,
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: token,
      },
      timeout: 30000,
    }
  );

  const toPayUrl = response.data?.data?.toPayUrl || response.data?.toPayUrl;
  if (!toPayUrl) {
    throw new Error(`toPayUrl missing in response: ${JSON.stringify(response.data)}`);
  }

  return toPayUrl;
}

// ═══════════════════════════════════════════════════════════
// PAYMENT METHOD SPECIFICATION (allow-list, regex, duplicates)
// ═══════════════════════════════════════════════════════════

const PAYMENT_METHODS = Object.freeze({
  COD: 'Cash on Delivery',
  BANK: 'Bank Transfer',
  TELEBIRR: 'Telebirr',
});

/**
 * Specification per method:
 *  - requiresRef : true  → user MUST send paymentRef
 *  - refRegex    : validation pattern for the reference
 *  - gatewaySet  : true  → paymentRef is written by the gateway/webhook, NOT the client
 */
const METHOD_SPEC = Object.freeze({
  [PAYMENT_METHODS.COD]: {
    requiresRef: false,
    refRegex: null,
    gatewaySet: false,
  },
  [PAYMENT_METHODS.BANK]: {
    requiresRef: true,
    // 6–32 chars, uppercase letters, digits, dash (typical bank FT refs)
    refRegex: /^[A-Z0-9-]{6,32}$/,
    gatewaySet: false,
  },
  [PAYMENT_METHODS.TELEBIRR]: {
    requiresRef: false, // Telebirr ref comes from the notify webhook
    refRegex: /^[A-Z0-9]{6,64}$/,
    gatewaySet: true,
  },
});

const ALLOWED_METHODS = Object.freeze(Object.values(PAYMENT_METHODS));

/**
 * Normalize + validate the paymentMethod / paymentRef coming from the client.
 * Returns { ok, method, ref, error }
 */
function validatePaymentInput(method, ref) {
  if (!method) return { ok: true, method: null, ref: null };

  const canonical = ALLOWED_METHODS.find(
    (m) => m.toLowerCase() === String(method).trim().toLowerCase()
  );

  if (!canonical) {
    return { ok: false, error: `Unsupported payment method: "${method}"` };
  }

  const spec = METHOD_SPEC[canonical];

  // Sanitize: strip all whitespace + control chars, bound length
  const cleanRef =
    ref === undefined || ref === null || String(ref).trim() === ''
      ? null
      : String(ref).replace(/[\s\u0000-\u001F\u007F]+/g, '').slice(0, 64);

  if (spec.requiresRef && !cleanRef) {
    return {
      ok: false,
      error: `${canonical} requires a transaction reference (paymentRef).`,
    };
  }

  if (cleanRef && spec.refRegex && !spec.refRegex.test(cleanRef)) {
    return {
      ok: false,
      error: `Invalid payment reference format for ${canonical}. Allowed: 6–32 letters, digits, dashes.`,
    };
  }

  // Gateway-set methods: client MUST NOT supply a ref at order-create time
  if (spec.gatewaySet && cleanRef) {
    return {
      ok: false,
      error: `${canonical} reference is issued by the gateway and must not be sent by the client.`,
    };
  }

  return { ok: true, method: canonical, ref: cleanRef };
}

/**
 * Block duplicate references for the SAME payment method.
 * Throws an error with statusCode 409 if the ref is already used.
 * Must run inside the same prisma transaction as the order write.
 */
async function assertRefNotUsed(tx, method, ref, excludeOrderId = null) {
  if (!ref || !method) return;
  const spec = METHOD_SPEC[method];
  if (!spec || spec.gatewaySet) return; // gateway refs are checked by the webhook

  const dupe = await tx.order.findFirst({
    where: {
      paymentMethod: method,
      paymentRef: ref,
      ...(excludeOrderId ? { id: { not: excludeOrderId } } : {}),
    },
    select: { id: true, orderNumber: true, status: true },
  });

  if (dupe) {
    const err = new Error(
      `This transaction reference is already used by order #${dupe.orderNumber} (${method}). Please use a different reference.`
    );
    err.statusCode = 409;
    err.code = 'DUPLICATE_PAYMENT_REF';
    err.existingOrderId = dupe.id;
    err.existingOrderNumber = dupe.orderNumber;
    throw err;
  }
}

// ═══════════════════════════════════════════════════════════
// GUEST USER HELPERS
// ═══════════════════════════════════════════════════════════

function makeGuestEmail(providedEmail) {
  const suffix = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  if (providedEmail && providedEmail.trim()) {
    const [local, domain] = providedEmail.split('@');
    if (local && domain) return `${local}+guest_${suffix}@${domain}`;
  }
  return `guest_${suffix}@temp.local`;
}

async function findOrCreateGuestUser(guestInfo) {
  const providedEmail = (guestInfo.email || '').trim();
  if (providedEmail) {
    const existing = await prisma.user.findUnique({ where: { email: providedEmail } });
    if (existing) return existing;
  }
  const email = makeGuestEmail(providedEmail);
  const password = `GUEST_TEMP_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  try {
    return await prisma.user.create({
      data: { name: guestInfo.name, email, phone: guestInfo.phone, password, role: 'USER' },
    });
  } catch (err) {
    if (err.code === 'P2002') {
      const retryEmail = makeGuestEmail(providedEmail);
      return await prisma.user.create({
        data: {
          name: guestInfo.name, email: retryEmail, phone: guestInfo.phone,
          password: `GUEST_TEMP_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
          role: 'USER',
        },
      });
    }
    throw err;
  }
}

async function findOrCreateGuestAddress(userId, guestInfo) {
  const existing = await prisma.address.findFirst({
    where: { userId },
    orderBy: [{ isDefault: 'desc' }, { id: 'desc' }],
  });
  if (existing) {
    return await prisma.address.update({
      where: { id: existing.id },
      data: {
        fullName: guestInfo.name, phone: guestInfo.phone, street: guestInfo.address,
        city: guestInfo.city || 'Addis Ababa', state: 'Ethiopia', zip: '0000',
        country: 'Ethiopia', isDefault: true,
      },
    });
  }
  return await prisma.address.create({
    data: {
      userId, fullName: guestInfo.name, phone: guestInfo.phone, street: guestInfo.address,
      city: guestInfo.city || 'Addis Ababa', state: 'Ethiopia', zip: '0000',
      country: 'Ethiopia', isDefault: true,
    },
  });
}

// ═══════════════════════════════════════════════════════════
// RATE LIMITER (protects checkout from spam / brute-force refs)
// ═══════════════════════════════════════════════════════════
const checkoutLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,             // 20 checkout attempts / minute / IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many checkout attempts. Please wait a minute.' },
});

// ============================================
// CREATE CHECKOUT
// ============================================
router.post('/', checkoutLimiter, optionalAuth, async (req, res) => {
  try {
    const userId = req.user?.id || null;
    const {
      productId, quantity = 1, guestInfo, addressId, notes,
      paymentMethod, paymentRef, paymentProof, items: requestItems,
    } = req.body;

    // ─── 1) Validate payment method + reference BEFORE anything else ───
    const payCheck = validatePaymentInput(paymentMethod, paymentRef);
    if (!payCheck.ok) {
      return res.status(400).json({ success: false, error: payCheck.error });
    }
    const canonicalMethod = payCheck.method;
    const cleanRef = payCheck.ref;

    // ─── 2) Build items (server-side prices ONLY) ───
    let items = [];
    let finalAddressId = null;
    let finalUserId = userId;
    let sourceCartId = null;

    if (Array.isArray(requestItems) && requestItems.length > 0) {
      // Re-read every product server-side; ignore client-supplied price/name
      const ids = [...new Set(requestItems.map((i) => i.productId).filter(Boolean))];
      if (ids.length !== requestItems.length) {
        return res.status(400).json({ success: false, error: 'Each item requires a productId' });
      }
      const products = await prisma.product.findMany({ where: { id: { in: ids } } });
      const byId = new Map(products.map((p) => [p.id, p]));

      const missing = ids.filter((id) => !byId.has(id));
      if (missing.length) {
        return res.status(400).json({
          success: false,
          error: 'Some items are no longer available.',
          missingProductIds: missing,
        });
      }

      items = requestItems.map((item) => {
        const p = byId.get(item.productId);
        const price =
          p.discountPrice && p.discountPrice > 0 && p.discountPrice < p.price
            ? Number(p.discountPrice)
            : Number(p.price);
        const qty = Math.max(1, Math.floor(Number(item.quantity) || 1));
        return {
          productId: p.id,
          name: p.name,
          price,
          quantity: qty,
          image: p.images?.[0] || null,
        };
      });
    } else if (productId) {
      const product = await prisma.product.findUnique({ where: { id: productId } });
      if (!product) return res.status(404).json({ success: false, error: 'Product not found' });
      const finalPrice =
        product.discountPrice && product.discountPrice > 0 && product.discountPrice < product.price
          ? Number(product.discountPrice)
          : Number(product.price);
      items.push({
        productId: product.id,
        name: product.name,
        price: finalPrice,
        quantity: Math.max(1, Math.floor(Number(quantity) || 1)),
        image: product.images?.[0] || null,
      });
    } else if (userId) {
      let cart = await prisma.cart.findUnique({
        where: { userId },
        include: { items: { include: { product: true } } },
      });
      if (!cart) {
        cart = await prisma.cart.create({
          data: { userId },
          include: { items: { include: { product: true } } },
        });
      }
      if (!cart.items || cart.items.length === 0) {
        return res.status(400).json({ success: false, error: 'Your cart is empty.' });
      }
      sourceCartId = cart.id;
      items = cart.items.map((ci) => {
        const finalPrice =
          ci.product.discountPrice && ci.product.discountPrice > 0 && ci.product.discountPrice < ci.product.price
            ? Number(ci.product.discountPrice)
            : Number(ci.product.price);
        return {
          productId: ci.productId,
          name: ci.product.name,
          price: finalPrice,
          quantity: ci.quantity,
          image: ci.product.images?.[0] || null,
        };
      });
    } else {
      return res.status(400).json({ success: false, error: 'Please add items to your cart.' });
    }

    if (!items.length) return res.status(400).json({ success: false, error: 'No items to checkout.' });

    for (const item of items) {
      if (!item.productId) return res.status(400).json({ success: false, error: 'Each item requires a productId' });
      if (!Number.isFinite(item.price) || item.price <= 0) return res.status(400).json({ success: false, error: `Invalid price for ${item.productId}` });
      if (!Number.isInteger(item.quantity) || item.quantity <= 0) return res.status(400).json({ success: false, error: `Invalid quantity for ${item.productId}` });
    }

    // Stock pre-check
    const stockRows = await prisma.product.findMany({
      where: { id: { in: [...new Set(items.map((i) => i.productId))] } },
      select: { id: true, stock: true, name: true },
    });
    const stockMap = new Map(stockRows.map((r) => [r.id, r]));
    for (const item of items) {
      const row = stockMap.get(item.productId);
      if (row && typeof row.stock === 'number' && row.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          error: `Insufficient stock for "${row.name}". Only ${row.stock} left.`,
        });
      }
    }

    // ─── 3) Address resolution ───
    if (userId) {
      if (addressId) {
        const address = await prisma.address.findFirst({ where: { id: addressId, userId } });
        if (!address) return res.status(400).json({ success: false, error: 'Invalid address' });
        finalAddressId = address.id;
      } else {
        const userAddresses = await prisma.address.findMany({ where: { userId } });
        if (userAddresses.length === 0) {
          if (guestInfo?.address) {
            const newAddress = await prisma.address.create({
              data: {
                userId,
                fullName: guestInfo.name || req.user?.name || 'Valued Customer',
                phone: guestInfo.phone || req.user?.phone || 'N/A',
                street: guestInfo.address,
                city: guestInfo.city || 'Addis Ababa',
                state: 'Ethiopia',
                zip: '0000',
                country: 'Ethiopia',
                isDefault: true,
              },
            });
            finalAddressId = newAddress.id;
          } else {
            return res.status(400).json({ success: false, error: 'Please add a shipping address.' });
          }
        } else {
          finalAddressId = userAddresses[0].id;
        }
      }
    } else {
      if (!guestInfo) return res.status(400).json({ success: false, error: 'Guest information required' });
      if (!guestInfo.name || !guestInfo.phone || !guestInfo.address) {
        return res.status(400).json({ success: false, error: 'Name, phone, and address required' });
      }
      const guestUser = await findOrCreateGuestUser(guestInfo);
      finalUserId = guestUser.id;
      const guestAddress = await findOrCreateGuestAddress(guestUser.id, guestInfo);
      finalAddressId = guestAddress.id;
    }

    const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    if (total <= 0) return res.status(400).json({ success: false, error: 'Total must be > 0' });

    let paymentProofDataUrl = null;
    if (paymentProof?.base64 && paymentProof?.mimeType) {
      paymentProofDataUrl = `data:${paymentProof.mimeType};base64,${paymentProof.base64}`;
    }

    // ─── 4) Create order + duplicate-ref guard inside the SAME transaction ───
    let order;
    try {
      order = await prisma.$transaction(async (tx) => {
        // For non-gateway methods, block duplicate refs
        await assertRefNotUsed(tx, canonicalMethod, cleanRef);

        const created = await tx.order.create({
          data: {
            userId: finalUserId,
            total,
            status: 'PENDING',
            paymentStatus: 'PENDING',
            addressId: finalAddressId,
            notes: notes || '',
            paymentMethod: canonicalMethod || null,
            // For gateway methods, ref stays null until webhook. For COD, null.
            paymentRef: canonicalMethod && METHOD_SPEC[canonicalMethod]?.gatewaySet ? null : cleanRef,
            paymentProof: paymentProofDataUrl,
            items: {
              create: items.map((i) => ({
                productId: i.productId,
                quantity: i.quantity,
                price: i.price,
              })),
            },
          },
          include: {
            items: { include: { product: { select: { name: true, images: true } } } },
            address: true,
            user: { select: { name: true, email: true, phone: true } },
          },
        });

        if (sourceCartId) {
          await tx.cartItem.deleteMany({ where: { cartId: sourceCartId } });
        }
        return created;
      });
    } catch (err) {
      if (err.statusCode === 409 || err.code === 'DUPLICATE_PAYMENT_REF') {
        return res.status(409).json({
          success: false,
          error: err.message,
          code: 'DUPLICATE_PAYMENT_REF',
          existingOrderId: err.existingOrderId,
          existingOrderNumber: err.existingOrderNumber,
        });
      }
      throw err;
    }

    // ─── 5) Telebirr leg ───
    let telebirrCheckoutUrl = null;
    let telebirrError = null;

    if (canonicalMethod === PAYMENT_METHODS.TELEBIRR) {
      try {
        telebirrCheckoutUrl = await createTelebirrCheckout({
          orderId: order.id,
          orderNumber: order.orderNumber,
          amount: order.total,
          title: `Order #${order.orderNumber}`,
        });

        // NOTE: we do NOT write paymentRef here. The webhook will write the
        // real Telebirr trade_no into paymentRef when payment succeeds.

        console.log('✅ Telebirr checkout URL:', telebirrCheckoutUrl);
      } catch (err) {
        telebirrError = err.response?.data
          ? JSON.stringify(err.response.data)
          : err.message || 'Telebirr error';
        console.error('❌ Telebirr failed:', telebirrError);
      }
    }

    res.status(201).json({
      success: true,
      message: telebirrError ? 'Order created, Telebirr gateway failed' : 'Order created successfully',
      data: {
        order,
        items,
        isGuest: !userId,
        telebirrCheckoutUrl,
        telebirrError: telebirrError || null,
      },
    });
  } catch (error) {
    console.error('❌ Checkout error:', error.message, error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.statusCode ? error.message : 'Failed to create order',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// ============================================
// GET CHECKOUT STATUS
// ============================================
router.get('/', (req, res) => {
  res.json({
    success: true,
    configured: true,
    message: 'Checkout is configured for order processing',
    paymentMethods: ALLOWED_METHODS,
    status: 'available',
  });
});

// ============================================
// GET CHECKOUT SUMMARY
// ============================================
router.get('/summary', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    let cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              select: { id: true, name: true, price: true, discountPrice: true, images: true, stock: true },
            },
          },
        },
      },
    });
    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
        include: {
          items: {
            include: {
              product: {
                select: { id: true, name: true, price: true, discountPrice: true, images: true, stock: true },
              },
            },
          },
        },
      });
    }
    const addresses = await prisma.address.findMany({ where: { userId }, orderBy: { isDefault: 'desc' } });

    if (!cart.items || cart.items.length === 0) {
      return res.json({
        success: true,
        data: {
          items: [], subtotal: 0, tax: 0, taxRate: 0.16, total: 0, addresses,
          paymentMethods: ALLOWED_METHODS,
          cartEmpty: true,
        },
      });
    }

    let subtotal = 0;
    const items = cart.items.map((item) => {
      const price =
        item.product.discountPrice && item.product.discountPrice > 0 && item.product.discountPrice < item.product.price
          ? Number(item.product.discountPrice)
          : Number(item.product.price);
      subtotal += price * item.quantity;
      return {
        productId: item.productId,
        name: item.product.name,
        price,
        quantity: item.quantity,
        image: item.product.images?.[0] || null,
        stock: item.product.stock,
      };
    });
    const taxRate = 0.16;
    const tax = subtotal * taxRate;
    const total = subtotal + tax;

    res.json({
      success: true,
      data: {
        items, subtotal, tax, taxRate, total, addresses,
        paymentMethods: ALLOWED_METHODS,
        cartEmpty: false,
      },
    });
  } catch (error) {
    console.error('❌ Checkout summary error:', error);
    res.status(500).json({ success: false, error: 'Failed to get checkout summary' });
  }
});

// ============================================
// COMPLETE ORDER
// ============================================
router.post('/complete/:orderId', checkoutLimiter, requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderId } = req.params;
    const { paymentMethod, paymentRef, paymentProof } = req.body;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { product: true } } },
    });
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });
    if (order.userId !== userId) return res.status(403).json({ success: false, error: 'Unauthorized' });
    if (order.status !== 'PENDING') return res.status(400).json({ success: false, error: 'Order cannot be completed' });

    // Resolve final payment method (must be a valid canonical method)
    const methodToUse = paymentMethod || order.paymentMethod;
    const payCheck = validatePaymentInput(methodToUse, paymentRef);
    if (!payCheck.ok) {
      return res.status(400).json({ success: false, error: payCheck.error });
    }
    const canonicalMethod = payCheck.method;
    const cleanRef = payCheck.ref;
    const spec = METHOD_SPEC[canonicalMethod] || {};

    // Gateway methods: client MUST NOT set / overwrite the ref
    if (spec.gatewaySet && cleanRef) {
      return res.status(409).json({
        success: false,
        error: `${canonicalMethod} reference is issued by the gateway and cannot be set by the client.`,
      });
    }

    // For non-gateway methods, the ref must be provided to complete
    if (spec.requiresRef && !cleanRef && !order.paymentRef) {
      return res.status(400).json({
        success: false,
        error: `${canonicalMethod} requires a transaction reference to complete this order.`,
      });
    }

    // Final ref to write: gateway methods keep whatever the webhook set; others use cleanRef
    const finalRef = spec.gatewaySet
      ? order.paymentRef            // never overwrite gateway ref
      : (cleanRef || order.paymentRef);

    let paymentProofDataUrl = order.paymentProof;
    if (paymentProof?.base64 && paymentProof?.mimeType) {
      paymentProofDataUrl = `data:${paymentProof.mimeType};base64,${paymentProof.base64}`;
    }

    let updatedOrder;
    try {
      updatedOrder = await prisma.$transaction(async (tx) => {
        // Re-check duplicate ref inside the transaction, excluding THIS order
        await assertRefNotUsed(tx, canonicalMethod, finalRef, orderId);

        const updated = await tx.order.update({
          where: { id: orderId },
          data: {
            status: 'COMPLETED',
            paymentStatus: 'PAID',
            paymentMethod: canonicalMethod,
            paymentRef: finalRef, // no 'Manual payment' fallback anymore
            paymentProof: paymentProofDataUrl,
          },
          include: { items: { include: { product: true } }, address: true },
        });

        for (const item of updated.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          });
        }
        return updated;
      });
    } catch (err) {
      if (err.statusCode === 409 || err.code === 'DUPLICATE_PAYMENT_REF') {
        return res.status(409).json({
          success: false,
          error: err.message,
          code: 'DUPLICATE_PAYMENT_REF',
          existingOrderId: err.existingOrderId,
          existingOrderNumber: err.existingOrderNumber,
        });
      }
      throw err;
    }

    res.json({ success: true, message: 'Order completed successfully', data: updatedOrder });
  } catch (error) {
    console.error('❌ Complete order error:', error.message, error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.statusCode ? error.message : 'Failed to complete order',
    });
  }
});

// ============================================
// GET ORDER BY ID
// ============================================
router.get('/order/:orderId', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderId } = req.params;
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { product: { select: { id: true, name: true, images: true } } } },
        address: true,
        user: { select: { name: true, email: true, phone: true } },
      },
    });
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });
    const isOwner = order.userId === userId;
    const isAdmin = req.user?.role === 'ADMIN';
    if (!isOwner && !isAdmin) return res.status(403).json({ success: false, error: 'Unauthorized' });
    res.json({ success: true, data: order });
  } catch (error) {
    console.error('❌ Get order error:', error);
    res.status(500).json({ success: false, error: 'Failed to get order' });
  }
});

// ============================================
// CANCEL ORDER
// ============================================
router.post('/cancel/:orderId', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderId } = req.params;
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });
    if (order.userId !== userId) return res.status(403).json({ success: false, error: 'Unauthorized' });
    if (order.status === 'COMPLETED') return res.status(400).json({ success: false, error: 'Cannot cancel completed order' });

    const cancelledOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: 'CANCELLED', paymentStatus: 'REFUNDED' },
    });
    res.json({ success: true, message: 'Order cancelled successfully', data: cancelledOrder });
  } catch (error) {
    console.error('❌ Cancel order error:', error);
    res.status(500).json({ success: false, error: 'Failed to cancel order' });
  }
});

module.exports = router;