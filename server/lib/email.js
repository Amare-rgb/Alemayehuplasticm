// server/lib/email.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587', 10),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const BRAND = {
  name: 'Genesis Agri Business',
  shortName: 'Genesis Agri',
  tagline: 'Fresh from Ethiopian farms to your table',
  supportEmail: process.env.EMAIL_FROM || 'noreply@genesisagri.com',
  website: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  year: new Date().getFullYear(),
};

// ============================================================
// sendWelcomeEmail — welcome notification, no verification needed
// ============================================================
async function sendWelcomeEmail(email, name) {
  const shopUrl = `${BRAND.website}/shop`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Welcome to ${BRAND.name}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #123523; background: #f6f3e9; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 24px 16px; }
        .card { background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 24px rgba(18,53,35,0.08); }
        .header { background: linear-gradient(135deg, #0b2419, #123523 50%, #19472d); padding: 36px 24px 32px; text-align: center; }
        .header .logo-mark { display: inline-flex; align-items: center; justify-content: center; width: 56px; height: 56px; border-radius: 16px; background: #b9d873; color: #0b2419; font-size: 28px; font-weight: 800; margin-bottom: 12px; }
        .header h1 { color: #ffffff; margin: 0; font-size: 26px; font-weight: 700; }
        .header p { color: rgba(185,216,115,0.85); margin: 8px 0 0; font-size: 13px; }
        .content { padding: 32px 28px; }
        .content h2 { color: #123523; margin: 0 0 12px; font-size: 20px; }
        .content p { color: #4a5a50; margin: 0 0 14px; font-size: 15px; }
        .cta { display: block; width: 100%; text-align: center; background: #123523; color: #ffffff !important; padding: 16px 24px; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 16px; margin: 26px 0 12px; }
        .divider { height: 1px; background: #ece9df; margin: 28px 0; }
        .feature-list { list-style: none; padding: 0; margin: 0; }
        .feature-list li { display: flex; align-items: flex-start; gap: 10px; color: #4a5a50; font-size: 14px; margin: 10px 0; }
        .feature-list .dot { flex-shrink: 0; width: 18px; height: 18px; border-radius: 50%; background: #b9d873; color: #0b2419; display: inline-flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 800; margin-top: 2px; }
        .footer { text-align: center; padding: 24px 16px 8px; font-size: 12px; color: #8a928c; }
        .footer a { color: #28633e; text-decoration: none; font-weight: 600; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="card">
          <div class="header">
            <div class="logo-mark">🌱</div>
            <h1>${BRAND.name}</h1>
            <p>${BRAND.tagline}</p>
          </div>

          <div class="content">
            <h2>Welcome aboard, ${name}! 🎉</h2>

            <p>
              Thank you for creating an account with
              <strong>${BRAND.name}</strong> — Ethiopia's marketplace for fresh
              farm produce, agricultural supplies, and trusted local farmers.
            </p>

            <p>
              Your account is ready. You can log in right now and start
              exploring the marketplace.
            </p>

            <a href="${shopUrl}" class="cta">
              Start shopping →
            </a>

            <div class="divider"></div>

            <p style="font-weight:600; color:#123523; margin-bottom:8px;">
              What you can do now:
            </p>
            <ul class="feature-list">
              <li><span class="dot">✓</span><span>Browse fresh produce from verified Ethiopian farms</span></li>
              <li><span class="dot">✓</span><span>Order with Telebirr, bank transfer, or cash on delivery</span></li>
              <li><span class="dot">✓</span><span>Track your orders from harvest to doorstep</span></li>
            </ul>

            <div class="divider"></div>

            <p style="font-size:13px; color:#69736b;">
              Need help? Reply to this email or reach us at
              <a href="mailto:${BRAND.supportEmail}" style="color:#28633e; font-weight:600;">${BRAND.supportEmail}</a>.
            </p>

            <p style="font-size:13px; color:#8a928c;">
              — The ${BRAND.name} Team
            </p>
          </div>
        </div>

        <div class="footer">
          <p>© ${BRAND.year} ${BRAND.name}. All rights reserved.</p>
          <p style="margin-top:8px;">
            This is an automated message — please do not reply directly.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Welcome aboard, ${name}!

Thank you for creating an account with ${BRAND.name} — Ethiopia's
marketplace for fresh farm produce, agricultural supplies, and trusted
local farmers.

Your account is ready. You can log in right now and start exploring:

    ${shopUrl}

What you can do now:
  - Browse fresh produce from verified Ethiopian farms
  - Order with Telebirr, bank transfer, or cash on delivery
  - Track your orders from harvest to doorstep

Need help? Contact us at ${BRAND.supportEmail}.

— The ${BRAND.name} Team
© ${BRAND.year} ${BRAND.name}
  `.trim();

  await transporter.sendMail({
    from: `"${BRAND.name}" <${BRAND.supportEmail}>`,
    to: email,
    subject: `Welcome to ${BRAND.name} 🌱`,
    text,
    html,
  });
}

module.exports = {
  sendWelcomeEmail,
  transporter,
};