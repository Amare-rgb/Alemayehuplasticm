// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // ========================================
  // 1. CREATE ADMIN USER WITH PROFILE
  // ========================================
  const adminPassword = await bcrypt.hash('admin@123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admingen@gmail.com' },
    update: {
      password: adminPassword,
      role: 'ADMIN',
      name: 'Genesis Admin',
      phone: '+1 555 123 4567',
      avatar: 'https://ui-avatars.com/api/?name=Genesis+Admin&background=22c55e&color=fff&size=128',
      profile: {
        upsert: {
          create: {
            shopName: 'Genesis Admin',
            shopDesc: 'Main administrator account',
            isVerified: true,
            isAdmin: true,
            adminRole: 'super_admin',
            permissions: ['manage_all', 'manage_users', 'manage_products', 'manage_orders'],
            status: 'active',
            address: '123 Admin Street, Nairobi, Kenya',
            phone: '+1 555 123 4567',
          },
          update: {
            shopName: 'Genesis Admin',
            shopDesc: 'Main administrator account',
            isVerified: true,
            isAdmin: true,
            adminRole: 'super_admin',
            permissions: ['manage_all', 'manage_users', 'manage_products', 'manage_orders'],
            status: 'active',
            address: '123 Admin Street, Nairobi, Kenya',
            phone: '+1 555 123 4567',
          }
        }
      }
    },
    create: {
      name: 'Genesis Admin',
      email: 'admingen@gmail.com',
      password: adminPassword,
      role: 'ADMIN',
      phone: '+1 555 123 4567',
      avatar: 'https://ui-avatars.com/api/?name=Genesis+Admin&background=22c55e&color=fff&size=128',
      profile: {
        create: {
          shopName: 'Genesis Admin',
          shopDesc: 'Main administrator account',
          isVerified: true,
          isAdmin: true,
          adminRole: 'super_admin',
          permissions: ['manage_all', 'manage_users', 'manage_products', 'manage_orders'],
          status: 'active',
          address: '123 Admin Street, Nairobi, Kenya',
          phone: '+1 555 123 4567',
        }
      }
    },
  });
  console.log('✅ Admin user created:');
  console.log(`    Email: ${admin.email}`);
  console.log(`    Name: ${admin.name}`);
  console.log(`    Role: ${admin.role}`);
  console.log(`    Password: admin@123`);

  // ========================================
  // 2. CREATE REGULAR USER WITH PROFILE
  // ========================================
  const userPassword = await bcrypt.hash('user@123', 12);
  const user = await prisma.user.upsert({
    where: { email: 'user@genesissagri.com' },
    update: {
      password: userPassword,
      role: 'USER',
      name: 'Genesis Customer',
      phone: '+1 555 987 6543',
      avatar: 'https://ui-avatars.com/api/?name=Genesis+Customer&background=3b82f6&color=fff&size=128',
      profile: {
        upsert: {
          create: {
            shopName: 'Customer Shop',
            shopDesc: 'Regular customer account',
            isVerified: false,
            isAdmin: false,
            status: 'active',
            address: '456 Customer Street, Nairobi, Kenya',
            phone: '+1 555 987 6543',
          },
          update: {
            shopName: 'Customer Shop',
            shopDesc: 'Regular customer account',
            isVerified: false,
            isAdmin: false,
            status: 'active',
            address: '456 Customer Street, Nairobi, Kenya',
            phone: '+1 555 987 6543',
          }
        }
      }
    },
    create: {
      name: 'Genesis Customer',
      email: 'user@genesissagri.com',
      password: userPassword,
      role: 'USER',
      phone: '+1 555 987 6543',
      avatar: 'https://ui-avatars.com/api/?name=Genesis+Customer&background=3b82f6&color=fff&size=128',
      profile: {
        create: {
          shopName: 'Customer Shop',
          shopDesc: 'Regular customer account',
          isVerified: false,
          isAdmin: false,
          status: 'active',
          address: '456 Customer Street, Nairobi, Kenya',
          phone: '+1 555 987 6543',
        }
      }
    },
  });
  console.log('\n Regular user created:');
  console.log(`    Email: ${user.email}`);
  console.log(`    Name: ${user.name}`);
  console.log(`    Role: ${user.role}`);
  console.log(`    Password: user@123`);

  // ========================================
  // 3. VERIFY PASSWORDS
  // ========================================
  console.log('\n Verifying passwords...');
  const verifyAdmin = await bcrypt.compare('admin@123', admin.password);
  const verifyUser = await bcrypt.compare('user@123', user.password);
  
  console.log(`   Admin password valid: ${verifyAdmin ? '✅' : '❌'}`);
  console.log(`   User password valid: ${verifyUser ? '✅' : '❌'}`);

  // ========================================
  // 4. CREATE CATEGORIES
  // ========================================
  console.log('\n Creating categories...');
  
  const categories = [
    { name: 'Vegetables', slug: 'vegetables', description: 'Fresh vegetables', icon: '🥬' },
    { name: 'Fruits', slug: 'fruits', description: 'Fresh fruits', icon: '🍎' },
    { name: 'Dairy', slug: 'dairy', description: 'Dairy products', icon: '🥛' },
    { name: 'Grains', slug: 'grains', description: 'Grains and cereals', icon: '🌾' },
    { name: 'Meat', slug: 'meat', description: 'Fresh meat', icon: '🥩' },
    { name: 'Fertilizers', slug: 'fertilizers', description: 'Organic and chemical fertilizers', icon: '🧪' },
    { name: 'Seeds', slug: 'seeds', description: 'High-quality seeds', icon: '🌱' },
    { name: 'Equipment', slug: 'equipment', description: 'Farming equipment', icon: '🔧' },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {
        name: cat.name,
        description: cat.description,
        icon: cat.icon,
        status: 'APPROVED',
        approvedBy: admin.id,
        approvedAt: new Date(),
      },
      create: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        icon: cat.icon,
        status: 'APPROVED',
        createdBy: admin.id,
        approvedBy: admin.id,
        approvedAt: new Date(),
      }
    });
  }
  console.log('   ✅ Categories created');

  // ========================================
  // 5. CREATE PRODUCTS
  // ========================================
  console.log('\n Creating products...');
  
  // Get the categories we just created
  const dbCategories = await prisma.category.findMany();
  const categoryMap = {};
  dbCategories.forEach(cat => {
    categoryMap[cat.slug] = cat.id;
  });

  // Use the first available category for products
  const firstCategoryId = dbCategories.length > 0 ? dbCategories[0].id : null;
  
  if (!firstCategoryId) {
    console.log('⚠️ No categories found. Skipping products.');
  } else {
    const products = [
      {
        name: 'Organic Fertilizer Premium',
        slug: 'organic-fertilizer-premium',
        description: 'High-quality organic fertilizer for all types of crops. Enriched with essential nutrients for maximum yield.',
        price: 45.99,
        discountPrice: 39.99,
        stock: 150,
        sku: 'FERT-ORG-001',
        images: ['fertilizer-1.jpg', 'fertilizer-2.jpg'],
        categoryId: firstCategoryId,
        tags: ['organic', 'fertilizer', 'premium'],
        brand: 'Genesis Agri',
        unitOfMeasurement: 'kg',
        visibility: 'VISIBLE',
        status: 'APPROVED'
      },
      {
        name: 'Hybrid Corn Seed - Golden Harvest',
        slug: 'hybrid-corn-seed-golden-harvest',
        description: 'Premium hybrid corn seeds with high yield potential. Drought resistant and disease tolerant.',
        price: 28.50,
        discountPrice: 24.99,
        stock: 500,
        sku: 'SEED-CORN-001',
        images: ['corn-seed-1.jpg', 'corn-seed-2.jpg'],
        categoryId: firstCategoryId,
        tags: ['hybrid', 'corn', 'seed', 'high-yield'],
        brand: 'Genesis Agri',
        unitOfMeasurement: 'kg',
        visibility: 'VISIBLE',
        status: 'APPROVED'
      },
      {
        name: 'Herbicide Pro - Weed Control',
        slug: 'herbicide-pro-weed-control',
        description: 'Advanced herbicide for effective weed control. Safe for crops and environmentally friendly.',
        price: 32.00,
        discountPrice: 28.50,
        stock: 200,
        sku: 'HERB-PRO-001',
        images: ['herbicide-1.jpg', 'herbicide-2.jpg'],
        categoryId: firstCategoryId,
        tags: ['herbicide', 'weed-control', 'agriculture'],
        brand: 'Genesis Agri',
        unitOfMeasurement: 'liter',
        visibility: 'VISIBLE',
        status: 'APPROVED'
      },
      {
        name: 'Wheat Seed - High Yield',
        slug: 'wheat-seed-high-yield',
        description: 'Premium wheat seeds with high yield potential. Disease resistant and suitable for all climates.',
        price: 35.00,
        discountPrice: 31.99,
        stock: 300,
        sku: 'SEED-WHEAT-001',
        images: ['wheat-seed-1.jpg'],
        categoryId: firstCategoryId,
        tags: ['wheat', 'seed', 'high-yield'],
        brand: 'Genesis Agri',
        unitOfMeasurement: 'kg',
        visibility: 'VISIBLE',
        status: 'APPROVED'
      },
      {
        name: 'Pesticide - Insect Control',
        slug: 'pesticide-insect-control',
        description: 'Broad-spectrum pesticide for effective insect control. Safe for beneficial insects when used as directed.',
        price: 42.00,
        discountPrice: 38.50,
        stock: 180,
        sku: 'PEST-INSECT-001',
        images: ['pesticide-1.jpg'],
        categoryId: firstCategoryId,
        tags: ['pesticide', 'insect-control', 'agriculture'],
        brand: 'Genesis Agri',
        unitOfMeasurement: 'liter',
        visibility: 'VISIBLE',
        status: 'APPROVED'
      },
      {
        name: 'Tomato Seeds - Hybrid',
        slug: 'tomato-seeds-hybrid',
        description: 'High-quality hybrid tomato seeds. Disease resistant and produces large, juicy tomatoes.',
        price: 15.00,
        discountPrice: 12.99,
        stock: 400,
        sku: 'SEED-TOMATO-001',
        images: ['tomato-seed-1.jpg'],
        categoryId: firstCategoryId,
        tags: ['tomato', 'seed', 'hybrid', 'vegetable'],
        brand: 'Genesis Agri',
        unitOfMeasurement: 'kg',
        visibility: 'VISIBLE',
        status: 'APPROVED'
      },
      {
        name: 'Soil pH Tester',
        slug: 'soil-ph-tester',
        description: 'Professional soil pH tester for accurate soil analysis. Essential for optimal crop growth.',
        price: 25.00,
        discountPrice: 22.99,
        stock: 100,
        sku: 'EQUIP-PH-001',
        images: ['ph-tester-1.jpg'],
        categoryId: firstCategoryId,
        tags: ['soil', 'ph-tester', 'equipment', 'analysis'],
        brand: 'Genesis Agri',
        unitOfMeasurement: 'unit',
        visibility: 'VISIBLE',
        status: 'APPROVED'
      },
      {
        name: 'Corn Seeds - Organic',
        slug: 'corn-seeds-organic',
        description: 'Organic corn seeds for sustainable farming. Non-GMO and high germination rate.',
        price: 22.00,
        discountPrice: 19.99,
        stock: 350,
        sku: 'SEED-CORN-ORG-001',
        images: ['organic-corn-seed-1.jpg'],
        categoryId: firstCategoryId,
        tags: ['organic', 'corn', 'seed', 'non-gmo'],
        brand: 'Genesis Agri',
        unitOfMeasurement: 'kg',
        visibility: 'VISIBLE',
        status: 'APPROVED'
      },
      {
        name: 'Nitrogen Fertilizer',
        slug: 'nitrogen-fertilizer',
        description: 'High-nitrogen fertilizer for enhanced crop growth. Perfect for leafy vegetables and grains.',
        price: 38.00,
        discountPrice: 34.99,
        stock: 250,
        sku: 'FERT-NITRO-001',
        images: ['nitrogen-fertilizer-1.jpg'],
        categoryId: firstCategoryId,
        tags: ['fertilizer', 'nitrogen', 'crop-growth'],
        brand: 'Genesis Agri',
        unitOfMeasurement: 'kg',
        visibility: 'VISIBLE',
        status: 'APPROVED'
      },
      {
        name: 'Irrigation System - Drip Kit',
        slug: 'irrigation-system-drip-kit',
        description: 'Complete drip irrigation system for efficient water management. Includes all necessary components.',
        price: 120.00,
        discountPrice: 99.99,
        stock: 50,
        sku: 'EQUIP-IRRIG-001',
        images: ['irrigation-kit-1.jpg', 'irrigation-kit-2.jpg'],
        categoryId: firstCategoryId,
        tags: ['irrigation', 'drip', 'water-management', 'equipment'],
        brand: 'Genesis Agri',
        unitOfMeasurement: 'kit',
        visibility: 'VISIBLE',
        status: 'APPROVED'
      }
    ];

    let createdCount = 0;
    for (const product of products) {
      try {
        const existingProduct = await prisma.product.findUnique({
          where: { sku: product.sku }
        });

        if (!existingProduct) {
          await prisma.product.create({
            data: product
          });
          console.log(`   ✅ Created product: ${product.name}`);
          createdCount++;
        } else {
          console.log(`   ⏭️ Product already exists: ${product.name}`);
        }
      } catch (error) {
        console.error(`   ❌ Error creating product ${product.name}:`, error.message);
      }
    }
    console.log(`   ✅ ${createdCount} new products created`);
  }

  // ========================================
  // 6. CREATE SETTINGS
  // ========================================
  console.log('\n⚙️ Creating settings...');
  
  await prisma.settings.upsert({
    where: { id: 'default-settings' },
    update: {
      siteName: 'Genesis Agri Business',
      siteDescription: 'Agriculture marketplace connecting farmers and buyers',
      adminEmail: 'admingen@gmail.com',
      storeName: 'Genesis Agri Business',
      storeEmail: 'info@genesisagri.com',
      currency: 'KES',
      taxRate: 16,
      themeColor: '#22c55e',
    },
    create: {
      id: 'default-settings',
      siteName: 'Genesis Agri Business',
      siteDescription: 'Agriculture marketplace connecting farmers and buyers',
      adminEmail: 'admingen@gmail.com',
      adminPhone: '+1 555 123 4567',
      storeName: 'Genesis Agri Business',
      storeEmail: 'info@genesisagri.com',
      storePhone: '+1 555 123 4567',
      currency: 'KES',
      taxRate: 16,
      themeColor: '#22c55e',
      contactEmail: 'support@genesisagri.com',
      supportEmail: 'support@genesisagri.com',
      infoEmail: 'info@genesisagri.com',
    }
  });
  console.log('   ✅ Settings created');

  // ========================================
  // 7. COUNT RECORDS
  // ========================================
  const userCount = await prisma.user.count();
  const profileCount = await prisma.profile.count();
  const categoryCount = await prisma.category.count();
  const productCount = await prisma.product.count();

  // ========================================
  // 8. SUMMARY
  // ========================================
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(' SEED COMPLETE!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n DATABASE SUMMARY:');
  console.log(`    Users: ${userCount}`);
  console.log(`    Profiles: ${profileCount}`);
  console.log(`    Categories: ${categoryCount}`);
  console.log(`    Products: ${productCount}`);
  console.log('\n LOGIN CREDENTIALS:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(' ADMIN:');
  console.log(`   Email: admingen@gmail.com`);
  console.log(`   Password: admin@123`);
  console.log(`   Role: ADMIN`);
  console.log('   ─────────────────────────────────────────────');
  console.log('👤 USER:');
  console.log(`   Email: user@genesissagri.com`);
  console.log(`   Password: user@123`);
  console.log(`   Role: USER`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n Test Login with curl:');
  console.log('   curl -X POST http://localhost:5000/api/auth/login \\');
  console.log('     -H "Content-Type: application/json" \\');
  console.log('     -d \'{"email":"admingen@gmail.com","password":"admin@123"}\'');
  console.log('\n   curl -X POST http://localhost:5000/api/auth/login \\');
  console.log('     -H "Content-Type: application/json" \\');
  console.log('     -d \'{"email":"user@genesissagri.com","password":"user@123"}\'');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n🤖 Chatbot now has products to work with!');
  console.log('   Try asking: "Show me your products"');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });