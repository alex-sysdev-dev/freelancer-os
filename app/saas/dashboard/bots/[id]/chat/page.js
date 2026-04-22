'use client';

import { useState, useEffect, useRef, use } from 'react';
import Link from 'next/link';

export default function TestChatPage({ params }) {
  const { id } = use(params);
  const [bot, setBot] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => {
    fetch(`/api/saas/bots/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.id) {
          setBot(data);
          if (data.WelcomeMessage) {
            setMessages([{ role: 'assistant', content: data.WelcomeMessage }]);
          }
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    const userMsg = { role: 'user', content: text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setSending(true);

    try {
      const res = await fetch(`/api/saas/bots/${id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages }),
      });
      const data = await res.json();
      if (res.ok && data.reply) {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: data.error || 'Something went wrong. Please try again.' },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Unable to reach the AI. Check your connection.' },
      ]);
    }
    setSending(false);
  }

  function reset() {
    const welcome = bot?.WelcomeMessage
      ? [{ role: 'assistant', content: bot.WelcomeMessage }]
      : [];
    setMessages(welcome);
  }

  if (loading) return <div className="text-white/30 text-sm">Loading…</div>;

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-120px)]">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <Link href={`/saas/dashboard/bots/${id}`} className="text-white/40 hover:text-white text-sm transition-colors">
            ← {bot?.Name || 'Bot'}
          </Link>
          <h1 className="text-xl font-bold">Test chat</h1>
        </div>
        <button
          onClick={reset}
          className="text-xs text-white/30 hover:text-white/60 transition-colors"
        >
          Reset
        </button>
      </div>

      {/* Chat window */}
      <div className="glass-tile rounded-xl flex flex-col flex-1 min-h-0">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-white/30 text-sm mt-8">
              No messages yet. Say something to your bot!
            </div>
          )}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-[#5ec7b7] text-black rounded-tr-sm'
                    : 'bg-white/8 text-white rounded-tl-sm'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex justify-start">
              <div className="bg-white/8 rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm text-white/40">
                <span className="animate-pulse">Typing…</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t border-white/10 p-4 shrink-0">
          <form onSubmit={sendMessage} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message…"
              disabled={sending}
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#5ec7b7]/60 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="bg-[#5ec7b7] hover:bg-[#4db5a5] disabled:opacity-30 text-black font-semibold px-5 py-2.5 rounded-lg transition-colors text-sm"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
