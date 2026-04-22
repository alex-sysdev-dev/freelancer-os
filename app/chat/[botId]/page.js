'use client';

import { useState, useEffect, useRef, use } from 'react';

export default function PublicChatPage({ params }) {
  const { botId } = use(params);
  const [bot, setBot] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loadError, setLoadError] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    fetch(`/api/public/chat/${botId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.id) {
          setBot(data);
          if (data.welcomeMessage) {
            setMessages([{ role: 'assistant', content: data.welcomeMessage }]);
          }
        } else {
          setLoadError("This bot isn't available right now.");
        }
      })
      .catch(() => setLoadError("Couldn't connect. Please try again later."));
  }, [botId]);

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
      const res = await fetch(`/api/public/chat/${botId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.reply || data.error || 'Something went wrong.' },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: "I'm having trouble connecting. Please try again." },
      ]);
    }
    setSending(false);
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-[#1a1f2e] flex items-center justify-center px-4">
        <div className="text-center text-white/40 text-sm">{loadError}</div>
      </div>
    );
  }

  if (!bot) {
    return (
      <div className="min-h-screen bg-[#1a1f2e] flex items-center justify-center">
        <div className="text-white/30 text-sm animate-pulse">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1f2e] flex flex-col" style={{ fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div className="bg-[#212736] border-b border-white/10 px-5 py-3.5 flex items-center gap-3 shrink-0">
        <div className="w-9 h-9 rounded-full bg-[#5ec7b7]/20 flex items-center justify-center text-lg">
          🤖
        </div>
        <div>
          <div className="font-semibold text-white text-sm">{bot.name}</div>
          <div className="text-xs text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
            Online
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-full bg-[#5ec7b7]/20 flex items-center justify-center text-sm mr-2 shrink-0 mt-0.5">
                🤖
              </div>
            )}
            <div
              className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-[#5ec7b7] text-black rounded-tr-sm font-medium'
                  : 'bg-white/8 text-white rounded-tl-sm'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {sending && (
          <div className="flex justify-start">
            <div className="w-7 h-7 rounded-full bg-[#5ec7b7]/20 flex items-center justify-center text-sm mr-2 shrink-0">
              🤖
            </div>
            <div className="bg-white/8 rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1 items-center">
              {[0, 1, 2].map((n) => (
                <span
                  key={n}
                  className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce"
                  style={{ animationDelay: `${n * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-[#212736] border-t border-white/10 px-4 py-3 shrink-0">
        <form onSubmit={sendMessage} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message…"
            disabled={sending}
            className="flex-1 bg-white/6 border border-white/10 rounded-full px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#5ec7b7]/50 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="w-10 h-10 rounded-full bg-[#5ec7b7] hover:bg-[#4db5a5] disabled:opacity-30 flex items-center justify-center transition-colors shrink-0"
            aria-label="Send"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-black rotate-90">
              <path d="M2 12L22 2L12 22L10 14L2 12Z" />
            </svg>
          </button>
        </form>
        <div className="text-center mt-2">
          <span className="text-[10px] text-white/20">Powered by BotBuilder</span>
        </div>
      </div>
    </div>
  );
}
