import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/saas/auth';
import { getBotsForUser, createBot } from '@/lib/saas/db';
import { TEMPLATES } from '@/lib/saas/templates';

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
}

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return unauthorized();

  try {
    const bots = await getBotsForUser(session.user.id);
    return NextResponse.json(bots);
  } catch (err) {
    console.error('[saas/bots GET]', err);
    return NextResponse.json({ error: 'Failed to load bots', code: 'SERVER_ERROR' }, { status: 500 });
  }
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return unauthorized();

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON', code: 'INVALID_JSON' }, { status: 400 });
  }

  const { name, businessType } = body;
  if (!name || !businessType) {
    return NextResponse.json({ error: 'name and businessType are required', code: 'MISSING_FIELDS' }, { status: 400 });
  }

  const template = TEMPLATES[businessType] || TEMPLATES.custom;

  try {
    const bot = await createBot({
      name: name.trim(),
      userId: session.user.id,
      businessType,
      systemPrompt: body.systemPrompt || template.systemPrompt,
      welcomeMessage: body.welcomeMessage || template.welcomeMessage,
    });
    return NextResponse.json(bot, { status: 201 });
  } catch (err) {
    console.error('[saas/bots POST]', err);
    return NextResponse.json({ error: 'Failed to create bot', code: 'SERVER_ERROR' }, { status: 500 });
  }
}
