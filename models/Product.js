const mongoose = require('mongoose');

const specificationSchema = new mongoose.Schema({
  key: { type: String, required: true },
  value: { type: String, required: true }
}, { _id: false });

const productSchema = new mongoose.Schema({
  id: {
    type: String,
    unique: true,
    index: true,
    required: true
  },
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    index: true
  },
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: [0, 'Price cannot be negative']
  },
  oldPrice: {
    type: Number,
    default: null
  },
  discount: {
    type: Number,
    default: 0
  },
  images: {
    type: [String],
    default: []
  },
  shortDescription: {
    type: String,
    default: '',
    trim: true
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  specifications: {
    type: Map,
    of: String,
    default: {}
  },
  category: {
    type: String,
    required: [true, 'Product category is required'],
    trim: true,
    index: true
  },
  categoryName: {
    type: String,
    default: ''
  },
  stock: {
    type: Number,
    default: 0,
    min: [0, 'Stock cannot be negative']
  },
  rating: {
    type: Number,
    default: 5.0,
    min: 0,
    max: 5
  },
  reviewCount: {
    type: Number,
    default: 0,
    min: 0
  },
  featured: {
    type: Boolean,
    default: false
  },
  isPublished: {
    type: Boolean,
    default: true
  },
  keywords: {
    type: [String],
    default: []
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Auto-calculate discount percentage if oldPrice exists
productSchema.pre('save', function() {
  if (this.oldPrice && this.oldPrice > this.price) {
    this.discount = Math.round(((this.oldPrice - this.price) / this.oldPrice) * 100);
  } else {
    this.discount = 0;
  }
});

module.exports = mongoose.model('Product', productSchema);
