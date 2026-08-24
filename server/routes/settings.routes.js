// routes/settings.routes.js
const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

// Get settings
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    // Try to get settings from database
    let settings = await prisma.settings.findFirst();
    
    // If no settings exist, create default settings
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
        }
      });
    }

    res.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Update settings
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const {
      siteName,
      siteDescription,
      adminEmail,
      adminPhone,
      address,
      timezone,
      dateFormat,
      storeName,
      storeEmail,
      storePhone,
      storeAddress,
      currency,
      taxRate,
      logo,
      favicon,
      twoFactorAuth,
      sessionTimeout,
      emailNotifications,
      orderNotifications,
      productNotifications,
      userNotifications,
      marketingEmails,
      themeColor,
      darkMode,
    } = req.body;

    // Get existing settings or create new
    let settings = await prisma.settings.findFirst();
    
    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          siteName: siteName || 'Genesis Agri Business',
          siteDescription: siteDescription || '',
          adminEmail: adminEmail || 'admin@genesisagri.com',
          adminPhone: adminPhone || '',
          address: address || '',
          timezone: timezone || 'Africa/Nairobi',
          dateFormat: dateFormat || 'MM/DD/YYYY',
          storeName: storeName || 'Genesis Agri Business',
          storeEmail: storeEmail || 'info@genesisagri.com',
          storePhone: storePhone || '',
          storeAddress: storeAddress || '',
          currency: currency || 'KES',
          taxRate: taxRate || 0,
          logo: logo || '',
          favicon: favicon || '',
          twoFactorAuth: twoFactorAuth || false,
          sessionTimeout: sessionTimeout || 60,
          emailNotifications: emailNotifications !== undefined ? emailNotifications : true,
          orderNotifications: orderNotifications !== undefined ? orderNotifications : true,
          productNotifications: productNotifications !== undefined ? productNotifications : true,
          userNotifications: userNotifications !== undefined ? userNotifications : true,
          marketingEmails: marketingEmails !== undefined ? marketingEmails : false,
          themeColor: themeColor || '#22c55e',
          darkMode: darkMode || false,
        }
      });
    } else {
      // Update existing settings
      settings = await prisma.settings.update({
        where: { id: settings.id },
        data: {
          siteName: siteName || settings.siteName,
          siteDescription: siteDescription !== undefined ? siteDescription : settings.siteDescription,
          adminEmail: adminEmail || settings.adminEmail,
          adminPhone: adminPhone !== undefined ? adminPhone : settings.adminPhone,
          address: address !== undefined ? address : settings.address,
          timezone: timezone || settings.timezone,
          dateFormat: dateFormat || settings.dateFormat,
          storeName: storeName || settings.storeName,
          storeEmail: storeEmail || settings.storeEmail,
          storePhone: storePhone !== undefined ? storePhone : settings.storePhone,
          storeAddress: storeAddress !== undefined ? storeAddress : settings.storeAddress,
          currency: currency || settings.currency,
          taxRate: taxRate !== undefined ? taxRate : settings.taxRate,
          logo: logo !== undefined ? logo : settings.logo,
          favicon: favicon !== undefined ? favicon : settings.favicon,
          twoFactorAuth: twoFactorAuth !== undefined ? twoFactorAuth : settings.twoFactorAuth,
          sessionTimeout: sessionTimeout || settings.sessionTimeout,
          emailNotifications: emailNotifications !== undefined ? emailNotifications : settings.emailNotifications,
          orderNotifications: orderNotifications !== undefined ? orderNotifications : settings.orderNotifications,
          productNotifications: productNotifications !== undefined ? productNotifications : settings.productNotifications,
          userNotifications: userNotifications !== undefined ? userNotifications : settings.userNotifications,
          marketingEmails: marketingEmails !== undefined ? marketingEmails : settings.marketingEmails,
          themeColor: themeColor || settings.themeColor,
          darkMode: darkMode !== undefined ? darkMode : settings.darkMode,
        }
      });
    }

    res.json({
      success: true,
      settings,
      message: 'Settings saved successfully'
    });
  } catch (error) {
    console.error('Error saving settings:', error);
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

// Change password
router.post('/change-password', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
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

// Reset settings to default
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