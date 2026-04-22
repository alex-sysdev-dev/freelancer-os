import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { findUserByEmail, createUser } from '@/lib/saas/db';

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON', code: 'INVALID_JSON' }, { status: 400 });
  }

  const { name, email, password } = body;
  if (!name || !email || !password) {
    return NextResponse.json({ error: 'name, email, and password are required', code: 'MISSING_FIELDS' }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters', code: 'WEAK_PASSWORD' }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Invalid email address', code: 'INVALID_EMAIL' }, { status: 400 });
  }

  try {
    const existing = await findUserByEmail(email);
    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists', code: 'EMAIL_TAKEN' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await createUser({ name: name.trim(), email: email.toLowerCase().trim(), passwordHash });

    return NextResponse.json({ id: user.id, name: user.Name, email: user.Email }, { status: 201 });
  } catch (err) {
    console.error('[saas/users POST]', err);
    return NextResponse.json({ error: 'Failed to create account', code: 'SERVER_ERROR' }, { status: 500 });
  }
}
