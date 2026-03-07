import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center text-white p-6 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(94,199,183,0.14),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(127,181,255,0.2),transparent_38%)]" />

      <div className="relative z-10 text-center space-y-8 max-w-2xl">
        <div className="space-y-3">
          <h1 className="text-5xl md:text-7xl font-semibold tracking-tight uppercase leading-none">
            Freelancer <span className="text-accent">Command Center</span>
          </h1>
          <p className="text-graphite-faint text-[10px] font-medium uppercase tracking-[0.4em]">
            Client CRM + Earnings Intelligence
          </p>
        </div>

        <p className="mx-auto text-graphite-muted leading-relaxed font-normal max-w-xl">
          Centralize client tracking, monitor platform cashflow, and run forecast modeling in a single dark-mode workspace.
        </p>

        <div className="pt-4">
          <Link
            href="/login"
            className="inline-flex items-center justify-center px-10 py-4 font-semibold text-[#041a1a] bg-[#5ec7b7] rounded-2xl transition-all duration-200 hover:bg-[#7be0cc] hover:shadow-[0_0_40px_8px_rgba(94,199,183,0.35)]"
          >
            Enter Workspace
          </Link>
        </div>
      </div>

      <footer className="absolute bottom-10 text-[10px] text-graphite-faint font-medium uppercase tracking-widest">
        Freelancer OS v2.0 // 2026
      </footer>
    </main>
  );
}
