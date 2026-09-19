const express = require('express');
const router = express.Router();
const Setting = require('../models/Setting');
const { requireAdmin } = require('../middleware/auth');

const mongoose = require('mongoose');
const { memoryStore } = require('../utils/memoryStore');

// GET /api/settings (Public website configuration)
router.get('/', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      let settings = await Setting.findOne({ key: 'main_settings' });
      if (!settings) {
        settings = await Setting.create({
          key: 'main_settings',
          websiteName: process.env.STORE_NAME || 'RollPoint',
          tagline: 'Counter supplies, delivered.',
          whatsappNumber: process.env.WHATSAPP_NUMBER || '0308 9134302',
          whatsappIntl: process.env.WHATSAPP_INTL || '923089134302',
          contactEmail: process.env.STORE_EMAIL || 'orders@rollpoint.pk',
          contactAddress: process.env.STORE_ADDRESS || 'Shop 12, Main Bazar, Lahore, Pakistan',
          contactHours: process.env.STORE_HOURS || 'Mon–Sat · 10:00 am – 8:00 pm',
          shippingRate: parseInt(process.env.FLAT_SHIPPING_RATE || '250', 10)
        });
      }
      return res.json({ ok: true, settings });
    }

    await memoryStore.init();
    return res.json({ ok: true, settings: memoryStore.settings });
  } catch (err) {
    console.error('Get settings error:', err);
    return res.status(500).json({ ok: false, error: 'Failed to fetch website settings.' });
  }
});

// PUT /api/settings (Admin updates website settings & theme)
router.put('/', requireAdmin, async (req, res) => {
  try {
    const updateFields = req.body;
    delete updateFields._id;
    delete updateFields.key;

    if (mongoose.connection.readyState === 1) {
      let settings = await Setting.findOneAndUpdate(
        { key: 'main_settings' },
        updateFields,
        { new: true, upsert: true, runValidators: true }
      );
      return res.json({
        ok: true,
        message: 'Website settings updated successfully',
        settings
      });
    }

    await memoryStore.init();
    memoryStore.settings = { ...memoryStore.settings, ...updateFields };
    return res.json({
      ok: true,
      message: 'Website settings updated successfully',
      settings: memoryStore.settings
    });
  } catch (err) {
    console.error('Update settings error:', err);
    return res.status(500).json({ ok: false, error: 'Failed to update website settings.' });
  }
});

module.exports = router;
