import { NextResponse } from 'next/server';
const prisma = require('../../../lib/prisma');

export async function GET() {
  const products = await prisma.product.findMany({
    include: { category: true },
    orderBy: { name: 'asc' },
  });
  return NextResponse.json({ products });
}

export async function POST(request) {
  const body = await request.json();
  const { name, sku, price, cost, stock, categoryId, imageUrl } = body;

  if (!name || !sku || price === undefined) {
    return NextResponse.json({ error: 'name, sku, and price are required' }, { status: 400 });
  }

  try {
    const product = await prisma.product.create({
      data: {
        name,
        sku,
        price,
        cost: cost ?? null,
        stock: stock ?? 0,
        categoryId: categoryId ?? null,
        imageUrl: imageUrl ?? null,
      },
    });
    return NextResponse.json({ product }, { status: 201 });
  } catch (err) {
    if (err.code === 'P2002') {
      return NextResponse.json({ error: 'SKU already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
