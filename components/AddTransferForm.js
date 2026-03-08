"use client";

import { useEffect, useMemo, useState } from 'react';

const ADMIN_SESSION_KEY = 'finance_admin_unlocked';
const PREVIEW_SESSION_KEY = 'finance_preview_unlocked';

const INITIAL_STATE = {
  date: new Date().toISOString().split('T')[0],
  accountId: '',
  category: 'Deposit',
  amount: '',
  source: 'Earnings',
  weekStartDate: '',
};

export default function AddTransferForm({ accounts = [], onSaved }) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState(INITIAL_STATE);
  const [isSaving, setIsSaving] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isAdmin = window.sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true';
    const isPreview = window.sessionStorage.getItem(PREVIEW_SESSION_KEY) === 'true';
    setIsPreviewMode(!isAdmin && isPreview);
  }, []);

  const accountOptions = useMemo(
    () =>
      [...accounts].sort((a, b) =>
        String(a.accountName || '').localeCompare(String(b.accountName || ''))
      ),
    [accounts]
  );

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const closeModal = () => {
    setIsOpen(false);
    setFormData(INITIAL_STATE);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const payload = {
        date: formData.date,
        accountId: formData.accountId,
        category: formData.category,
        amount: formData.amount,
        source: formData.source,
        weekStartDate: formData.weekStartDate,
      };

      const res = await fetch('/api/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(`Error: ${err.error || 'Failed to save transfer'}`);
        return;
      }

      closeModal();
      if (typeof onSaved === 'function') onSaved();
    } catch {
      alert('Critical error connecting to API.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isPreviewMode) return null;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-[#7fb5ff] hover:bg-[#99c5ff] text-[#071a35] text-xs font-semibold py-2 px-4 rounded-lg transition-all duration-200 shadow-lg shadow-[#274a80]/40"
      >
        + ADD TRANSFER
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-tile-dark p-6 w-full max-w-md text-white border border-[#2f4b70]">
            <h2 className="text-xl font-semibold mb-4">Log Transfer</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-graphite-faint font-medium uppercase mb-1 block">Date</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  className="w-full p-2.5 rounded-lg bg-[#0f1825] border border-[#2a3f5d] text-white focus:border-[#7fb5ff] outline-none transition"
                  onChange={(e) => handleChange('date', e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs text-graphite-faint font-medium uppercase mb-1 block">Account</label>
                <select
                  required
                  value={formData.accountId}
                  className="w-full p-2.5 rounded-lg bg-[#0f1825] border border-[#2a3f5d] text-white focus:border-[#7fb5ff] outline-none transition"
                  onChange={(e) => handleChange('accountId', e.target.value)}
                >
                  <option value="">Select account</option>
                  {accountOptions.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.accountName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-graphite-faint font-medium uppercase mb-1 block">Category</label>
                  <select
                    value={formData.category}
                    className="w-full p-2.5 rounded-lg bg-[#0f1825] border border-[#2a3f5d] text-white focus:border-[#7fb5ff] outline-none transition"
                    onChange={(e) => handleChange('category', e.target.value)}
                  >
                    <option value="Deposit">Deposit</option>
                    <option value="Withdrawal">Withdrawal</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-graphite-faint font-medium uppercase mb-1 block">Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.amount}
                    className="w-full p-2.5 rounded-lg bg-[#0f1825] border border-[#2a3f5d] text-white focus:border-[#7fb5ff] outline-none transition"
                    onChange={(e) => handleChange('amount', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-graphite-faint font-medium uppercase mb-1 block">Source</label>
                  <select
                    value={formData.source}
                    className="w-full p-2.5 rounded-lg bg-[#0f1825] border border-[#2a3f5d] text-white focus:border-[#7fb5ff] outline-none transition"
                    onChange={(e) => handleChange('source', e.target.value)}
                  >
                    <option value="Earnings">Earnings</option>
                    <option value="Manual">Manual</option>
                    <option value="Adjustment">Adjustment</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-graphite-faint font-medium uppercase mb-1 block">Week Key</label>
                  <input
                    type="text"
                    placeholder="2026-W10"
                    value={formData.weekStartDate}
                    className="w-full p-2.5 rounded-lg bg-[#0f1825] border border-[#2a3f5d] text-white focus:border-[#7fb5ff] outline-none transition"
                    onChange={(e) => handleChange('weekStartDate', e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 bg-[#7fb5ff] hover:bg-[#99c5ff] text-[#071a35] py-2.5 rounded-lg font-semibold transition disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 bg-[#19263a] hover:bg-[#223450] text-white py-2.5 rounded-lg font-semibold transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
