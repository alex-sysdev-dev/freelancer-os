"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import AddEarningForm from '@/components/AddEarningForm';
import AddTransferForm from '@/components/AddTransferForm';
import LinkedTile from '@/components/LinkedTile';
import useFinanceData from '@/lib/hooks/useFinanceData';
import { CHART_COLORS, usd } from '@/lib/finance/ui';

export default function DashboardOverviewPage() {
  const { isLoading, accounts, loadFinanceData, earningsAnalytics, wealthAnalytics } = useFinanceData();

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <AddEarningForm onSaved={loadFinanceData} />
        <AddTransferForm accounts={accounts} onSaved={loadFinanceData} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <LinkedTile href="/dashboard/earnings" className="glass-tile p-5 border border-[#2f4b70]">
          <p className="text-[10px] uppercase tracking-widest text-graphite-faint">Total earnings</p>
          <p className="text-2xl font-semibold mt-2">{isLoading ? '--' : usd(earningsAnalytics.totalEarnings)}</p>
        </LinkedTile>

        <LinkedTile href="/dashboard/forecast" className="glass-tile p-5 border border-[#2f4b70]">
          <p className="text-[10px] uppercase tracking-widest text-graphite-faint">2 week forecast</p>
          <p className="text-2xl font-semibold mt-2">{isLoading ? '--' : usd(earningsAnalytics.twoWeekForecast)}</p>
        </LinkedTile>

        <LinkedTile href="/dashboard/accounts" className="glass-tile p-5 border border-[#2f4b70]">
          <p className="text-[10px] uppercase tracking-widest text-graphite-faint">Current balance</p>
          <p className="text-2xl font-semibold mt-2">{isLoading ? '--' : usd(wealthAnalytics.totalCurrentBalance)}</p>
        </LinkedTile>

        <LinkedTile href="/dashboard/transfers" className="glass-tile p-5 border border-[#2f4b70]">
          <p className="text-[10px] uppercase tracking-widest text-graphite-faint">Net transfers</p>
          <p className="text-2xl font-semibold mt-2">{isLoading ? '--' : usd(wealthAnalytics.totalNetTransfers)}</p>
        </LinkedTile>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <LinkedTile href="/dashboard/earnings" className="glass-tile-dark p-5 border border-[#2f4b70]">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs uppercase tracking-[0.2em] text-graphite-faint">Earnings by week</p>
            <p className="text-sm text-graphite-faint">Latest week: {usd(earningsAnalytics.lastWeek)}</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={earningsAnalytics.weeklyEarnings}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(136,164,204,0.18)" />
                <XAxis dataKey="week" stroke="#9db2d5" tick={{ fill: '#9db2d5', fontSize: 11 }} />
                <YAxis stroke="#9db2d5" tick={{ fill: '#9db2d5', fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  contentStyle={{ background: '#0f1726', border: '1px solid #2f4b70', borderRadius: 12 }}
                  formatter={(v) => usd(v)}
                />
                <Bar dataKey="total" fill="#5ec7b7" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </LinkedTile>

        <LinkedTile href="/dashboard/accounts" className="glass-tile-dark p-5 border border-[#2f4b70]">
          <div className="flex items-start justify-between gap-2 mb-4">
            <p className="text-xs uppercase tracking-[0.2em] text-graphite-faint">Balances by account type</p>
            <span className="text-[10px] uppercase text-graphite-faint">Accounts.Type</span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={wealthAnalytics.typeTotals}
                  dataKey="total"
                  nameKey="type"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ type }) => type}
                >
                  {wealthAnalytics.typeTotals.map((entry, index) => (
                    <Cell key={entry.type} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#0f1726', border: '1px solid #2f4b70', borderRadius: 12 }}
                  formatter={(v) => usd(v)}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </LinkedTile>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <LinkedTile href="/dashboard/earnings" className="glass-tile p-5 border border-[#2f4b70]">
          <div className="flex items-start justify-between gap-2 mb-4">
            <p className="text-xs uppercase tracking-[0.2em] text-graphite-faint">Recent earnings entries</p>
            <span className="text-[10px] uppercase text-graphite-faint">Earnings.Rows</span>
          </div>
          <div className="space-y-3 max-h-[360px] overflow-auto pr-1">
            {earningsAnalytics.recentEarnings.length === 0 && (
              <p className="text-sm text-graphite-faint">No earnings logged yet.</p>
            )}

            {earningsAnalytics.recentEarnings.slice(0, 6).map((entry) => (
              <div key={entry.id} className="rounded-xl border border-[#2a3f5d] bg-[#0d1522] p-3 flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{entry.platform}</p>
                  <p className="text-xs text-graphite-faint">
                    {entry.project} - {new Date(entry.date).toLocaleDateString('en-US')}
                  </p>
                </div>
                <p className="font-semibold text-accent">{usd(entry.amount)}</p>
              </div>
            ))}
          </div>
        </LinkedTile>

        <LinkedTile href="/dashboard/transfers" className="glass-tile p-5 border border-[#2f4b70]">
          <div className="flex items-start justify-between gap-2 mb-4">
            <p className="text-xs uppercase tracking-[0.2em] text-graphite-faint">Recent transfers</p>
            <span className="text-[10px] uppercase text-graphite-faint">Transfers.Rows</span>
          </div>
          <div className="space-y-3 max-h-[360px] overflow-auto pr-1">
            {wealthAnalytics.recentTransfers.length === 0 && (
              <p className="text-sm text-graphite-faint">No transfers logged yet.</p>
            )}

            {wealthAnalytics.recentTransfers.slice(0, 6).map((transfer) => (
              <div key={transfer.id} className="rounded-xl border border-[#2a3f5d] bg-[#0d1522] p-3 flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{transfer.account}</p>
                  <p className="text-xs text-graphite-faint">
                    {transfer.category} - {new Date(transfer.date).toLocaleDateString('en-US')} - {transfer.source}
                  </p>
                </div>
                <p className={`font-semibold ${transfer.signedAmount < 0 ? 'text-red-300' : 'text-accent'}`}>
                  {usd(transfer.signedAmount)}
                </p>
              </div>
            ))}
          </div>
        </LinkedTile>
      </div>
    </div>
  );
}
