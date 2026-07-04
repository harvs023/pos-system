import { NextResponse } from 'next/server';
const { getUserFromRequest } = require('../../../../lib/auth');

export async function GET(request) {
  const user = getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.json({ user });
}
