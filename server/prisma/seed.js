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
  // 5. CREATE SETTINGS
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
  // 6. COUNT USERS
  // ========================================
  const userCount = await prisma.user.count();
  const profileCount = await prisma.profile.count();
  const categoryCount = await prisma.category.count();

  // ========================================
  // 7. SUMMARY
  // ========================================
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(' SEED COMPLETE!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n DATABASE SUMMARY:');
  console.log(`    Users: ${userCount}`);
  console.log(`    Profiles: ${profileCount}`);
  console.log(`    Categories: ${categoryCount}`);
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
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });