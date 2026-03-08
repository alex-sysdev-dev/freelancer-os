"use client";

import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import useFinanceData from '@/lib/hooks/useFinanceData';
import { usd } from '@/lib/finance/ui';

export default function ForecastPage() {
  const { isLoading, earningsAnalytics } = useFinanceData();

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="glass-tile p-5 border border-[#2f4b70]">
          <p className="text-[10px] uppercase tracking-widest text-graphite-faint">Latest week</p>
          <p className="text-2xl font-semibold mt-2">{isLoading ? '--' : usd(earningsAnalytics.lastWeek)}</p>
        </div>
        <div className="glass-tile p-5 border border-[#2f4b70]">
          <p className="text-[10px] uppercase tracking-widest text-graphite-faint">2 week forecast</p>
          <p className="text-2xl font-semibold mt-2">{isLoading ? '--' : usd(earningsAnalytics.twoWeekForecast)}</p>
        </div>
        <div className="glass-tile p-5 border border-[#2f4b70]">
          <p className="text-[10px] uppercase tracking-widest text-graphite-faint">1 month forecast</p>
          <p className="text-2xl font-semibold mt-2">{isLoading ? '--' : usd(earningsAnalytics.oneMonthForecast)}</p>
        </div>
        <div className="glass-tile p-5 border border-[#2f4b70]">
          <p className="text-[10px] uppercase tracking-widest text-graphite-faint">6 month forecast</p>
          <p className="text-2xl font-semibold mt-2">{isLoading ? '--' : usd(earningsAnalytics.sixMonthForecast)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="glass-tile-dark p-5 border border-[#2f4b70]">
          <p className="text-xs uppercase tracking-[0.2em] text-graphite-faint mb-4">Monthly earnings trend</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={earningsAnalytics.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(136,164,204,0.18)" />
                <XAxis dataKey="month" stroke="#9db2d5" tick={{ fill: '#9db2d5', fontSize: 11 }} />
                <YAxis stroke="#9db2d5" tick={{ fill: '#9db2d5', fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                <Tooltip contentStyle={{ background: '#0f1726', border: '1px solid #2f4b70', borderRadius: 12 }} formatter={(v) => usd(v)} />
                <Line type="monotone" dataKey="total" stroke="#7fb5ff" strokeWidth={3} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-tile-dark p-5 border border-[#2f4b70]">
          <p className="text-xs uppercase tracking-[0.2em] text-graphite-faint mb-4">Weekly baseline</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={earningsAnalytics.weeklyEarnings}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(136,164,204,0.18)" />
                <XAxis dataKey="week" stroke="#9db2d5" tick={{ fill: '#9db2d5', fontSize: 11 }} />
                <YAxis stroke="#9db2d5" tick={{ fill: '#9db2d5', fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                <Tooltip contentStyle={{ background: '#0f1726', border: '1px solid #2f4b70', borderRadius: 12 }} formatter={(v) => usd(v)} />
                <Bar dataKey="total" fill="#5ec7b7" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="glass-tile p-5 border border-[#2f4b70]">
        <p className="text-xs uppercase tracking-[0.2em] text-graphite-faint">Forecast notes</p>
        <ul className="mt-4 space-y-2 text-sm text-graphite-muted">
          <li>2-week forecast tracks the most recent weekly baseline x2 when table formula value is unavailable.</li>
          <li>1-month forecast uses recent weekly baseline x4.33 when formula value is unavailable.</li>
          <li>6-month forecast uses monthly forecast x6 when formula value is unavailable.</li>
        </ul>
      </div>
    </div>
  );
}
