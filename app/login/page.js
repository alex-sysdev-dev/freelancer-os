'use client';

import Link from 'next/link';

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-white">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-semibold tracking-tight uppercase">
          Freelancer <span className="text-accent">Command Center</span>
        </h1>
        <p className="text-graphite-faint text-xs font-medium uppercase tracking-[0.3em] mt-2">Finance portal</p>
      </div>

      <div className="w-full max-w-3xl">
        <div className="glass-tile-dark p-8 flex flex-col justify-between border border-[#2f4b70]">
          <div>
            <span className="text-[10px] font-semibold bg-[#12322e] text-[#9ce6d9] px-3 py-1 rounded-full uppercase tracking-widest">Finance Stack</span>
            <h2 className="text-2xl font-semibold mt-4">Earnings + Savings + Investments</h2>
            <p className="text-graphite-muted text-sm mt-2">Track weekly earnings, transfer flows, and account balances in one command center.</p>
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
