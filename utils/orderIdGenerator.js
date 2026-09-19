const mongoose = require('mongoose');

/**
 * Generates a unique, standardized order ID in the format:
 * ORD-YYYYMMDD-XXXX (e.g. ORD-20260917-0001)
 */
async function generateOrderId() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const datePrefix = `ORD-${year}${month}${day}`;

  try {
    const Order = mongoose.model('Order');
    // Find highest order number for today
    const startOfDay = new Date(year, now.getMonth(), now.getDate());
    const endOfDay = new Date(year, now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const countToday = await Order.countDocuments({
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    });

    const nextSeq = String(countToday + 1).padStart(4, '0');
    let orderId = `${datePrefix}-${nextSeq}`;

    // Verify uniqueness
    const exists = await Order.findOne({ orderId });
    if (exists) {
      // Fallback with randomized suffix if duplicate collision
      const rand = Math.floor(1000 + Math.random() * 9000);
      orderId = `${datePrefix}-${rand}`;
    }

    return orderId;
  } catch (err) {
    // Graceful fallback
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `${datePrefix}-${rand}`;
  }
}

module.exports = { generateOrderId };
