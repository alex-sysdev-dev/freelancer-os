import Image from 'next/image';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-6 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(94,199,183,0.14),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(127,181,255,0.2),transparent_38%)]" />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center"
      >
        <div className="relative">
          <Image
            src="/logos/logo-full.svg"
            alt=""
            width={860}
            height={860}
            priority
            className="h-auto w-[72vw] min-w-[340px] max-w-[900px] select-none opacity-[0.15] mix-blend-screen [filter:contrast(1.14)_brightness(1.08)_drop-shadow(0_0_40px_rgba(94,199,183,0.24))]"
          />
          <Image
            src="/logos/logo-full.svg"
            alt=""
            width={860}
            height={860}
            className="absolute inset-0 h-auto w-[72vw] min-w-[340px] max-w-[900px] select-none opacity-[0.18] mix-blend-lighten [filter:brightness(1.32)_contrast(1.28)_saturate(1.2)_drop-shadow(0_0_22px_rgba(105,224,198,0.44))]"
          />
        </div>
      </div>

      <div className="relative z-10 max-w-2xl space-y-8 text-center">
        <div className="space-y-3">
          <h1 className="text-5xl md:text-7xl font-semibold tracking-tight uppercase leading-none">
            Freelancer <span className="text-accent">Finance OS</span>
          </h1>
          <p className="text-graphite-faint text-[10px] font-medium uppercase tracking-[0.4em]">
            Earnings + Savings + Investments
          </p>
        </div>

        <p className="mx-auto max-w-xl text-graphite-muted leading-relaxed font-normal">
          Track platform earnings, route money into accounts, and monitor long-horizon forecasts.
        </p>

        <div className="pt-4">
          <Link
            href="/login"
            className="hero-tile-cta inline-flex items-center justify-center rounded-2xl bg-[#5ec7b7] px-10 py-4 font-semibold text-[#041a1a] hover:bg-[#7be0cc]"
          >
            Start Tracking your Earnings
          </Link>
        </div>
      </div>

      <footer className="absolute bottom-10 text-[10px] text-graphite-faint font-medium uppercase tracking-widest">
        Freelancer OS v2.0 // 2026
      </footer>
    </main>
  );
}
