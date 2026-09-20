const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { requireAdmin } = require('../middleware/auth');

// Memory storage use karein taake Vercel crash na ho
const storage = multer.memoryStorage();

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
  limits: { fileSize: 4 * 1024 * 1024 }, // 4MB limit
  fileFilter
});

function bufferToDataURI(buffer, mimetype) {
  return `data:${mimetype};base64,${buffer.toString('base64')}`;
}

// POST /api/upload
router.post('/', requireAdmin, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ ok: false, error: 'No image file uploaded.' });
    }

    // Convert to Data URI so it saves directly in MongoDB
    const dataUri = bufferToDataURI(req.file.buffer, req.file.mimetype);

    // Optional local backup
    try {
      const uploadDir = path.join(__dirname, '..', 'public', 'uploads');
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
      const ext = path.extname(req.file.originalname).toLowerCase();
      const cleanName = path.basename(req.file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '-').slice(0, 30);
      const filename = `${cleanName}-${Date.now()}${ext}`;
      fs.writeFileSync(path.join(uploadDir, filename), req.file.buffer);
    } catch (e) {}

    return res.json({
      ok: true,
      message: 'Image uploaded successfully',
      url: dataUri,
      filename: req.file.originalname,
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

    const urls = req.files.map(f => bufferToDataURI(f.buffer, f.mimetype));

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