const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  productId: {
    type: String,
    required: true,
    index: true
  },
  productSlug: {
    type: String,
    required: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Reviewer name is required'],
    trim: true
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: 1,
    max: 5
  },
  text: {
    type: String,
    required: [true, 'Review text is required'],
    trim: true,
    minlength: [5, 'Review must be at least 5 characters long']
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
    index: true
  },
  date: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Static helper to recalculate product rating and review count from approved reviews
reviewSchema.statics.recalculateProductRating = async function(productId, productSlug) {
  const Product = mongoose.model('Product');
  const query = productId ? { productId, status: 'approved' } : { productSlug, status: 'approved' };
  
  const approvedReviews = await this.find(query);
  const reviewCount = approvedReviews.length;
  
  let averageRating = 5.0;
  if (reviewCount > 0) {
    const sum = approvedReviews.reduce((acc, r) => acc + r.rating, 0);
    averageRating = Math.round((sum / reviewCount) * 10) / 10;
  }
  
  const targetFilter = productId ? { id: productId } : { slug: productSlug };
  await Product.findOneAndUpdate(targetFilter, {
    rating: averageRating,
    reviewCount: reviewCount
  });
};

module.exports = mongoose.model('Review', reviewSchema);
