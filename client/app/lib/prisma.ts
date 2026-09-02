// client/app/lib/prisma.ts

// ── FIX: Define proper types instead of 'any' ──────────────────────────────
type PrismaClientLike = {
  $connect?: () => Promise<void>
  $disconnect?: () => Promise<void>
  $transaction?: <T>(callback: () => Promise<T>) => Promise<T>
  [key: string]: unknown
}

type DummyProxyTarget = Record<string, unknown>

// Type for the actual PrismaClient
type PrismaClientInstance = PrismaClientLike & Record<string, unknown>

// ── FIX: Create a properly typed dummy proxy ───────────────────────────────
const createDummyProxy = (): PrismaClientInstance => {
  const handler: ProxyHandler<DummyProxyTarget> = {
    get: (_target: DummyProxyTarget, prop: string | symbol) => {
      if (prop === 'then') return undefined
      if (prop === '$connect') return () => Promise.resolve()
      if (prop === '$disconnect') return () => Promise.resolve()
      if (prop === '$transaction') {
        return (callback: () => unknown) => Promise.resolve(callback())
      }
      // For model access like prisma.order, prisma.product, etc.
      // Return a proxy that mimics the model methods
      return new Proxy(() => Promise.resolve([]), {
        get: () => {
          // For methods like findFirst, findMany, create, etc.
          return (...args: unknown[]) => Promise.resolve(null)
        }
      })
    },
    apply: () => Promise.resolve([]),
  }
  
  return new Proxy({} as DummyProxyTarget, handler) as PrismaClientInstance
}

// ── FIX: Properly typed globalThis extension ──────────────────────────────
interface GlobalWithPrisma {
  prisma?: PrismaClientInstance
}

// ── FIX: Initialize PrismaClient with proper typing ────────────────────────
let prismaInstance: PrismaClientInstance

const initializePrisma = (): PrismaClientInstance => {
  try {
    const globalWithPrisma = globalThis as typeof globalThis & GlobalWithPrisma
    
    // Check if we already have a client in global scope
    if (globalWithPrisma.prisma) {
      return globalWithPrisma.prisma
    }
    
    // Use dynamic require so bundler doesn't fail if client schema is not generated in client workspace
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaClient } = require('@prisma/client')
    const client = new PrismaClient()
    
    // Store in global scope in development to prevent multiple instances
    if (process.env.NODE_ENV !== 'production') {
      globalWithPrisma.prisma = client as PrismaClientInstance
    }
    
    return client as PrismaClientInstance
  } catch (error) {
    // Return dummy proxy if PrismaClient is not available
    return createDummyProxy()
  }
}

// Initialize prisma instance
try {
  prismaInstance = initializePrisma()
} catch (error) {
  prismaInstance = createDummyProxy()
}

// ── FIX: Type guard to check if prisma is available ────────────────────────
const isRealPrisma = (instance: PrismaClientInstance): boolean => {
  return !!(instance && 
    typeof instance === 'object' && 
    '$connect' in instance && 
    typeof instance.$connect === 'function')
}

export const prisma = prismaInstance

// ── Helper to check if prisma is available ──────────────────────────────────
export const isPrismaAvailable = (): boolean => {
  return !!(prisma && typeof prisma === 'object' && '$connect' in prisma)
}

// ── FIX: Helper to get typed prisma client with error handling ─────────────
export const getSafePrisma = (): PrismaClientInstance => {
  if (!isPrismaAvailable()) {
    throw new Error('PrismaClient is not available. Please ensure the database is connected and @prisma/client is installed.')
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

// Type for model keys
export type PrismaModelKey = typeof PRISMA_MODELS[keyof typeof PRISMA_MODELS]