"use client";

import { useState } from 'react';

const INITIAL_STATE = {
  platform: '',
  project: '',
  hoursWorked: '',
  date: new Date().toISOString().split('T')[0],
  status: 'Paid',
};

export default function AddEarningForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState(INITIAL_STATE);
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const payload = {
        platform: formData.platform,
        project: formData.project,
        hoursWorked: formData.hoursWorked,
        date: formData.date,
        status: formData.status,
      };

      const res = await fetch('/api/earnings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(`Error: ${err.error || 'Failed to save earning'}`);
        return;
      }

      alert('Earning logged successfully.');
      setIsOpen(false);
      setFormData(INITIAL_STATE);
      window.location.reload();
    } catch {
      alert('Critical error connecting to API.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-[#43bda8] hover:bg-[#59d4bc] text-[#041a1a] text-xs font-semibold py-2 px-4 rounded-lg transition-all duration-200 shadow-lg shadow-[#1d6f62]/40"
      >
        + ADD EARNING
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-tile-dark p-6 w-full max-w-md text-white border border-[#2f4b70]">
            <h2 className="text-xl font-semibold mb-4">Log Earnings Event</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-graphite-faint font-medium uppercase mb-1 block">Platform</label>
                <input
                  type="text"
                  placeholder="Mercor, Alignerr, Outlier"
                  required
                  value={formData.platform}
                  className="w-full p-2.5 rounded-lg bg-[#0f1825] border border-[#2a3f5d] text-white focus:border-[#59d4bc] outline-none transition"
                  onChange={(e) => handleChange('platform', e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs text-graphite-faint font-medium uppercase mb-1 block">Project</label>
                <input
                  type="text"
                  placeholder="Alpha"
                  required
                  value={formData.project}
                  className="w-full p-2.5 rounded-lg bg-[#0f1825] border border-[#2a3f5d] text-white focus:border-[#59d4bc] outline-none transition"
                  onChange={(e) => handleChange('project', e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs text-graphite-faint font-medium uppercase mb-1 block">Hours Worked</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="0.0"
                  required
                  value={formData.hoursWorked}
                  className="w-full p-2.5 rounded-lg bg-[#0f1825] border border-[#2a3f5d] text-white focus:border-[#59d4bc] outline-none transition"
                  onChange={(e) => handleChange('hoursWorked', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-graphite-faint font-medium uppercase mb-1 block">Date</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    className="w-full p-2.5 rounded-lg bg-[#0f1825] border border-[#2a3f5d] text-white focus:border-[#59d4bc] outline-none transition"
                    onChange={(e) => handleChange('date', e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-xs text-graphite-faint font-medium uppercase mb-1 block">Status</label>
                  <select
                    value={formData.status}
                    className="w-full p-2.5 rounded-lg bg-[#0f1825] border border-[#2a3f5d] text-white focus:border-[#59d4bc] outline-none transition"
                    onChange={(e) => handleChange('status', e.target.value)}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Paid">Paid</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 bg-[#43bda8] hover:bg-[#59d4bc] text-[#041a1a] py-2.5 rounded-lg font-semibold transition disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
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
