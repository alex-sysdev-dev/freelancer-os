'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { TEMPLATES } from '@/lib/saas/templates';

export default function TrainBotPage({ params }) {
  const { id } = use(params);
  const [bot, setBot] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ question: '', answer: '', category: '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch(`/api/saas/bots/${id}`).then((r) => r.json()),
      fetch(`/api/saas/bots/${id}/training`).then((r) => r.json()),
    ]).then(([botData, trainingData]) => {
      if (botData.id) setBot(botData);
      if (Array.isArray(trainingData)) setItems(trainingData);
    }).finally(() => setLoading(false));
  }, [id]);

  async function addItem(e) {
    e.preventDefault();
    if (!form.question.trim() || !form.answer.trim()) {
      setFormError('Question and answer are required.');
      return;
    }
    setFormError('');
    setSaving(true);
    try {
      const res = await fetch(`/api/saas/bots/${id}/training`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setItems((prev) => [...prev, data]);
        setForm({ question: '', answer: '', category: '' });
      } else {
        setFormError(data.error || 'Failed to add item.');
      }
    } catch {
      setFormError('Something went wrong.');
    }
    setSaving(false);
  }

  async function deleteItem(itemId) {
    setDeletingId(itemId);
    await fetch(`/api/saas/bots/${id}/training?itemId=${itemId}`, { method: 'DELETE' });
    setItems((prev) => prev.filter((i) => i.id !== itemId));
    setDeletingId(null);
  }

  function loadTemplate(qa) {
    setForm({ question: qa.question, answer: qa.answer, category: '' });
  }

  const templateSuggestions = bot ? (TEMPLATES[bot.BusinessType]?.sampleQA || []) : [];
  const usedQuestions = new Set(items.map((i) => i.Question));
  const unusedSuggestions = templateSuggestions.filter((s) => !usedQuestions.has(s.question));

  if (loading) return <div className="text-white/30 text-sm">Loading…</div>;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Link href={`/saas/dashboard/bots/${id}`} className="text-white/40 hover:text-white text-sm transition-colors">
          ← {bot?.Name || 'Bot'}
        </Link>
        <h1 className="text-xl font-bold">Training data</h1>
        <span className="text-sm text-white/30">{items.length} Q&amp;A pair{items.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Add form */}
        <div className="glass-tile rounded-xl p-5">
          <h2 className="font-semibold text-sm mb-4">Add Q&amp;A pair</h2>
          <form onSubmit={addItem} className="space-y-3">
            <div>
              <label className="block text-xs text-white/50 mb-1">Question</label>
              <input
                type="text"
                value={form.question}
                onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))}
                placeholder="e.g. What are your hours?"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#5ec7b7]/60"
              />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">Answer</label>
              <textarea
                rows={4}
                value={form.answer}
                onChange={(e) => setForm((f) => ({ ...f, answer: e.target.value }))}
                placeholder="The answer your bot will give…"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#5ec7b7]/60 resize-y"
              />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">Category (optional)</label>
              <input
                type="text"
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                placeholder="e.g. Hours, Pricing, FAQ"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#5ec7b7]/60"
              />
            </div>
            {formError && <div className="text-red-400 text-xs">{formError}</div>}
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-[#5ec7b7] hover:bg-[#4db5a5] disabled:opacity-50 text-black text-sm font-semibold py-2 rounded-lg transition-colors"
            >
              {saving ? 'Adding…' : 'Add to training'}
            </button>
          </form>

          {/* Template suggestions */}
          {unusedSuggestions.length > 0 && (
            <div className="mt-5">
              <div className="text-xs text-white/30 font-semibold uppercase tracking-wider mb-2">
                Suggested for {bot?.BusinessType?.replace('_', ' ')}
              </div>
              <div className="space-y-2">
                {unusedSuggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => loadTemplate(s)}
                    className="w-full text-left text-xs text-white/50 hover:text-white border border-white/5 hover:border-white/20 rounded-lg px-3 py-2 transition-colors"
                  >
                    <span className="text-[#5ec7b7]">+ </span>
                    {s.question}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Existing items */}
        <div>
          <h2 className="font-semibold text-sm mb-4">Knowledge base</h2>
          {items.length === 0 && (
            <div className="glass-tile-dark rounded-xl p-6 text-center text-white/30 text-sm">
              No training data yet. Add your first Q&amp;A pair.
            </div>
          )}
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {items.map((item) => (
              <div key={item.id} className="glass-tile-dark rounded-xl p-4 group">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    {item.Category && (
                      <div className="text-xs text-[#5ec7b7]/60 mb-1">{item.Category}</div>
                    )}
                    <div className="font-medium text-sm mb-1">{item.Question}</div>
                    <div className="text-xs text-white/50 line-clamp-2">{item.Answer}</div>
                  </div>
                  <button
                    onClick={() => deleteItem(item.id)}
                    disabled={deletingId === item.id}
                    className="text-white/20 hover:text-red-400 transition-colors text-xs shrink-0 opacity-0 group-hover:opacity-100 disabled:opacity-30"
                    title="Delete"
                  >
                    {deletingId === item.id ? '…' : '✕'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
