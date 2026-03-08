"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import AddTransferForm from '@/components/AddTransferForm';
import useFinanceData from '@/lib/hooks/useFinanceData';
import { usd } from '@/lib/finance/ui';

export default function TransfersPage() {
  const { accounts, loadFinanceData, wealthAnalytics } = useFinanceData();

  const totals = wealthAnalytics.recentTransfers.reduce(
    (acc, transfer) => {
      if (transfer.signedAmount >= 0) acc.deposits += transfer.signedAmount;
      else acc.withdrawals += Math.abs(transfer.signedAmount);
      acc.net += transfer.signedAmount;
      return acc;
    },
    { deposits: 0, withdrawals: 0, net: 0 }
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <AddTransferForm accounts={accounts} onSaved={loadFinanceData} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-tile p-5 border border-[#2f4b70]">
          <p className="text-[10px] uppercase tracking-widest text-graphite-faint">Deposits</p>
          <p className="text-2xl font-semibold mt-2 text-accent">{usd(totals.deposits)}</p>
        </div>
        <div className="glass-tile p-5 border border-[#2f4b70]">
          <p className="text-[10px] uppercase tracking-widest text-graphite-faint">Withdrawals</p>
          <p className="text-2xl font-semibold mt-2 text-red-300">{usd(totals.withdrawals)}</p>
        </div>
        <div className="glass-tile p-5 border border-[#2f4b70]">
          <p className="text-[10px] uppercase tracking-widest text-graphite-faint">Net movement</p>
          <p className={`text-2xl font-semibold mt-2 ${totals.net < 0 ? 'text-red-300' : 'text-accent'}`}>{usd(totals.net)}</p>
        </div>
      </div>

      <div className="glass-tile-dark p-5 border border-[#2f4b70]">
        <p className="text-xs uppercase tracking-[0.2em] text-graphite-faint mb-4">Transfer flow by source</p>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={wealthAnalytics.transferBySource}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(136,164,204,0.18)" />
              <XAxis dataKey="source" stroke="#9db2d5" tick={{ fill: '#9db2d5', fontSize: 11 }} />
              <YAxis stroke="#9db2d5" tick={{ fill: '#9db2d5', fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
              <Tooltip contentStyle={{ background: '#0f1726', border: '1px solid #2f4b70', borderRadius: 12 }} formatter={(v) => usd(v)} />
              <Legend />
              <Bar dataKey="total" fill="#59a8e2" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass-tile p-5 border border-[#2f4b70]">
        <p className="text-xs uppercase tracking-[0.2em] text-graphite-faint mb-4">Recent transfers</p>
        <div className="space-y-3 max-h-[520px] overflow-auto pr-1">
          {wealthAnalytics.recentTransfers.length === 0 && <p className="text-sm text-graphite-faint">No transfers logged yet.</p>}

          {wealthAnalytics.recentTransfers.map((transfer) => (
            <div key={transfer.id} className="rounded-xl border border-[#2a3f5d] bg-[#0d1522] p-3 flex items-center justify-between gap-3">
              <div>
                <p className="font-medium">{transfer.account}</p>
                <p className="text-xs text-graphite-faint">
                  {transfer.category} - {new Date(transfer.date).toLocaleDateString('en-US')} - {transfer.source}
                </p>
              </div>
              <p className={`font-semibold ${transfer.signedAmount < 0 ? 'text-red-300' : 'text-accent'}`}>{usd(transfer.signedAmount)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
