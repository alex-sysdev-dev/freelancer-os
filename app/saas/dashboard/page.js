'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BUSINESS_TYPES } from '@/lib/saas/templates';

function typeLabel(businessType) {
  return BUSINESS_TYPES.find((t) => t.id === businessType)?.label || businessType;
}

function typeIcon(businessType) {
  return BUSINESS_TYPES.find((t) => t.id === businessType)?.icon || '🤖';
}

function StatusBadge({ status }) {
  const colors = {
    active: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    inactive: 'bg-white/5 text-white/40 border-white/10',
    draft: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${colors[status] || colors.draft}`}>
      {status}
    </span>
  );
}

export default function SaasDashboardPage() {
  const [bots, setBots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/saas/bots')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setBots(data);
        else setError(data.error || 'Failed to load bots');
      })
      .catch(() => setError('Failed to load bots'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Your bots</h1>
          <p className="text-white/40 text-sm mt-1">Build, train, and deploy AI chatbots for your business</p>
        </div>
        <Link
          href="/saas/dashboard/bots/new"
          className="bg-[#5ec7b7] hover:bg-[#4db5a5] text-black text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
        >
          + New bot
        </Link>
      </div>

      {loading && (
        <div className="text-white/30 text-sm">Loading your bots…</div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-5 py-4">
          {error}
        </div>
      )}

      {!loading && !error && bots.length === 0 && (
        <div className="glass-tile rounded-2xl p-12 text-center">
          <div className="text-5xl mb-4">🤖</div>
          <h2 className="text-lg font-semibold mb-2">No bots yet</h2>
          <p className="text-white/40 text-sm mb-6">Create your first chatbot in under 2 minutes.</p>
          <Link
            href="/saas/dashboard/bots/new"
            className="bg-[#5ec7b7] hover:bg-[#4db5a5] text-black text-sm font-semibold px-6 py-2.5 rounded-lg transition-colors inline-block"
          >
            Create your first bot
          </Link>
        </div>
      )}

      {bots.length > 0 && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bots.map((bot) => (
            <Link
              key={bot.id}
              href={`/saas/dashboard/bots/${bot.id}`}
              className="glass-tile-dark rounded-xl p-5 hover:border-[#5ec7b7]/30 transition-all group block"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="text-3xl">{typeIcon(bot.BusinessType)}</div>
                <StatusBadge status={bot.Status || 'active'} />
              </div>
              <div className="font-semibold text-base group-hover:text-[#5ec7b7] transition-colors">
                {bot.Name}
              </div>
              <div className="text-xs text-white/40 mt-1">{typeLabel(bot.BusinessType)}</div>
              <div className="text-xs text-white/30 mt-3 truncate">
                {bot.WelcomeMessage || 'No welcome message set'}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
