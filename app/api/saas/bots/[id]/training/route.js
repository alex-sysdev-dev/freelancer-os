import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/saas/auth';
import { getBotById, getTrainingForBot, addTrainingItem, deleteTrainingItem } from '@/lib/saas/db';

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
}

async function getOwnedBot(session, id) {
  const bot = await getBotById(id);
  if (!bot || bot.UserId !== session.user.id) return null;
  return bot;
}

export async function GET(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return unauthorized();
  const { id } = await params;

  try {
    const bot = await getOwnedBot(session, id);
    if (!bot) return NextResponse.json({ error: 'Bot not found', code: 'NOT_FOUND' }, { status: 404 });

    const items = await getTrainingForBot(id);
    return NextResponse.json(items);
  } catch (err) {
    console.error('[training GET]', err);
    return NextResponse.json({ error: 'Failed to load training data', code: 'SERVER_ERROR' }, { status: 500 });
  }
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

  const { question, answer, category } = body;
  if (!question || !answer) {
    return NextResponse.json({ error: 'question and answer are required', code: 'MISSING_FIELDS' }, { status: 400 });
  }

  try {
    const bot = await getOwnedBot(session, id);
    if (!bot) return NextResponse.json({ error: 'Bot not found', code: 'NOT_FOUND' }, { status: 404 });

    const item = await addTrainingItem({ botId: id, question: question.trim(), answer: answer.trim(), category: category?.trim() });
    return NextResponse.json(item, { status: 201 });
  } catch (err) {
    console.error('[training POST]', err);
    return NextResponse.json({ error: 'Failed to add training item', code: 'SERVER_ERROR' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return unauthorized();
  const { id } = await params;

  const { searchParams } = new URL(req.url);
  const itemId = searchParams.get('itemId');
  if (!itemId) {
    return NextResponse.json({ error: 'itemId query param required', code: 'MISSING_FIELDS' }, { status: 400 });
  }

  try {
    const bot = await getOwnedBot(session, id);
    if (!bot) return NextResponse.json({ error: 'Bot not found', code: 'NOT_FOUND' }, { status: 404 });

    await deleteTrainingItem(itemId);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[training DELETE]', err);
    return NextResponse.json({ error: 'Failed to delete training item', code: 'SERVER_ERROR' }, { status: 500 });
  }
}
