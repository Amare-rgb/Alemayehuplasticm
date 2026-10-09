const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function createAdmin() {
  try {
    const hashedPassword = await bcrypt.hash('admin@123', 10);
    
    // በ schema.prisma ላይ @@map("users") ስላለ Prisma.user ብለን እንጠራዋለን
    const admin = await prisma.user.upsert({
      where: { email: 'admingen@gmail.com' },
      update: {
        password: hashedPassword,
        role: 'ADMIN',
      },
      create: {
        name: 'Admin Gen',
        email: 'admingen@gmail.com',
        password: hashedPassword,
        role: 'ADMIN',
      },
    });

    console.log('✅ Admin user created/updated successfully:', admin.email);
  } catch (error) {
    console.error('❌ Error creating admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();