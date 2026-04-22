'use client';

import { useState } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function onChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await signIn('credentials', {
      email: form.email,
      password: form.password,
      redirect: false,
    });

    if (result?.error) {
      setError('Invalid email or password.');
      setLoading(false);
    } else {
      router.push('/saas/dashboard');
    }
  }

  return (
    <div className="min-h-screen graphite-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/saas" className="text-2xl font-bold text-white inline-flex items-center gap-2">
            <span>🤖</span> BotBuilder
          </Link>
          <p className="text-white/50 mt-2 text-sm">Sign in to your account</p>
        </div>

        <div className="glass-tile rounded-2xl p-8">
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-white/60 mb-1.5">Email</label>
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                value={form.email}
                onChange={onChange}
                placeholder="jane@example.com"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#5ec7b7]/60"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/60 mb-1.5">Password</label>
              <input
                name="password"
                type="password"
                required
                autoComplete="current-password"
                value={form.password}
                onChange={onChange}
                placeholder="Your password"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#5ec7b7]/60"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-2.5">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#5ec7b7] hover:bg-[#4db5a5] disabled:opacity-50 text-black font-semibold py-2.5 rounded-lg transition-colors text-sm"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-xs text-white/40 mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/saas/signup" className="text-[#5ec7b7] hover:underline">
              Sign up free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
