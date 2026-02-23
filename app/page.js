import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#000a16] text-white p-6">
      <div className="absolute inset-0 bg-blue-600/5" />

      <div className="relative z-10 text-center space-y-8">
        <div className="space-y-2">
          <h1 className="text-7xl font-black italic tracking-tighter uppercase leading-none">
            FREELANCER<span className="text-blue-500">OS</span>
          </h1>
          <p className="text-blue-100/40 text-[10px] font-bold uppercase tracking-[0.4em]">
            Solo-Operator Command Center
          </p>
        </div>

        <p className="max-w-md mx-auto text-blue-100/60 leading-relaxed font-medium">
          Manage applicants, Track project revenue, and Monitor your business growth in one centralized interface.
        </p>
        
        <div className="pt-4">
          <Link 
            href="/login" 
            className="group relative inline-flex items-center justify-center px-12 py-5 font-black text-white bg-blue-600 rounded-2xl transition-all duration-200 hover:bg-blue-500 hover:shadow-[0_0_40px_8px_rgba(37,99,235,0.3)] active:scale-95"
          >
            INITIALIZE SYSTEM
          </Link>
        </div>
      </div>

      <footer className="absolute bottom-10 text-[10px] text-blue-100/20 font-bold uppercase tracking-widest italic">
        Freelancer OS v1.0 // 2026
      </footer>
    </main>
  );
}