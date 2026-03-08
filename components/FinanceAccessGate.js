"use client";

import { useEffect, useState } from 'react';

const ADMIN_SESSION_KEY = 'finance_admin_unlocked';
const PREVIEW_SESSION_KEY = 'finance_preview_unlocked';

export default function FinanceAccessGate({ children }) {
  const [accessMode, setAccessMode] = useState('locked');
  const [password, setPassword] = useState('');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const adminUnlocked = window.sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true';
    const previewUnlocked = window.sessionStorage.getItem(PREVIEW_SESSION_KEY) === 'true';
    const params = new URLSearchParams(window.location.search);
    const previewRequested = params.get('preview') === '1';

    if (adminUnlocked) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAccessMode('admin');
      setIsReady(true);
      return;
    }

    if (previewUnlocked || previewRequested) {
      if (previewRequested) {
        window.sessionStorage.setItem(PREVIEW_SESSION_KEY, 'true');
        params.delete('preview');
        const nextQuery = params.toString();
        window.history.replaceState({}, '', `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ''}`);
      }
      setAccessMode('preview');
      setIsReady(true);
      return;
    }

    setAccessMode('locked');
    setIsReady(true);
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();

    if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
        window.sessionStorage.removeItem(PREVIEW_SESSION_KEY);
      }
      setAccessMode('admin');
      return;
    }

    alert('Access denied');
  };

  const handlePreviewEnter = () => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(PREVIEW_SESSION_KEY, 'true');
    }
    setAccessMode('preview');
  };

  if (!isReady) {
    return <div className="min-h-screen" />;
  }

  if (accessMode === 'locked') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-tile-dark w-full max-w-md p-8 border border-[#34517a] space-y-4">
          <form onSubmit={handleLogin}>
            <h1 className="text-2xl font-semibold mb-6 uppercase tracking-tight">Freelancer Command Center</h1>
            <p className="text-graphite-faint text-xs mb-4 uppercase tracking-[0.2em]">Admin access</p>
            <input
              type="password"
              placeholder="Admin Password"
              className="w-full p-3 rounded-xl bg-[#0f1825] border border-[#2a3f5d] mb-4 outline-none focus:border-[#5ec7b7]"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button className="w-full bg-[#5ec7b7] hover:bg-[#7be0cc] text-[#041a1a] py-3 rounded-xl font-semibold transition-all">
              Unlock
            </button>
          </form>

          <button
            type="button"
            onClick={handlePreviewEnter}
            className="w-full bg-[#101a28] border border-[#2a3f5d] hover:border-[#7fb5ff] hover:text-white text-graphite-faint py-3 rounded-xl text-sm font-semibold uppercase tracking-widest transition-all"
          >
            Enter
          </button>
        </div>
      </div>
    );
  }

  if (accessMode === 'preview') {
    return (
      <>
        <div className="fixed top-3 right-3 z-[60] rounded-lg border border-[#2a3f5d] bg-[#0b1422]/90 px-3 py-1.5 text-[10px] uppercase tracking-widest text-graphite-faint">
          Preview Mode
        </div>
        {children}
      </>
    );
  }

  return children;
}
