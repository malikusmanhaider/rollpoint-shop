const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  key: {
    type: String,
    default: 'main_settings',
    unique: true
  },
  websiteName: {
    type: String,
    default: 'RollPoint'
  },
  tagline: {
    type: String,
    default: 'Counter supplies, delivered.'
  },
  logo: {
    type: String,
    default: ''
  },
  primaryColor: {
    type: String,
    default: '#D14A0E'
  },
  secondaryColor: {
    type: String,
    default: '#221B10'
  },
  accentSoftColor: {
    type: String,
    default: '#FAE8DC'
  },
  paperColor: {
    type: String,
    default: '#F6F2E9'
  },
  whatsappNumber: {
    type: String,
    default: '0308 9134302'
  },
  whatsappIntl: {
    type: String,
    default: '923089134302'
  },
  contactEmail: {
    type: String,
    default: 'malikusmanhaider0346@gmail.com'
  },
  contactAddress: {
    type: String,
    default: 'Rehmat Plaza, Pakistan Town Phase 2 Rd, near Allah Wali Masjid, Phase 2 Islamabad, 45720, Pakistan'
  },
  googleMapsUrl: {
    type: String,
    default: 'https://maps.app.goo.gl/N9xDnGzuN3n8PbCD6?g_st=awb'
  },
  contactHours: {
    type: String,
    default: 'Mon–Sat · 10:00 am – 8:00 pm'
  },
  shippingRate: {
    type: Number,
    default: 250
  },
  footerAboutText: {
    type: String,
    default: 'RollPoint supplies genuine BPA-free thermal rolls, labels and POS hardware to counters across Pakistan — dispatched within 24 hours, delivered on cash-on-delivery.'
  },
  heroKicker: {
    type: String,
    default: '// Counter supplies · Pakistan'
  },
  heroTitle: {
    type: String,
    default: 'Thermal rolls, labels & POS gear — delivered to your counter.'
  },
  heroSubtitle: {
    type: String,
    default: 'Genuine BPA-free thermal paper, shipping labels and point-of-sale hardware for shops that never stop. Flat Rs. 250 delivery, cash on delivery, nationwide.'
  },
  heroStats: {
    type: String,
    default: '1,200+ shops supplied · 48h major-city delivery · 4.8 average rating'
  },
  heroChip: {
    type: String,
    default: '−19% on rolls'
  },
  heroBtn1Text: {
    type: String,
    default: 'Shop all products'
  },
  heroBtn2Text: {
    type: String,
    default: 'Browse categories'
  },
  heroImage: {
    type: String,
    default: 'https://picsum.photos/seed/rp-hero-counter/900/760.jpg'
  },
  heroProductSlug: {
    type: String,
    default: 'thermal-roll-80x80'
  },
  usp1Title: {
    type: String,
    default: 'Flat Rs. 250 delivery'
  },
  usp1Sub: {
    type: String,
    default: 'Anywhere in Pakistan'
  },
  usp2Title: {
    type: String,
    default: 'Cash on delivery'
  },
  usp2Sub: {
    type: String,
    default: 'Pay when it arrives'
  },
  usp3Title: {
    type: String,
    default: 'Genuine stock'
  },
  usp3Sub: {
    type: String,
    default: 'BPA-free thermal paper'
  },
  usp4Title: {
    type: String,
    default: 'WhatsApp ordering'
  },
  usp4Sub: {
    type: String,
    default: '0308 9134302'
  },
  dealTitle: {
    type: String,
    default: 'Buy 10 rolls, pay for 9.'
  },
  dealSubtitle: {
    type: String,
    default: 'Order any ten 80mm or 57mm thermal rolls and the eleventh is on us — applied when our team confirms your order on WhatsApp.'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Setting', settingSchema);
