// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Alemayehu Plastic Manufacturing...\n');

  // ========================================
  // 1. ADMIN USER
  // ========================================
  const adminPassword = await bcrypt.hash('admin@123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@alemayehplastic.com' },
    update: {
      password: adminPassword,
      role: 'ADMIN',
      name: 'Alemayehu Admin',
    },
    create: {
      name: 'Alemayehu Admin',
      email: 'admin@alemayehplastic.com',
      password: adminPassword,
      role: 'ADMIN',
      phone: '+251 900 000 000',
      address: 'Bahir Dar, Ethiopia',
    },
  });

  console.log('✅ Admin user created');
  console.log(`   Email:    ${admin.email}`);
  console.log(`   Password: admin@123\n`);

  // ========================================
  // 2. REGULAR USER
  // ========================================
  const userPassword = await bcrypt.hash('user@123', 12);

  const user = await prisma.user.upsert({
    where: { email: 'user@alemayehplastic.com' },
    update: {
      password: userPassword,
      role: 'USER',
      name: 'Test Customer',
    },
    create: {
      name: 'Test Customer',
      email: 'user@alemayehplastic.com',
      password: userPassword,
      role: 'USER',
      phone: '+251 911 000 000',
      address: 'Bahir Dar, Ethiopia',
    },
  });

  console.log('✅ Regular user created');
  console.log(`   Email:    ${user.email}`);
  console.log(`   Password: user@123\n`);

  // ========================================
  // 3. CATEGORIES
  // ========================================
  // ⚠️ MOCK CATEGORIES REMOVED
  // Add your real categories here later, or create them from the admin dashboard.
  const categories = [];

  const categoryMap = {};

  for (const cat of categories) {
    const created = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, description: cat.description, icon: cat.icon },
      create: { ...cat, createdBy: admin.id },
    });
    categoryMap[cat.slug] = created.id;
  }

  console.log(`✅ Categories seeded: ${categories.length}\n`);

  // ========================================
  // 4. PRODUCTS
  // ========================================
  // ⚠️ MOCK PRODUCTS REMOVED
  // Add your real products here later, or create them from the admin dashboard.
  const products = [];

  let productCount = 0;

  for (const p of products) {
    const categoryId = categoryMap[p.categorySlug];
    if (!categoryId) continue;

    const existing = await prisma.product.findUnique({ where: { sku: p.sku } });
    if (existing) {
      console.log(`⏭️  Already exists: ${p.name}`);
      continue;
    }

    await prisma.product.create({
      data: {
        name: p.name,
        slug: p.slug,
        description: p.description,
        price: p.price,
        discountPrice: p.discountPrice ?? null,
        stock: p.stock,
        sku: p.sku,
        images: p.images,
        categoryId,
        brand: p.brand,
        unitOfMeasurement: p.unitOfMeasurement,
        tags: [],
      },
    });
    console.log(`✅ Created product: ${p.name}`);
    productCount++;
  }

  console.log(`\n✅ Products seeded: ${productCount}\n`);

  // ========================================
  // 5. SETTINGS
  // ========================================
  await prisma.settings.upsert({
    where: { id: 'default-settings' },
    update: {
      siteName: 'Alemayehu Plastic Manufacturing',
      siteDescription: 'Quality plastic products manufactured in Ethiopia',
      adminEmail: 'admin@alemayehplastic.com',
      storeName: 'Alemayehu Plastic Manufacturing',
      storeEmail: 'info@alemayehplastic.com',
      currency: 'ETB',
      taxRate: 15,
      themeColor: '#e0a83c',
    },
    create: {
      id: 'default-settings',
      siteName: 'Alemayehu Plastic Manufacturing',
      siteDescription: 'Quality plastic products manufactured in Ethiopia',
      adminEmail: 'admin@alemayehplastic.com',
      adminPhone: '+251 900 000 000',
      address: 'Bahir Dar, Ethiopia',
      storeName: 'Alemayehu Plastic Manufacturing',
      storeEmail: 'info@alemayehplastic.com',
      storePhone: '+251 900 000 000',
      storeAddress: 'Bahir Dar, Ethiopia',
      currency: 'ETB',
      taxRate: 15,
      themeColor: '#e0a83c',
      contactEmail: 'support@alemayehplastic.com',
      contactPhone: '+251 900 000 000',
      contactAddress: 'Bahir Dar, Ethiopia',
      supportEmail: 'support@alemayehplastic.com',
      infoEmail: 'info@alemayehplastic.com',
      timezone: 'Africa/Addis_Ababa',
    },
  });

  console.log('✅ Settings created\n');

  // ========================================
  // 6. SUMMARY
  // ========================================
  const userCount     = await prisma.user.count();
  const categoryCount = await prisma.category.count();
  const productCnt    = await prisma.product.count();

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎉 SEED COMPLETE!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`   Users:      ${userCount}`);
  console.log(`   Categories: ${categoryCount}`);
  console.log(`   Products:   ${productCnt}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔐 LOGIN:');
  console.log('   Admin → admin@alemayehplastic.com / admin@123');
  console.log('   User  → user@alemayehplastic.com  / user@123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });