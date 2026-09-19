const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Review = require('../models/Review');
const { requireAdmin } = require('../middleware/auth');

const mongoose = require('mongoose');
const { memoryStore } = require('../utils/memoryStore');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        ok: false,
        error: 'Please enter both email and password.'
      });
    }

    let admin = null;
    if (mongoose.connection.readyState === 1) {
      admin = await Admin.findOne({ email: email.toLowerCase().trim() });
    } else {
      await memoryStore.init();
      admin = memoryStore.admins.find(a => a.email === email.toLowerCase().trim());
    }

    if (!admin) {
      return res.status(401).json({
        ok: false,
        error: 'Invalid email or password.'
      });
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        ok: false,
        error: 'Invalid email or password.'
      });
    }

    admin.lastLogin = new Date();
    if (mongoose.connection.readyState === 1) await admin.save();

    const secret = process.env.JWT_SECRET || 'rollpoint_jwt_secret_dev_key_2026_9da0e7e7';
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

    const token = jwt.sign(
      { id: admin._id, email: admin.email, role: admin.role },
      secret,
      { expiresIn }
    );

    return res.json({
      ok: true,
      message: 'Logged in successfully',
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ ok: false, error: 'Server error during login.' });
  }
});

// GET /api/auth/me (Verify token)
router.get('/me', requireAdmin, async (req, res) => {
  return res.json({
    ok: true,
    admin: req.admin
  });
});

// PUT /api/auth/profile (Update Admin Email, Name & Password)
router.put('/profile', requireAdmin, async (req, res) => {
  try {
    const { name, email, currentPassword, newPassword } = req.body;

    if (!currentPassword) {
      return res.status(400).json({ ok: false, error: 'Please enter your current password to confirm changes.' });
    }

    if (mongoose.connection.readyState === 1) {
      const admin = await Admin.findById(req.admin._id);
      if (!admin) return res.status(404).json({ ok: false, error: 'Admin not found.' });

      const isMatch = await admin.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({ ok: false, error: 'Incorrect current password.' });
      }

      if (email && email.toLowerCase().trim() !== admin.email) {
        const existing = await Admin.findOne({ email: email.toLowerCase().trim(), _id: { $ne: admin._id } });
        if (existing) {
          return res.status(400).json({ ok: false, error: 'This email is already in use by another admin.' });
        }
        admin.email = email.toLowerCase().trim();
      }

      if (name) admin.name = name.trim();

      if (newPassword && newPassword.trim()) {
        if (newPassword.trim().length < 6) {
          return res.status(400).json({ ok: false, error: 'New password must be at least 6 characters.' });
        }
        admin.password = newPassword.trim();
      }

      await admin.save();

      const secret = process.env.JWT_SECRET || 'rollpoint_jwt_secret_dev_key_2026_9da0e7e7';
      const token = jwt.sign({ id: admin._id, email: admin.email, role: admin.role }, secret, { expiresIn: '7d' });

      return res.json({
        ok: true,
        message: 'Admin account updated successfully.',
        token,
        admin: { id: admin._id, name: admin.name, email: admin.email, role: admin.role }
      });
    }

    // Memory Store Fallback
    await memoryStore.init();
    const admin = memoryStore.admins.find(a => a._id === req.admin._id || a.email === req.admin.email);
    if (!admin) return res.status(404).json({ ok: false, error: 'Admin not found.' });

    const isMatch = await admin.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ ok: false, error: 'Incorrect current password.' });
    }

    if (email && email.toLowerCase().trim() !== admin.email) {
      const existing = memoryStore.admins.find(a => a.email === email.toLowerCase().trim() && a._id !== admin._id);
      if (existing) {
        return res.status(400).json({ ok: false, error: 'This email is already in use by another admin.' });
      }
      admin.email = email.toLowerCase().trim();
    }

    if (name) admin.name = name.trim();

    if (newPassword && newPassword.trim()) {
      if (newPassword.trim().length < 6) {
        return res.status(400).json({ ok: false, error: 'New password must be at least 6 characters.' });
      }
      const salt = await bcrypt.genSalt(10);
      admin.password = await bcrypt.hash(newPassword.trim(), salt);
    }

    const secret = process.env.JWT_SECRET || 'rollpoint_jwt_secret_dev_key_2026_9da0e7e7';
    const token = jwt.sign({ id: admin._id, email: admin.email, role: admin.role }, secret, { expiresIn: '7d' });

    return res.json({
      ok: true,
      message: 'Admin account updated successfully.',
      token,
      admin: { id: admin._id, name: admin.name, email: admin.email, role: admin.role }
    });
  } catch (err) {
    console.error('Update profile error:', err);
    return res.status(500).json({ ok: false, error: 'Failed to update admin profile.' });
  }
});

// PUT /api/auth/change-password
router.put('/change-password', requireAdmin, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ ok: false, error: 'Current and new password are required.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ ok: false, error: 'New password must be at least 6 characters.' });
    }

    if (mongoose.connection.readyState === 1) {
      const admin = await Admin.findById(req.admin._id);
      const isMatch = await admin.comparePassword(currentPassword);
      if (!isMatch) return res.status(400).json({ ok: false, error: 'Incorrect current password.' });
      admin.password = newPassword;
      await admin.save();
      return res.json({ ok: true, message: 'Password updated successfully.' });
    }

    await memoryStore.init();
    const admin = memoryStore.admins.find(a => a._id === req.admin._id || a.email === req.admin.email);
    if (!admin) return res.status(404).json({ ok: false, error: 'Admin not found.' });
    const isMatch = await admin.comparePassword(currentPassword);
    if (!isMatch) return res.status(400).json({ ok: false, error: 'Incorrect current password.' });
    const salt = await bcrypt.genSalt(10);
    admin.password = await bcrypt.hash(newPassword, salt);
    return res.json({ ok: true, message: 'Password updated successfully.' });
  } catch (err) {
    return res.status(500).json({ ok: false, error: 'Failed to change password.' });
  }
});

// GET /api/auth/stats (Admin Dashboard statistics)
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const [
        totalProducts,
        lowStockProducts,
        totalOrders,
        pendingOrders,
        confirmedOrders,
        shippedOrders,
        deliveredOrders,
        cancelledOrders,
        totalReviews,
        pendingReviews,
        recentOrders
      ] = await Promise.all([
        Product.countDocuments(),
        Product.countDocuments({ stock: { $lte: 10 } }),
        Order.countDocuments(),
        Order.countDocuments({ orderStatus: 'Pending' }),
        Order.countDocuments({ orderStatus: 'Confirmed' }),
        Order.countDocuments({ orderStatus: 'Shipped' }),
        Order.countDocuments({ orderStatus: 'Delivered' }),
        Order.countDocuments({ orderStatus: 'Cancelled' }),
        Review.countDocuments(),
        Review.countDocuments({ status: 'pending' }),
        Order.find().sort({ createdAt: -1 }).limit(8)
      ]);

      const revenueAgg = await Order.aggregate([
        { $match: { orderStatus: { $in: ['Delivered', 'Shipped', 'Confirmed'] } } },
        { $group: { _id: null, totalRevenue: { $sum: '$grandTotal' } } }
      ]);
      const totalRevenue = revenueAgg[0]?.totalRevenue || 0;

      return res.json({
        ok: true,
        stats: {
          totalProducts,
          lowStockProducts,
          totalOrders,
          pendingOrders,
          confirmedOrders,
          shippedOrders,
          deliveredOrders,
          cancelledOrders,
          totalReviews,
          pendingReviews,
          totalRevenue
        },
        recentOrders
      });
    }

    await memoryStore.init();
    const prods = memoryStore.products;
    const orders = memoryStore.orders;
    const reviews = memoryStore.reviews;

    const totalRevenue = orders
      .filter(o => ['Delivered', 'Shipped', 'Confirmed'].includes(o.orderStatus))
      .reduce((sum, o) => sum + o.grandTotal, 0);

    return res.json({
      ok: true,
      stats: {
        totalProducts: prods.length,
        lowStockProducts: prods.filter(p => p.stock <= 10).length,
        totalOrders: orders.length,
        pendingOrders: orders.filter(o => o.orderStatus === 'Pending').length,
        confirmedOrders: orders.filter(o => o.orderStatus === 'Confirmed').length,
        shippedOrders: orders.filter(o => o.orderStatus === 'Shipped').length,
        deliveredOrders: orders.filter(o => o.orderStatus === 'Delivered').length,
        cancelledOrders: orders.filter(o => o.orderStatus === 'Cancelled').length,
        totalReviews: reviews.length,
        pendingReviews: reviews.filter(r => r.status === 'pending').length,
        totalRevenue
      },
      recentOrders: [...orders].reverse().slice(0, 8)
    });
  } catch (err) {
    console.error('Stats error:', err);
    return res.status(500).json({ ok: false, error: 'Failed to load statistics.' });
  }
});

module.exports = router;
