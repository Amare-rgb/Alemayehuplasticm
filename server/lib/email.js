// lib/email.js
const nodemailer = require('nodemailer');

// ═══════════════════════════════════════════════════════════
// Email — Alemayehu Plastic Manufacturing
//  • Provider: Resend (preferred) or SMTP (fallback)
// ═══════════════════════════════════════════════════════════

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587', 10),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 15000,
});

const stripSlash = (s) => String(s || '').trim().replace(/\/+$/, '');

const BRAND = {
  name: 'Alemayehu Plastic Manufacturing',
  shortName: 'Alemayehu Plastic',
  tagline: 'Quality plastic products manufactured in Ethiopia',
  supportEmail:
    process.env.SUPPORT_EMAIL ||
    process.env.EMAIL_FROM ||
    'support@alemayehplastic.com',
  website:
    stripSlash(
      process.env.SITE_URL ||
        process.env.FRONTEND_URL ||
        process.env.CLIENT_URL ||
        process.env.NEXT_PUBLIC_SITE_URL
    ) || 'http://localhost:3000',
};

// Escape user-provided text before putting it inside HTML
const escapeHtml = (value) =>
  String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

// ============================================================
// sendEmail — one generic function used by all emails
// ============================================================
async function sendEmail({ to, subject, html, text }) {
  if (!to) throw new Error('sendEmail: "to" is required');

  const resendKey = process.env.RESEND_API_KEY;

  // ---------- Option 1: Resend over HTTPS (recommended) ----------
  if (resendKey) {
    if (typeof fetch !== 'function') {
      throw new Error('Global fetch is not available. Use Node.js 18 or newer.');
    }

    const from =
      process.env.RESEND_FROM ||
      `${BRAND.shortName} <onboarding@resend.dev>`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to: [to],
          subject,
          html,
          text,
        }),
        signal: controller.signal,
      });

      const body = await response.text();

      if (!response.ok) {
        throw new Error(`Resend API error ${response.status}: ${body}`);
      }

      try {
        return JSON.parse(body);
      } catch {
        return { ok: true };
      }
    } catch (err) {
      if (err && err.name === 'AbortError') {
        throw new Error('Resend API request timed out after 15s');
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  // ---------- Option 2: SMTP fallback (local development) ----------
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    throw new Error(
      'No email provider configured. Set RESEND_API_KEY (recommended) or EMAIL_USER and EMAIL_PASSWORD.'
    );
  }

  return transporter.sendMail({
    from: `"${BRAND.name}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    html,
  });
}

// ============================================================
// sendWelcomeEmail — welcome notification
// ============================================================
async function sendWelcomeEmail(email, name) {
  const shopUrl = `${BRAND.website}/products`;
  const year = new Date().getFullYear();
  const safeName = escapeHtml(name || 'there');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Welcome to ${BRAND.name}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #1a1a1a; background: #f7f5ef; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 24px 16px; }
        .card { background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 24px rgba(224,168,60,0.10); }
        .header { background: linear-gradient(135deg, #1a1a1a, #2b2b2b 50%, #3a3a3a); padding: 36px 24px 32px; text-align: center; }
        .header .logo-mark { display: inline-flex; align-items: center; justify-content: center; width: 56px; height: 56px; border-radius: 16px; background: #e0a83c; color: #1a1a1a; font-size: 28px; font-weight: 800; margin-bottom: 12px; }
        .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; }
        .header p { color: rgba(224,168,60,0.85); margin: 8px 0 0; font-size: 13px; }
        .content { padding: 32px 28px; }
        .content h2 { color: #1a1a1a; margin: 0 0 12px; font-size: 20px; }
        .content p { color: #555555; margin: 0 0 14px; font-size: 15px; }
        .cta { display: block; width: 100%; text-align: center; background: #e0a83c; color: #1a1a1a !important; padding: 16px 24px; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 16px; margin: 26px 0 12px; }
        .divider { height: 1px; background: #efe9db; margin: 28px 0; }
        .feature-list { list-style: none; padding: 0; margin: 0; }
        .feature-list li { display: flex; align-items: flex-start; gap: 10px; color: #555555; font-size: 14px; margin: 10px 0; }
        .feature-list .dot { flex-shrink: 0; width: 18px; height: 18px; border-radius: 50%; background: #e0a83c; color: #1a1a1a; display: inline-flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 800; margin-top: 2px; }
        .footer { text-align: center; padding: 24px 16px 8px; font-size: 12px; color: #8a8a8a; }
        .footer a { color: #b8842e; text-decoration: none; font-weight: 600; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="card">
          <div class="header">
            <div class="logo-mark">🏭</div>
            <h1>${BRAND.name}</h1>
            <p>${BRAND.tagline}</p>
          </div>

          <div class="content">
            <h2>Welcome aboard, ${safeName}! 🎉</h2>

            <p>
              Thank you for creating an account with
              <strong>${BRAND.name}</strong> — your trusted source for
              high-quality plastic products manufactured right here in Ethiopia.
            </p>

            <p>
              Your account is ready. You can log in right now and start
              exploring our product catalogue.
            </p>

            <a href="${shopUrl}" class="cta">
              Browse products →
            </a>

            <div class="divider"></div>

            <p style="font-weight:600; color:#1a1a1a; margin-bottom:8px;">
              What you can do now:
            </p>
            <ul class="feature-list">
              <li><span class="dot">✓</span><span>Browse our full range of plastic products</span></li>
              <li><span class="dot">✓</span><span>See prices, sizes, and stock availability in real time</span></li>
              <li><span class="dot">✓</span><span>Contact us directly for bulk orders and custom manufacturing</span></li>
            </ul>

            <div class="divider"></div>

            <p style="font-size:13px; color:#777777;">
              Need help? Reply to this email or reach us at
              <a href="mailto:${BRAND.supportEmail}" style="color:#b8842e; font-weight:600;">${BRAND.supportEmail}</a>.
            </p>

            <p style="font-size:13px; color:#8a8a8a;">
              — The ${BRAND.name} Team
            </p>
          </div>
        </div>

        <div class="footer">
          <p>© ${year} ${BRAND.name}. All rights reserved.</p>
          <p style="margin-top:8px;">
            This is an automated message — please do not reply directly.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Welcome aboard, ${name || 'there'}!

Thank you for creating an account with ${BRAND.name} — your trusted
source for high-quality plastic products manufactured right here in
Ethiopia.

Your account is ready. You can log in right now and start exploring:

    ${shopUrl}

What you can do now:
  - Browse our full range of plastic products
  - See prices, sizes, and stock availability in real time
  - Contact us directly for bulk orders and custom manufacturing

Need help? Contact us at ${BRAND.supportEmail}.

— The ${BRAND.name} Team
© ${year} ${BRAND.name}
  `.trim();

  return sendEmail({
    to: email,
    subject: `Welcome to ${BRAND.name} 🏭`,
    text,
    html,
  });
}

module.exports = {
  sendWelcomeEmail,
  sendEmail,
  transporter,
};