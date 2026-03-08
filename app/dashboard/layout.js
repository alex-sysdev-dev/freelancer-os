import FinanceAccessGate from '@/components/FinanceAccessGate';
import DashboardNav from '@/components/DashboardNav';
import Image from 'next/image';

export default function DashboardLayout({ children }) {
  const asOfLabel = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <FinanceAccessGate>
      <div className="min-h-screen p-6 md:p-8 text-white">
        <div className="max-w-7xl mx-auto space-y-6">
          <header className="space-y-3">
            <div className="flex items-center gap-3">
              <Image
                src="/logos/logo-full.svg"
                alt="Finance Command Center logo"
                width={44}
                height={44}
                className="h-11 w-11 rounded-full border border-[#2c8d88]/55 bg-[#071822]/70 p-1.5 shadow-[0_0_22px_rgba(94,199,183,0.22)]"
                priority
              />
              <h1 className="text-3xl font-semibold uppercase tracking-tight">
                Finance <span className="text-accent">Command Center</span>
              </h1>
            </div>
            <p className="text-graphite-faint text-[11px] uppercase tracking-[0.25em]">
              Earnings, savings, and investment tracking // as of {asOfLabel}
            </p>
          </header>

          <DashboardNav />

          {children}
        </div>
      </div>
    </FinanceAccessGate>
  );
}
