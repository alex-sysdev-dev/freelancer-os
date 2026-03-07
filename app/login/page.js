'use client';

import Link from 'next/link';

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-white">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-semibold tracking-tight uppercase">
          Freelancer <span className="text-accent">Command Center</span>
        </h1>
        <p className="text-graphite-faint text-xs font-medium uppercase tracking-[0.3em] mt-2">Operations portal</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl">
        <div className="glass-tile p-8 flex flex-col justify-between border border-[#2f4b70]">
          <div>
            <span className="text-[10px] font-semibold bg-[#17314f] text-[#9ec5ff] px-3 py-1 rounded-full uppercase tracking-widest">Client CRM</span>
            <h2 className="text-2xl font-semibold mt-4">Add or Update Clients</h2>
            <p className="text-graphite-muted text-sm mt-2">Track active clients, engagement status, and key contact details in Airtable.</p>
          </div>

          <Link
            href="/login/candidate"
            className="mt-8 text-center w-full bg-[#1b2f4a] text-white font-semibold py-3 rounded-xl hover:bg-[#274366] transition-all border border-[#365a84]"
          >
            Open Client Intake
          </Link>
        </div>

        <div className="glass-tile-dark p-8 flex flex-col justify-between border border-[#2f4b70]">
          <div>
            <span className="text-[10px] font-semibold bg-[#12322e] text-[#9ce6d9] px-3 py-1 rounded-full uppercase tracking-widest">Earnings Intelligence</span>
            <h2 className="text-2xl font-semibold mt-4">Forecast + Revenue Analytics</h2>
            <p className="text-graphite-muted text-sm mt-2">Monitor weekly cashflow, platform performance, and month-end forecast in one dashboard.</p>
          </div>

          <Link
            href="/dashboard"
            className="mt-8 text-center w-full bg-[#43bda8] text-[#041a1a] font-semibold py-3 rounded-xl hover:bg-[#59d4bc] transition-all"
          >
            Launch Dashboard
          </Link>
        </div>
      </div>

      <div className="mt-12">
        <Link href="/" className="text-[10px] text-graphite-faint hover:text-white transition-colors uppercase font-semibold tracking-widest">
          Back to Home
        </Link>
      </div>
    </main>
  );
}
