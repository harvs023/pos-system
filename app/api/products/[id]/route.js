import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
const prisma = require('../../../../lib/prisma');

export async function GET(request, { params }) {
  const product = await prisma.product.findUnique({
    where: { id: Number(params.id) },
    include: { category: true },
  });
  if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ product });
}

export async function PUT(request, { params }) {
  const body = await request.json();
  const { name, sku, price, cost, stock, categoryId, imageUrl, isActive } = body;

  try {
    const product = await prisma.product.update({
      where: { id: Number(params.id) },
      data: { name, sku, price, cost, stock, categoryId, imageUrl, isActive },
    });
    return NextResponse.json({ product });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await prisma.product.update({
      where: { id: Number(params.id) },
      data: { isActive: false }, // soft delete to preserve order history integrity
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
