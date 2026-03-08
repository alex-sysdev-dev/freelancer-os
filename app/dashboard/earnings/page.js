"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import AddEarningForm from '@/components/AddEarningForm';
import LinkedTile from '@/components/LinkedTile';
import useFinanceData from '@/lib/hooks/useFinanceData';
import { CHART_COLORS, usd } from '@/lib/finance/ui';

export default function EarningsPage() {
  const { isLoading, loadFinanceData, earningsAnalytics } = useFinanceData();

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <AddEarningForm onSaved={loadFinanceData} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <LinkedTile href="/dashboard/forecast" className="glass-tile p-5 border border-[#2f4b70]">
          <p className="text-[10px] uppercase tracking-widest text-graphite-faint">Total earnings</p>
          <p className="text-2xl font-semibold mt-2">{isLoading ? '--' : usd(earningsAnalytics.totalEarnings)}</p>
        </LinkedTile>
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
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 glass-tile-dark p-5 border border-[#2f4b70]">
          <p className="text-xs uppercase tracking-[0.2em] text-graphite-faint mb-4">Earnings by week</p>
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

        <div className="glass-tile-dark p-5 border border-[#2f4b70]">
          <p className="text-xs uppercase tracking-[0.2em] text-graphite-faint mb-4">Revenue by platform</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={earningsAnalytics.platformTotals} dataKey="amount" nameKey="platform" cx="50%" cy="50%" outerRadius={95} innerRadius={55} label={({ platform }) => platform}>
                  {earningsAnalytics.platformTotals.map((entry, index) => (
                    <Cell key={entry.platform} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#0f1726', border: '1px solid #2f4b70', borderRadius: 12 }} formatter={(v) => usd(v)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="glass-tile p-5 border border-[#2f4b70]">
          <p className="text-xs uppercase tracking-[0.2em] text-graphite-faint mb-4">Monthly trend</p>
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

        <div className="glass-tile p-5 border border-[#2f4b70]">
          <p className="text-xs uppercase tracking-[0.2em] text-graphite-faint mb-4">Recent earnings entries</p>
          <div className="space-y-3 max-h-[360px] overflow-auto pr-1">
            {earningsAnalytics.recentEarnings.length === 0 && <p className="text-sm text-graphite-faint">No earnings logged yet.</p>}
            {earningsAnalytics.recentEarnings.map((entry) => (
              <div key={entry.id} className="rounded-xl border border-[#2a3f5d] bg-[#0d1522] p-3 flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{entry.platform}</p>
                  <p className="text-xs text-graphite-faint">{entry.project} - {new Date(entry.date).toLocaleDateString('en-US')}</p>
                </div>
                <p className="font-semibold text-accent">{usd(entry.amount)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
