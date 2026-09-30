const Product = require('../models/Product');
const Review = require('../models/Review');
const Admin = require('../models/Admin');
const Setting = require('../models/Setting');
const Category = require('../models/Category');

const INITIAL_CATEGORIES = [
  { slug: 'mini-printer', name: 'Mini Printer', tagline: 'Portable & Bluetooth pocket printers', image: 'https://img.drz.lazcdn.com/g/kf/S036af77a759e409d9e2f3cf440217919J.png_720x720q80.png' },
  { slug: 'mini-fan', name: 'Mini Fan', tagline: 'Portable mini fans for daily carry and travel', image: 'https://images.unsplash.com/photo-1590486803833-1c5dc8ddd4c8?w=720&auto=format&fit=crop&q=80' },
  { slug: 'party-items', name: 'Party Items', tagline: 'Colorful party straws and fun event essentials', image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=720&auto=format&fit=crop&q=80' }
];

const INITIAL_PRODUCTS = [
  {
    id: 'rp-116',
    slug: 'pocket-inkless-mini-thermal-printer-bluetooth',
    name: 'Pocket Inkless Mini Thermal Printer (Bluetooth Wireless for Kids & Students)',
    price: 2499,
    oldPrice: 3200,
    category: 'mini-printer',
    categoryName: 'Mini Printer',
    stock: 50,
    rating: 4.9,
    reviewCount: 4,
    featured: true,
    isPublished: true,
    keywords: ['mini printer', 'pocket printer', 'bluetooth printer', 'thermal printer', 'portable printer', 'sticker printer', 'inkless printer', 'kids printer', 'study notes', 'receipt printer'],
    variationTitle: 'Color Family',
    variations: [
      {
        name: 'Pink Printer',
        price: 2499,
        oldPrice: 3200,
        image: 'https://img.drz.lazcdn.com/g/kf/S036af77a759e409d9e2f3cf440217919J.png_720x720q80.png'
      },
      {
        name: 'Blue Printer',
        price: 2499,
        oldPrice: 3200,
        image: 'https://img.drz.lazcdn.com/static/pk/p/f06c9835ea0d95cc3b31609fd46cf49d.png_720x720q80.png'
      },
      {
        name: 'White Printer',
        price: 2599,
        oldPrice: 3400,
        image: 'https://img.drz.lazcdn.com/static/pk/p/8adc45f5e8f0474823e2ec1a75b5580c.jpg_720x720q80.jpg'
      }
    ],
    images: [
      'https://img.drz.lazcdn.com/g/kf/S036af77a759e409d9e2f3cf440217919J.png_720x720q80.png',
      'https://img.drz.lazcdn.com/static/pk/p/f06c9835ea0d95cc3b31609fd46cf49d.png_720x720q80.png',
      'https://img.drz.lazcdn.com/static/pk/p/8adc45f5e8f0474823e2ec1a75b5580c.jpg_720x720q80.jpg',
      'https://img.drz.lazcdn.com/static/pk/p/e62d60d26d48063d3392b428bf65d0df.jpg_720x720q80.jpg',
      'https://img.drz.lazcdn.com/static/pk/p/f8a321bd27db448dac85e93c8cdd5fe6.jpg_720x720q80.jpg'
    ],
    shortDescription: 'Pocket-sized inkless mini thermal printer with Bluetooth wireless connectivity. Perfect for kids, students, journaling, study notes, labels, receipts, and QR codes on iOS & Android.',
    description: 'Make printing fun, easy, and instant with this Pocket Inkless Mini Portable Bluetooth Thermal Printer! Designed with an adorable and compact pocket form factor, it connects seamlessly via Bluetooth to your smartphone or tablet using the companion mobile app.\n\nEquipped with advanced direct thermal printing technology, this printer requires **zero ink cartridges, toner, or ribbon** — just load standard 57mm thermal paper or adhesive sticker rolls and start printing instant black-and-white photos, study notes, reminder memos, to-do lists, shipping labels, and creative DIY crafts.\n\nIts built-in 1000 mAh rechargeable lithium-ion battery provides hours of wireless portable printing, making it the perfect gadget for students, kids, office workers, and travelers.',
    specifications: {
      'Printing Method': 'Direct Thermal (Inkless — No toner required)',
      'Connectivity': 'Bluetooth 4.0 / BLE & Micro-USB',
      'Resolution': '203 DPI Sharp Print Head',
      'Paper Size': '57mm × 30mm / 57mm × 25mm rolls & stickers',
      'Battery Capacity': '1000 mAh Rechargeable Lithium Battery',
      'Charging': '5V Micro-USB Interface',
      'Compatible OS': 'Android & iOS (via App)',
      'Body Design': 'Cute Pocket Cat Design / Ultra-Portable',
      'Functions': 'Photo Print, Study Notes, Labels, Receipts, QR Code & To-Do Lists'
    },
    seedReviews: [
      { name: 'Zain Ali', rating: 5, date: new Date('2025-01-22'), text: 'Super cute mini printer! Works seamlessly over Bluetooth with my Android phone. Very handy for study notes and journal stickers.' },
      { name: 'Ayesha Khan', rating: 5, date: new Date('2025-01-18'), text: 'Bought this as a gift for my younger sister. She loves printing photos and stickers for her notebooks. Quality is surprisingly good!' },
      { name: 'Hamza Tariq', rating: 5, date: new Date('2025-01-10'), text: 'Best pocket printer for the price. Zero ink needed and connection with the app was quick. Highly recommended!' }
    ]
  },
  {
    id: 'rp-117',
    slug: 'rechargeable-mini-fan-portable-handheld-usb-cooling',
    name: 'Rechargeable Mini Fan Portable Handheld Cooling Fan (USB Charging with Phone Holder & Hanging Rope)',
    price: 1099,
    oldPrice: 1800,
    category: 'mini-fan',
    categoryName: 'Mini Fan',
    stock: 75,
    rating: 4.8,
    reviewCount: 3,
    featured: true,
    isPublished: true,
    keywords: ['mini fan', 'portable fan', 'handheld fan', 'usb fan', 'rechargeable fan', 'cooling fan', 'pocket fan', 'cute fan', 'desk fan'],
    variationTitle: 'Color Family',
    variations: [
      {
        name: 'Strawberry Pink',
        price: 1099,
        oldPrice: 1800,
        image: 'https://img.drz.lazcdn.com/g/kf/S6465208f166d49ca98415f6c1370f7a3w.png_720x720q80.png'
      },
      {
        name: 'Avocado Green',
        price: 1099,
        oldPrice: 1800,
        image: 'https://images.unsplash.com/photo-1590486803833-1c5dc8ddd4c8?w=720&auto=format&fit=crop&q=80'
      },
      {
        name: 'Pineapple Yellow',
        price: 1099,
        oldPrice: 1800,
        image: 'https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=720&auto=format&fit=crop&q=80'
      }
    ],
    images: [
      'https://img.drz.lazcdn.com/g/kf/S6465208f166d49ca98415f6c1370f7a3w.png_720x720q80.png',
      'https://images.unsplash.com/photo-1590486803833-1c5dc8ddd4c8?w=720&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=720&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1618944847823-380f1ed80101?w=720&auto=format&fit=crop&q=80'
    ],
    shortDescription: 'Ultra-portable rechargeable handheld mini fan with USB charging, smooth quiet airflow, built-in phone holder base, and hanging lanyard for travel, school, office & home.',
    description: 'Enjoy instant refreshing cooling wherever you go with this Rechargeable Portable Mini Handheld Fan! Designed for everyday convenience and summer comfort, this lightweight pocket fan delivers smooth, quiet, and natural airflow to keep you fresh during hot weather whether you are at home, school, office, or traveling outdoors.\n\nFeaturing an ultra-quiet motor, you can study, work, or relax without irritating noise. It includes a built-in phone stand base that lets you place the fan upright on your desk while holding your smartphone for hands-free video watching.\n\nPowered by a built-in rechargeable battery, it charges easily via USB with any power bank, laptop, car charger, or USB adapter. Complete with a soft hanging lanyard rope for effortless carrying on the go.',
    specifications: {
      'Product Type': 'Rechargeable Handheld & Desk Mini Fan',
      'Power Source': 'USB Rechargeable Battery',
      'Battery Capacity': 'Built-in 250–500 mAh Rechargeable Battery',
      'Charging Time': 'Approx. 1.5 – 2 Hours',
      'Working Time': 'Up to 60–90 Minutes Continuous Airflow',
      'Special Features': 'Ultra Quiet Motor, Built-in Phone Holder Base, Hanging Lanyard Rope',
      'Body Material': 'Durable High-Grade ABS / PP',
      'Dimensions': '5cm × 4cm × 10.5cm (Pocket Portable)',
      'Package Includes': '1× Mini Fan, 1× USB Charging Cable, 1× Hanging Lanyard Rope, 1× User Manual'
    },
    seedReviews: [
      { name: 'Ayesha Khan', rating: 5, date: new Date('2025-02-10'), text: 'Bohat pyara aur useful mini fan hai! Airflow is surprisingly good and the phone holder feature is very handy.' },
      { name: 'Hamza Tariq', rating: 5, date: new Date('2025-02-18'), text: 'Good battery backup and easy USB charging. Perfect for university and travel in summer.' },
      { name: 'Sara Ahmed', rating: 4, date: new Date('2025-03-01'), text: 'Compact pocket size, quiet motor and cute colors. Recommended!' }
    ]
  },
  {
    id: 'rp-118',
    slug: '50pcs-colorful-bendy-straws-flexible-drinking-party-straws',
    name: '50PCS Colorful Bendy Straws (Flexible Drinking Straws for Kids Birthday, Parties & Cold Drinks)',
    price: 199,
    oldPrice: 499,
    category: 'party-items',
    categoryName: 'Party Items',
    stock: 200,
    rating: 4.9,
    reviewCount: 5,
    featured: true,
    isPublished: true,
    keywords: ['party straws', 'bendy straws', 'colorful straws', 'flexible straws', 'birthday straws', 'disposable straws', 'party supplies', 'drinking straws', 'juice straws'],
    variationTitle: 'Pack Size',
    variations: [
      {
        name: '50 Pcs Pack',
        price: 199,
        oldPrice: 499,
        image: 'https://img.drz.lazcdn.com/g/kf/Scbc3ecf468d74e978df0c67fcc0fc180C.png_720x720q80.png'
      },
      {
        name: '100 Pcs Value Pack',
        price: 349,
        oldPrice: 799,
        image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=720&auto=format&fit=crop&q=80'
      },
      {
        name: '200 Pcs Mega Pack',
        price: 599,
        oldPrice: 1299,
        image: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=720&auto=format&fit=crop&q=80'
      }
    ],
    images: [
      'https://img.drz.lazcdn.com/g/kf/Scbc3ecf468d74e978df0c67fcc0fc180C.png_720x720q80.png',
      'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=720&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=720&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=720&auto=format&fit=crop&q=80'
    ],
    shortDescription: 'Flexible bendy colorful drinking straws in vibrant assorted colors. Food-grade, hygienic, and disposable — perfect for birthday parties, weddings, juice bars, milkshakes & events.',
    description: 'Brighten up your drinks and celebrations with this pack of Colorful Bendy Flexible Drinking Straws! Designed with an ultra-flexible accordion bendable section, these straws make sipping convenient, fun, and spill-free for kids and adults alike.\n\nMade from 100% food-grade, BPA-free, and odorless plastic material, they are safe for juices, smoothies, soft drinks, milkshakes, mocktails, iced tea, and cold beverages.\n\nFeaturing an assorted mix of vivid neon colors (Pink, Green, Yellow, Blue, Orange), they add instant festive energy to birthday parties, weddings, Eid get-togethers, picnics, school celebrations, and family BBQs.',
    specifications: {
      'Product Type': 'Flexible Bendy Drinking Straws',
      'Material': '100% Food-Grade BPA-Free Plastic',
      'Colors': 'Assorted Vibrant Mixed Neon Colors (Pink, Blue, Green, Yellow, Orange)',
      'Design': 'Flexible Accordion Bendable Section',
      'Straw Length': 'Approx. 20 cm – 21 cm (Stretchable)',
      'Suitable For': 'Cold Drinks, Juices, Smoothies, Milkshakes, Mocktails & Soft Drinks',
      'Occasion': 'Birthday Parties, Weddings, School Events, Picnics, Cafes & Family Gatherings',
      'Package Includes': '1× Pack of Flexible Colorful Straws (Pack Size as selected)'
    },
    seedReviews: [
      { name: 'Fatima Noor', rating: 5, date: new Date('2025-02-25'), text: 'Birthday party ke liye mangwaye thay, bohat pyaray aur bright colors hain! Quality bhi achi hai.' },
      { name: 'Bilal Siddiqui', rating: 5, date: new Date('2025-03-02'), text: 'Very good flexible bendy straws. Kids loved using them for juices and milkshakes.' },
      { name: 'Nadia Qasim', rating: 5, date: new Date('2025-03-10'), text: 'Fast delivery and very economical 50/100 pack. Highly recommended for events!' }
    ]
  }
];

async function seedDatabase() {
  try {
    // 1. Seed Settings if not exists
    const settingsCount = await Setting.countDocuments();
    if (settingsCount === 0) {
      await Setting.create({
        websiteName: process.env.STORE_NAME || 'RollsPoint',
        tagline: 'Counter supplies, delivered.',
        whatsappNumber: process.env.WHATSAPP_NUMBER || '0308 9134302',
        whatsappIntl: process.env.WHATSAPP_INTL || '923089134302',
        contactEmail: process.env.STORE_EMAIL || 'malikusmanhaider0346@gmail.com',
        contactAddress: process.env.STORE_ADDRESS || 'Rehmat Plaza, Pakistan Town Phase 2 Rd, near Allah Wali Masjid, Phase 2 Islamabad, 45720, Pakistan',
        googleMapsUrl: process.env.GOOGLE_MAPS_URL || 'https://maps.app.goo.gl/N9xDnGzuN3n8PbCD6?g_st=awb',
        contactHours: process.env.STORE_HOURS || 'Mon–Sat · 10:00 am – 8:00 pm',
        shippingRate: parseInt(process.env.FLAT_SHIPPING_RATE || '250', 10)
      });
      console.log('✅ Default website settings seeded successfully.');
    }

    // 2. Seed Default Admin if not exists
    const adminEmail = (process.env.DEFAULT_ADMIN_EMAIL || 'malikusmanhaider0346@gmail.com').toLowerCase();
    const existingAdmin = await Admin.findOne({ email: adminEmail });
    if (!existingAdmin) {
      await Admin.create({
        name: process.env.DEFAULT_ADMIN_NAME || 'Usman Haider',
        email: adminEmail,
        password: process.env.DEFAULT_ADMIN_PASSWORD || 'usman123@321',
        role: 'superadmin'
      });
      console.log(`✅ Default admin account created: ${adminEmail}`);
    }

    // 3. Seed missing Categories
    for (const cat of INITIAL_CATEGORIES) {
      const existingCat = await Category.findOne({ slug: cat.slug });
      if (!existingCat) {
        await Category.create(cat).catch(() => null);
        console.log(`✅ Seeded missing category: ${cat.name}`);
      } else if (cat.image && !existingCat.image) {
        existingCat.image = cat.image;
        await existingCat.save().catch(() => null);
      }
    }

    // 4. Seed missing Products
    for (const p of INITIAL_PRODUCTS) {
      const existingProd = await Product.findOne({ $or: [{ id: p.id }, { slug: p.slug }] });
      if (!existingProd) {
        const { seedReviews, ...productData } = p;
        const createdProduct = await Product.create(productData);
        console.log(`✅ Seeded missing product: ${p.name}`);

        if (seedReviews && seedReviews.length) {
          for (const rev of seedReviews) {
            await Review.create({
              productId: createdProduct.id,
              productSlug: createdProduct.slug,
              name: rev.name,
              rating: rev.rating,
              text: rev.text,
              status: 'approved',
              date: rev.date || new Date()
            }).catch(() => null);
          }
        }
      }
    }
  } catch (err) {
    console.error('⚠️ Database seed check error:', err.message);
  }
}

module.exports = {
  INITIAL_CATEGORIES,
  INITIAL_PRODUCTS,
  seedDatabase
};
