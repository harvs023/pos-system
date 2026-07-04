import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
const bcrypt = require('bcryptjs');
const prisma = require('../../../../lib/prisma');
const { getUserFromRequest } = require('../../../../lib/auth');

export async function PUT(request, { params }) {
  const me = getUserFromRequest(request);
  if (!me || me.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const { name, role, password } = await request.json();
  const data = {};
  if (name) data.name = name;
  if (role) data.role = role === 'ADMIN' ? 'ADMIN' : 'CASHIER';
  if (password) {
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }
    data.password = await bcrypt.hash(password, 10);
  }

  try {
    const user = await prisma.user.update({
      where: { id: Number(params.id) },
      data,
      select: { id: true, name: true, username: true, role: true, createdAt: true },
    });
    return NextResponse.json({ user });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const me = getUserFromRequest(request);
  if (!me || me.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }
  if (Number(params.id) === me.id) {
    return NextResponse.json({ error: "You can't delete your own account" }, { status: 400 });
  }

  try {
    await prisma.user.delete({ where: { id: Number(params.id) } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    // Users with existing orders can't be hard-deleted (FK constraint) — that's fine,
    // this keeps sales history intact. Surface a clear message instead.
    return NextResponse.json(
      { error: 'This user has sales history and cannot be deleted. Consider changing their role instead.' },
      { status: 409 }
    );
  }
}
