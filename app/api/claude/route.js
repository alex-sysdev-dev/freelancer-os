import { NextResponse } from 'next/server';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const DEFAULT_MODEL = 'claude-3-haiku-20240307';

function errorResponse(status, message) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req) {
  let payload;
  try {
    payload = await req.json();
  } catch {
    return errorResponse(400, 'Invalid JSON payload');
  }

  const message = typeof payload?.message === 'string' ? payload.message.trim() : '';
  if (!message) {
    return errorResponse(400, 'Message is required');
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  const model = process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;
  if (!apiKey) {
    return errorResponse(
      500,
      'Missing Anthropic API key. Set ANTHROPIC_API_KEY in your environment.'
    );
  }

  const prompt = `\n\nHuman: ${message}\n\nAssistant:`;

  let response;
  try {
    response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        max_tokens: 1000,
        temperature: 0.2,
        messages: [
          {
            role: 'user',
            content: message,
          },
        ],
      }),
    });
  } catch (requestError) {
    return errorResponse(502, 'Unable to reach Claude API');
  }

  let body = {};
  try {
    body = await response.json();
  } catch {
    return errorResponse(502, 'Invalid response from Claude API');
  }

  if (!response.ok) {
    const errorMessage = body.error?.message || body?.message || 'Claude API returned an error';
    return errorResponse(response.status || 500, errorMessage);
  }

  const result = typeof body.content?.[0]?.text === 'string' ? body.content[0].text.trim() : '';
  if (!result) {
    return errorResponse(502, 'Claude returned an empty response');
  }

  return NextResponse.json({ result });
}
