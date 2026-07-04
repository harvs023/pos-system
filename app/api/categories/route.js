import { NextResponse } from 'next/server';
const prisma = require('../../../lib/prisma');

export async function GET() {
  const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
  return NextResponse.json({ categories });
}

export async function POST(request) {
  const { name } = await request.json();
  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 });

  try {
    const category = await prisma.category.create({ data: { name } });
    return NextResponse.json({ category }, { status: 201 });
  } catch (err) {
    if (err.code === 'P2002') {
      return NextResponse.json({ error: 'Category already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}
