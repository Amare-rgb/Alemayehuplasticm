// client/app/lib/prisma.ts
// Prisma client singleton for the Next.js client side.
// Uses global caching to prevent multiple instances during hot reload.
//
// ✅ Safe fallback: if `@prisma/client` is not installed/generated in this
// workspace, the app won't crash at build time. All Prisma calls will throw
// a clear runtime error instead.

// ── Types ─────────────────────────────────────────────────────────────────
// We intentionally avoid importing from '@prisma/client' at the top level
// because that file may not be generated in the client workspace.
// Instead, we define a minimal interface that describes what we actually use.

type PrismaLike = {
  $connect: () => Promise<void>;
  $disconnect: () => Promise<void>;
  $queryRaw: (...args: unknown[]) => Promise<unknown>;
  $transaction: <T>(fn: (tx: PrismaLike) => Promise<T>) => Promise<T>;
  [key: string]: unknown;
};

type GlobalWithPrisma = typeof globalThis & {
  prisma?: PrismaLike;
};

// ── Lazy loader for the real PrismaClient ─────────────────────────────────
// Uses `require` so TypeScript doesn't try to resolve '@prisma/client' at
// compile time. If it's missing, we return null and the caller falls back.
function loadPrismaClient(): PrismaLike | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('@prisma/client') as {
      PrismaClient?: new (...args: unknown[]) => PrismaLike;
    };
    if (!mod?.PrismaClient) return null;
    return new mod.PrismaClient({
      log:
        process.env.NODE_ENV === 'development'
          ? ['error', 'warn']
          : ['error'],
    });
  } catch {
    return null;
  }
}

// ── Create or reuse the Prisma client ─────────────────────────────────────
const globalForPrisma = globalThis as GlobalWithPrisma;

function createPrisma(): PrismaLike {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  const client = loadPrismaClient();

  if (!client) {
    // Prisma is not available in this workspace.
    // Return a proxy that throws a clear error the first time it's used.
    const missing = new Proxy(
      {},
      {
        get(_t, prop) {
          throw new Error(
            `PrismaClient is not available in the client workspace. ` +
              `Attempted to access "prisma.${String(prop)}". ` +
              `Either install @prisma/client + run "npx prisma generate" ` +
              `in /client, or make sure this file is not imported from the browser.`
          );
        },
      }
    ) as PrismaLike;

    if (process.env.NODE_ENV !== 'production') {
      globalForPrisma.prisma = missing;
    }
    return missing;
  }

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = client;
  }

  return client;
}

export const prisma: PrismaLike = createPrisma();

// ── Helper: check if Prisma is actually available ─────────────────────────
export const isPrismaAvailable = (): boolean => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('@prisma/client');
    return !!mod?.PrismaClient;
  } catch {
    return false;
  }
};

// ── Helper: get the Prisma client safely ──────────────────────────────────
export const getSafePrisma = (): PrismaLike => {
  if (!isPrismaAvailable()) {
    throw new Error(
      'PrismaClient is not available. Please install @prisma/client and run `npx prisma generate` in the client workspace.'
    );
  }
  return prisma;
};

// ── Model names (for reference / dynamic access) ──────────────────────────
// ✅ Trimmed to what a plastic manufacturing business actually needs.
export const PRISMA_MODELS = {
  USER: 'user',
  PRODUCT: 'product',
  CATEGORY: 'category',
  REVIEW: 'review',
  SETTINGS: 'settings',
  PROFILE: 'profile',
  ADMIN_PROFILE: 'adminProfile',
  ARTICLE: 'article',
  CHAT_MESSAGE: 'chatMessage',
  INQUIRY: 'inquiry',
} as const;

export type PrismaModelKey =
  (typeof PRISMA_MODELS)[keyof typeof PRISMA_MODELS];

export default prisma;