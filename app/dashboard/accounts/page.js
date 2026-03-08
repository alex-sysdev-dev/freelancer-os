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
import AddTransferForm from '@/components/AddTransferForm';
import useFinanceData from '@/lib/hooks/useFinanceData';
import { CHART_COLORS, usd } from '@/lib/finance/ui';

export default function AccountsPage() {
  const { isLoading, accounts, loadFinanceData, wealthAnalytics } = useFinanceData();

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <AddTransferForm accounts={accounts} onSaved={loadFinanceData} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-tile p-5 border border-[#2f4b70]">
          <p className="text-[10px] uppercase tracking-widest text-graphite-faint">Current balance</p>
          <p className="text-2xl font-semibold mt-2">{isLoading ? '--' : usd(wealthAnalytics.totalCurrentBalance)}</p>
        </div>
        <div className="glass-tile p-5 border border-[#2f4b70]">
          <p className="text-[10px] uppercase tracking-widest text-graphite-faint">Net transfers</p>
          <p className="text-2xl font-semibold mt-2">{isLoading ? '--' : usd(wealthAnalytics.totalNetTransfers)}</p>
        </div>
        <div className="glass-tile p-5 border border-[#2f4b70]">
          <p className="text-[10px] uppercase tracking-widest text-graphite-faint">Accounts tracked</p>
          <p className="text-2xl font-semibold mt-2">{isLoading ? '--' : String(accounts.length)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="glass-tile-dark p-5 border border-[#2f4b70]">
          <p className="text-xs uppercase tracking-[0.2em] text-graphite-faint mb-4">Account balances</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={wealthAnalytics.accountBalances}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(136,164,204,0.18)" />
                <XAxis dataKey="accountName" stroke="#9db2d5" tick={{ fill: '#9db2d5', fontSize: 11 }} />
                <YAxis stroke="#9db2d5" tick={{ fill: '#9db2d5', fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                <Tooltip contentStyle={{ background: '#0f1726', border: '1px solid #2f4b70', borderRadius: 12 }} formatter={(v) => usd(v)} />
                <Bar dataKey="currentBalance" fill="#7a8fff" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-tile-dark p-5 border border-[#2f4b70]">
          <p className="text-xs uppercase tracking-[0.2em] text-graphite-faint mb-4">Balances by account type</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={wealthAnalytics.typeTotals} dataKey="total" nameKey="type" cx="50%" cy="50%" outerRadius={100} label={({ type }) => type}>
                  {wealthAnalytics.typeTotals.map((entry, index) => (
                    <Cell key={entry.type} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#0f1726', border: '1px solid #2f4b70', borderRadius: 12 }} formatter={(v) => usd(v)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {wealthAnalytics.accountBalances.map((account) => (
          <div key={account.id} className="glass-tile p-4 border border-[#2f4b70]">
            <p className="text-sm uppercase tracking-widest text-graphite-faint">{account.type}</p>
            <h3 className="text-xl font-semibold mt-2">{account.accountName}</h3>
            <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-graphite-faint text-[10px] uppercase tracking-widest">Starting</p>
                <p className="font-semibold">{usd(account.startingBalance)}</p>
              </div>
              <div>
                <p className="text-graphite-faint text-[10px] uppercase tracking-widest">Net Transfers</p>
                <p className={`font-semibold ${account.netTransfers < 0 ? 'text-red-300' : 'text-accent'}`}>{usd(account.netTransfers)}</p>
              </div>
              <div>
                <p className="text-graphite-faint text-[10px] uppercase tracking-widest">Current</p>
                <p className="font-semibold">{usd(account.currentBalance)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
