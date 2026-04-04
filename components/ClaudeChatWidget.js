"use client";

import { useMemo, useState } from 'react';

const INITIAL_MESSAGES = [
  {
    id: 'system',
    role: 'assistant',
    text: 'Hi! I can help explain your freelancer finance data and answer questions about earnings, accounts, and transfers.',
  },
];

export default function ClaudeChatWidget() {
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);

  const chatHistory = useMemo(
    () => messages.filter((message) => message.role !== 'system'),
    [messages]
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!input.trim()) return;

    const newMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: input.trim(),
    };

    setMessages((current) => [...current, newMessage]);
    setInput('');
    setError(null);
    setIsSending(true);

    try {
      const response = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: newMessage.text }),
      });

      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error || 'Claude request failed');
      }

      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          text: body.result,
        },
      ]);
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'Unknown error');
    } finally {
      setIsSending(false);
    }
  };

  if (!isExpanded) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsExpanded(true)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-[#5ec7b7] text-[#041a1a] shadow-lg shadow-[#00000040] transition-all hover:bg-[#7be0cc] hover:scale-105"
          title="Open Claude Chat"
        >
          <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-3rem)]">
      <div className="glass-tile-dark rounded-2xl border border-[#2f4b70] shadow-2xl shadow-[#00000060]">
        <div className="flex items-center justify-between border-b border-[#2f4b70] p-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-[#5ec7b7]"></div>
            <span className="text-sm font-medium text-white">Claude Assistant</span>
          </div>
          <button
            onClick={() => setIsExpanded(false)}
            className="text-graphite-faint hover:text-white transition-colors"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="h-80 overflow-y-auto p-4 space-y-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`rounded-lg p-3 text-sm ${
                message.role === 'assistant'
                  ? 'bg-[#0f243f] text-slate-100 border border-[#2f5d7d]'
                  : 'bg-[#08151f] text-slate-200 border border-[#23424f] ml-8'
              }`}
            >
              <p className="whitespace-pre-wrap leading-5">{message.text}</p>
            </div>
          ))}
        </div>

        {error && (
          <div className="mx-4 mb-2 rounded-lg border border-[#7b2b2b] bg-[#2a1015] p-2 text-xs text-[#f1c6c6]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="border-t border-[#2f4b70] p-4">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about your finances..."
              className="flex-1 rounded-lg border border-[#2f4b70] bg-[#0f1726] px-3 py-2 text-sm text-white outline-none focus:border-[#5ec7b7] placeholder:text-graphite-faint"
            />
            <button
              type="submit"
              disabled={isSending}
              className="rounded-lg bg-[#5ec7b7] px-4 py-2 text-sm font-medium text-[#041a1a] transition hover:bg-[#79dac3] disabled:opacity-40"
            >
              {isSending ? '...' : 'Send'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
