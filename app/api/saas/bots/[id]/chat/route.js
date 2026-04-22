import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/saas/auth';
import { getBotById, getTrainingForBot } from '@/lib/saas/db';
import { sendChatMessage } from '@/lib/saas/chatEngine';

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
}

export async function POST(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return unauthorized();
  const { id } = await params;

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON', code: 'INVALID_JSON' }, { status: 400 });
  }

  const { messages } = body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: 'messages array is required', code: 'MISSING_FIELDS' }, { status: 400 });
  }

  try {
    const bot = await getBotById(id);
    if (!bot || bot.UserId !== session.user.id) {
      return NextResponse.json({ error: 'Bot not found', code: 'NOT_FOUND' }, { status: 404 });
    }
    if (bot.Status === 'inactive') {
      return NextResponse.json({ error: 'This bot is currently inactive', code: 'BOT_INACTIVE' }, { status: 403 });
    }

    const trainingItems = await getTrainingForBot(id);
    const reply = await sendChatMessage({ bot, trainingItems, messages });
    return NextResponse.json({ reply });
  } catch (err) {
    console.error('[bot chat POST]', err);
    return NextResponse.json({ error: err.message || 'Chat failed', code: 'SERVER_ERROR' }, { status: 500 });
  }
}
