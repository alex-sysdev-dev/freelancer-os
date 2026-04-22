'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BUSINESS_TYPES } from '@/lib/saas/templates';

function typeIcon(businessType) {
  return BUSINESS_TYPES.find((t) => t.id === businessType)?.icon || '🤖';
}

export default function BotOverviewPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const [bot, setBot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    fetch(`/api/saas/bots/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.id) setBot(data);
        else setError(data.error || 'Bot not found');
      })
      .catch(() => setError('Failed to load bot'))
      .finally(() => setLoading(false));
  }, [id]);

  async function toggleStatus() {
    if (!bot) return;
    setToggling(true);
    const newStatus = bot.Status === 'active' ? 'inactive' : 'active';
    const res = await fetch(`/api/saas/bots/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) setBot((b) => ({ ...b, Status: newStatus }));
    setToggling(false);
  }

  async function deleteBot() {
    if (!confirm('Delete this bot? This cannot be undone.')) return;
    setDeleting(true);
    await fetch(`/api/saas/bots/${id}`, { method: 'DELETE' });
    router.push('/saas/dashboard');
  }

  if (loading) return <div className="text-white/30 text-sm">Loading…</div>;
  if (error) return <div className="text-red-400 text-sm">{error}</div>;
  if (!bot) return null;

  const isActive = bot.Status === 'active';

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/saas/dashboard" className="text-white/40 hover:text-white text-sm transition-colors">
          ← Bots
        </Link>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <span>{typeIcon(bot.BusinessType)}</span>
          {bot.Name}
        </h1>
        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
            isActive
              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
              : 'bg-white/5 text-white/40 border-white/10'
          }`}
        >
          {bot.Status || 'active'}
        </span>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { href: `/saas/dashboard/bots/${id}/train`, icon: '📚', label: 'Train', desc: 'Add Q&A pairs' },
          { href: `/saas/dashboard/bots/${id}/chat`, icon: '💬', label: 'Test Chat', desc: 'Try it live' },
          { href: `/saas/dashboard/bots/${id}/embed`, icon: '🔗', label: 'Embed', desc: 'Get your code' },
        ].map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="glass-tile-dark rounded-xl p-5 text-center hover:border-[#5ec7b7]/30 transition-all group"
          >
            <div className="text-2xl mb-2">{action.icon}</div>
            <div className="font-semibold text-sm group-hover:text-[#5ec7b7] transition-colors">
              {action.label}
            </div>
            <div className="text-xs text-white/40 mt-0.5">{action.desc}</div>
          </Link>
        ))}
      </div>

      {/* Bot details */}
      <div className="glass-tile rounded-xl p-6 space-y-4 mb-6">
        <h2 className="font-semibold text-sm text-white/60 uppercase tracking-wider">Bot details</h2>

        <div>
          <div className="text-xs text-white/40 mb-1">Welcome message</div>
          <div className="text-sm">{bot.WelcomeMessage || <span className="text-white/30">Not set</span>}</div>
        </div>

        <div>
          <div className="text-xs text-white/40 mb-1">AI instructions</div>
          <div className="text-sm text-white/70 whitespace-pre-wrap line-clamp-4">{bot.SystemPrompt}</div>
        </div>

        <div className="text-xs text-white/30">Bot ID: {bot.id}</div>
      </div>

      {/* Danger zone */}
      <div className="glass-tile-dark rounded-xl p-5 border border-white/5">
        <h2 className="font-semibold text-sm text-white/40 mb-4">Actions</h2>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={toggleStatus}
            disabled={toggling}
            className="text-sm border border-white/10 hover:border-white/20 text-white/60 hover:text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-40"
          >
            {toggling ? '…' : isActive ? 'Deactivate bot' : 'Activate bot'}
          </button>
          <button
            onClick={deleteBot}
            disabled={deleting}
            className="text-sm border border-red-500/20 hover:border-red-500/40 text-red-400/60 hover:text-red-400 px-4 py-2 rounded-lg transition-colors disabled:opacity-40"
          >
            {deleting ? 'Deleting…' : 'Delete bot'}
          </button>
        </div>
      </div>
    </div>
  );
}
