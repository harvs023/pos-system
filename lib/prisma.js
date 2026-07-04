const { PrismaClient } = require('@prisma/client');

// Prevent creating a new PrismaClient on every hot-reload in dev
const globalForPrisma = globalThis;

const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

module.exports = prisma;
