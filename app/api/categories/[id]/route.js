import { NextResponse } from 'next/server';
const prisma = require('../../../../lib/prisma');

export async function PUT(request, { params }) {
  const { name } = await request.json();
  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 });

  try {
    const category = await prisma.category.update({
      where: { id: Number(params.id) },
      data: { name },
    });
    return NextResponse.json({ category });
  } catch (err) {
    if (err.code === 'P2002') {
      return NextResponse.json({ error: 'A category with that name already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to rename category' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const id = Number(params.id);

  try {
    // Products in this category aren't deleted — they just become "uncategorized"
    // so their sales history and stock stay intact.
    await prisma.product.updateMany({
      where: { categoryId: id },
      data: { categoryId: null },
    });
    await prisma.category.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
