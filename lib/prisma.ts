import { PrismaClient } from '@prisma/client';

// Declare a global variable type to avoid TypeScript errors
declare global {
  var prisma: PrismaClient | undefined;
}

/**
 * Create a single global Prisma Client instance
 * In development, due to hot reload, ensure multiple instances are not created
 * This prevents opening too many database connections
 */
const prisma = globalThis.prisma || new PrismaClient();

// In development, store Prisma Client on the global object
if (process.env.NODE_ENV === 'development') {
  globalThis.prisma = prisma;
}

export default prisma;
