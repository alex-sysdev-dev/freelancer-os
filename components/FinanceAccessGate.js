"use client";

import { useEffect, useState } from 'react';

const SESSION_KEY = 'finance_admin_unlocked';

export default function FinanceAccessGate({ children }) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [password, setPassword] = useState('');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const unlocked = typeof window !== 'undefined' && window.sessionStorage.getItem(SESSION_KEY) === 'true';
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsUnlocked(unlocked);
    setIsReady(true);
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();

    if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(SESSION_KEY, 'true');
      }
      setIsUnlocked(true);
      return;
    }

    alert('Access denied');
  };

  if (!isReady) {
    return <div className="min-h-screen" />;
  }

  if (!isUnlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="glass-tile-dark w-full max-w-md p-8 border border-[#34517a]">
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
      </div>
    );
  }

  return children;
}
