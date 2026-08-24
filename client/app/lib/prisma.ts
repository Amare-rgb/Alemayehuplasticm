// src/app/lib/prisma.ts

const createDummyProxy = () => {
  const handler: any = {
    get: (_target: any, prop: string) => {
      if (prop === 'then') return undefined;
      return new Proxy(() => Promise.resolve([]), handler);
    },
    apply: () => Promise.resolve([]),
  };
  return new Proxy({}, handler);
};

let prismaInstance: any;

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { PrismaClient } = require('@prisma/client');
  prismaInstance = (globalThis as any).prisma || new PrismaClient();
  if (process.env.NODE_ENV !== 'production') {
    (globalThis as any).prisma = prismaInstance;
  }
} catch {
  prismaInstance = createDummyProxy();
}

export const prisma = prismaInstance;
