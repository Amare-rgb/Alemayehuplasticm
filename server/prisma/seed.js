// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // ========================================
  // 1. CREATE ADMIN USER
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
    },
    create: {
      name: 'Genesis Admin',
      email: 'admingen@gmail.com',
      password: adminPassword,
      role: 'ADMIN',
      phone: '+1 555 123 4567',
      avatar: 'https://ui-avatars.com/api/?name=Genesis+Admin&background=22c55e&color=fff&size=128',
    },
  });
  console.log('✅ Admin user created:');
  console.log(`   📧 Email: ${admin.email}`);
  console.log(`   👤 Name: ${admin.name}`);
  console.log(`   🔑 Role: ${admin.role}`);
  console.log(`   🔐 Password: admin@123`);

  // ========================================
  // 2. CREATE SELLER USER
  // ========================================
  const sellerPassword = await bcrypt.hash('seller@123', 12);
  const seller = await prisma.user.upsert({
    where: { email: 'seller@genesisagri.com' },
    update: {
      password: sellerPassword,
      role: 'SELLER',
      name: 'Genesis Seller',
      phone: '+1 555 444 5555',
      avatar: 'https://ui-avatars.com/api/?name=Genesis+Seller&background=8b5cf6&color=fff&size=128',
    },
    create: {
      name: 'Genesis Seller',
      email: 'seller@genesisagri.com',
      password: sellerPassword,
      role: 'SELLER',
      phone: '+1 555 444 5555',
      avatar: 'https://ui-avatars.com/api/?name=Genesis+Seller&background=8b5cf6&color=fff&size=128',
    },
  });
  console.log('\n✅ Seller user created:');
  console.log(`   📧 Email: ${seller.email}`);
  console.log(`   👤 Name: ${seller.name}`);
  console.log(`   🔑 Role: ${seller.role}`);
  console.log(`   🔐 Password: seller@123`);

  // ========================================
  // 3. CREATE SELLER PROFILE
  // ========================================
  const sellerProfile = await prisma.sellerProfile.upsert({
    where: { userId: seller.id },
    update: {
      shopName: 'Genesis Farm Supplies',
      shopDesc: 'Premium agricultural products and farm supplies',
      phone: '+1 555 444 5555',
      isVerified: true,
      address: '123 Farm Road, Agri City, CA 90210',
      logo: 'https://ui-avatars.com/api/?name=Genesis+Supplies&background=22c55e&color=fff&size=128',
      banner: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&h=400&fit=crop',
    },
    create: {
      userId: seller.id,
      shopName: 'Genesis Farm Supplies',
      shopDesc: 'Premium agricultural products and farm supplies',
      phone: '+1 555 444 5555',
      isVerified: true,
      address: '123 Farm Road, Agri City, CA 90210',
      logo: 'https://ui-avatars.com/api/?name=Genesis+Supplies&background=22c55e&color=fff&size=128',
      banner: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&h=400&fit=crop',
    },
  });
  console.log('\n✅ Seller profile created:');
  console.log(`   🏪 Shop Name: ${sellerProfile.shopName}`);
  console.log(`   ✅ Verified: ${sellerProfile.isVerified}`);

  // ========================================
  // 4. CREATE REGULAR USER
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
    },
    create: {
      name: 'Genesis Customer',
      email: 'user@genesissagri.com',
      password: userPassword,
      role: 'USER',
      phone: '+1 555 987 6543',
      avatar: 'https://ui-avatars.com/api/?name=Genesis+Customer&background=3b82f6&color=fff&size=128',
    },
  });
  console.log('\n✅ Regular user created:');
  console.log(`   📧 Email: ${user.email}`);
  console.log(`   👤 Name: ${user.name}`);
  console.log(`   🔑 Role: ${user.role}`);
  console.log(`   🔐 Password: user@123`);

  // ========================================
  // 5. VERIFY PASSWORDS
  // ========================================
  console.log('\n🔐 Verifying passwords...');
  const verifyAdmin = await bcrypt.compare('admin@123', admin.password);
  const verifyUser = await bcrypt.compare('user@123', user.password);
  const verifySeller = await bcrypt.compare('seller@123', seller.password);
  
  console.log(`   Admin password valid: ${verifyAdmin ? '✅' : '❌'}`);
  console.log(`   User password valid: ${verifyUser ? '✅' : '❌'}`);
  console.log(`   Seller password valid: ${verifySeller ? '✅' : '❌'}`);

  // ========================================
  // 6. SUMMARY
  // ========================================
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎉 SEED COMPLETE!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n📋 LOGIN CREDENTIALS:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('👑 ADMIN:');
  console.log(`   Email: admingen@gmail.com`);
  console.log(`   Password: admin@123`);
  console.log(`   Role: ADMIN`);
  console.log('   ─────────────────────────────────────────────');
  console.log('🏪 SELLER:');
  console.log(`   Email: seller@genesisagri.com`);
  console.log(`   Password: seller@123`);
  console.log(`   Role: SELLER`);
  console.log(`   Shop: Genesis Farm Supplies`);
  console.log('   ─────────────────────────────────────────────');
  console.log('👤 USER:');
  console.log(`   Email: user@genesissagri.com`);
  console.log(`   Password: user@123`);
  console.log(`   Role: USER`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n🔐 Test Login with curl:');
  console.log('   curl -X POST http://localhost:5000/api/auth/login \\');
  console.log('     -H "Content-Type: application/json" \\');
  console.log('     -d \'{"email":"admingen@gmail.com","password":"admin@123"}\'');
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