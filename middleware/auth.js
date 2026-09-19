const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const { memoryStore } = require('../utils/memoryStore');

async function requireAdmin(req, res, next) {
  try {
    let token = null;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.headers['x-admin-token']) {
      token = req.headers['x-admin-token'];
    }

    if (!token) {
      return res.status(401).json({
        ok: false,
        error: 'Authentication required. Please log in as an administrator.'
      });
    }

    const secret = process.env.JWT_SECRET || 'rollpoint_jwt_secret_dev_key_2026_9da0e7e7';
    const decoded = jwt.verify(token, secret);

    let admin = null;
    if (mongoose.connection.readyState === 1) {
      admin = await Admin.findById(decoded.id).select('-password');
    } else {
      admin = memoryStore.admins.find(a => a._id === decoded.id || a.email === decoded.email);
    }
    if (!admin) {
      return res.status(401).json({
        ok: false,
        error: 'Admin account not found or access revoked.'
      });
    }

    req.admin = admin;
    next();
  } catch (err) {
    return res.status(401).json({
      ok: false,
      error: 'Invalid or expired session token. Please log in again.'
    });
  }
}

module.exports = { requireAdmin };
