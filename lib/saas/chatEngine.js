const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const DEFAULT_MODEL = 'claude-3-haiku-20240307';

export function buildSystemPrompt(bot, trainingItems = []) {
  let prompt = bot.SystemPrompt || bot.systemPrompt || '';

  if (trainingItems.length > 0) {
    prompt += '\n\n## Knowledge Base\n\nUse the following Q&A pairs to answer questions accurately:\n\n';
    for (const item of trainingItems) {
      const q = item.Question || item.question;
      const a = item.Answer || item.answer;
      if (q && a) {
        prompt += `Q: ${q}\nA: ${a}\n\n`;
      }
    }
  }

  prompt +=
    "\n\nGuidelines:\n- Be helpful, friendly, and concise.\n- If a question is outside your knowledge base, say so honestly and offer to connect the user with a human.\n- Never make up information.";

  return prompt.trim();
}

export async function sendChatMessage({ bot, trainingItems = [], messages }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('Missing ANTHROPIC_API_KEY');

  const model = process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;
  const systemPrompt = buildSystemPrompt(bot, trainingItems);

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    }),
  });

  const body = await response.json();

  if (!response.ok) {
    throw new Error(body.error?.message || 'Anthropic API error');
  }

  const text = body.content?.[0]?.text ?? '';
  return text.trim();
}
