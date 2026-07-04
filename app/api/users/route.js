import { NextResponse } from 'next/server';
const bcrypt = require('bcryptjs');
const prisma = require('../../../lib/prisma');
const { getUserFromRequest } = require('../../../lib/auth');

export async function GET(request) {
  const me = getUserFromRequest(request);
  if (!me || me.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }
  const users = await prisma.user.findMany({
    select: { id: true, name: true, username: true, role: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });
  return NextResponse.json({ users });
}

export async function POST(request) {
  const me = getUserFromRequest(request);
  if (!me || me.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const { name, username, password, role } = await request.json();
  if (!name || !username || !password) {
    return NextResponse.json({ error: 'name, username, and password are required' }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
  }

  try {
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        username,
        password: hashed,
        role: role === 'ADMIN' ? 'ADMIN' : 'CASHIER',
      },
      select: { id: true, name: true, username: true, role: true, createdAt: true },
    });
    return NextResponse.json({ user }, { status: 201 });
  } catch (err) {
    if (err.code === 'P2002') {
      return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
