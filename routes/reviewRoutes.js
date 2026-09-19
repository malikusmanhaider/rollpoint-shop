const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Review = require('../models/Review');
const Product = require('../models/Product');
const { requireAdmin } = require('../middleware/auth');
const { memoryStore } = require('../utils/memoryStore');

// -------------------------------------------------------------
// PUBLIC REVIEWS
// -------------------------------------------------------------

// POST /api/reviews (Customer submits review -> status: pending)
router.post('/', async (req, res) => {
  try {
    const { slug, productId, name, rating, text } = req.body;

    if (!name || name.trim().length < 2) return res.status(400).json({ ok: false, error: 'Please enter your name.' });
    const numRating = Number(rating);
    if (!numRating || numRating < 1 || numRating > 5) return res.status(400).json({ ok: false, error: 'Please select a valid rating between 1 and 5 stars.' });
    if (!text || text.trim().length < 5) return res.status(400).json({ ok: false, error: 'Please write a review with at least 5 characters.' });

    if (mongoose.connection.readyState === 1) {
      let product = null;
      if (slug) product = await Product.findOne({ slug });
      else if (productId) product = await Product.findOne({ id: productId });
      if (!product) return res.status(404).json({ ok: false, error: 'Product not found.' });

      const review = new Review({
        productId: product.id,
        productSlug: product.slug,
        name: name.trim(),
        rating: numRating,
        text: text.trim(),
        status: 'pending',
        date: new Date()
      });

      await review.save();

      return res.status(201).json({
        ok: true,
        message: 'Thank you! Your review has been submitted for moderation.',
        review: {
          id: review._id,
          name: review.name,
          rating: review.rating,
          text: review.text,
          date: review.date,
          status: review.status
        }
      });
    }

    // Memory Store Fallback
    await memoryStore.init();
    const product = memoryStore.products.find(p => p.slug === slug || p.id === productId);
    if (!product) return res.status(404).json({ ok: false, error: 'Product not found.' });

    const reviewId = `rev-${Date.now()}`;
    const review = {
      _id: reviewId,
      id: reviewId,
      productId: product.id,
      productSlug: product.slug,
      name: name.trim(),
      rating: numRating,
      text: text.trim(),
      status: 'pending',
      date: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    memoryStore.reviews.unshift(review);

    return res.status(201).json({
      ok: true,
      message: 'Thank you! Your review has been submitted for moderation.',
      review
    });
  } catch (err) {
    console.error('Submit review error:', err);
    return res.status(500).json({ ok: false, error: 'Failed to submit review.' });
  }
});

// GET /api/reviews/product/:slug (Public approved reviews)
router.get('/product/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    if (mongoose.connection.readyState === 1) {
      const reviews = await Review.find({ productSlug: slug, status: 'approved' }).sort({ date: -1 });
      return res.json({ ok: true, count: reviews.length, reviews });
    }

    await memoryStore.init();
    const reviews = memoryStore.reviews.filter(r => r.productSlug === slug && r.status === 'approved');
    return res.json({ ok: true, count: reviews.length, reviews });
  } catch (err) {
    return res.status(500).json({ ok: false, error: 'Failed to fetch reviews.' });
  }
});

// -------------------------------------------------------------
// ADMIN REVIEWS MODERATION
// -------------------------------------------------------------

// GET /api/reviews/admin/all
router.get('/admin/all', requireAdmin, async (req, res) => {
  try {
    const { status, search } = req.query;

    if (mongoose.connection.readyState === 1) {
      const query = {};
      if (status && status !== 'All') query.status = status;
      if (search && search.trim()) {
        const sRegex = new RegExp(search.trim(), 'i');
        query.$or = [{ name: sRegex }, { text: sRegex }, { productSlug: sRegex }, { productId: sRegex }];
      }
      const reviews = await Review.find(query).sort({ createdAt: -1 });
      return res.json({ ok: true, count: reviews.length, reviews });
    }

    await memoryStore.init();
    let list = [...memoryStore.reviews];
    if (status && status !== 'All') list = list.filter(r => r.status === status);
    if (search && search.trim()) {
      const s = search.trim().toLowerCase();
      list = list.filter(r => r.name.toLowerCase().includes(s) || r.text.toLowerCase().includes(s) || r.productSlug.toLowerCase().includes(s));
    }
    return res.json({ ok: true, count: list.length, reviews: list });
  } catch (err) {
    return res.status(500).json({ ok: false, error: 'Failed to fetch reviews.' });
  }
});

// PATCH /api/reviews/:id/status (Approve or Reject review)
router.patch('/:id/status', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ ok: false, error: 'Invalid status. Must be pending, approved, or rejected.' });
    }

    if (mongoose.connection.readyState === 1) {
      const review = await Review.findById(id);
      if (!review) return res.status(404).json({ ok: false, error: 'Review not found.' });

      review.status = status;
      await review.save();
      await Review.recalculateProductRating(review.productId, review.productSlug);

      const product = await Product.findOne({ $or: [{ id: review.productId }, { slug: review.productSlug }] });
      return res.json({
        ok: true,
        message: `Review marked as ${status}.`,
        review,
        product: product ? { rating: product.rating, reviewCount: product.reviewCount } : null
      });
    }

    await memoryStore.init();
    const review = memoryStore.reviews.find(r => r._id === id || r.id === id);
    if (!review) return res.status(404).json({ ok: false, error: 'Review not found.' });

    review.status = status;
    memoryStore.recalculateProductRating(review.productId, review.productSlug);

    const product = memoryStore.products.find(p => p.id === review.productId || p.slug === review.productSlug);
    return res.json({
      ok: true,
      message: `Review marked as ${status}.`,
      review,
      product: product ? { rating: product.rating, reviewCount: product.reviewCount } : null
    });
  } catch (err) {
    console.error('Update review status error:', err);
    return res.status(500).json({ ok: false, error: 'Failed to update review status.' });
  }
});

// DELETE /api/reviews/:id
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState === 1) {
      const review = await Review.findByIdAndDelete(id);
      if (!review) return res.status(404).json({ ok: false, error: 'Review not found.' });
      await Review.recalculateProductRating(review.productId, review.productSlug);
      return res.json({ ok: true, message: 'Review deleted successfully.' });
    }

    await memoryStore.init();
    const index = memoryStore.reviews.findIndex(r => r._id === id || r.id === id);
    if (index === -1) return res.status(404).json({ ok: false, error: 'Review not found.' });

    const deleted = memoryStore.reviews.splice(index, 1)[0];
    memoryStore.recalculateProductRating(deleted.productId, deleted.productSlug);

    return res.json({ ok: true, message: 'Review deleted successfully.' });
  } catch (err) {
    return res.status(500).json({ ok: false, error: 'Failed to delete review.' });
  }
});

module.exports = router;
