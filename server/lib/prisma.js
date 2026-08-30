// lib/prisma.js
const { PrismaClient } = require('@prisma/client');

// ✅ Simple Prisma Client initialization WITHOUT any adapter
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Optional: Add connection error handling
prisma.$connect()
  .then(() => {
    console.log('✅ Database connected successfully');
  })
  .catch((error) => {
    console.error('❌ Database connection failed:', error.message);
    console.error('Please check your DATABASE_URL in .env file');
    process.exit(1);
  });

module.exports = prisma;