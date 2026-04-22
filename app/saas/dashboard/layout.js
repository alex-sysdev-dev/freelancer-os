'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

export default function SaasDashboardLayout({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/saas/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen graphite-bg flex items-center justify-center">
        <div className="text-white/40 text-sm">Loading…</div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen graphite-bg text-white flex flex-col">
      {/* Top nav */}
      <header className="border-b border-white/10 px-6 py-3 flex items-center justify-between">
        <Link href="/saas/dashboard" className="flex items-center gap-2 font-bold text-lg">
          <span>🤖</span> BotBuilder
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-white/50">{session.user.name || session.user.email}</span>
          <button
            onClick={() => signOut({ callbackUrl: '/saas/login' })}
            className="text-xs text-white/40 hover:text-white/70 transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
