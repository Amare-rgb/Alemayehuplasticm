// client/app/lib/prisma.ts

import { PrismaClient } from '@prisma/client';

// Properly typed globalThis extension for Next.js hot reload
interface GlobalWithPrisma {
  prisma?: PrismaClient;
}

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// ✅ FIX: Initialize PrismaClient WITHOUT adapter
const initializePrisma = (): PrismaClient => {
  const globalWithPrisma = globalThis as typeof globalThis & GlobalWithPrisma;

  // Check if we already have a prisma instance in global (for development hot reload)
  if (globalWithPrisma.prisma) {
    return globalWithPrisma.prisma;
  }

  try {
    // ✅ Create Prisma Client WITHOUT adapter
    const client = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });

    // Store in global for development hot reload
    if (process.env.NODE_ENV !== 'production') {
      globalWithPrisma.prisma = client;
    }

    return client;
  } catch (error) {
    console.error('❌ Failed to initialize PrismaClient:', error);
    throw new Error('Failed to initialize database connection. Please check your DATABASE_URL in .env file.');
  }
};

// Initialize prisma instance
const prisma = initializePrisma();

// ── Export the prisma instance ──────────────────────────────────────────────
export { prisma };

// ── Helper to check if prisma is available ──────────────────────────────────
export const isPrismaAvailable = (): boolean => {
  return !!prisma && typeof prisma === 'object';
};

// ── Helper to get typed prisma client with error handling ──────────────────
export const getSafePrisma = (): PrismaClient => {
  if (!isPrismaAvailable()) {
    throw new Error('PrismaClient is not available. Please ensure the database is connected and @prisma/client is installed.');
  }
  return prisma;
};

// ── Export model names for type safety ──────────────────────────────────────
export const PRISMA_MODELS = {
  USER: 'user',
  PRODUCT: 'product',
  CATEGORY: 'category',
  ORDER: 'order',
  SETTINGS: 'settings',
  PROFILE: 'profile',
  CART: 'cart',
  CART_ITEM: 'cart_item',
  ORDER_ITEM: 'order_item',
  REVIEW: 'review',
  ADDRESS: 'address',
  BLOG_POST: 'blog_post',
  ARTICLE: 'article',
} as const;

export default prisma;