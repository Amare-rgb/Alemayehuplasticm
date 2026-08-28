// routes/settings.routes.js
const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for logo upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/settings');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'logo-' + uniqueSuffix + ext);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: fileFilter
});

// ============================================
// PUBLIC ROUTE - No authentication required
// ============================================
router.get('/public', async (req, res) => {
  try {
    console.log('🔍 Fetching public settings...');
    
    let settings = await prisma.settings.findFirst();
    
    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          siteName: 'Genesis Agri Business',
          siteDescription: 'Agriculture marketplace connecting farmers and buyers',
          adminEmail: 'admin@genesisagri.com',
          adminPhone: '+1 (555) 123-4567',
          address: '123 Farm Road, Nairobi, Kenya',
          timezone: 'Africa/Nairobi',
          dateFormat: 'MM/DD/YYYY',
          storeName: 'Genesis Agri Business',
          storeEmail: 'info@genesisagri.com',
          storePhone: '+1 (555) 123-4567',
          storeAddress: '123 Farm Road, Nairobi, Kenya',
          currency: 'KES',
          taxRate: 16,
          logo: '',
          favicon: '',
          twoFactorAuth: false,
          sessionTimeout: 60,
          emailNotifications: true,
          orderNotifications: true,
          productNotifications: true,
          userNotifications: true,
          marketingEmails: false,
          themeColor: '#22c55e',
          darkMode: false,
          contactEmail: 'support@genesisagri.com',
          contactPhone: '+1 (555) 123-4567',
          contactAddress: '123 Agriculture Way, Farming District, FC 12345',
          contactHours: 'Mon-Fri: 8:00 AM - 6:00 PM',
          contactMapEmbed: '',
          enableContactForm: true,
          enableWhatsApp: true,
          whatsAppNumber: '+254700000000',
          enableLiveChat: false,
          emergencyPhone: '+1 (555) 999-9999',
          supportEmail: 'support@genesisagri.com',
          infoEmail: 'info@genesisagri.com',
        }
      });
      console.log('✅ Default settings created');
    }

    // Return only public fields (no sensitive data)
    const publicSettings = {
      siteName: settings.siteName,
      siteDescription: settings.siteDescription,
      logo: settings.logo,
      contactEmail: settings.contactEmail,
      contactPhone: settings.contactPhone,
      contactAddress: settings.contactAddress,
      contactHours: settings.contactHours,
      contactMapEmbed: settings.contactMapEmbed,
      enableContactForm: settings.enableContactForm,
      enableWhatsApp: settings.enableWhatsApp,
      whatsAppNumber: settings.whatsAppNumber,
      enableLiveChat: settings.enableLiveChat,
      emergencyPhone: settings.emergencyPhone,
      supportEmail: settings.supportEmail,
      infoEmail: settings.infoEmail,
      themeColor: settings.themeColor,
    };

    console.log('📦 Public settings sent');
    res.json(publicSettings);
  } catch (error) {
    console.error('❌ Error fetching public settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// ============================================
// ADMIN ROUTES - Authentication required
// ============================================

// Get settings (admin only)
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    let settings = await prisma.settings.findFirst();
    
    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          siteName: 'Genesis Agri Business',
          siteDescription: 'Agriculture marketplace connecting farmers and buyers',
          adminEmail: 'admin@genesisagri.com',
          adminPhone: '+1 (555) 123-4567',
          address: '123 Farm Road, Nairobi, Kenya',
          timezone: 'Africa/Nairobi',
          dateFormat: 'MM/DD/YYYY',
          storeName: 'Genesis Agri Business',
          storeEmail: 'info@genesisagri.com',
          storePhone: '+1 (555) 123-4567',
          storeAddress: '123 Farm Road, Nairobi, Kenya',
          currency: 'KES',
          taxRate: 16,
          logo: '',
          favicon: '',
          twoFactorAuth: false,
          sessionTimeout: 60,
          emailNotifications: true,
          orderNotifications: true,
          productNotifications: true,
          userNotifications: true,
          marketingEmails: false,
          themeColor: '#22c55e',
          darkMode: false,
          contactEmail: 'support@genesisagri.com',
          contactPhone: '+1 (555) 123-4567',
          contactAddress: '123 Agriculture Way, Farming District, FC 12345',
          contactHours: 'Mon-Fri: 8:00 AM - 6:00 PM',
          contactMapEmbed: '',
          enableContactForm: true,
          enableWhatsApp: true,
          whatsAppNumber: '+254700000000',
          enableLiveChat: false,
          emergencyPhone: '+1 (555) 999-9999',
          supportEmail: 'support@genesisagri.com',
          infoEmail: 'info@genesisagri.com',
        }
      });
    }

    res.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Update settings with logo upload (admin only)
