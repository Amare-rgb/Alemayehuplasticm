// src/app/lib/prisma.ts

import { PrismaClient } from '@prisma/client'

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
  prisma?: PrismaClient
}

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

// ── FIX: Initialize PrismaClient with proper typing ────────────────────────
let prismaInstance: PrismaClient | PrismaClientLike

const initializePrisma = (): PrismaClient | PrismaClientLike => {
  try {
    const globalWithPrisma = globalThis as typeof globalThis & GlobalWithPrisma
    
    if (!globalWithPrisma.prisma) {
      const client = new PrismaClient()
      if (process.env.NODE_ENV !== 'production') {
        globalWithPrisma.prisma = client
      }
      return client
    }
    
    return globalWithPrisma.prisma
  } catch (error) {
    console.warn('⚠️ PrismaClient not available, using dummy proxy')
    return createDummyProxy()
  }
}

// Initialize prisma instance
try {
  prismaInstance = initializePrisma()
} catch (error) {
  console.warn('⚠️ Failed to initialize PrismaClient, using dummy proxy')
  prismaInstance = createDummyProxy()
}

// ── FIX: Type guard to check if prisma is available ────────────────────────
const isRealPrisma = (instance: PrismaClient | PrismaClientLike): instance is PrismaClient => {
  return !!(instance && 
    typeof instance === 'object' && 
    '$connect' in instance && 
    typeof instance.$connect === 'function')
}

export const prisma = prismaInstance

// ── FIX: Type guard for prisma availability ────────────────────────────────
export const isPrismaAvailable = (): boolean => {
  return isRealPrisma(prismaInstance)
}

// ── FIX: Helper to get typed prisma client with error handling ─────────────
export const getSafePrisma = (): PrismaClient => {
  if (!isPrismaAvailable()) {
    throw new Error('PrismaClient is not available. Please ensure the database is connected and @prisma/client is installed.')
  }
  return prismaInstance as PrismaClient
}

// ── FIX: Export model names for type safety ────────────────────────────────
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

export default prisma