const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  qty: { type: Number, required: true, min: 1 },
  total: { type: Number, required: true },
  image: { type: String, default: '' }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  // Single-product direct fields (as specified in prompt)
  productId: {
    type: String,
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  productPrice: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  productTotal: {
    type: Number,
    required: true
  },
  shipping: {
    type: Number,
    default: 250,
    required: true
  },
  grandTotal: {
    type: Number,
    required: true
  },
  // Items array for extended compatibility
  items: [orderItemSchema],

  // Customer Details
  customerName: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true
  },
  customerPhone: {
    type: String,
    required: [true, 'Working/WhatsApp phone number is required'],
    trim: true
  },
  customerEmail: {
    type: String,
    trim: true,
    default: ''
  },
  customerAddress: {
    type: String,
    required: [true, 'Delivery address is required'],
    trim: true
  },
  customerCity: {
    type: String,
    required: [true, 'City is required'],
    trim: true
  },
  customerNotes: {
    type: String,
    trim: true,
    default: ''
  },

  // Order Lifecycle
  orderStatus: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'],
    default: 'Pending',
    index: true
  },
  orderDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

module.exports = mongoose.model('Order', orderSchema);
