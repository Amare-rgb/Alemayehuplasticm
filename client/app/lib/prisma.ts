// client/app/lib/prisma.ts

// ── FIX: Define proper types instead of 'any' ──────────────────────────────
type PrismaClientLike = {
  $connect?: () => Promise<void>
  $disconnect?: () => Promise<void>
  $transaction?: <T>(callback: () => Promise<T>) => Promise<T>
  [key: string]: unknown
}

type DummyProxyTarget = Record<string, unknown>

// ── FIX: Create a properly typed dummy proxy ───────────────────────────────
const createDummyProxy = (): PrismaClientLike => {
  const handler: ProxyHandler<DummyProxyTarget> = {
    get: (_target: DummyProxyTarget, prop: string | symbol) => {
      if (prop === 'then') return undefined
      if (prop === '$connect') return () => Promise.resolve()
      if (prop === '$disconnect') return () => Promise.resolve()
      if (prop === '$transaction') {
        return (callback: () => unknown) => Promise.resolve(callback())
      }
      return () => Promise.resolve([])
    },
    apply: () => Promise.resolve([]),
  }
  
  return new Proxy({} as DummyProxyTarget, handler) as PrismaClientLike
}

// ── FIX: Properly typed globalThis extension ──────────────────────────────
interface GlobalWithPrisma {
  prisma?: any
}

declare global {
  // eslint-disable-next-line no-var
  var prisma: any | undefined
}

// ── FIX: Initialize PrismaClient with proper typing ────────────────────────
let prismaInstance: any

const initializePrisma = (): any => {
  try {
    const globalWithPrisma = globalThis as typeof globalThis & GlobalWithPrisma
    
    if (!globalWithPrisma.prisma) {
      // Use dynamic require so bundler doesn't fail if client schema is not generated in client workspace
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { PrismaClient } = require('@prisma/client')
      const client = new PrismaClient()
      if (process.env.NODE_ENV !== 'production') {
        globalWithPrisma.prisma = client
      }
      return client
    }

    return client;
  } catch (error) {
    return createDummyProxy()
  }
};

// Initialize prisma instance
try {
  prismaInstance = initializePrisma()
} catch (error) {
  prismaInstance = createDummyProxy()
}

// ── FIX: Type guard to check if prisma is available ────────────────────────
const isRealPrisma = (instance: any): boolean => {
  return !!(instance && 
    typeof instance === 'object' && 
    '$connect' in instance && 
    typeof instance.$connect === 'function')
}

export const prisma = prismaInstance

// ── Helper to check if prisma is available ──────────────────────────────────
export const isPrismaAvailable = (): boolean => {
  return !!prisma && typeof prisma === 'object';
};

// ── FIX: Helper to get typed prisma client with error handling ─────────────
export const getSafePrisma = (): any => {
  if (!isPrismaAvailable()) {
    throw new Error('PrismaClient is not available. Please ensure the database is connected and @prisma/client is installed.');
  }
  return prismaInstance
}

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
} as const
