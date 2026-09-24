const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;
const { requireAdmin } = require('../middleware/auth');

// Configure Cloudinary if credentials are present
const isCloudinaryConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
  });
}

// Memory storage for multer: processes images in RAM without saving temp files to disk
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp|gif|svg|avif/;
  const isExtAllowed = allowed.test(path.extname(file.originalname).toLowerCase());
  const isMimeAllowed = allowed.test(file.mimetype) || file.mimetype.startsWith('image/');

  if (isExtAllowed || isMimeAllowed) {
    return cb(null, true);
  }
  cb(new Error('Only image files (JPEG, PNG, WEBP, GIF, SVG, AVIF) are allowed!'));
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit per image
  fileFilter
});

/**
 * Uploads a buffer directly to Cloudinary and returns CDN HTTPS URL.
 * Automatically converts to optimized WebP format with quality tuning.
 */
function uploadBufferToCloudinary(buffer, originalname) {
  return new Promise((resolve, reject) => {
    const cleanName = path.basename(originalname, path.extname(originalname))
      .replace(/[^a-zA-Z0-9_-]/g, '-')
      .slice(0, 40);

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'rollpoint/products',
        public_id: `${cleanName}-${Date.now()}`,
        resource_type: 'image',
        format: 'webp', // Auto-compress to modern WebP format
        transformation: [
          { quality: 'auto:good' }, // Optimal compression (keeps crystal clear, tiny file size)
          { fetch_format: 'auto' }
        ]
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    uploadStream.end(buffer);
  });
}

/**
 * Fallback local file saver when Cloudinary is not yet configured.
 * Saves to public/uploads and returns relative URL "/uploads/filename.ext".
 */
function saveLocallyAsUrl(buffer, originalname) {
  const uploadDir = path.join(__dirname, '..', 'public', 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const ext = path.extname(originalname).toLowerCase() || '.png';
  const cleanName = path.basename(originalname, ext)
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .slice(0, 30);
  const filename = `${cleanName}-${Date.now()}${ext}`;
  const filepath = path.join(uploadDir, filename);

  fs.writeFileSync(filepath, buffer);
  return `/uploads/${filename}`;
}

// GET /api/upload/status — Diagnostic endpoint to check storage engine
router.get('/status', (req, res) => {
  const configured = Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
  res.json({
    ok: true,
    engine: configured ? 'cloudinary' : 'local-storage',
    cloudName: process.env.CLOUDINARY_CLOUD_NAME ? `${process.env.CLOUDINARY_CLOUD_NAME.slice(0, 3)}***` : null,
    message: configured
      ? 'Cloudinary CDN active: Uploads will be saved as high-speed WebP URLs'
      : 'Cloudinary not configured yet. Saving to local storage /uploads URL.'
  });
});

// POST /api/upload — Single Image Upload
router.post('/', requireAdmin, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ ok: false, error: 'No image file provided.' });
    }

    let imageUrl = '';
    let storageEngine = 'local';

    if (isCloudinaryConfigured) {
      try {
        const result = await uploadBufferToCloudinary(req.file.buffer, req.file.originalname);
        imageUrl = result.secure_url;
        storageEngine = 'cloudinary';
      } catch (cloudErr) {
        console.error('Cloudinary upload failed, falling back to local storage:', cloudErr.message);
        imageUrl = saveLocallyAsUrl(req.file.buffer, req.file.originalname);
      }
    } else {
      imageUrl = saveLocallyAsUrl(req.file.buffer, req.file.originalname);
    }

    return res.json({
      ok: true,
      message: 'Image uploaded successfully as URL',
      url: imageUrl,
      storage: storageEngine,
      filename: req.file.originalname,
      size: req.file.size
    });
  } catch (err) {
    console.error('Image upload handler error:', err);
    return res.status(500).json({
      ok: false,
      error: err.message || 'Image upload failed.'
    });
  }
});

// POST /api/upload/multiple — Multiple Images Upload (up to 8 images at once)
router.post('/multiple', requireAdmin, upload.array('images', 8), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ ok: false, error: 'No image files provided.' });
    }

    const uploadPromises = req.files.map(async (file) => {
      if (isCloudinaryConfigured) {
        try {
          const resCloud = await uploadBufferToCloudinary(file.buffer, file.originalname);
          return resCloud.secure_url;
        } catch (e) {
          console.error('Cloudinary multiple upload error fallback:', e.message);
          return saveLocallyAsUrl(file.buffer, file.originalname);
        }
      } else {
        return saveLocallyAsUrl(file.buffer, file.originalname);
      }
    });

    const urls = await Promise.all(uploadPromises);

    return res.json({
      ok: true,
      message: `${urls.length} images uploaded successfully`,
      urls
    });
  } catch (err) {
    console.error('Multiple upload handler error:', err);
    return res.status(500).json({
      ok: false,
      error: err.message || 'Multiple upload failed.'
    });
  }
});

module.exports = router;