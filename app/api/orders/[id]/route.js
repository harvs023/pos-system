import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
const prisma = require('../../../../lib/prisma');

export async function GET(request, { params }) {
  const order = await prisma.order.findUnique({
    where: { id: Number(params.id) },
    include: { items: true, cashier: { select: { name: true } } },
  });
  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ order });
}
