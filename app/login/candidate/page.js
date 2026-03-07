'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ClientIntakeForm() {
  const [status, setStatus] = useState('idle');

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('sending');

    const formData = new FormData(e.target);

    try {
      const res = await fetch('/api/submit-candidate', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        setStatus('error');
        return;
      }

      setStatus('success');
      e.target.reset();
    } catch {
      setStatus('error');
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4 text-white">
      <div className="w-full max-w-xl p-6 md:p-8 glass-tile-dark border border-[#2f4b70]">
        <div className="mb-8 text-center">
          <h2 className="text-3xl md:text-4xl font-semibold uppercase tracking-tight">
            Client <span className="text-accent">Intake</span>
          </h2>
          <p className="text-graphite-faint text-[10px] font-medium uppercase tracking-[0.35em] mt-2">Freelancer relationship tracker</p>
        </div>

        {status === 'success' ? (
          <div className="py-12 text-center">
            <h3 className="text-2xl font-semibold uppercase">Client Saved</h3>
            <p className="text-graphite-muted mt-2">Airtable has been updated with your new client record.</p>
            <button
              onClick={() => setStatus('idle')}
              className="mt-8 text-accent font-semibold uppercase text-[10px] tracking-widest hover:text-white transition-colors"
            >
              Add Another
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-5">
            <div className="col-span-2 md:col-span-1">
              <label className="block text-[10px] font-semibold text-accent uppercase tracking-widest mb-2">Client Name</label>
              <input
                name="name"
                required
                placeholder="Alex Aguilar"
                className="w-full bg-[#0f1825] border border-[#2a3f5d] p-3 rounded-xl text-white outline-none focus:border-[#5ec7b7]"
              />
            </div>

            <div className="col-span-2 md:col-span-1">
              <label className="block text-[10px] font-semibold text-accent uppercase tracking-widest mb-2">Email</label>
              <input
                name="email"
                type="email"
                required
                placeholder="client@email.com"
                className="w-full bg-[#0f1825] border border-[#2a3f5d] p-3 rounded-xl text-white outline-none focus:border-[#5ec7b7]"
              />
            </div>

            <div className="col-span-2 md:col-span-1">
              <label className="block text-[10px] font-semibold text-accent uppercase tracking-widest mb-2">Role / Service</label>
              <input
                name="role"
                required
                placeholder="Full Stack Development"
                className="w-full bg-[#0f1825] border border-[#2a3f5d] p-3 rounded-xl text-white outline-none focus:border-[#5ec7b7]"
              />
            </div>

            <div className="col-span-2 md:col-span-1">
              <label className="block text-[10px] font-semibold text-accent uppercase tracking-widest mb-2">Experience</label>
              <input
                name="experience"
                required
                placeholder="10"
                className="w-full bg-[#0f1825] border border-[#2a3f5d] p-3 rounded-xl text-white outline-none focus:border-[#5ec7b7]"
              />
            </div>

            <div className="col-span-2 md:col-span-1">
              <label className="block text-[10px] font-semibold text-accent uppercase tracking-widest mb-2">Status</label>
              <select
                name="status"
                defaultValue="New"
                className="w-full bg-[#0f1825] border border-[#2a3f5d] p-3 rounded-xl text-white outline-none focus:border-[#5ec7b7]"
              >
                <option>New</option>
                <option>Active</option>
                <option>Paused</option>
                <option>Closed</option>
              </select>
            </div>

            <div className="col-span-2 md:col-span-1">
              <label className="block text-[10px] font-semibold text-accent uppercase tracking-widest mb-2">Attach Brief / Contract (optional)</label>
              <input
                name="resume"
                type="file"
                accept=".pdf,.doc,.docx"
                className="block w-full text-xs text-graphite-faint file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-semibold file:bg-[#1b2f4a] file:text-white hover:file:bg-[#274366]"
              />
            </div>

            <div className="col-span-2 mt-3">
              <button
                disabled={status === 'sending'}
                type="submit"
                className="w-full bg-[#43bda8] hover:bg-[#59d4bc] text-[#041a1a] font-semibold py-3 rounded-xl transition-all disabled:opacity-50"
              >
                {status === 'sending' ? 'Saving...' : 'Save Client'}
              </button>

              {status === 'error' && (
                <p className="text-red-300 text-center font-semibold mt-3 text-[11px] uppercase tracking-widest">Connection error. Please retry.</p>
              )}
            </div>
          </form>
        )}

        <div className="mt-8 text-center border-t border-[#2a3f5d] pt-6">
          <Link href="/login" className="text-[10px] text-graphite-faint hover:text-white transition-colors uppercase font-semibold tracking-[0.3em]">
            Return to Portal
          </Link>
        </div>
      </div>
    </main>
  );
}
