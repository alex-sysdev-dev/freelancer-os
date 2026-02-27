'use client';

import Link from 'next/link';

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-[#2f2a25]">
      
      {/* Header Branding */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-semibold tracking-tight text-[#2f2a25] uppercase">
          Freelancer<span className="text-accent">OS</span>
        </h1>
        <p className="text-graphite-faint text-xs font-medium uppercase tracking-[0.3em] mt-2">Access Portal</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 w-full max-w-5xl">
        
        {/* Card 1: Candidate Portal */}
        <div className="flex-1 p-8 glass-tile flex flex-col justify-between relative overflow-hidden">
          <div>
            <div className="mb-6">
              <span className="text-[10px] font-semibold bg-[#8b6d4b] text-white px-3 py-1 rounded-full uppercase tracking-widest">Guest</span>
              <h2 className="text-2xl font-semibold text-[#2f2a25] mt-4">Candidate Portal</h2>
              <p className="text-graphite-muted text-sm mt-2">Check your application status and update your profile.</p>
            </div>

            <div className="space-y-3">
              <button className="w-full flex items-center justify-center gap-3 bg-[#f7f2ea] text-[#2f2a25] font-medium py-3 rounded-xl hover:bg-[#efe7db] transition-all border border-[#e6d8c6]">
                Google
              </button>
              <button className="w-full flex items-center justify-center gap-3 bg-[#f7f2ea] text-[#2f2a25] font-medium py-3 rounded-xl hover:bg-[#efe7db] transition-all border border-[#e6d8c6]">
                LinkedIn
              </button>
            </div>
          </div>
          <p className="text-[10px] text-center text-graphite-faint mt-6 uppercase font-medium">Registration Required</p>
        </div>

        {/* Card 2: Admin/Command Portal */}
        <div className="flex-1 p-8 glass-tile-dark flex flex-col justify-between relative overflow-hidden">
          <div>
            <div className="mb-6">
              <span className="text-[10px] font-semibold bg-[#2f2a25] text-white px-3 py-1 rounded-full uppercase tracking-widest">Internal</span>
              <h2 className="text-2xl font-semibold text-[#2f2a25] mt-4">Command Center</h2>
              <p className="text-graphite-muted text-sm mt-2">Full access to revenue, Analytics, and Data management.</p>
            </div>

            <div className="space-y-3">
              <button className="w-full flex items-center justify-center gap-3 bg-[#2f2a25] text-white font-semibold py-3 rounded-xl hover:bg-[#3a332c] transition-all shadow-lg shadow-black/10">
                GitHub Admin
              </button>
              <button className="w-full flex items-center justify-center gap-3 bg-[#f1e9dc] text-[#2f2a25] font-semibold py-3 rounded-xl hover:bg-[#e9dece] transition-all border border-[#e3d6c4]">
                Apple ID
              </button>
            </div>
          </div>
          <p className="text-[10px] text-center text-graphite-faint mt-6 uppercase font-medium">Authorized Personnel Only</p>
        </div>

      </div>

      {/* Footer Link */}
      <div className="mt-12">
        <Link href="/" className="text-[10px] text-graphite-faint hover:text-[#2f2a25] transition-colors uppercase font-semibold tracking-widest">
          ← Cancel Authorization
        </Link>
      </div>
    </main>
  );
}
