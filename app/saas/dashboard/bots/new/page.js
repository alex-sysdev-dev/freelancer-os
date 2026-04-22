'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BUSINESS_TYPES, TEMPLATES } from '@/lib/saas/templates';

export default function NewBotPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState(null);
  const [form, setForm] = useState({ name: '', systemPrompt: '', welcomeMessage: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function selectType(type) {
    const template = TEMPLATES[type.id] || TEMPLATES.custom;
    setSelectedType(type);
    setForm({ name: '', systemPrompt: template.systemPrompt, welcomeMessage: template.welcomeMessage });
    setStep(2);
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Bot name is required.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/saas/bots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          businessType: selectedType.id,
          systemPrompt: form.systemPrompt,
          welcomeMessage: form.welcomeMessage,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to create bot.');
        setLoading(false);
        return;
      }
      router.push(`/saas/dashboard/bots/${data.id}`);
    } catch {
      setError('Something went wrong.');
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/saas/dashboard" className="text-white/40 hover:text-white text-sm transition-colors">
          ← Back
        </Link>
        <h1 className="text-xl font-bold">Create new bot</h1>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                step >= s ? 'bg-[#5ec7b7] text-black' : 'bg-white/10 text-white/30'
              }`}
            >
              {s}
            </div>
            {s === 1 && <span className={`text-sm ${step >= 1 ? 'text-white' : 'text-white/30'}`}>Choose type</span>}
            {s === 2 && <span className={`text-sm ${step >= 2 ? 'text-white' : 'text-white/30'}`}>Configure</span>}
            {s < 2 && <div className="w-8 h-px bg-white/10 mx-1" />}
          </div>
        ))}
      </div>

      {/* Step 1: Choose business type */}
      {step === 1 && (
        <div>
          <p className="text-white/50 text-sm mb-6">What kind of business is this bot for?</p>
          <div className="grid grid-cols-2 gap-3">
            {BUSINESS_TYPES.map((type) => (
              <button
                key={type.id}
                onClick={() => selectType(type)}
                className="glass-tile-dark rounded-xl p-5 text-left hover:border-[#5ec7b7]/40 transition-all group"
              >
                <div className="text-3xl mb-3">{type.icon}</div>
                <div className="font-semibold text-sm group-hover:text-[#5ec7b7] transition-colors">
                  {type.label}
                </div>
                <div className="text-xs text-white/40 mt-1">{type.description}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Configure */}
      {step === 2 && selectedType && (
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="glass-tile-dark rounded-xl p-4 flex items-center gap-3 mb-2">
            <span className="text-2xl">{selectedType.icon}</span>
            <div>
              <div className="font-semibold text-sm">{selectedType.label}</div>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs text-[#5ec7b7] hover:underline"
              >
                Change
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/60 mb-1.5">Bot name *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder={`e.g. ${selectedType.label} Assistant`}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#5ec7b7]/60"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/60 mb-1.5">Welcome message</label>
            <input
              type="text"
              value={form.welcomeMessage}
              onChange={(e) => setForm((f) => ({ ...f, welcomeMessage: e.target.value }))}
              placeholder="What the bot says first"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#5ec7b7]/60"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/60 mb-1.5">
              AI instructions{' '}
              <span className="text-white/30 font-normal">(system prompt)</span>
            </label>
            <textarea
              rows={6}
              value={form.systemPrompt}
              onChange={(e) => setForm((f) => ({ ...f, systemPrompt: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#5ec7b7]/60 resize-y"
            />
            <p className="text-xs text-white/30 mt-1">
              This tells the AI how to behave. The template pre-filled this for you.
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-2.5">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex-1 border border-white/10 hover:border-white/20 text-white/60 hover:text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#5ec7b7] hover:bg-[#4db5a5] disabled:opacity-50 text-black text-sm font-semibold py-2.5 rounded-lg transition-colors"
            >
              {loading ? 'Creating…' : 'Create bot'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
