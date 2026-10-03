const bcrypt = require('bcryptjs');

/**
 * In-Memory Store Fallback for local development when MongoDB Atlas URI is pending.
 * Automatically mirrors Mongoose schema operations.
 */
class MemoryStore {
  constructor() {
    this.products = [];
    this.categories = [];
    this.orders = [];
    this.reviews = [];
    this.admins = [];
    this.settings = null;
    this.initialized = false;
  }

  async init() {
    const { INITIAL_CATEGORIES, INITIAL_PRODUCTS } = require('../config/seed');

    // Ensure categories
    for (const c of INITIAL_CATEGORIES) {
      const idx = this.categories.findIndex(x => x.slug === c.slug);
      if (idx === -1) {
        this.categories.push({ ...c });
      } else if (c.image && !this.categories[idx].image) {
        this.categories[idx].image = c.image;
      }
    }

    if (!this.initialized) {
      // Default settings
      this.settings = {
        key: 'main_settings',
        websiteName: process.env.STORE_NAME || 'RollsPoint',
        tagline: 'Counter supplies, delivered.',
        whatsappNumber: process.env.WHATSAPP_NUMBER || '0308 9134302',
        whatsappIntl: process.env.WHATSAPP_INTL || '923089134302',
        contactEmail: process.env.STORE_EMAIL || 'malikusmanhaider0346@gmail.com',
        contactAddress: process.env.STORE_ADDRESS || 'Rehmat Plaza, Pakistan Town Phase 2 Rd, near Allah Wali Masjid, Phase 2 Islamabad, 45720, Pakistan',
        googleMapsUrl: process.env.GOOGLE_MAPS_URL || 'https://maps.app.goo.gl/N9xDnGzuN3n8PbCD6?g_st=awb',
        contactHours: process.env.STORE_HOURS || 'Mon–Sat · 10:00 am – 8:00 pm',
        shippingRate: parseInt(process.env.FLAT_SHIPPING_RATE || '250', 10),
        heroImage: 'https://img.drz.lazcdn.com/g/kf/S036af77a759e409d9e2f3cf440217919J.png_720x720q80.png',
        heroImages: [],
        heroInterval: 3,
        heroProductSlug: 'pocket-inkless-mini-thermal-printer-bluetooth',
        primaryColor: '#D14A0E',
        secondaryColor: '#221B10',
        footerAboutText: 'RollsPoint supplies pocket mini printers, portable fans, party items and counter supplies across Pakistan.'
      };

      // Default admin with hashed password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(process.env.DEFAULT_ADMIN_PASSWORD || 'admin123', salt);
      this.admins.push({
        _id: 'admin-01',
        name: process.env.DEFAULT_ADMIN_NAME || 'RollsPoint Administrator',
        email: (process.env.DEFAULT_ADMIN_EMAIL || 'admin@rollpoint.pk').toLowerCase(),
        password: hashedPassword,
        role: 'superadmin',
        comparePassword: async function(candidate) {
          return bcrypt.compare(candidate, this.password);
        }
      });
    }

    // Ensure products
    for (const p of INITIAL_PRODUCTS) {
      if (!this.products.some(x => x.id === p.id || x.slug === p.slug)) {
        const { seedReviews, reviews, ...prodData } = p;
        prodData.createdAt = new Date();
        prodData.updatedAt = new Date();
        this.products.push(prodData);
        const revList = seedReviews || reviews;
        if (revList) {
          revList.forEach((r, i) => {
            if (!this.reviews.some(rx => rx.productId === p.id && rx.name === r.name)) {
              this.reviews.push({
                _id: `rev-${p.id}-${i}`,
                productId: p.id,
                productSlug: p.slug,
                name: r.name,
                rating: r.rating,
                text: r.text,
                status: 'approved',
                date: r.date || new Date()
              });
            }
          });
        }
      }
    }

    this.initialized = true;
  }

  // Recalculate rating helper
  recalculateProductRating(productId, productSlug) {
    const approved = this.reviews.filter(r => (r.productId === productId || r.productSlug === productSlug) && r.status === 'approved');
    const count = approved.length;
    let avg = 5.0;
    if (count > 0) {
      avg = Math.round((approved.reduce((s, r) => s + r.rating, 0) / count) * 10) / 10;
    }
    const p = this.products.find(x => x.id === productId || x.slug === productSlug);
    if (p) {
      p.rating = avg;
      p.reviewCount = count;
    }
  }
}

const memoryStore = new MemoryStore();

module.exports = { memoryStore };
