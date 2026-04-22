'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';

export default function EmbedPage({ params }) {
  const { id } = use(params);
  const [bot, setBot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState('');

  useEffect(() => {
    fetch(`/api/saas/bots/${id}`)
      .then((r) => r.json())
      .then((data) => { if (data.id) setBot(data); })
      .finally(() => setLoading(false));
  }, [id]);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const chatUrl = `${origin}/chat/${id}`;

  const iframeSnippet = `<iframe
  src="${chatUrl}"
  width="400"
  height="600"
  style="border:none;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,0.25);"
  title="${bot?.Name || 'Chat'}"
></iframe>`;

  const floatingSnippet = `<!-- BotBuilder floating chat widget -->
<script>
  (function() {
    var btn = document.createElement('button');
    btn.textContent = '💬 Chat';
    btn.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:9999;background:#5ec7b7;color:#000;font-weight:700;border:none;border-radius:50px;padding:12px 20px;cursor:pointer;font-size:14px;box-shadow:0 4px 16px rgba(94,199,183,0.4);';
    var frame = document.createElement('iframe');
    frame.src = '${chatUrl}';
    frame.style.cssText = 'position:fixed;bottom:80px;right:24px;z-index:9998;width:380px;height:580px;border:none;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,0.3);display:none;';
    frame.title = '${bot?.Name || 'Chat'}';
    var open = false;
    btn.onclick = function() {
      open = !open;
      frame.style.display = open ? 'block' : 'none';
      btn.textContent = open ? '✕ Close' : '💬 Chat';
    };
    document.body.appendChild(frame);
    document.body.appendChild(btn);
  })();
</script>`;

  async function copy(text, key) {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
  }

  if (loading) return <div className="text-white/30 text-sm">Loading…</div>;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Link href={`/saas/dashboard/bots/${id}`} className="text-white/40 hover:text-white text-sm transition-colors">
          ← {bot?.Name || 'Bot'}
        </Link>
        <h1 className="text-xl font-bold">Embed code</h1>
      </div>

      {/* Status */}
      {bot?.Status === 'inactive' && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm rounded-xl px-5 py-3 mb-6">
          This bot is currently inactive. Activate it from the bot overview to enable the embed.
        </div>
      )}

      {/* Public URL */}
      <div className="glass-tile rounded-xl p-5 mb-4">
        <div className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Direct link</div>
        <div className="flex items-center gap-3">
          <a
            href={chatUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-white/5 rounded-lg px-3 py-2 text-sm text-[#5ec7b7] truncate hover:underline"
          >
            {chatUrl}
          </a>
          <button
            onClick={() => copy(chatUrl, 'url')}
            className="text-xs border border-white/10 hover:border-white/20 text-white/50 hover:text-white px-3 py-2 rounded-lg transition-colors shrink-0"
          >
            {copied === 'url' ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <p className="text-xs text-white/30 mt-2">
          Share this link directly or open it in a new tab to test the public view.
        </p>
      </div>

      {/* Floating widget */}
      <div className="glass-tile rounded-xl p-5 mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-semibold text-white/50 uppercase tracking-wider">
            Floating chat button
            <span className="ml-2 text-[#5ec7b7] normal-case font-normal">Recommended</span>
          </div>
          <button
            onClick={() => copy(floatingSnippet, 'floating')}
            className="text-xs border border-white/10 hover:border-[#5ec7b7]/40 text-white/50 hover:text-white px-3 py-1.5 rounded-lg transition-colors"
          >
            {copied === 'floating' ? '✓ Copied!' : 'Copy code'}
          </button>
        </div>
        <pre className="bg-black/30 rounded-lg p-4 text-xs text-white/60 overflow-x-auto whitespace-pre-wrap">
          {floatingSnippet}
        </pre>
        <p className="text-xs text-white/30 mt-2">
          Paste before the closing <code>&lt;/body&gt;</code> tag on any page.
        </p>
      </div>

      {/* Inline iframe */}
      <div className="glass-tile rounded-xl p-5">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-semibold text-white/50 uppercase tracking-wider">Inline iframe</div>
          <button
            onClick={() => copy(iframeSnippet, 'iframe')}
            className="text-xs border border-white/10 hover:border-[#5ec7b7]/40 text-white/50 hover:text-white px-3 py-1.5 rounded-lg transition-colors"
          >
            {copied === 'iframe' ? '✓ Copied!' : 'Copy code'}
          </button>
        </div>
        <pre className="bg-black/30 rounded-lg p-4 text-xs text-white/60 overflow-x-auto whitespace-pre-wrap">
          {iframeSnippet}
        </pre>
        <p className="text-xs text-white/30 mt-2">
          Embed the chat directly on a page as a fixed-size widget.
        </p>
      </div>
    </div>
  );
}
