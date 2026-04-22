import { NextResponse } from 'next/server';
import { getBotById, getTrainingForBot } from '@/lib/saas/db';
import { sendChatMessage } from '@/lib/saas/chatEngine';

// Public endpoint — no auth required. Used by the embeddable chat widget.
export async function POST(req, { params }) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON', code: 'INVALID_JSON' }, { status: 400 });
  }

  const { botId } = await params;
  const { messages } = body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: 'messages array is required', code: 'MISSING_FIELDS' }, { status: 400 });
  }

  try {
    const bot = await getBotById(botId);
    if (!bot) return NextResponse.json({ error: 'Bot not found', code: 'NOT_FOUND' }, { status: 404 });
    if (bot.Status === 'inactive') {
      return NextResponse.json({ reply: "I'm currently unavailable. Please check back later." });
    }

    const trainingItems = await getTrainingForBot(botId);
    const reply = await sendChatMessage({ bot, trainingItems, messages });
    return NextResponse.json({ reply });
  } catch (err) {
    console.error('[public/chat POST]', err);
    return NextResponse.json({ error: 'Chat failed', code: 'SERVER_ERROR' }, { status: 500 });
  }
}

// Allow GET so the embed page can fetch bot info (name, welcomeMessage)
export async function GET(req, { params }) {
  const { botId } = await params;
  try {
    const bot = await getBotById(botId);
    if (!bot || bot.Status === 'inactive') {
      return NextResponse.json({ error: 'Bot not found', code: 'NOT_FOUND' }, { status: 404 });
    }
    return NextResponse.json({
      id: bot.id,
      name: bot.Name,
      businessType: bot.BusinessType,
      welcomeMessage: bot.WelcomeMessage,
    });
  } catch (err) {
    console.error('[public/chat GET]', err);
    return NextResponse.json({ error: 'Failed to load bot', code: 'SERVER_ERROR' }, { status: 500 });
  }
}
