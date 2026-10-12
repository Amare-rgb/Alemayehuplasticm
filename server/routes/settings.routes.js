// routes/settings.routes.js
const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ============================================================
// Multer — logo upload to /uploads/settings/
// ============================================================
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/settings');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, 'logo-' + uniqueSuffix + ext);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
});

// ============================================================
// Helpers
// ============================================================
const parseBoolean = (value) => {
  if (value === 'true' || value === true) return true;
  if (value === 'false' || value === false) return false;
  return undefined;
};

const parseNumber = (value) => {
  if (value === undefined || value === null || value === '') return undefined;
  const num = parseFloat(value);
  return isNaN(num) ? undefined : num;
};

// ✅ Extract user ID from whichever shape the auth middleware uses
const getUserId = (req) => {
  return (
    req.user?.id ||
    req.user?.userId ||
    req.userId ||
    null
  );
};

// ============================================================
// ✅ Rebranded default settings — Alemayehu Plastic Manufacturing
// ============================================================
const DEFAULT_SETTINGS = {
  siteName: 'Alemayehu Plastic Manufacturing',
  siteDescription: 'Quality plastic products manufactured in Ethiopia',
  adminEmail: 'admin@alemayehplastic.com',
  adminPhone: '+251 900 000 000',
  address: 'Bahir Dar, Ethiopia',
  timezone: 'Africa/Addis_Ababa',
  dateFormat: 'DD/MM/YYYY',
  storeName: 'Alemayehu Plastic Manufacturing',
  storeEmail: 'info@alemayehplastic.com',
  storePhone: '+251 900 000 000',
  storeAddress: 'Bahir Dar, Ethiopia',
  currency: 'ETB',
  taxRate: 15,
  logo: '',
  twoFactorAuth: false,
  sessionTimeout: 60,
  emailNotifications: true,
  orderNotifications: true,
  productNotifications: true,
  userNotifications: true,
  marketingEmails: false,
  themeColor: '#e0a83c',
  darkMode: false,
  contactEmail: 'support@alemayehplastic.com',
  contactPhone: '+251 900 000 000',
  contactAddress: 'Bahir Dar, Ethiopia',
  contactHours: 'Mon-Sat: 8:00 AM - 6:00 PM',
  enableContactForm: true,
};

