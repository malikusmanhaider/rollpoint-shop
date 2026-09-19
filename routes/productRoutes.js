const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Review = require('../models/Review');
const { requireAdmin } = require('../middleware/auth');
const { INITIAL_CATEGORIES } = require('../config/seed');
const { memoryStore } = require('../utils/memoryStore');

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

// -------------------------------------------------------------
// PUBLIC ROUTES
// -------------------------------------------------------------

// GET /api/products/categories
router.get('/categories', async (req, res) => {
  try {
    let products = [];
    if (mongoose.connection.readyState === 1) {
      products = await Product.find({ isPublished: true });
    } else {
      await memoryStore.init();
      products = memoryStore.products.filter(p => p.isPublished);
    }

    const categoryMap = new Map();
    INITIAL_CATEGORIES.forEach(c => {
      categoryMap.set(c.slug, { slug: c.slug, name: c.name, tagline: c.tagline, count: 0 });
    });

    products.forEach(p => {
      if (categoryMap.has(p.category)) {
        const item = categoryMap.get(p.category);
        item.count += 1;
      } else {
        categoryMap.set(p.category, {
          slug: p.category,
          name: p.categoryName || p.category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          tagline: '',
          count: 1
        });
      }
    });

    const categories = Array.from(categoryMap.values());
    return res.json({ ok: true, categories });
  } catch (err) {
    console.error('Get categories error:', err);
    return res.status(500).json({ ok: false, error: 'Failed to fetch categories.' });
  }
});

// GET /api/products
router.get('/', async (req, res) => {
  try {
    const { category, q, inStockOnly, featuredOnly, sort, limit } = req.query;

    if (mongoose.connection.readyState === 1) {
      const query = { isPublished: true };
      if (category) query.category = category;
      if (inStockOnly === 'true' || inStockOnly === true) query.stock = { $gt: 0 };
      if (featuredOnly === 'true' || featuredOnly === true) query.featured = true;
      if (q && q.trim()) {
        const searchRegex = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        query.$or = [
          { name: searchRegex },
          { shortDescription: searchRegex },
          { description: searchRegex },
          { category: searchRegex },
          { keywords: { $in: [searchRegex] } }
        ];
      }

      let sortOption = {};
      switch (sort) {
        case 'price-asc': sortOption = { price: 1 }; break;
        case 'price-desc': sortOption = { price: -1 }; break;
        case 'rating': sortOption = { rating: -1, reviewCount: -1 }; break;
        case 'newest': sortOption = { createdAt: -1 }; break;
        default: sortOption = { featured: -1, rating: -1, createdAt: -1 };
      }

      let queryBuilder = Product.find(query).sort(sortOption);
      if (limit) {
        const numLimit = parseInt(limit, 10);
        if (!isNaN(numLimit) && numLimit > 0) queryBuilder = queryBuilder.limit(numLimit);
      }

      const products = await queryBuilder.exec();
      return res.json({ ok: true, count: products.length, products });
    }

    // Memory Store Fallback
    await memoryStore.init();
    let list = memoryStore.products.filter(p => p.isPublished);

    if (category) list = list.filter(p => p.category === category);
    if (inStockOnly === 'true' || inStockOnly === true) list = list.filter(p => p.stock > 0);
    if (featuredOnly === 'true' || featuredOnly === true) list = list.filter(p => p.featured);
    if (q && q.trim()) {
      const queryLower = q.trim().toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(queryLower) ||
        p.shortDescription.toLowerCase().includes(queryLower) ||
        p.category.toLowerCase().includes(queryLower) ||
        (p.keywords || []).some(k => k.toLowerCase().includes(queryLower))
      );
    }

    switch (sort) {
      case 'price-asc': list.sort((a, b) => a.price - b.price); break;
      case 'price-desc': list.sort((a, b) => b.price - a.price); break;
      case 'rating': list.sort((a, b) => b.rating - a.rating); break;
      case 'newest': list.reverse(); break;
      default: list.sort((a, b) => (b.featured - a.featured) || (b.rating - a.rating));
    }

    if (limit) {
      const numLimit = parseInt(limit, 10);
      if (!isNaN(numLimit) && numLimit > 0) list = list.slice(0, numLimit);
    }

    return res.json({ ok: true, count: list.length, products: list });
  } catch (err) {
    console.error('Get products error:', err);
    return res.status(500).json({ ok: false, error: 'Failed to fetch products.' });
  }
});

