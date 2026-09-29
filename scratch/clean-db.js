require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Review = require('../models/Review');

const ALLOWED_CATEGORIES = [
  { slug: 'mini-printer', name: 'Mini Printer', tagline: 'Portable & Bluetooth pocket printers' },
  { slug: 'mini-fan', name: 'Mini Fan', tagline: 'Portable mini fans for daily carry and travel' },
  { slug: 'party-items', name: 'Party Items', tagline: 'Colorful party straws and fun event essentials' }
];

const ALLOWED_SLUGS = ALLOWED_CATEGORIES.map(c => c.slug);

async function clean() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.log('No MONGODB_URI set.');
    process.exit(0);
  }

  await mongoose.connect(uri);
  console.log('Connected to MongoDB Atlas for database cleanup...');

  // 1. Delete all categories not in allowed list
  const delCatsRes = await Category.deleteMany({ slug: { $nin: ALLOWED_SLUGS } });
  console.log(`Deleted ${delCatsRes.deletedCount} old categories.`);

  // 2. Ensure all 3 allowed categories exist
  for (const cat of ALLOWED_CATEGORIES) {
    await Category.findOneAndUpdate(
      { slug: cat.slug },
      { $set: cat },
      { upsert: true, returnDocument: 'after' }
    );
  }
  console.log('Ensured the 3 categories exist: mini-printer, mini-fan, party-items.');

  // 3. Delete all products not in allowed categories
  const delProdsRes = await Product.deleteMany({ category: { $nin: ALLOWED_SLUGS } });
  console.log(`Deleted ${delProdsRes.deletedCount} old products.`);

  // 4. Delete orphaned reviews
  const remainingProds = await Product.find();
  const remainingIds = remainingProds.map(p => p.id);
  const remainingSlugs = remainingProds.map(p => p.slug);

  const delRevRes = await Review.deleteMany({
    productId: { $nin: remainingIds },
    productSlug: { $nin: remainingSlugs }
  });
  console.log(`Deleted ${delRevRes.deletedCount} orphaned reviews.`);

  // 5. Verify current state
  const currentCategories = await Category.find().sort({ createdAt: 1 });
  const currentProducts = await Product.find();
  console.log('\n--- VERIFIED DATABASE STATE ---');
  console.log('Active Categories (' + currentCategories.length + '):', currentCategories.map(c => `${c.name} (/${c.slug})`));
  console.log('Active Products (' + currentProducts.length + '):', currentProducts.map(p => `${p.name} [${p.category}]`));

  process.exit(0);
}

clean().catch(err => {
  console.error('Clean error:', err);
  process.exit(1);
});
