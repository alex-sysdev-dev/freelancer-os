import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/saas/auth';
import { getBotById, updateBot, deleteBot } from '@/lib/saas/db';

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
}

async function getOwnedBot(session, id) {
  const bot = await getBotById(id);
  if (!bot) return null;
  if (bot.UserId !== session.user.id) return null;
  return bot;
}

export async function GET(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return unauthorized();
  const { id } = await params;

  try {
    const bot = await getOwnedBot(session, id);
    if (!bot) return NextResponse.json({ error: 'Bot not found', code: 'NOT_FOUND' }, { status: 404 });
    return NextResponse.json(bot);
  } catch (err) {
    console.error('[saas/bots/[id] GET]', err);
    return NextResponse.json({ error: 'Failed to load bot', code: 'SERVER_ERROR' }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return unauthorized();
  const { id } = await params;

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON', code: 'INVALID_JSON' }, { status: 400 });
  }

  try {
    const existing = await getOwnedBot(session, id);
    if (!existing) return NextResponse.json({ error: 'Bot not found', code: 'NOT_FOUND' }, { status: 404 });

    const updated = await updateBot(id, {
      Name: body.name,
      Status: body.status,
      SystemPrompt: body.systemPrompt,
      WelcomeMessage: body.welcomeMessage,
      BusinessType: body.businessType,
    });
    return NextResponse.json(updated);
  } catch (err) {
    console.error('[saas/bots/[id] PUT]', err);
    return NextResponse.json({ error: 'Failed to update bot', code: 'SERVER_ERROR' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return unauthorized();
  const { id } = await params;

  try {
    const existing = await getOwnedBot(session, id);
    if (!existing) return NextResponse.json({ error: 'Bot not found', code: 'NOT_FOUND' }, { status: 404 });

    await deleteBot(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[saas/bots/[id] DELETE]', err);
    return NextResponse.json({ error: 'Failed to delete bot', code: 'SERVER_ERROR' }, { status: 500 });
  }
}
