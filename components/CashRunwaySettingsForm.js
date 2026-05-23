"use client";

import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { usd } from '@/lib/finance/ui';

const LOCAL_RUNWAY_SETTINGS_KEY = 'finance_runway_settings';

function toInputNumber(value) {
  return Number.isFinite(Number(value)) ? String(value) : '';
}

export default function CashRunwaySettingsForm({ settings, onSaved }) {
  const [monthlyExpenseTarget, setMonthlyExpenseTarget] = useState(toInputNumber(settings?.monthlyExpenseTarget));
  const [taxReservePercent, setTaxReservePercent] = useState(toInputNumber(Math.round((settings?.taxReserveRate || 0) * 100)));
  const [minimumCashBuffer, setMinimumCashBuffer] = useState(toInputNumber(settings?.minimumCashBuffer));
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    setMonthlyExpenseTarget(toInputNumber(settings?.monthlyExpenseTarget));
    setTaxReservePercent(toInputNumber(Math.round((settings?.taxReserveRate || 0) * 100)));
    setMinimumCashBuffer(toInputNumber(settings?.minimumCashBuffer));
  }, [settings]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monthlyExpenseTarget: Number(monthlyExpenseTarget),
          taxReserveRate: Number(taxReservePercent),
          minimumCashBuffer: Number(minimumCashBuffer),
        }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        if (data?.code === 'SETTINGS_TABLE_MISSING') {
          window.localStorage.setItem(LOCAL_RUNWAY_SETTINGS_KEY, JSON.stringify({
            monthlyExpenseTarget: Number(monthlyExpenseTarget),
            taxReserveRate: Number(taxReservePercent) / 100,
            minimumCashBuffer: Number(minimumCashBuffer),
          }));
          setMessage({ type: 'success', text: 'Runway settings saved locally' });
          await onSaved?.();
          return;
        }

        throw new Error(data?.error || 'Unable to save runway settings');
      }

      window.localStorage.removeItem(LOCAL_RUNWAY_SETTINGS_KEY);
      setMessage({ type: 'success', text: 'Runway settings saved' });
      await onSaved?.();
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Unable to save runway settings' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="glass-tile p-5 border border-[#2f4b70] space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-graphite-faint">Runway controls</p>
          <p className="mt-2 text-xl font-semibold text-white">Cash settings</p>
        </div>
        <span className="rounded-md border border-[#2f4b70] px-2 py-1 text-[10px] uppercase tracking-widest text-graphite-faint">
          {settings?.configured ? 'Saved' : 'Default'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <label className="space-y-2">
          <span className="block text-[10px] uppercase tracking-widest text-graphite-faint">Monthly expense target</span>
          <input
            type="number"
            min="0"
            step="50"
            value={monthlyExpenseTarget}
            onChange={(event) => setMonthlyExpenseTarget(event.target.value)}
            className="w-full rounded-md border border-[#2f4b70] bg-[#07111e] px-3 py-2 text-sm text-white outline-none focus:border-accent"
          />
        </label>

        <label className="space-y-2">
          <span className="block text-[10px] uppercase tracking-widest text-graphite-faint">Tax reserve</span>
          <div className="flex items-center rounded-md border border-[#2f4b70] bg-[#07111e] focus-within:border-accent">
            <input
              type="number"
              min="0"
              max="100"
              step="1"
              value={taxReservePercent}
              onChange={(event) => setTaxReservePercent(event.target.value)}
              className="w-full bg-transparent px-3 py-2 text-sm text-white outline-none"
            />
            <span className="pr-3 text-sm text-graphite-faint">%</span>
          </div>
        </label>

        <label className="space-y-2">
          <span className="block text-[10px] uppercase tracking-widest text-graphite-faint">Minimum cash buffer</span>
          <input
            type="number"
            min="0"
            step="50"
            value={minimumCashBuffer}
            onChange={(event) => setMinimumCashBuffer(event.target.value)}
            className="w-full rounded-md border border-[#2f4b70] bg-[#07111e] px-3 py-2 text-sm text-white outline-none focus:border-accent"
          />
        </label>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-graphite-faint">
          Target: {usd(monthlyExpenseTarget)} / Buffer: {usd(minimumCashBuffer)} / Reserve: {taxReservePercent || 0}%
        </p>
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-[#06131f] transition hover:bg-[#78d8cb] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save className="h-4 w-4" aria-hidden="true" />
          {isSaving ? 'Saving' : 'Save'}
        </button>
      </div>

      {message && (
        <p className={`text-sm ${message.type === 'error' ? 'text-red-300' : 'text-accent'}`}>
          {message.text}
        </p>
      )}
    </form>
  );
}
