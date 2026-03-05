import { PrismaClient } from '@prisma/client';

// Extend the NodeJS global type to include Prisma
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Use existing Prisma client if it exists (for hot reloads in dev)
export const prisma = global.prisma || new PrismaClient();

// Only assign to global in development to prevent multiple instances
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export default prisma;