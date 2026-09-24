const bcrypt = require('bcryptjs');

/**
 * In-Memory Store Fallback for local development when MongoDB Atlas URI is pending.
 * Automatically mirrors Mongoose schema operations.
 */
class MemoryStore {
  constructor() {
    this.products = [];
    this.orders = [];
    this.reviews = [];
    this.admins = [];
    this.settings = null;
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;
    const { INITIAL_CATEGORIES } = require('../config/seed');

    // Default settings
    this.settings = {
      key: 'main_settings',
      websiteName: process.env.STORE_NAME || 'RollPoint',
      tagline: 'Counter supplies, delivered.',
      whatsappNumber: process.env.WHATSAPP_NUMBER || '0308 9134302',
      whatsappIntl: process.env.WHATSAPP_INTL || '923089134302',
      contactEmail: process.env.STORE_EMAIL || 'malikusmanhaider0346@gmail.com',
      contactAddress: process.env.STORE_ADDRESS || 'Rehmat Plaza, Pakistan Town Phase 2 Rd, near Allah Wali Masjid, Phase 2 Islamabad, 45720, Pakistan',
      googleMapsUrl: process.env.GOOGLE_MAPS_URL || 'https://maps.app.goo.gl/N9xDnGzuN3n8PbCD6?g_st=awb',
      contactHours: process.env.STORE_HOURS || 'Mon–Sat · 10:00 am – 8:00 pm',
      shippingRate: parseInt(process.env.FLAT_SHIPPING_RATE || '250', 10),
      heroImage: 'https://picsum.photos/seed/rp-hero-counter/900/760.jpg',
      heroProductSlug: 'thermal-roll-80x80',
      primaryColor: '#D14A0E',
      secondaryColor: '#221B10',
      footerAboutText: 'RollPoint supplies genuine BPA-free thermal rolls, labels and POS hardware to counters across Pakistan — dispatched within 24 hours, delivered on cash-on-delivery.'
    };

    // Default admin with hashed password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(process.env.DEFAULT_ADMIN_PASSWORD || 'admin123', salt);
    this.admins.push({
      _id: 'admin-01',
      name: process.env.DEFAULT_ADMIN_NAME || 'RollPoint Administrator',
      email: (process.env.DEFAULT_ADMIN_EMAIL || 'admin@rollpoint.pk').toLowerCase(),
      password: hashedPassword,
      role: 'superadmin',
      comparePassword: async function(candidate) {
        return bcrypt.compare(candidate, this.password);
      }
    });

    // Seed 15 initial products & reviews
    const img = (seed, n = 4) =>
      Array.from({ length: n }, (_, i) => `https://picsum.photos/seed/${seed}-${i + 1}/640/640.jpg`);

    const productsSeed = [
      {
        id: 'rp-101', slug: 'thermal-roll-80x80', name: 'Thermal Roll 80mm × 80m — Premium',
        price: 340, oldPrice: 420, category: 'thermal-rolls', categoryName: 'Thermal Rolls',
        stock: 240, rating: 4.8, reviewCount: 3, featured: true, isPublished: true,
        keywords: ['80mm', '80x80', 'receipt roll', 'cash register', 'pos paper', 'bpa free'],
        images: img('rp-roll-80x80'),
        shortDescription: 'BPA-free premium thermal roll for POS machines and cash registers. Sharp, dark printing with zero fade.',
        description: 'Our best-selling 80mm × 80m roll, made from BPA-free premium thermal paper with a high-sensitivity coating that produces crisp, dark prints at low printer heads. Each roll is precision-slitted so it feeds smoothly without jamming, and the 12.7mm standard core fits virtually every receipt printer on the market.\n\nSealed in moisture-proof wrapping and tested batch-by-batch, these rolls keep their coating for up to five years in cool, dry storage — so bulk buying is safe.',
        specifications: { 'Width': '80 mm', 'Length': '80 m', 'Core diameter': '12.7 mm (standard)', 'Material': 'BPA-free thermal paper', 'Packing': '1 roll, sealed wrap', 'Shelf life': '5 years (cool & dry)' },
        reviews: [
          { _id: 'rev-01', productId: 'rp-101', productSlug: 'thermal-roll-80x80', name: 'Ahmed Raza', rating: 5, date: new Date('2025-01-12'), text: 'Printing is sharp and dark, no fade at all. We run two POS machines all day and these rolls last longer than the local ones we used before.', status: 'approved' },
          { _id: 'rev-02', productId: 'rp-101', productSlug: 'thermal-roll-80x80', name: 'Fatima Noor', rating: 4, date: new Date('2024-12-28'), text: 'Good quality paper and fast delivery to Karachi. One roll had a slightly bent core but the rest were perfect.', status: 'approved' },
          { _id: 'rev-03', productId: 'rp-101', productSlug: 'thermal-roll-80x80', name: 'Usman Tariq', rating: 5, date: new Date('2024-12-03'), text: 'Ordered 20 rolls for our bakery counters. Exactly 80m as promised and the coating works fine with our Epson printer.', status: 'approved' },
        ]
      },
      {
        id: 'rp-102', slug: 'thermal-roll-57x50', name: 'Thermal Roll 57mm × 50mm',
        price: 180, oldPrice: 220, category: 'thermal-rolls', categoryName: 'Thermal Rolls',
        stock: 180, rating: 4.6, reviewCount: 2, featured: false, isPublished: true,
        keywords: ['57mm', '57x50', '58mm printer', 'pocket printer', 'receipt roll'],
        images: img('rp-roll-57x50'),
        shortDescription: 'Compact 57mm thermal roll for 58mm printers, card machines and pocket receipt printers.',
        description: 'The standard roll for 58mm Bluetooth receipt printers and handheld billing devices. Clean edges and consistent winding mean fewer paper jams and smoother feeding, even in small portable printers where tolerances are tight.\n\nAvailable loose or in sealed packs — ideal for cafés, food carts and delivery riders who print on the move.',
        specifications: { 'Width': '57 mm', 'Length': '50 mm Ø', 'Core': 'Coreless', 'Material': 'Thermal paper', 'Packing': '1 roll, sealed wrap', 'Compatible': '58mm printers' },
        reviews: [
          { _id: 'rev-04', productId: 'rp-102', productSlug: 'thermal-roll-57x50', name: 'Bilal Ahmed', rating: 5, date: new Date('2025-01-05'), text: 'Perfect size for our 58mm pocket printers. No jamming so far after three packs.', status: 'approved' },
          { _id: 'rev-05', productId: 'rp-102', productSlug: 'thermal-roll-57x50', name: 'Hira Shahid', rating: 4, date: new Date('2024-11-19'), text: 'Decent rolls for the price. Print quality is clear enough for daily receipts.', status: 'approved' }
        ]
      },
      {
        id: 'rp-103', slug: 'thermal-roll-80x60', name: 'Thermal Roll 80mm × 60m',
        price: 265, oldPrice: null, category: 'thermal-rolls', categoryName: 'Thermal Rolls',
        stock: 95, rating: 4.5, reviewCount: 2, featured: false, isPublished: true,
        keywords: ['80mm', '80x60', 'receipt roll', 'supermarket', 'pharmacy'],
        images: img('rp-roll-80x60'),
        shortDescription: 'Mid-length 80mm roll — a balanced option for pharmacies, kiosks and low-volume counters.',
        description: 'Not every counter burns through an 80m roll. This 60m version keeps the same premium BPA-free coating and slitting quality in a lighter, cheaper roll — perfect for pharmacies, mobile top-up shops and billing points with moderate footfall.',
        specifications: { 'Width': '80 mm', 'Length': '60 m', 'Core diameter': '12.7 mm', 'Material': 'BPA-free thermal paper', 'Packing': '1 roll, sealed wrap' },
        reviews: [
          { _id: 'rev-06', productId: 'rp-103', productSlug: 'thermal-roll-80x60', name: 'Salman Qureshi', rating: 5, date: new Date('2024-12-15'), text: '60m length is ideal for our pharmacy. Delivery took just 2 days to Lahore.', status: 'approved' },
          { _id: 'rev-07', productId: 'rp-103', productSlug: 'thermal-roll-80x60', name: 'Ayesha Malik', rating: 4, date: new Date('2024-10-30'), text: 'Good value. Packaging could be a bit stronger but the product itself is fine.', status: 'approved' }
        ]
      },
      {
        id: 'rp-104', slug: 'jumbo-roll-80x180', name: 'Jumbo Thermal Roll 80mm × 180m',
        price: 780, oldPrice: 950, category: 'thermal-paper', categoryName: 'Thermal Paper',
        stock: 42, rating: 4.7, reviewCount: 2, featured: true, isPublished: true,
        keywords: ['jumbo', '80x180', '180m', 'supermarket', 'high volume', 'bpa free'],
        images: img('rp-jumbo-80x180'),
        shortDescription: 'High-capacity jumbo roll for supermarkets and hypermarkets — fewer changes, more uptime.',
        description: 'Three times the length of a standard roll, engineered for high-volume checkouts where every roll change slows the queue. The reinforced core and even winding handle fast feed rates without tearing or telescoping.\n\nOne jumbo roll typically replaces three standard rolls, cutting both cost per meter and counter downtime during rush hours.',
        specifications: { 'Width': '80 mm', 'Length': '180 m', 'Core diameter': '25 mm (1 inch)', 'Material': 'BPA-free thermal paper', 'Packing': '1 jumbo roll', 'Best for': 'High-volume checkouts' },
        reviews: [
          { _id: 'rev-08', productId: 'rp-104', productSlug: 'jumbo-roll-80x180', name: 'Kamran Aslam', rating: 5, date: new Date('2025-01-18'), text: 'Jumbo rolls save us so many roll changes during rush hours. Quality is consistent across the whole batch.', status: 'approved' },
          { _id: 'rev-09', productId: 'rp-104', productSlug: 'jumbo-roll-80x180', name: 'Zainab Sheikh', rating: 5, date: new Date('2024-12-22'), text: 'BPA-free as advertised, and the price per meter is the best I found anywhere.', status: 'approved' }
        ]
      },
      {
        id: 'rp-105', slug: 'bond-roll-2ply', name: 'Bond Paper Roll 80mm × 76m (2-Ply)',
        price: 520, oldPrice: null, category: 'thermal-paper', categoryName: 'Thermal Paper',
        stock: 60, rating: 4.4, reviewCount: 2, featured: false, isPublished: true,
        keywords: ['bond paper', '2 ply', 'carbon copy', 'duplicate', '76m'],
        images: img('rp-bond-2ply'),
        shortDescription: 'Two-ply bond roll that produces an original plus a legible duplicate copy — no ink required.',
        description: 'For businesses that need a customer copy and a record copy from the same print, this 2-ply bond roll produces a crisp top sheet and a clean second impression through impact of the print head. Standard width fits most classic billing machines and ECRs.',
        specifications: { 'Width': '80 mm', 'Length': '76 m', 'Ply': '2-ply (white / white)', 'Type': 'Impact bond paper', 'Packing': '1 roll' },
        reviews: [
          { _id: 'rev-10', productId: 'rp-105', productSlug: 'bond-roll-2ply', name: 'Naveed Iqbal', rating: 4, date: new Date('2024-11-08'), text: 'Both copies print clearly. Good for our carbon-copy invoices at the workshop.', status: 'approved' },
          { _id: 'rev-11', productId: 'rp-105', productSlug: 'bond-roll-2ply', name: 'Maham Raza', rating: 4, date: new Date('2024-09-27'), text: 'Solid 2-ply rolls. Slightly expensive but the quality justifies it.', status: 'approved' }
        ]
      },
      {
        id: 'rp-106', slug: 'bt-thermal-printer-58', name: 'Bluetooth Thermal Receipt Printer (58mm)',
        price: 6500, oldPrice: 7900, category: 'pos-products', categoryName: 'POS Products',
        stock: 18, rating: 4.6, reviewCount: 3, featured: true, isPublished: true,
        keywords: ['printer', 'bluetooth', '58mm', 'pos', 'thermal printer', 'android'],
        images: img('rp-printer-58'),
        shortDescription: 'Compact Bluetooth + USB thermal printer for Android/iOS POS apps. 203 dpi, fast and quiet.',
        description: 'A pocket-friendly workhorse for small businesses: pairs with Android or iOS billing apps over Bluetooth 4.0, or plugs in over USB for desktop setups. The 203 dpi head prints logos and QR codes sharply at up to 90mm per second.\n\nThe 1500mAh battery runs a full shop shift on one charge, and it pairs perfectly with our 57mm rolls.',
        specifications: { 'Connectivity': 'Bluetooth 4.0 + USB', 'Print width': '58 mm', 'Resolution': '203 dpi', 'Speed': '90 mm/sec', 'Battery': '1500 mAh (5–6 hrs)', 'Warranty': '6 months' },
        reviews: [
          { _id: 'rev-12', productId: 'rp-106', productSlug: 'bt-thermal-printer-58', name: 'Hamza Sheikh', rating: 5, date: new Date('2025-01-09'), text: 'Connected to our Android POS in minutes. Print speed is good and the battery lasts a full shift.', status: 'approved' },
          { _id: 'rev-13', productId: 'rp-106', productSlug: 'bt-thermal-printer-58', name: 'Rabia Anwar', rating: 4, date: new Date('2024-12-11'), text: 'Compact printer, decent build. The manual is a bit short but setup was easy.', status: 'approved' },
          { _id: 'rev-14', productId: 'rp-106', productSlug: 'bt-thermal-printer-58', name: 'Faisal Mehmood', rating: 5, date: new Date('2024-11-25'), text: 'Second one I have bought. Works with the RollPoint 57mm rolls perfectly.', status: 'approved' }
        ]
      },
      {
        id: 'rp-107', slug: 'barcode-scanner-1d', name: 'USB Laser Barcode Scanner — 1D',
        price: 4200, oldPrice: 5000, category: 'pos-products', categoryName: 'POS Products',
        stock: 25, rating: 4.5, reviewCount: 2, featured: true, isPublished: true,
        keywords: ['barcode', 'scanner', 'laser', 'usb', '1d', 'retail'],
        images: img('rp-scanner-1d'),
        shortDescription: 'Fast handheld 1D laser scanner — plug-and-play USB, reads damaged labels in one pass.',
        description: 'A rugged handheld scanner built for retail counters: 200 scans per second, a wide working range, and aggressive decoding that reads torn or partially covered labels in a single pass. True plug-and-play — no drivers on Windows, Linux or Android POS terminals.\n\nComes with a 1.8m heavy-duty USB cable and an adjustable stand for hands-free scanning.',
        specifications: { 'Type': '1D laser', 'Scan speed': '200 scans/sec', 'Interface': 'USB 2.0 (plug & play)', 'Cable': '1.8 m reinforced', 'Stand': 'Included', 'Warranty': '6 months' },
        reviews: [
          { _id: 'rev-15', productId: 'rp-107', productSlug: 'barcode-scanner-1d', name: 'Omar Farooq', rating: 5, date: new Date('2024-12-30'), text: 'Scans even cracked labels instantly. Plug and play with no drivers on Windows.', status: 'approved' },
          { _id: 'rev-16', productId: 'rp-107', productSlug: 'barcode-scanner-1d', name: 'Sadia Khan', rating: 4, date: new Date('2024-11-14'), text: 'Good range and very fast scanning. The cable could be a little longer.', status: 'approved' }
        ]
      },
      {
        id: 'rp-108', slug: 'cash-drawer-4x5', name: 'POS Cash Drawer — 4 Bill / 5 Coin',
        price: 7800, oldPrice: null, category: 'pos-products', categoryName: 'POS Products',
        stock: 9, rating: 4.7, reviewCount: 2, featured: false, isPublished: true,
        keywords: ['cash drawer', 'pos', 'money drawer', 'steel', 'rj11'],
        images: img('rp-cash-drawer'),
        shortDescription: 'Heavy steel cash drawer with 4 bill and 5 coin compartments. Opens via printer kick (RJ11) or key.',
        description: 'A proper counter drawer: cold-rolled steel body, ceramic-roller bearings for smooth slide action, and a 3-position lock with full manual override. Opens automatically from your receipt printer via the included RJ11 kick cable.\n\nAdjustable bill dividers and removable coin trays let you arrange compartments for Pakistani denominations.',
        specifications: { 'Size': '410 × 415 × 100 mm', 'Bill slots': '4 (adjustable)', 'Coin slots': '5 (removable)', 'Lock': '3-position + RJ11 kick', 'Body': 'Cold-rolled steel' },
        reviews: [
          { _id: 'rev-17', productId: 'rp-108', productSlug: 'cash-drawer-4x5', name: 'Adnan Yousaf', rating: 5, date: new Date('2024-12-05'), text: 'Heavy and sturdy, opens smoothly with the printer kick. Exactly what our supermarket needed.', status: 'approved' },
          { _id: 'rev-18', productId: 'rp-108', productSlug: 'cash-drawer-4x5', name: 'Mariam Siddiqui', rating: 5, date: new Date('2024-10-21'), text: 'Solid drawer with smooth coin slots. Great value at this price.', status: 'approved' }
        ]
      },
      {
        id: 'rp-109', slug: 'mini-sticker-57x30', name: 'Mini Printer Sticker Paper 57×30mm (3 Rolls)',
        price: 450, oldPrice: 560, category: 'mini-printer-paper', categoryName: 'Mini Printer Paper',
        stock: 130, rating: 4.8, reviewCount: 2, featured: true, isPublished: true,
        keywords: ['sticker paper', 'mini printer', '57x30', 'periPage', 'pocket printer', 'labels'],
        images: img('rp-sticker-57x30'),
        shortDescription: 'Self-adhesive sticker paper for mini pocket printers — 3 rolls per pack, strong glue, no residue.',
        description: 'Turn any pocket printer into a label maker. These 57×30mm thermal stickers use a strong yet clean-peeling adhesive that holds on paper, plastic and glass — and removes without sticky residue.\n\nBlack-and-white prints come out dark and smudge-proof, perfect for jar labels, name tags, study notes and small-price stickers.',
        specifications: { 'Sticker size': '57 × 30 mm', 'Rolls': '3 per pack', 'Adhesive': 'Permanent, residue-free', 'Print': 'Direct thermal, B/W', 'Compatible': 'PeriPage, Phomemo & similar' },
        reviews: [
          { _id: 'rev-19', productId: 'rp-109', productSlug: 'mini-sticker-57x30', name: 'Areeba Hussain', rating: 5, date: new Date('2025-01-15'), text: 'Stickers stick properly and print dark. My kids use the mini printer non-stop and these last long.', status: 'approved' },
          { _id: 'rev-20', productId: 'rp-109', productSlug: 'mini-sticker-57x30', name: 'Talha Bin Masood', rating: 4, date: new Date('2024-12-08'), text: 'Good adhesive, no residue when removed from plastic boxes. Will reorder.', status: 'approved' }
        ]
      },
      {
        id: 'rp-110', slug: 'mini-paper-57x25', name: 'Pocket Printer Paper 57×25mm (5 Rolls)',
        price: 600, oldPrice: null, category: 'mini-printer-paper', categoryName: 'Mini Printer Paper',
        stock: 88, rating: 4.6, reviewCount: 2, featured: false, isPublished: true,
        keywords: ['mini printer', '57x25', 'periPage', 'phomemo', 'paper roll', 'pocket'],
        images: img('rp-paper-57x25'),
        shortDescription: 'Value pack of five regular paper rolls for pocket thermal printers. Smooth, jam-free feeding.',
        description: 'Keep your pocket printer stocked for months. Five tightly-wound 57×25mm rolls with a smooth thermal surface that protects print heads and delivers clear, gray-free text for lists, receipts and journaling prints.',
        specifications: { 'Roll size': '57 × 25 mm Ø', 'Rolls': '5 per pack', 'Surface': 'Smooth thermal', 'Compatible': 'PeriPage, Phomemo & similar' },
        reviews: [
          { _id: 'rev-21', productId: 'rp-110', productSlug: 'mini-paper-57x25', name: 'Junaid Akhtar', rating: 5, date: new Date('2024-11-30'), text: 'Five rolls at this price is a steal. Prints are clear and never smudge.', status: 'approved' },
          { _id: 'rev-22', productId: 'rp-110', productSlug: 'mini-paper-57x25', name: 'Nimra Khalid', rating: 4, date: new Date('2024-10-12'), text: 'Fits my PeriPage perfectly. Slight curl at the roll end but prints fine.', status: 'approved' }
        ]
      },
      {
        id: 'rp-111', slug: 'thermal-label-4x6', name: 'Thermal Shipping Label 4″ × 6″ (500 Labels)',
        price: 1350, oldPrice: 1600, category: 'labels', categoryName: 'Labels',
        stock: 74, rating: 4.9, reviewCount: 3, featured: true, isPublished: true,
        keywords: ['shipping label', '4x6', 'courier', 'thermal label', '500', 'ecommerce'],
        images: img('rp-label-4x6'),
        shortDescription: 'The e-commerce standard: 500 strong-adhesive 4×6 shipping labels per roll. Smudge-proof, scanner-friendly.',
        description: 'The label trusted by online sellers: 4×6 inch direct-thermal labels with permanent adhesive that grips poly bags, corrugated boxes and padded mailers. The high-contrast coating keeps barcodes scannable even after rain, rubbing and long transit.\n\nFade-resistant for over a year, compatible with all major 4×6 thermal printers, and wound on a 25mm core.',
        specifications: { 'Label size': '4 × 6 in (101 × 152 mm)', 'Labels per roll': '500', 'Adhesive': 'Permanent, strong-grip', 'Core': '25 mm (1 in)', 'Printer type': 'Direct thermal' },
        reviews: [
          { _id: 'rev-23', productId: 'rp-111', productSlug: 'thermal-label-4x6', name: 'Hassan Raza', rating: 5, date: new Date('2025-01-20'), text: 'Shipping labels peel easily and the print never fades. We ship 100+ parcels daily on these.', status: 'approved' },
          { _id: 'rev-24', productId: 'rp-111', productSlug: 'thermal-label-4x6', name: 'Kiran Shahzadi', rating: 5, date: new Date('2024-12-19'), text: 'Work flawlessly with our 4x6 printer. Dark, smudge-free barcodes every time.', status: 'approved' },
          { _id: 'rev-25', productId: 'rp-111', productSlug: 'thermal-label-4x6', name: 'Waqar Ahmed', rating: 4, date: new Date('2024-11-02'), text: 'Strong adhesive even on poly bags. Best price I found for 500 labels.', status: 'approved' }
        ]
      },
      {
        id: 'rp-112', slug: 'thermal-label-100x150', name: 'Thermal Label Roll 100×150mm (250 pcs)',
        price: 980, oldPrice: null, category: 'labels', categoryName: 'Labels',
        stock: 51, rating: 4.5, reviewCount: 2, featured: false, isPublished: true,
        keywords: ['label', '100x150', 'courier', 'manifest', 'warehouse'],
        images: img('rp-label-100x150'),
        shortDescription: 'Versatile 100×150mm labels for courier manifests, warehouse tags and bulk carton marking.',
        description: 'A slightly narrower alternative to 4×6 — same permanent adhesive and thermal coating, sized for courier manifests, warehouse shelf tags and carton labelling. Consistent die-cutting means the liner peels cleanly at speed.',
        specifications: { 'Label size': '100 × 150 mm', 'Labels per roll': '250', 'Adhesive': 'Permanent', 'Core': '25 mm', 'Printer type': 'Direct thermal' },
        reviews: [
          { _id: 'rev-26', productId: 'rp-112', productSlug: 'thermal-label-100x150', name: 'Danish Ali', rating: 4, date: new Date('2024-12-26'), text: 'Good size for courier manifests. Print is sharp and scanning never fails.', status: 'approved' },
          { _id: 'rev-27', productId: 'rp-112', productSlug: 'thermal-label-100x150', name: 'Sana Tariq', rating: 5, date: new Date('2024-11-11'), text: 'Exactly 250 pieces as promised, no misprints in the roll.', status: 'approved' }
        ]
      },
      {
        id: 'rp-113', slug: 'thermal-label-30x20', name: 'Thermal Label 30×20mm (1,000 pcs)',
        price: 520, oldPrice: null, category: 'labels', categoryName: 'Labels',
        stock: 0, rating: 4.3, reviewCount: 1, featured: false, isPublished: true,
        keywords: ['small label', '30x20', 'price label', 'jewellery', '1000'],
        images: img('rp-label-30x20'),
        shortDescription: 'Tiny 30×20mm labels for jewellery tagging, electronics serials and small-price marking.',
        description: 'Small but mighty: a thousand 30×20mm thermal labels for price tags, serial numbers and barcode marking on small items. Strong mini-dot adhesive holds on metal, plastic and glass surfaces.',
        specifications: { 'Label size': '30 × 20 mm', 'Labels per roll': '1,000', 'Adhesive': 'Strong mini-dot', 'Printer type': 'Direct thermal' },
        reviews: [
          { _id: 'rev-28', productId: 'rp-113', productSlug: 'thermal-label-30x20', name: 'Imran Baig', rating: 4, date: new Date('2024-10-05'), text: 'Small labels perfect for jewellery pricing. Hopefully restocked soon — I need them monthly.', status: 'approved' }
        ]
      },
      {
        id: 'rp-114', slug: 'price-gun-kit', name: 'Price Gun Labeller + 1,000 Labels',
        price: 1850, oldPrice: 2200, category: 'other-products', categoryName: 'Other Products',
        stock: 34, rating: 4.4, reviewCount: 1, featured: false, isPublished: true,
        keywords: ['price gun', 'labeller', 'tag gun', 'pricing', 'starter kit'],
        images: img('rp-price-gun'),
        shortDescription: 'One-line price gun with smooth trigger action, bundled with 1,000 starter labels.',
        description: 'Everything a small shop needs to start pricing products: a durable one-line price gun with a clear display window, smooth trigger action and refill loading in seconds. The bundle includes 1,000 compatible labels to get you printing on day one.',
        specifications: { 'Lines': '1 line, 8 digits', 'Labels': '1,000 included (21×12 mm)', 'Body': 'ABS + metal mechanism', 'Loading': 'Drop-in roll' },
        reviews: [
          { _id: 'rev-29', productId: 'rp-114', productSlug: 'price-gun-kit', name: 'Moiz Ahmed', rating: 4, date: new Date('2024-12-13'), text: 'Gun feels sturdy and labels feed without tearing. The included labels are good quality too.', status: 'approved' }
        ]
      },
      {
        id: 'rp-115', slug: 'card-machine-roll-57x35', name: 'Card Machine Roll 57×35mm (EFTPOS)',
        price: 210, oldPrice: null, category: 'other-products', categoryName: 'Other Products',
        stock: 64, rating: 4.7, reviewCount: 2, featured: false, isPublished: true,
        keywords: ['card machine', 'eftpos', '57x35', 'bank', 'merchant roll'],
        images: img('rp-card-roll'),
        shortDescription: 'Correct-width rolls for bank card machines (EFTPOS) — no more forcing wrong paper into terminals.',
        description: 'Bank card terminals are fussy about paper width — these 57×35mm rolls are slitted to spec for common EFTPOS machines, with end-tape that lifts cleanly so the roll feeds right on the first try. Sold singly or in counter packs.',
        specifications: { 'Width': '57 mm', 'Roll Ø': '35 mm', 'Core': 'Coreless', 'End tape': 'Easy-lift', 'Compatible': 'Most EFTPOS terminals' },
        reviews: [
          { _id: 'rev-30', productId: 'rp-115', productSlug: 'card-machine-roll-57x35', name: 'Yasir Hussain', rating: 5, date: new Date('2025-01-07'), text: 'Fits our bank card machine exactly. No more struggling with wrong-width rolls.', status: 'approved' },
          { _id: 'rev-31', productId: 'rp-115', productSlug: 'card-machine-roll-57x35', name: 'Alina Zafar', rating: 4, date: new Date('2024-12-01'), text: 'Good quality and quick delivery. Will order in a pack next time.', status: 'approved' }
        ]
      }
    ];

    for (const p of productsSeed) {
      const { reviews, ...prodData } = p;
      prodData.createdAt = new Date();
      prodData.updatedAt = new Date();
      this.products.push(prodData);
      if (reviews) {
        reviews.forEach(r => this.reviews.push(r));
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
