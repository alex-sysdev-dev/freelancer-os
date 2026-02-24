'use client';

import Link from 'next/link';

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#000a16] p-6">
      
      {/* Header Branding */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-black italic tracking-tighter text-white uppercase">
          Freelancer<span className="text-blue-500">OS</span>
        </h1>
        <p className="text-blue-100/30 text-xs font-bold uppercase tracking-[0.3em] mt-2">Access Portal</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 w-full max-w-5xl">
        
        {/* Card 1: Candidate Portal */}
        <div className="flex-1 p-8 bg-white/10 backdrop-blur-2xl rounded-[2.5rem] border border-white/20 shadow-2xl flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:scale-[1.01] hover:border-blue-500/40 hover:shadow-[0_20px_60px_-30px_rgba(59,130,246,0.55)] group relative overflow-hidden before:absolute before:inset-0 before:rounded-[2.5rem] before:bg-[linear-gradient(135deg,rgba(255,255,255,0.25),rgba(255,255,255,0.08)_35%,rgba(255,255,255,0)_65%)] before:opacity-90 before:pointer-events-none">
          <div>
            <div className="mb-6">
              <span className="text-[10px] font-black bg-blue-500 text-white px-3 py-1 rounded-full uppercase tracking-widest">Guest</span>
              <h2 className="text-2xl font-bold text-white mt-4">Candidate Portal</h2>
              <p className="text-blue-100/50 text-sm mt-2">Check your application status and update your profile.</p>
            </div>

            <div className="space-y-3">
              <button className="w-full flex items-center justify-center gap-3 bg-white/10 text-white font-bold py-3 rounded-xl hover:bg-white/20 transition-all border border-white/5">
                Google
              </button>
              <button className="w-full flex items-center justify-center gap-3 bg-white/10 text-white font-bold py-3 rounded-xl hover:bg-white/20 transition-all border border-white/5">
                LinkedIn
              </button>
            </div>
          </div>
          <p className="text-[10px] text-center text-blue-100/20 mt-6 uppercase font-bold">Registration Required</p>
        </div>

        {/* Card 2: Admin/Command Portal */}
        <div className="flex-1 p-8 bg-blue-600/20 backdrop-blur-2xl rounded-[2.5rem] border border-blue-400/30 shadow-2xl flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:scale-[1.01] hover:border-blue-400/60 hover:shadow-[0_20px_60px_-30px_rgba(59,130,246,0.6)] relative overflow-hidden before:absolute before:inset-0 before:rounded-[2.5rem] before:bg-[linear-gradient(135deg,rgba(255,255,255,0.22),rgba(255,255,255,0.06)_35%,rgba(255,255,255,0)_65%)] before:opacity-90 before:pointer-events-none">
          <div>
            <div className="mb-6">
              <span className="text-[10px] font-black bg-white text-blue-600 px-3 py-1 rounded-full uppercase tracking-widest">Internal</span>
              <h2 className="text-2xl font-bold text-white mt-4">Command Center</h2>
              <p className="text-blue-100/50 text-sm mt-2">Full access to revenue, Analytics, and Data management.</p>
            </div>

            <div className="space-y-3">
              <button className="w-full flex items-center justify-center gap-3 bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-200 transition-all shadow-lg shadow-blue-500/10">
                GitHub Admin
              </button>
              <button className="w-full flex items-center justify-center gap-3 bg-black text-white font-bold py-3 rounded-xl hover:bg-gray-900 transition-all border border-white/10">
                Apple ID
              </button>
            </div>
          </div>
          <p className="text-[10px] text-center text-blue-100/20 mt-6 uppercase font-bold">Authorized Personnel Only</p>
        </div>

      </div>

      {/* Footer Link */}
      <div className="mt-12">
        <Link href="/" className="text-[10px] text-blue-100/30 hover:text-white transition-colors uppercase font-black tracking-widest">
          ← Cancel Authorization
        </Link>
      </div>
    </main>
  );
}
