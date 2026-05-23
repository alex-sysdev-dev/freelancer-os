"use client";

import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import CashRunwaySettingsForm from '@/components/CashRunwaySettingsForm';
import ErrorBanner from '@/components/ErrorBanner';
import useFinanceData from '@/lib/hooks/useFinanceData';
import { usd } from '@/lib/finance/ui';

function monthsLabel(value) {
  if (value === null || value === undefined) return '--';
  return `${value.toFixed(1)} mo`;
}

export default function ForecastPage() {
  const { error, isLoading, settings, runwayAnalytics, loadFinanceData, earningsAnalytics } = useFinanceData();

  return (
    <div className="space-y-8">
      <ErrorBanner message={error} />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="glass-tile p-5 border border-[#2f4b70]">
          <p className="text-[10px] uppercase tracking-widest text-graphite-faint">Tax reserve needed</p>
          <p className="text-2xl font-semibold mt-2">{isLoading ? '--' : usd(runwayAnalytics.taxReserveNeeded)}</p>
        </div>
        <div className="glass-tile p-5 border border-[#2f4b70]">
          <p className="text-[10px] uppercase tracking-widest text-graphite-faint">Safe-to-spend cash</p>
          <p className="text-2xl font-semibold mt-2">{isLoading ? '--' : usd(runwayAnalytics.safeToSpend)}</p>
        </div>
        <div className="glass-tile p-5 border border-[#2f4b70]">
          <p className="text-[10px] uppercase tracking-widest text-graphite-faint">Runway months</p>
          <p className="text-2xl font-semibold mt-2">{isLoading ? '--' : monthsLabel(runwayAnalytics.runwayMonths)}</p>
        </div>
        <div className={`glass-tile p-5 border ${runwayAnalytics.isBelowBuffer ? 'border-red-500/70' : 'border-[#2f4b70]'}`}>
          <p className="text-[10px] uppercase tracking-widest text-graphite-faint">Buffer gap</p>
          <p className={`text-2xl font-semibold mt-2 ${runwayAnalytics.isBelowBuffer ? 'text-red-300' : 'text-accent'}`}>
            {isLoading ? '--' : usd(runwayAnalytics.bufferGap)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6">
        <div className="glass-tile-dark p-5 border border-[#2f4b70]">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-graphite-faint">Cash runway</p>
              <p className="mt-3 text-4xl font-semibold text-white">{isLoading ? '--' : monthsLabel(runwayAnalytics.runwayMonths)}</p>
            </div>
            <div className="grid grid-cols-1 gap-3 text-sm text-graphite-muted sm:grid-cols-3 md:min-w-[430px]">
              <div className="rounded-md border border-[#2f4b70] bg-[#07111e] p-3">
                <p className="text-[10px] uppercase tracking-widest text-graphite-faint">Expense target</p>
                <p className="mt-2 font-semibold text-white">{usd(runwayAnalytics.monthlyExpenseTarget)}</p>
              </div>
              <div className="rounded-md border border-[#2f4b70] bg-[#07111e] p-3">
                <p className="text-[10px] uppercase tracking-widest text-graphite-faint">Reserve rate</p>
                <p className="mt-2 font-semibold text-white">{Math.round(runwayAnalytics.taxReserveRate * 100)}%</p>
              </div>
              <div className="rounded-md border border-[#2f4b70] bg-[#07111e] p-3">
                <p className="text-[10px] uppercase tracking-widest text-graphite-faint">Cash buffer</p>
                <p className="mt-2 font-semibold text-white">{usd(runwayAnalytics.minimumCashBuffer)}</p>
              </div>
            </div>
          </div>
        </div>

        <CashRunwaySettingsForm settings={settings} onSaved={loadFinanceData} />
      </div>

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

    </div>
  );
}
