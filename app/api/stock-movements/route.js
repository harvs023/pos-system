import { NextResponse } from 'next/server';
const prisma = require('../../../lib/prisma');
export const dynamic = 'force-dynamic';
export async function GET() {
  const movements = await prisma.stockMovement.findMany({
    include: {
      product: { select: { name: true, sku: true } },
      user: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  return NextResponse.json({ movements });
}
