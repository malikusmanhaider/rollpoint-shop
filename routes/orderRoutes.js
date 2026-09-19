const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Setting = require('../models/Setting');
const { generateOrderId } = require('../utils/orderIdGenerator');
const { requireAdmin } = require('../middleware/auth');
const { memoryStore } = require('../utils/memoryStore');

const formatPrice = n => 'Rs. ' + Number(n).toLocaleString('en-US');

function buildWhatsAppPayload(order, whatsappIntl = '923089134302') {
  const lines = [
    '*NEW ORDER*',
    '',
    `*Order ID:* ${order.orderId || order.id}`,
    `*Product:* ${order.productName}`,
    `*Price:* ${formatPrice(order.productPrice)}`,
    `*Quantity:* ${order.quantity}`,
    `*Product Total:* ${formatPrice(order.productTotal)}`,
    `*Shipping:* ${formatPrice(order.shipping)} (Flat Nationwide)`,
    `*Grand Total:* ${formatPrice(order.grandTotal)}`,
    '',
    '*CUSTOMER DETAILS*',
    `*Name:* ${order.customerName}`,
    `*WhatsApp:* ${order.customerPhone}`,
    order.customerEmail ? `*Email:* ${order.customerEmail}` : null,
    `*Address:* ${order.customerAddress}`,
    `*City:* ${order.customerCity}`,
    order.customerNotes ? `*Notes:* ${order.customerNotes}` : null,
    '',
    '_Sent via RollPoint Web Checkout_'
  ].filter(Boolean);

  const messageText = lines.join('\n');
  const cleanPhone = whatsappIntl.replace(/[^0-9]/g, '');
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`;

  return { messageText, whatsappUrl };
}

// -------------------------------------------------------------
// PUBLIC ORDER CREATION
// -------------------------------------------------------------

// POST /api/orders
router.post('/', async (req, res) => {
  try {
    const {
      productId,
      quantity,
      customerName,
      customerPhone,
      customerEmail,
      customerAddress,
      customerCity,
      customerNotes
    } = req.body;

    if (!productId) return res.status(400).json({ ok: false, error: 'Product is required.' });
    if (!customerName || customerName.trim().length < 2) return res.status(400).json({ ok: false, error: 'Please enter a valid customer name.' });
    if (!customerPhone || customerPhone.trim().length < 10) return res.status(400).json({ ok: false, error: 'Please enter a valid working/WhatsApp phone number.' });
    if (!customerAddress || customerAddress.trim().length < 6) return res.status(400).json({ ok: false, error: 'Please enter a complete delivery address.' });
    if (!customerCity || customerCity.trim().length < 2) return res.status(400).json({ ok: false, error: 'Please enter your city.' });

    const qty = Math.max(1, parseInt(quantity, 10) || 1);
    const orderId = await generateOrderId();

    if (mongoose.connection.readyState === 1) {
      const product = await Product.findOne({ $or: [{ id: productId }, { slug: productId }] });
      if (!product) return res.status(404).json({ ok: false, error: 'Product not found.' });

      const settings = await Setting.findOne({ key: 'main_settings' }) || {};
      const shipping = settings.shippingRate || 250;
      const whatsappIntl = process.env.WHATSAPP_INTL || settings.whatsappIntl || '923089134302';

      const productPrice = product.price;
      const productTotal = productPrice * qty;
      const grandTotal = productTotal + shipping;

      const order = new Order({
        orderId,
        productId: product.id,
        productName: product.name,
        productPrice,
        quantity: qty,
        productTotal,
        shipping,
        grandTotal,
        items: [{
          productId: product.id,
          name: product.name,
          price: productPrice,
          qty,
          total: productTotal,
          image: (product.images && product.images[0]) || ''
        }],
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail ? customerEmail.trim() : '',
        customerAddress: customerAddress.trim(),
        customerCity: customerCity.trim(),
        customerNotes: customerNotes ? customerNotes.trim() : '',
        orderStatus: 'Pending',
        orderDate: new Date()
      });

      await order.save();

      if (product.stock > 0) {
        product.stock = Math.max(0, product.stock - qty);
        await product.save();
      }

      const { messageText, whatsappUrl } = buildWhatsAppPayload(order, whatsappIntl);

      return res.status(201).json({
        ok: true,
        message: 'Order created successfully',
        orderId: order.orderId,
        order: {
          id: order.orderId,
          orderId: order.orderId,
          productName: order.productName,
          productPrice: order.productPrice,
          quantity: order.quantity,
          productTotal: order.productTotal,
          shipping: order.shipping,
          grandTotal: order.grandTotal,
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          customerEmail: order.customerEmail,
          customerAddress: order.customerAddress,
          customerCity: order.customerCity,
          orderStatus: order.orderStatus,
          orderDate: order.orderDate
        },
        whatsappUrl,
        whatsappMessage: messageText
      });
    }

    // Memory Store Fallback
    await memoryStore.init();
    const product = memoryStore.products.find(p => p.id === productId || p.slug === productId);
    if (!product) return res.status(404).json({ ok: false, error: 'Product not found.' });

    const shipping = memoryStore.settings.shippingRate || 250;
    const whatsappIntl = process.env.WHATSAPP_INTL || memoryStore.settings.whatsappIntl || '923089134302';
    const productPrice = product.price;
    const productTotal = productPrice * qty;
    const grandTotal = productTotal + shipping;

    const order = {
      _id: `ord-id-${Date.now()}`,
      orderId,
      productId: product.id,
      productName: product.name,
      productPrice,
      quantity: qty,
      productTotal,
      shipping,
      grandTotal,
      items: [{
        productId: product.id,
        name: product.name,
        price: productPrice,
        qty,
        total: productTotal,
        image: (product.images && product.images[0]) || ''
      }],
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerEmail: customerEmail ? customerEmail.trim() : '',
      customerAddress: customerAddress.trim(),
      customerCity: customerCity.trim(),
      customerNotes: customerNotes ? customerNotes.trim() : '',
      orderStatus: 'Pending',
      orderDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    memoryStore.orders.unshift(order);
    if (product.stock > 0) product.stock = Math.max(0, product.stock - qty);

    const { messageText, whatsappUrl } = buildWhatsAppPayload(order, whatsappIntl);

    return res.status(201).json({
      ok: true,
      message: 'Order created successfully',
      orderId: order.orderId,
      order,
      whatsappUrl,
      whatsappMessage: messageText
    });
  } catch (err) {
    console.error('Create order error:', err);
    return res.status(500).json({ ok: false, error: 'Failed to create order.' });
  }
});

// GET /api/orders/track/:orderId
router.get('/track/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    if (mongoose.connection.readyState === 1) {
      const order = await Order.findOne({ orderId });
      if (!order) return res.status(404).json({ ok: false, error: 'Order not found.' });
      return res.json({ ok: true, order });
    }

    await memoryStore.init();
    const order = memoryStore.orders.find(o => o.orderId === orderId);
    if (!order) return res.status(404).json({ ok: false, error: 'Order not found.' });
    return res.json({ ok: true, order });
  } catch (err) {
    return res.status(500).json({ ok: false, error: 'Failed to look up order.' });
  }
});

// -------------------------------------------------------------
// ADMIN ORDER MANAGEMENT
// -------------------------------------------------------------

// GET /api/orders
router.get('/', requireAdmin, async (req, res) => {
  try {
    const { status, search, limit = 50, page = 1 } = req.query;

    if (mongoose.connection.readyState === 1) {
      const query = {};
      if (status && status !== 'All') query.orderStatus = status;
      if (search && search.trim()) {
        const sRegex = new RegExp(search.trim(), 'i');
        query.$or = [{ orderId: sRegex }, { customerName: sRegex }, { customerPhone: sRegex }, { customerCity: sRegex }, { productName: sRegex }];
      }
      const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
      const totalCount = await Order.countDocuments(query);
      const orders = await Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit, 10));
      return res.json({ ok: true, total: totalCount, page: parseInt(page, 10), totalPages: Math.ceil(totalCount / parseInt(limit, 10)), orders });
    }

    await memoryStore.init();
    let list = [...memoryStore.orders];
    if (status && status !== 'All') list = list.filter(o => o.orderStatus === status);
    if (search && search.trim()) {
      const s = search.trim().toLowerCase();
      list = list.filter(o =>
        o.orderId.toLowerCase().includes(s) ||
        o.customerName.toLowerCase().includes(s) ||
        o.customerPhone.toLowerCase().includes(s) ||
        o.customerCity.toLowerCase().includes(s) ||
        o.productName.toLowerCase().includes(s)
      );
    }
    return res.json({ ok: true, total: list.length, page: 1, totalPages: 1, orders: list });
  } catch (err) {
    return res.status(500).json({ ok: false, error: 'Failed to fetch orders.' });
  }
});

// GET /api/orders/:id
router.get('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    if (mongoose.connection.readyState === 1) {
      const order = await Order.findOne({ $or: [{ orderId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }] });
      if (!order) return res.status(404).json({ ok: false, error: 'Order not found.' });
      return res.json({ ok: true, order });
    }

    await memoryStore.init();
    const order = memoryStore.orders.find(o => o.orderId === id || o._id === id);
    if (!order) return res.status(404).json({ ok: false, error: 'Order not found.' });
    return res.json({ ok: true, order });
  } catch (err) {
    return res.status(500).json({ ok: false, error: 'Failed to fetch order.' });
  }
});

// PATCH /api/orders/:id/status
router.patch('/:id/status', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'];
    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({ ok: false, error: `Invalid status. Must be one of: ${allowedStatuses.join(', ')}` });
    }

    if (mongoose.connection.readyState === 1) {
      const order = await Order.findOneAndUpdate(
        { $or: [{ orderId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }] },
        { orderStatus: status },
        { new: true }
      );
      if (!order) return res.status(404).json({ ok: false, error: 'Order not found.' });
      return res.json({ ok: true, message: `Order status updated to ${status}`, order });
    }

    await memoryStore.init();
    const order = memoryStore.orders.find(o => o.orderId === id || o._id === id);
    if (!order) return res.status(404).json({ ok: false, error: 'Order not found.' });
    order.orderStatus = status;
    order.updatedAt = new Date();
    return res.json({ ok: true, message: `Order status updated to ${status}`, order });
  } catch (err) {
    return res.status(500).json({ ok: false, error: 'Failed to update order status.' });
  }
});

// DELETE /api/orders/:id
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    if (mongoose.connection.readyState === 1) {
      const order = await Order.findOneAndDelete({
        $or: [{ orderId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }]
      });
      if (!order) return res.status(404).json({ ok: false, error: 'Order not found.' });
      return res.json({ ok: true, message: 'Order deleted successfully.' });
    }

    await memoryStore.init();
    const index = memoryStore.orders.findIndex(o => o.orderId === id || o._id === id);
    if (index === -1) return res.status(404).json({ ok: false, error: 'Order not found.' });
    memoryStore.orders.splice(index, 1);
    return res.json({ ok: true, message: 'Order deleted successfully.' });
  } catch (err) {
    return res.status(500).json({ ok: false, error: 'Failed to delete order.' });
  }
});

module.exports = router;
