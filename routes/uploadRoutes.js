const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { requireAdmin } = require('../middleware/auth');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '..', 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer disk storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '-').slice(0, 30);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E6);
    cb(null, `${cleanName}-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp|gif|svg/;
  const isExtAllowed = allowed.test(path.extname(file.originalname).toLowerCase());
  const isMimeAllowed = allowed.test(file.mimetype);

  if (isExtAllowed && isMimeAllowed) {
    return cb(null, true);
  }
  cb(new Error('Only image files (JPEG, PNG, WEBP, GIF, SVG) are allowed!'));
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter
});

// POST /api/upload (Protected admin file upload)
router.post('/', requireAdmin, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ ok: false, error: 'No image file uploaded.' });
    }

    // Return relative public URL path
    const fileUrl = `/uploads/${req.file.filename}`;

    return res.json({
      ok: true,
      message: 'Image uploaded successfully',
      url: fileUrl,
      filename: req.file.filename,
      size: req.file.size
    });
  } catch (err) {
    console.error('Upload error:', err);
    return res.status(500).json({ ok: false, error: err.message || 'Image upload failed.' });
  }
});

// POST /api/upload/multiple
router.post('/multiple', requireAdmin, upload.array('images', 8), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ ok: false, error: 'No image files uploaded.' });
    }

    const urls = req.files.map(f => `/uploads/${f.filename}`);

    return res.json({
      ok: true,
      message: `${req.files.length} images uploaded successfully`,
      urls
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message || 'Multiple upload failed.' });
  }
});

module.exports = router;