// GET /api/products/:slug
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    if (mongoose.connection.readyState === 1) {
      const product = await Product.findOne({ slug });
      if (!product) return res.status(404).json({ ok: false, error: 'Product not found.' });

      const approvedReviews = await Review.find({
        $or: [{ productSlug: product.slug }, { productId: product.id }],
        status: 'approved'
      }).sort({ date: -1 });

      const productObj = product.toObject();
      productObj.reviews = approvedReviews;
      return res.json({ ok: true, product: productObj });
    }

    await memoryStore.init();
    const product = memoryStore.products.find(p => p.slug === slug);
    if (!product) return res.status(404).json({ ok: false, error: 'Product not found.' });

    const approvedReviews = memoryStore.reviews.filter(
      r => (r.productSlug === slug || r.productId === product.id) && r.status === 'approved'
    );

    return res.json({ ok: true, product: { ...product, reviews: approvedReviews } });
  } catch (err) {
    return res.status(500).json({ ok: false, error: 'Failed to fetch product.' });
  }
});

// GET /api/products/id/:id
router.get('/id/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (mongoose.connection.readyState === 1) {
      const product = await Product.findOne({ id });
      if (!product) return res.status(404).json({ ok: false, error: 'Product not found.' });
      return res.json({ ok: true, product });
    }

    await memoryStore.init();
    const product = memoryStore.products.find(p => p.id === id);
    if (!product) return res.status(404).json({ ok: false, error: 'Product not found.' });
    return res.json({ ok: true, product });
  } catch (err) {
    return res.status(500).json({ ok: false, error: 'Failed to fetch product.' });
  }
});

// -------------------------------------------------------------
// ADMIN PROTECTED ROUTES
// -------------------------------------------------------------

// GET /api/products/admin/all
router.get('/admin/all', requireAdmin, async (req, res) => {
  try {
    const { category, search } = req.query;

    if (mongoose.connection.readyState === 1) {
      const query = {};
      if (category) query.category = category;
      if (search && search.trim()) {
        const searchRegex = new RegExp(search.trim(), 'i');
        query.$or = [{ name: searchRegex }, { id: searchRegex }, { slug: searchRegex }, { category: searchRegex }];
      }
      const products = await Product.find(query).sort({ createdAt: -1 });
      return res.json({ ok: true, count: products.length, products });
    }

    await memoryStore.init();
    let list = [...memoryStore.products];
    if (category) list = list.filter(p => p.category === category);
    if (search && search.trim()) {
      const s = search.trim().toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(s) || p.id.toLowerCase().includes(s) || p.slug.toLowerCase().includes(s));
    }
    return res.json({ ok: true, count: list.length, products: list });
  } catch (err) {
    return res.status(500).json({ ok: false, error: 'Failed to fetch admin products.' });
  }
});

// POST /api/products
router.post('/', requireAdmin, async (req, res) => {
  try {
    const {
      name,
      slug: customSlug,
      price,
      oldPrice,
      category,
      categoryName,
      stock,
      shortDescription,
      description,
      specifications,
      images,
      keywords,
      featured,
      isPublished
    } = req.body;

    if (!name || price === undefined || !category) {
      return res.status(400).json({ ok: false, error: 'Product name, price, and category are required.' });
    }

    let slug = customSlug ? slugify(customSlug) : slugify(name);

    if (mongoose.connection.readyState === 1) {
      let existingSlug = await Product.findOne({ slug });
      if (existingSlug) slug = `${slug}-${Date.now().toString().slice(-4)}`;
      const count = await Product.countDocuments();
      const id = `rp-${100 + count + 1}`;

      const newProduct = new Product({
        id,
        name: name.trim(),
        slug,
        price: Number(price),
        oldPrice: oldPrice ? Number(oldPrice) : null,
        category: category.trim(),
        categoryName: categoryName || category,
        stock: stock !== undefined ? Number(stock) : 0,
        shortDescription: shortDescription || '',
        description: description || '',
        specifications: specifications || {},
        images: Array.isArray(images) && images.length > 0 ? images : [`https://picsum.photos/seed/${slug}/640/640.jpg`],
        keywords: Array.isArray(keywords) ? keywords : (keywords ? keywords.split(',').map(k => k.trim()) : []),
        featured: Boolean(featured),
        isPublished: isPublished !== undefined ? Boolean(isPublished) : true
      });

      await newProduct.save();
      return res.status(201).json({ ok: true, message: 'Product created successfully', product: newProduct });
    }

    await memoryStore.init();
    let existingSlug = memoryStore.products.find(p => p.slug === slug);
    if (existingSlug) slug = `${slug}-${Date.now().toString().slice(-4)}`;
    const id = `rp-${100 + memoryStore.products.length + 1}`;

    const newProduct = {
      id,
      name: name.trim(),
      slug,
      price: Number(price),
      oldPrice: oldPrice ? Number(oldPrice) : null,
      category: category.trim(),
      categoryName: categoryName || category,
      stock: stock !== undefined ? Number(stock) : 0,
      shortDescription: shortDescription || '',
      description: description || '',
      specifications: specifications || {},
      images: Array.isArray(images) && images.length > 0 ? images : [`https://picsum.photos/seed/${slug}/640/640.jpg`],
      keywords: Array.isArray(keywords) ? keywords : (keywords ? keywords.split(',').map(k => k.trim()) : []),
      featured: Boolean(featured),
      isPublished: isPublished !== undefined ? Boolean(isPublished) : true,
      rating: 5.0,
      reviewCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    memoryStore.products.unshift(newProduct);
    return res.status(201).json({ ok: true, message: 'Product created successfully', product: newProduct });
  } catch (err) {
    console.error('Create product error:', err);
    return res.status(500).json({ ok: false, error: err.message || 'Failed to create product.' });
  }
});

// PUT /api/products/:id
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    if (updateData.price !== undefined) updateData.price = Number(updateData.price);
    if (updateData.oldPrice !== undefined) updateData.oldPrice = updateData.oldPrice ? Number(updateData.oldPrice) : null;
    if (updateData.stock !== undefined) updateData.stock = Number(updateData.stock);

    if (mongoose.connection.readyState === 1) {
      const product = await Product.findOneAndUpdate(
        { $or: [{ id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }] },
        updateData,
        { new: true, runValidators: true }
      );
      if (!product) return res.status(404).json({ ok: false, error: 'Product not found.' });
      return res.json({ ok: true, message: 'Product updated successfully', product });
    }

    await memoryStore.init();
    const index = memoryStore.products.findIndex(p => p.id === id);
    if (index === -1) return res.status(404).json({ ok: false, error: 'Product not found.' });

    memoryStore.products[index] = { ...memoryStore.products[index], ...updateData, updatedAt: new Date() };
    return res.json({ ok: true, message: 'Product updated successfully', product: memoryStore.products[index] });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message || 'Failed to update product.' });
  }
});

