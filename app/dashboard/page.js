"use client";
import { useState, useEffect } from 'react';
import AddEarningForm from '@/components/AddEarningForm';

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [earnings, setEarnings] = useState([]);
  const [earningsLoading, setEarningsLoading] = useState(true);

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      setIsAuthenticated(true);
    } else {
      alert("Access Denied");
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetch('/api/get-candidates')
        .then(res => res.json())
        .then(data => {
          setCandidates(Array.isArray(data) ? data : []);
          setLoading(false);
        })
        .catch(() => setLoading(false));

      fetch('/api/earnings')
        .then(res => res.json())
        .then(data => {
          setEarnings(Array.isArray(data) ? data : []);
          setEarningsLoading(false);
        })
        .catch(() => setEarningsLoading(false));
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#000a16] flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="bg-white/5 backdrop-blur-2xl p-8 rounded-3xl border border-white/10 w-full max-w-md shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/30 hover:shadow-[0_24px_70px_-30px_rgba(59,130,246,0.55)] relative overflow-hidden before:absolute before:inset-0 before:rounded-3xl before:bg-[linear-gradient(135deg,rgba(255,255,255,0.22),rgba(255,255,255,0.06)_40%,rgba(255,255,255,0)_70%)] before:opacity-90 before:pointer-events-none">
          <h1 className="text-2xl font-bold text-white mb-6 uppercase tracking-tight">Freelancer OS Login</h1>
          <input 
            type="password" 
            placeholder="Admin Password"
            className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white mb-4 outline-none focus:border-blue-500 focus:bg-white/10 transition-all"
            onChange={(e) => setPassword(e.target.value)}
          />
          <button className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold transition-all shadow-xl shadow-blue-600/20">Unlock</button>
        </form>
      </div>
    );
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthLabel = now.toLocaleDateString('en-US', { month: 'short' });
  const asOfLabel = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const dailyTotals = Array.from({ length: daysInMonth }, () => 0);
  earnings.forEach((entry) => {
    if (!entry?.date) return;
    const parsed = new Date(entry.date);
    if (Number.isNaN(parsed.getTime())) return;
    if (parsed.getFullYear() !== year || parsed.getMonth() !== month) return;

    const amount = typeof entry.amount === 'number' ? entry.amount : parseFloat(entry.amount);
    if (!Number.isFinite(amount)) return;
    dailyTotals[parsed.getDate() - 1] += amount;
  });

  const cumulative = [];
  let running = 0;
  for (let i = 0; i < dayOfMonth; i += 1) {
    running += dailyTotals[i];
    cumulative.push(running);
  }

  const avgDaily = dayOfMonth > 0 ? running / dayOfMonth : 0;
  const forecastSeries = [];
  for (let i = 0; i < daysInMonth; i += 1) {
    if (i < dayOfMonth) {
      forecastSeries.push(cumulative[i] ?? running);
    } else {
      forecastSeries.push(running + avgDaily * (i + 1 - dayOfMonth));
    }
  }

  const earnedToDate = cumulative[cumulative.length - 1] || 0;
  const forecastTotal = forecastSeries[forecastSeries.length - 1] || 0;
  const hasEarnings = earnedToDate > 0;

  const formatUsd = (value) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);

  const chartHeight = 60;
  const chartWidth = 100;
  const denominator = Math.max(daysInMonth - 1, 1);
  const maxValue = Math.max(...forecastSeries, 1);

  const toPoints = (series) =>
    series.map((value, index) => ({
      x: (index / denominator) * chartWidth,
      y: chartHeight - (value / maxValue) * chartHeight,
    }));

  const buildLine = (points) => {
    if (!points.length) return "";
    return `M ${points[0].x} ${points[0].y} ` + points.slice(1).map((p) => `L ${p.x} ${p.y}`).join(" ");
  };

  const actualPoints = toPoints(cumulative);
  const forecastPoints = toPoints(forecastSeries);
  const actualLine = buildLine(actualPoints);
  const forecastLine = buildLine(forecastPoints);
  const actualArea =
    actualPoints.length > 0
      ? `${actualLine} L ${actualPoints[actualPoints.length - 1].x} ${chartHeight} L 0 ${chartHeight} Z`
      : "";

  return (
    <div className="min-h-screen bg-[#000a16] text-white p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* THE HEADER AREA */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-3xl font-black text-white uppercase tracking-tighter italic">Command <span className="text-blue-500">Center</span></h1>
            <p className="text-blue-100/40 text-[10px] font-black uppercase tracking-[0.4em] mt-2">Operations Overview</p>
          </div>
          
          <div className="flex items-center gap-4">
            <AddEarningForm /> 
            <div className="bg-white/5 px-4 py-2 rounded-full border border-white/10 text-xs font-mono text-blue-100/40">
              {candidates.length} APPLICANTS DETECTED
            </div>
          </div>
        </div>

        <div className="mb-10 bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-2xl relative overflow-hidden shadow-2xl before:absolute before:inset-0 before:rounded-3xl before:bg-[linear-gradient(135deg,rgba(255,255,255,0.2),rgba(255,255,255,0.06)_40%,rgba(255,255,255,0)_70%)] before:opacity-90 before:pointer-events-none">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-[10px] text-blue-100/40 uppercase font-bold tracking-widest">Revenue Overview</div>
              <div className="text-lg font-bold">Earnings to date and forecast</div>
            </div>
            <div className="text-xs text-blue-100/40">As of {asOfLabel}</div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-end">
            <div className="lg:col-span-2">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-28">
                  <defs>
                    <linearGradient id="actualFill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="rgba(59,130,246,0.45)" />
                      <stop offset="100%" stopColor="rgba(59,130,246,0)" />
                    </linearGradient>
                  </defs>
                  <path d={actualArea} fill="url(#actualFill)" />
                  <path d={actualLine} fill="none" stroke="rgba(59,130,246,0.9)" strokeWidth="2" />
                  <path d={forecastLine} fill="none" stroke="rgba(148,163,184,0.7)" strokeWidth="2" strokeDasharray="4 4" />
                </svg>
                <div className="flex items-center justify-between text-[10px] text-blue-100/40 mt-2 uppercase font-bold tracking-widest">
                  <span>{monthLabel} 1</span>
                  <span>{monthLabel} {daysInMonth}</span>
                </div>
                {!earningsLoading && !hasEarnings && (
                  <div className="text-xs text-blue-100/40 mt-3">No earnings logged for this month yet.</div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <div className="text-[10px] text-blue-100/40 uppercase font-bold tracking-widest">Earnings to date</div>
                <div className="text-2xl font-bold mt-1">
                  {earningsLoading ? "--" : formatUsd(earnedToDate)}
                </div>
                <div className="text-[10px] text-blue-100/40 uppercase font-bold tracking-widest mt-1">
                  Month to date
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <div className="text-[10px] text-blue-100/40 uppercase font-bold tracking-widest">Potential (forecast)</div>
                <div className="text-2xl font-bold text-blue-400 mt-1">
                  {earningsLoading ? "--" : formatUsd(forecastTotal)}
                </div>
                <div className="text-[10px] text-blue-100/40 uppercase font-bold tracking-widest mt-1">
                  Projected end of {monthLabel}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* THE CARDS AREA */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {candidates.map((person) => (
            <div key={person.id} className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-2xl transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/40 hover:shadow-[0_20px_60px_-30px_rgba(59,130,246,0.55)] relative overflow-hidden before:absolute before:inset-0 before:rounded-2xl before:bg-[linear-gradient(135deg,rgba(255,255,255,0.22),rgba(255,255,255,0.06)_40%,rgba(255,255,255,0)_70%)] before:opacity-90 before:pointer-events-none">
              <h2 className="text-xl font-bold">{person.name}</h2>
              <p className="text-blue-100/50 text-sm mb-4">{person.email}</p>
              <div className="text-[10px] text-blue-100/40 uppercase font-bold mb-1 tracking-widest">Experience</div>
              <p className="text-sm text-blue-100/70 mb-6">{person.experience}</p>
              <a href={person.resumeUrl} target="_blank" className="block text-center bg-white/10 hover:bg-white/20 border border-white/10 py-2 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all">View Application</a>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
