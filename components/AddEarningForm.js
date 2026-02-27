"use client";
import { useState } from 'react';

export default function AddEarningForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({ 
    source: '', 
    amount: '', 
    date: new Date().toISOString().split('T')[0] 
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const res = await fetch(`${window.location.origin}/api/earnings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        alert("✅ Earning Logged to Airtable!");
        setIsOpen(false);
        setFormData({ source: '', amount: '', date: new Date().toISOString().split('T')[0] });
        window.location.reload(); 
      } else {
        const err = await res.json();
        alert("❌ Error: " + (err.error || "Failed to save"));
      }
    } catch (error) {
      alert("❌ Critical Error connecting to API");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)} 
        className="bg-green-600 hover:bg-green-500 text-white text-xs font-semibold py-2 px-4 rounded-lg transition-all duration-200 shadow-lg shadow-green-900/20 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_-12px_rgba(34,197,94,0.7)] active:translate-y-0"
      >
        + ADD EARNING
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-tile-dark p-6 w-full max-w-sm text-[#2f2a25]">
            <h2 className="text-xl font-semibold mb-4 text-[#2f2a25]">Log Revenue</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-graphite-faint font-medium uppercase mb-1 block">Source</label>
                <input 
                  type="text" placeholder="e.g. Outlier, DataAnnotation" required
                  className="w-full p-2.5 rounded-lg bg-[#f7f2ea] border border-[#e6d8c6] text-[#2f2a25] focus:border-[#9a7a55] outline-none transition"
                  onChange={(e) => setFormData({...formData, source: e.target.value})}
                />
              </div>

              <div>
                <label className="text-xs text-graphite-faint font-medium uppercase mb-1 block">Amount ($)</label>
                <input 
                  type="number" step="0.01" placeholder="0.00" required
                  className="w-full p-2.5 rounded-lg bg-[#f7f2ea] border border-[#e6d8c6] text-[#2f2a25] focus:border-[#9a7a55] outline-none transition"
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                />
              </div>

              <div>
                <label className="text-xs text-graphite-faint font-medium uppercase mb-1 block">Date</label>
                <input 
                  type="date" required value={formData.date}
                  className="w-full p-2.5 rounded-lg bg-[#f7f2ea] border border-[#e6d8c6] text-[#2f2a25] focus:border-[#9a7a55] outline-none transition"
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="flex-1 bg-green-600 hover:bg-green-500 text-white py-2.5 rounded-lg font-semibold transition disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save Earning"}
                </button>
                <button 
                  type="button" 
                  onClick={() => setIsOpen(false)} 
                  className="flex-1 bg-[#f1e9dc] hover:bg-[#e9dece] text-[#2f2a25] py-2.5 rounded-lg font-semibold transition"
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
