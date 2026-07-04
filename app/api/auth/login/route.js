import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
const bcrypt = require('bcryptjs');
const prisma = require('../../../../lib/prisma');
const { signToken, COOKIE_NAME } = require('../../../../lib/auth');

export async function POST(request) {
  const { username, password } = await request.json();

  if (!username || !password) {
    return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) {
    return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
  }

  const token = signToken({ id: user.id, name: user.name, username: user.username, role: user.role });

  const response = NextResponse.json({
    user: { id: user.id, name: user.name, username: user.username, role: user.role },
  });

  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 12, // 12 hours
  });

  return response;
}
