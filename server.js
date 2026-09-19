require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { connectDB } = require('./config/db');

// Route Handlers
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const settingRoutes = require('./routes/settingRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Parsing Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-token']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static Assets Hosting (Public folder)
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/upload', uploadRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    store: process.env.STORE_NAME || 'RollPoint',
    version: '1.0.0'
  });
});

// Root fallback to index.html for single-page app
app.use((req, res) => {
  // If API request not matched, return 404 JSON
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ ok: false, error: `API endpoint '${req.path}' not found.` });
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Centralized Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    ok: false,
    error: err.message || 'Internal Server Error'
  });
});

// Start Server & Connect Database
async function startServer() {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`
=====================================================
🚀 ROLLPOINT E-COMMERCE SERVER RUNNING
=====================================================
📡 Port:        http://localhost:${PORT}
🛍️ Customer UI: http://localhost:${PORT}/#/
🔐 Admin Panel: http://localhost:${PORT}/#/admin
📊 Health:      http://localhost:${PORT}/api/health
=====================================================
    `);
  });
}

startServer();

module.exports = app;