// DELETE /api/products/:id
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState === 1) {
      const product = await Product.findOneAndDelete({
        $or: [{ id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }]
      });
      if (!product) return res.status(404).json({ ok: false, error: 'Product not found.' });
      await Review.deleteMany({ $or: [{ productId: product.id }, { productSlug: product.slug }] });
      return res.json({ ok: true, message: 'Product deleted successfully.' });
    }

    await memoryStore.init();
    const index = memoryStore.products.findIndex(p => p.id === id);
    if (index === -1) return res.status(404).json({ ok: false, error: 'Product not found.' });

    const deleted = memoryStore.products.splice(index, 1)[0];
    memoryStore.reviews = memoryStore.reviews.filter(r => r.productId !== deleted.id && r.productSlug !== deleted.slug);

    return res.json({ ok: true, message: 'Product deleted successfully.' });
  } catch (err) {
    return res.status(500).json({ ok: false, error: 'Failed to delete product.' });
  }
});

// PATCH /api/products/:id/publish
router.patch('/:id/publish', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState === 1) {
      const product = await Product.findOne({ $or: [{ id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }] });
      if (!product) return res.status(404).json({ ok: false, error: 'Product not found.' });
      product.isPublished = !product.isPublished;
      await product.save();
      return res.json({ ok: true, isPublished: product.isPublished });
    }

    await memoryStore.init();
    const product = memoryStore.products.find(p => p.id === id);
    if (!product) return res.status(404).json({ ok: false, error: 'Product not found.' });
    product.isPublished = !product.isPublished;
    return res.json({ ok: true, isPublished: product.isPublished });
  } catch (err) {
    return res.status(500).json({ ok: false, error: 'Failed to update publish state.' });
  }
});

// PATCH /api/products/:id/stock
router.patch('/:id/stock', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { stock } = req.body;
    if (stock === undefined || isNaN(Number(stock)) || Number(stock) < 0) {
      return res.status(400).json({ ok: false, error: 'Valid stock number is required.' });
    }

    if (mongoose.connection.readyState === 1) {
      const product = await Product.findOneAndUpdate(
        { $or: [{ id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }] },
        { stock: Number(stock) },
        { new: true }
      );
      if (!product) return res.status(404).json({ ok: false, error: 'Product not found.' });
      return res.json({ ok: true, stock: product.stock });
    }

    await memoryStore.init();
    const product = memoryStore.products.find(p => p.id === id);
    if (!product) return res.status(404).json({ ok: false, error: 'Product not found.' });
    product.stock = Number(stock);
    return res.json({ ok: true, stock: product.stock });
  } catch (err) {
    return res.status(500).json({ ok: false, error: 'Failed to update stock.' });
  }
});

module.exports = router;
