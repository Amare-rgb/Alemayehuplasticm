// lib/prisma.js
const { PrismaClient } = require('@prisma/client');

// ✅ Simple Prisma Client initialization WITHOUT any adapter
// ⚠️ Use a singleton so hot-reload in dev does NOT create multiple clients.
//    Multiple clients → multiple connection pools → "Too many connections".
const globalForPrisma = globalThis;

const prisma =
  globalForPrisma.__prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['warn', 'error']
        : ['error'],
  });

// Cache the client on globalThis in non-production so hot-reload reuses it.
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.__prisma = prisma;
}

// Optional: Add connection error handling
// ⚠️ We do NOT call process.exit(1) here — server.js handles DB status and
//    should be allowed to start so /api/health can report the DB state.
prisma
  .$connect()
  .then(() => {
    console.log('✅ Database connected successfully');
  })
  .catch((error) => {
    console.error('❌ Database connection failed:', error.message);
    console.error('Please check your DATABASE_URL in .env file');
  });

module.exports = prisma;