// ============================================================
// PUBLIC — GET /api/admin/settings/public
// ============================================================
router.get('/public', async (req, res) => {
  try {
    let settings = await prisma.settings.findFirst();

    if (!settings) {
      settings = await prisma.settings.create({ data: DEFAULT_SETTINGS });
    }

    // Return only public fields
    const publicSettings = {
      siteName: settings.siteName,
      siteDescription: settings.siteDescription,
      logo: settings.logo,
      contactEmail: settings.contactEmail,
      contactPhone: settings.contactPhone,
      contactAddress: settings.contactAddress,
      contactHours: settings.contactHours,
      enableContactForm: settings.enableContactForm,
      enableWhatsApp: settings.enableWhatsApp,
      whatsAppNumber: settings.whatsAppNumber,
      themeColor: settings.themeColor,
    };

    res.setHeader(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, private'
    );
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    res.json(publicSettings);
  } catch (error) {
    console.error('❌ Error fetching public settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// ============================================================
// ADMIN — GET /api/admin/settings
// ============================================================
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    let settings = await prisma.settings.findFirst();

    if (!settings) {
      settings = await prisma.settings.create({ data: DEFAULT_SETTINGS });
    }

    res.setHeader(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, private'
    );
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    res.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// ============================================================
// ADMIN — POST /api/admin/settings (save + optional logo upload)
// ============================================================
router.post(
  '/',
  requireAuth,
  requireAdmin,
  upload.single('logo'),
  async (req, res) => {
    try {
      let settings = await prisma.settings.findFirst();

      // ── Handle logo upload ────────────────────────────────
      let logoUrl = settings?.logo || '';

      if (req.file) {
        // Delete the old logo file if it exists on disk
        if (settings?.logo) {
          const oldLogoFileName = path.basename(settings.logo);
          const oldLogoPath = path.join(
            __dirname,
            '../uploads/settings',
            oldLogoFileName
          );
          if (fs.existsSync(oldLogoPath)) {
            fs.unlinkSync(oldLogoPath);
          }
        }
        logoUrl = `/uploads/settings/${req.file.filename}`;
      } else if (req.body.logo === '') {
        // Explicitly cleared
        logoUrl = '';
      }

      // ── Build the update payload ──────────────────────────
      // Any field the client didn't send keeps its current value.
      const updateData = {
        siteName:
          req.body.siteName ?? settings?.siteName ?? DEFAULT_SETTINGS.siteName,
        siteDescription:
          req.body.siteDescription ??
          settings?.siteDescription ??
          DEFAULT_SETTINGS.siteDescription,
        adminEmail:
          req.body.adminEmail ??
          settings?.adminEmail ??
          DEFAULT_SETTINGS.adminEmail,
        adminPhone:
          req.body.adminPhone ??
          settings?.adminPhone ??
          DEFAULT_SETTINGS.adminPhone,
        address:
          req.body.address ?? settings?.address ?? DEFAULT_SETTINGS.address,
        timezone:
          req.body.timezone ?? settings?.timezone ?? DEFAULT_SETTINGS.timezone,
        dateFormat:
          req.body.dateFormat ??
          settings?.dateFormat ??
          DEFAULT_SETTINGS.dateFormat,
        storeName:
          req.body.storeName ??
          settings?.storeName ??
          DEFAULT_SETTINGS.storeName,
        storeEmail:
          req.body.storeEmail ??
          settings?.storeEmail ??
          DEFAULT_SETTINGS.storeEmail,
        storePhone:
          req.body.storePhone ??
          settings?.storePhone ??
          DEFAULT_SETTINGS.storePhone,
        storeAddress:
          req.body.storeAddress ??
          settings?.storeAddress ??
          DEFAULT_SETTINGS.storeAddress,
        currency:
          req.body.currency ?? settings?.currency ?? DEFAULT_SETTINGS.currency,
        taxRate:
          parseNumber(req.body.taxRate) ??
          settings?.taxRate ??
          DEFAULT_SETTINGS.taxRate,
        logo: logoUrl,
        twoFactorAuth:
          parseBoolean(req.body.twoFactorAuth) ??
          settings?.twoFactorAuth ??
          DEFAULT_SETTINGS.twoFactorAuth,
        sessionTimeout:
          parseNumber(req.body.sessionTimeout) ??
          settings?.sessionTimeout ??
          DEFAULT_SETTINGS.sessionTimeout,
        emailNotifications:
          parseBoolean(req.body.emailNotifications) ??
          settings?.emailNotifications ??
          DEFAULT_SETTINGS.emailNotifications,
        orderNotifications:
          parseBoolean(req.body.orderNotifications) ??
          settings?.orderNotifications ??
          DEFAULT_SETTINGS.orderNotifications,
        productNotifications:
          parseBoolean(req.body.productNotifications) ??
          settings?.productNotifications ??
          DEFAULT_SETTINGS.productNotifications,
        userNotifications:
          parseBoolean(req.body.userNotifications) ??
          settings?.userNotifications ??
          DEFAULT_SETTINGS.userNotifications,
        marketingEmails:
          parseBoolean(req.body.marketingEmails) ??
          settings?.marketingEmails ??
          DEFAULT_SETTINGS.marketingEmails,
        themeColor:
          req.body.themeColor ??
          settings?.themeColor ??
          DEFAULT_SETTINGS.themeColor,
        darkMode:
          parseBoolean(req.body.darkMode) ??
          settings?.darkMode ??
          DEFAULT_SETTINGS.darkMode,
        contactEmail:
          req.body.contactEmail ??
          settings?.contactEmail ??
          DEFAULT_SETTINGS.contactEmail,
        contactPhone:
          req.body.contactPhone ??
          settings?.contactPhone ??
          DEFAULT_SETTINGS.contactPhone,
        contactAddress:
          req.body.contactAddress ??
          settings?.contactAddress ??
          DEFAULT_SETTINGS.contactAddress,
        contactHours:
          req.body.contactHours ??
          settings?.contactHours ??
          DEFAULT_SETTINGS.contactHours,
        enableContactForm:
          parseBoolean(req.body.enableContactForm) ??
          settings?.enableContactForm ??
          DEFAULT_SETTINGS.enableContactForm,
      };

      if (!settings) {
        settings = await prisma.settings.create({ data: updateData });
      } else {
        settings = await prisma.settings.update({
          where: { id: settings.id },
          data: updateData,
        });
      }

      res.setHeader(
        'Cache-Control',
        'no-store, no-cache, must-revalidate, private'
      );
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      res.json({
        success: true,
        settings,
        message: 'Settings saved successfully',
      });
    } catch (error) {
      console.error('❌ Error saving settings:', error);
      res.status(500).json({
        error: 'Failed to save settings',
        details:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }
);

// ============================================================
// ADMIN — POST /api/admin/settings/change-password
// ============================================================
router.post(
  '/change-password',
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res
          .status(400)
          .json({ error: 'Current password and new password are required' });
      }

      if (newPassword.length < 8) {
        return res
          .status(400)
          .json({ error: 'New password must be at least 8 characters' });
      }

      // ✅ Works with any auth middleware shape
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const user = await prisma.user.findUnique({ where: { id: userId } });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const isValidPassword = await bcrypt.compare(
        currentPassword,
        user.password
      );
      if (!isValidPassword) {
        return res
          .status(400)
          .json({ error: 'Current password is incorrect' });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });

      res.json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error) {
      console.error('Error changing password:', error);
      res.status(500).json({ error: 'Failed to change password' });
    }
  }
);

// ============================================================
// ADMIN — POST /api/admin/settings/reset
// ============================================================
router.post('/reset', requireAuth, requireAdmin, async (req, res) => {
  try {
    let settings = await prisma.settings.findFirst();

    if (settings) {
      await prisma.settings.update({
        where: { id: settings.id },
        data: DEFAULT_SETTINGS,
      });
    } else {
      await prisma.settings.create({ data: DEFAULT_SETTINGS });
    }

    res.json({
      success: true,
      message: 'Settings reset to default successfully',
    });
  } catch (error) {
    console.error('Error resetting settings:', error);
    res.status(500).json({ error: 'Failed to reset settings' });
  }
});

module.exports = router;