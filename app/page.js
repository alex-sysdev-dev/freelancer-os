import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center text-[#2f2a25] p-6">
      <div className="absolute inset-0 bg-white/20" />

      <div className="relative z-10 text-center space-y-8">
        <div className="space-y-2">
          <h1 className="text-6xl md:text-7xl font-semibold tracking-tight uppercase leading-none text-[#2f2a25]">
            FREELANCER<span className="text-accent">OS</span>
          </h1>
          <p className="text-graphite-faint text-[10px] font-medium uppercase tracking-[0.4em]">
            Freelance CRM
          </p>
        </div>

        <p className="max-w-md mx-auto text-graphite-muted leading-relaxed font-normal">
          Manage Projects, Track project revenue, and Monitor Earings.
        </p>
        
        <div className="pt-4">
          <Link 
            href="/login" 
            className="group relative inline-flex items-center justify-center px-12 py-5 font-semibold text-white bg-[#8b6d4b] rounded-2xl transition-all duration-200 hover:bg-[#9a7a55] hover:shadow-[0_0_40px_8px_rgba(139,109,75,0.35)] active:scale-95"
          >
            Welcome
          </Link>
        </div>
      </div>

      <footer className="absolute bottom-10 text-[10px] text-graphite-faint font-medium uppercase tracking-widest">
        Freelancer OS v1.0 // 2026
      </footer>
    </main>
  );
}