router.post('/', requireAuth, requireAdmin, upload.single('logo'), async (req, res) => {
  try {
    console.log('📥 Received settings update');
    console.log('📥 File:', req.file ? req.file.filename : 'No file');

    let settings = await prisma.settings.findFirst();
    
    // Handle logo upload
    let logoUrl = settings?.logo || '';
    if (req.file) {
      if (settings?.logo && settings.logo !== '') {
        const oldLogoPath = path.join(__dirname, '../public', settings.logo);
        if (fs.existsSync(oldLogoPath)) {
          try {
            fs.unlinkSync(oldLogoPath);
            console.log('🗑️ Deleted old logo');
          } catch (err) {
            console.error('Error deleting old logo:', err);
          }
        }
      }
      logoUrl = `/uploads/settings/${req.file.filename}`;
      console.log('🖼️ New logo uploaded:', logoUrl);
    } else if (req.body.logo === '') {
      logoUrl = '';
      console.log('🗑️ Logo removed');
    }

    // Helper function to parse boolean
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

    // Build update data
    const updateData = {
      siteName: req.body.siteName || 'Genesis Agri Business',
      siteDescription: req.body.siteDescription || '',
      adminEmail: req.body.adminEmail || 'admin@genesisagri.com',
      adminPhone: req.body.adminPhone || '',
      address: req.body.address || '',
      timezone: req.body.timezone || 'Africa/Nairobi',
      dateFormat: req.body.dateFormat || 'MM/DD/YYYY',
      storeName: req.body.storeName || 'Genesis Agri Business',
      storeEmail: req.body.storeEmail || 'info@genesisagri.com',
      storePhone: req.body.storePhone || '',
      storeAddress: req.body.storeAddress || '',
      currency: req.body.currency || 'KES',
      taxRate: parseNumber(req.body.taxRate) || 16,
      logo: logoUrl,
      favicon: req.body.favicon || '',
      twoFactorAuth: parseBoolean(req.body.twoFactorAuth) ?? false,
      sessionTimeout: parseNumber(req.body.sessionTimeout) || 60,
      emailNotifications: parseBoolean(req.body.emailNotifications) ?? true,
      orderNotifications: parseBoolean(req.body.orderNotifications) ?? true,
      productNotifications: parseBoolean(req.body.productNotifications) ?? true,
      userNotifications: parseBoolean(req.body.userNotifications) ?? true,
      marketingEmails: parseBoolean(req.body.marketingEmails) ?? false,
      themeColor: req.body.themeColor || '#22c55e',
      darkMode: parseBoolean(req.body.darkMode) ?? false,
      contactEmail: req.body.contactEmail || 'support@genesisagri.com',
      contactPhone: req.body.contactPhone || '+1 (555) 123-4567',
      contactAddress: req.body.contactAddress || '123 Agriculture Way, Farming District, FC 12345',
      contactHours: req.body.contactHours || 'Mon-Fri: 8:00 AM - 6:00 PM',
      contactMapEmbed: req.body.contactMapEmbed || '',
      enableContactForm: parseBoolean(req.body.enableContactForm) ?? true,
      enableWhatsApp: parseBoolean(req.body.enableWhatsApp) ?? true,
      whatsAppNumber: req.body.whatsAppNumber || '+254700000000',
      enableLiveChat: parseBoolean(req.body.enableLiveChat) ?? false,
      emergencyPhone: req.body.emergencyPhone || '+1 (555) 999-9999',
      supportEmail: req.body.supportEmail || 'support@genesisagri.com',
      infoEmail: req.body.infoEmail || 'info@genesisagri.com',
    };

    if (!settings) {
      settings = await prisma.settings.create({ data: updateData });
      console.log('✅ Settings created');
    } else {
      settings = await prisma.settings.update({
        where: { id: settings.id },
        data: updateData
      });
      console.log('✅ Settings updated');
    }

    res.json({
      success: true,
      settings,
      message: 'Settings saved successfully'
    });
  } catch (error) {
    console.error('❌ Error saving settings:', error);
    res.status(500).json({ 
      error: 'Failed to save settings',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Change password (admin only)
router.post('/change-password', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedPassword }
    });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Reset settings to default (admin only)
router.post('/reset', requireAuth, requireAdmin, async (req, res) => {
  try {
    const defaultSettings = {
      siteName: 'Genesis Agri Business',
      siteDescription: 'Agriculture marketplace connecting farmers and buyers',
      adminEmail: 'admin@genesisagri.com',
      adminPhone: '+1 (555) 123-4567',
      address: '123 Farm Road, Nairobi, Kenya',
      timezone: 'Africa/Nairobi',
      dateFormat: 'MM/DD/YYYY',
      storeName: 'Genesis Agri Business',
      storeEmail: 'info@genesisagri.com',
      storePhone: '+1 (555) 123-4567',
      storeAddress: '123 Farm Road, Nairobi, Kenya',
      currency: 'KES',
      taxRate: 16,
      logo: '',
      favicon: '',
      twoFactorAuth: false,
      sessionTimeout: 60,
      emailNotifications: true,
      orderNotifications: true,
      productNotifications: true,
      userNotifications: true,
      marketingEmails: false,
      themeColor: '#22c55e',
      darkMode: false,
      contactEmail: 'support@genesisagri.com',
      contactPhone: '+1 (555) 123-4567',
      contactAddress: '123 Agriculture Way, Farming District, FC 12345',
      contactHours: 'Mon-Fri: 8:00 AM - 6:00 PM',
      contactMapEmbed: '',
      enableContactForm: true,
      enableWhatsApp: true,
      whatsAppNumber: '+254700000000',
      enableLiveChat: false,
      emergencyPhone: '+1 (555) 999-9999',
      supportEmail: 'support@genesisagri.com',
      infoEmail: 'info@genesisagri.com',
    };

    let settings = await prisma.settings.findFirst();
    
    if (settings) {
      await prisma.settings.update({
        where: { id: settings.id },
        data: defaultSettings
      });
    } else {
      await prisma.settings.create({
        data: defaultSettings
      });
    }

    res.json({
      success: true,
      message: 'Settings reset to default successfully'
    });
  } catch (error) {
    console.error('Error resetting settings:', error);
    res.status(500).json({ error: 'Failed to reset settings' });
  }
});

module.exports = router;