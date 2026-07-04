import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
const prisma = require('../../../../../lib/prisma');
const { getUserFromRequest } = require('../../../../../lib/auth');

// Records a stock movement (restock or manual adjustment) and updates
// the product's stock count in one transaction, so the two never drift apart.
export async function POST(request, { params }) {
  const user = getUserFromRequest(request);
  const productId = Number(params.id);
  const { delta, note } = await request.json();

  const qty = Number(delta);
  if (!qty || Number.isNaN(qty)) {
    return NextResponse.json({ error: 'Enter a non-zero quantity (positive to add, negative to remove)' }, { status: 400 });
  }

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }
  if (product.stock + qty < 0) {
    return NextResponse.json({ error: `That would take stock below zero (currently ${product.stock}).` }, { status: 400 });
  }

  const type = qty > 0 ? 'RESTOCK' : 'ADJUSTMENT';

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.product.update({
      where: { id: productId },
      data: { stock: { increment: qty } },
    });
    const movement = await tx.stockMovement.create({
      data: {
        productId,
        type,
        quantity: qty,
        note: note || null,
        userId: user?.id,
      },
    });
    return { updated, movement };
  });

  return NextResponse.json({ product: result.updated, movement: result.movement }, { status: 201 });
}

// Movement history for this one product
export async function GET(request, { params }) {
  const movements = await prisma.stockMovement.findMany({
    where: { productId: Number(params.id) },
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  return NextResponse.json({ movements });
}
