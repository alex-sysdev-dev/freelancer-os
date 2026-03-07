"use client";

import { useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
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

const CHART_COLORS = ['#5ec7b7', '#7fb5ff', '#7a8fff', '#8de4d6', '#59a8e2', '#a4b8ff'];

function LinkedTile({ href, className, children }) {
  const classes = `${className} ${href ? 'block cursor-pointer hover:border-[#5ec7b7] transition-colors' : ''}`;
  if (!href) return <div className={classes}>{children}</div>;

  return (
    <a href={href} target="_blank" rel="noreferrer" className={classes}>
      {children}
    </a>
  );
}

function usd(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value || 0);
}

function weekStartLabel(date) {
  const d = new Date(date);
  const day = d.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + offset);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [clients, setClients] = useState([]);
  const [earnings, setEarnings] = useState([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [earningsLoading, setEarningsLoading] = useState(true);

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      return;
    }
    alert('Access denied');
  };

  useEffect(() => {
    if (!isAuthenticated) return;

    fetch('/api/get-candidates')
      .then((res) => res.json())
      .then((data) => {
        setClients(Array.isArray(data) ? data : []);
      })
      .catch(() => setClients([]))
      .finally(() => setClientsLoading(false));

    fetch('/api/earnings')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setEarnings(data);
          return;
        }
        setEarnings(Array.isArray(data?.records) ? data.records : []);
      })
      .catch(() => setEarnings([]))
      .finally(() => setEarningsLoading(false));
  }, [isAuthenticated]);

  const analytics = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const normalized = earnings
      .map((entry) => {
        const parsedDate = entry?.date ? new Date(entry.date) : null;
        const amount = typeof entry?.amount === 'number' ? entry.amount : Number(entry?.amount);

        if (!parsedDate || Number.isNaN(parsedDate.getTime()) || !Number.isFinite(amount)) {
          return null;
        }

        return {
          ...entry,
          dateObj: parsedDate,
          amount,
          platform: entry.platform || entry.source || 'Unknown',
          status: entry.status || 'Paid',
        };
      })
      .filter(Boolean);

    const paidTotal = normalized
      .filter((item) => String(item.status).toLowerCase() === 'paid')
      .reduce((sum, item) => sum + item.amount, 0);

    const pendingTotal = normalized
      .filter((item) => String(item.status).toLowerCase() !== 'paid')
      .reduce((sum, item) => sum + item.amount, 0);

    const monthEntries = normalized.filter(
      (item) => item.dateObj.getFullYear() === currentYear && item.dateObj.getMonth() === currentMonth
    );

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const today = now.getDate();
    const dailyNet = Array.from({ length: daysInMonth }, (_, dayIndex) => {
      const day = dayIndex + 1;
      const total = monthEntries
        .filter((item) => item.dateObj.getDate() === day)
        .reduce((sum, item) => sum + item.amount, 0);
      return total;
    });

    const cumulative = [];
    let running = 0;
    for (let i = 0; i < today; i += 1) {
      running += dailyNet[i] || 0;
      cumulative.push(running);
    }

    const avgDaily = today > 0 ? running / today : 0;
    const forecastSeries = [];
    for (let i = 0; i < daysInMonth; i += 1) {
      if (i < today) {
        forecastSeries.push(cumulative[i] ?? running);
      } else {
        forecastSeries.push(running + avgDaily * (i + 1 - today));
      }
    }

    const monthForecastChart = Array.from({ length: daysInMonth }, (_, i) => ({
      day: i + 1,
      actual: i < cumulative.length ? Math.round((cumulative[i] || 0) * 100) / 100 : null,
      forecast: Math.round((forecastSeries[i] || 0) * 100) / 100,
    }));

    const weeklyMap = new Map();
    for (const item of normalized) {
      const key = weekStartLabel(item.dateObj);
      if (!weeklyMap.has(key)) {
        weeklyMap.set(key, {
          week: key,
          paid: 0,
          pending: 0,
          total: 0,
        });
      }
      const bucket = weeklyMap.get(key);
      bucket.total += item.amount;
      if (String(item.status).toLowerCase() === 'paid') bucket.paid += item.amount;
      else bucket.pending += item.amount;
    }

    const weeklyCashflow = [...weeklyMap.values()]
      .sort((a, b) => new Date(a.week).getTime() - new Date(b.week).getTime())
      .slice(-10)
      .map((row) => ({
        ...row,
        paid: Math.round(row.paid * 100) / 100,
        pending: Math.round(row.pending * 100) / 100,
        total: Math.round(row.total * 100) / 100,
      }));

    const platformMap = new Map();
    for (const item of normalized) {
      const key = item.platform || 'Unknown';
      platformMap.set(key, (platformMap.get(key) || 0) + item.amount);
    }

    const platformTotals = [...platformMap.entries()]
      .map(([platform, amount]) => ({
        platform,
        amount: Math.round(amount * 100) / 100,
      }))
      .sort((a, b) => b.amount - a.amount);

    const monthMap = new Map();
    for (const item of normalized) {
      const key = monthKey(item.dateObj);
      monthMap.set(key, (monthMap.get(key) || 0) + item.amount);
    }

    const monthlyTrend = [...monthMap.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-8)
      .map(([key, total]) => ({
        month: key,
        total: Math.round(total * 100) / 100,
      }));

    const earnedToDate = cumulative[cumulative.length - 1] || 0;
    const forecastEndOfMonth = forecastSeries[forecastSeries.length - 1] || 0;

    return {
      paidTotal,
      pendingTotal,
      monthlyPaid: monthEntries
        .filter((item) => String(item.status).toLowerCase() === 'paid')
        .reduce((sum, item) => sum + item.amount, 0),
      earnedToDate,
      forecastEndOfMonth,
      monthForecastChart,
      weeklyCashflow,
      platformTotals,
      monthlyTrend,
      recentEarnings: normalized
        .sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime())
        .slice(0, 8),
    };
  }, [earnings]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="glass-tile-dark w-full max-w-md p-8 border border-[#34517a]">
          <h1 className="text-2xl font-semibold mb-6 uppercase tracking-tight">Freelancer Command Center</h1>
          <p className="text-graphite-faint text-xs mb-4 uppercase tracking-[0.2em]">Admin access</p>
          <input
            type="password"
            placeholder="Admin Password"
            className="w-full p-3 rounded-xl bg-[#0f1825] border border-[#2a3f5d] mb-4 outline-none focus:border-[#5ec7b7]"
            onChange={(e) => setPassword(e.target.value)}
          />
          <button className="w-full bg-[#5ec7b7] hover:bg-[#7be0cc] text-[#041a1a] py-3 rounded-xl font-semibold transition-all">
            Unlock
          </button>
        </form>
      </div>
    );
  }

  const asOfLabel = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const baseAirtableLink = process.env.NEXT_PUBLIC_AIRTABLE_BASE_URL || '';
  const airtableLinks = {
    earnings: process.env.NEXT_PUBLIC_AIRTABLE_LINK_EARNINGS || baseAirtableLink,
    activeEarnings: process.env.NEXT_PUBLIC_AIRTABLE_LINK_ACTIVE_EARNINGS || baseAirtableLink,
    client: process.env.NEXT_PUBLIC_AIRTABLE_LINK_CLIENT || baseAirtableLink,
    applicants: process.env.NEXT_PUBLIC_AIRTABLE_LINK_APPLICANTS || baseAirtableLink,
  };

  return (
    <div className="min-h-screen p-6 md:p-8 text-white">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold uppercase tracking-tight">
              Earnings <span className="text-accent">Intelligence</span>
            </h1>
            <p className="text-graphite-faint text-[11px] uppercase tracking-[0.25em] mt-2">
              Forecast modeling and cashflow analytics // as of {asOfLabel}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <AddEarningForm />
            <div className="glass-tile px-4 py-2 text-xs uppercase tracking-widest text-graphite-faint border border-[#2f4b70]">
              {clientsLoading ? '--' : clients.length} clients tracked
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <LinkedTile href={airtableLinks.earnings} className="glass-tile p-5 border border-[#2f4b70]">
            <div className="flex items-start justify-between gap-2">
              <p className="text-[10px] uppercase tracking-widest text-graphite-faint">Lifetime paid</p>
              <span className="text-[10px] uppercase text-graphite-faint">Earnings.Status</span>
            </div>
            <p className="text-2xl font-semibold mt-2">{earningsLoading ? '--' : usd(analytics.paidTotal)}</p>
          </LinkedTile>
          <LinkedTile href={airtableLinks.earnings} className="glass-tile p-5 border border-[#2f4b70]">
            <div className="flex items-start justify-between gap-2">
              <p className="text-[10px] uppercase tracking-widest text-graphite-faint">Pending pipeline</p>
              <span className="text-[10px] uppercase text-graphite-faint">Earnings.Status</span>
            </div>
            <p className="text-2xl font-semibold mt-2">{earningsLoading ? '--' : usd(analytics.pendingTotal)}</p>
          </LinkedTile>
          <LinkedTile href={airtableLinks.earnings} className="glass-tile p-5 border border-[#2f4b70]">
            <div className="flex items-start justify-between gap-2">
              <p className="text-[10px] uppercase tracking-widest text-graphite-faint">Month paid</p>
              <span className="text-[10px] uppercase text-graphite-faint">Earnings.Date</span>
            </div>
            <p className="text-2xl font-semibold mt-2">{earningsLoading ? '--' : usd(analytics.monthlyPaid)}</p>
          </LinkedTile>
          <LinkedTile href={airtableLinks.earnings} className="glass-tile p-5 border border-[#2f4b70]">
            <div className="flex items-start justify-between gap-2">
              <p className="text-[10px] uppercase tracking-widest text-graphite-faint">Forecast end of month</p>
              <span className="text-[10px] uppercase text-graphite-faint">Earnings.Hours+Tags</span>
            </div>
            <p className="text-2xl font-semibold mt-2 text-accent">
              {earningsLoading ? '--' : usd(analytics.forecastEndOfMonth)}
            </p>
          </LinkedTile>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <LinkedTile href={airtableLinks.earnings} className="xl:col-span-2 glass-tile-dark p-5 border border-[#2f4b70]">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs uppercase tracking-[0.2em] text-graphite-faint">Current month forecast</p>
              <p className="text-sm text-graphite-faint">MTD {usd(analytics.earnedToDate)} - Earnings.Date</p>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.monthForecastChart}>
                  <defs>
                    <linearGradient id="forecastFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#5ec7b7" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#5ec7b7" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(136,164,204,0.18)" />
                  <XAxis dataKey="day" stroke="#9db2d5" tick={{ fill: '#9db2d5', fontSize: 11 }} />
                  <YAxis stroke="#9db2d5" tick={{ fill: '#9db2d5', fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                  <Tooltip
                    contentStyle={{ background: '#0f1726', border: '1px solid #2f4b70', borderRadius: 12 }}
                    formatter={(v) => usd(v)}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="actual" name="Actual" stroke="#7fb5ff" fill="url(#forecastFill)" strokeWidth={2} />
                  <Line type="monotone" dataKey="forecast" name="Forecast" stroke="#5ec7b7" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </LinkedTile>

          <LinkedTile href={airtableLinks.earnings} className="glass-tile-dark p-5 border border-[#2f4b70]">
            <div className="flex items-start justify-between gap-2 mb-4">
              <p className="text-xs uppercase tracking-[0.2em] text-graphite-faint">Revenue by platform</p>
              <span className="text-[10px] uppercase text-graphite-faint">Earnings.Platform</span>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.platformTotals}
                    dataKey="amount"
                    nameKey="platform"
                    cx="50%"
                    cy="50%"
                    outerRadius={95}
                    innerRadius={55}
                    label={({ platform }) => platform}
                  >
                    {analytics.platformTotals.map((entry, index) => (
                      <Cell key={entry.platform} fill={CHART_COLORS[index % CHART_COLORS.length]} />
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
          <LinkedTile href={airtableLinks.earnings} className="glass-tile p-5 border border-[#2f4b70]">
            <div className="flex items-start justify-between gap-2 mb-4">
              <p className="text-xs uppercase tracking-[0.2em] text-graphite-faint">Weekly cashflow (paid vs pending)</p>
              <span className="text-[10px] uppercase text-graphite-faint">Earnings.Date+Status</span>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.weeklyCashflow}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(136,164,204,0.18)" />
                  <XAxis dataKey="week" stroke="#9db2d5" tick={{ fill: '#9db2d5', fontSize: 11 }} />
                  <YAxis stroke="#9db2d5" tick={{ fill: '#9db2d5', fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                  <Tooltip
                    contentStyle={{ background: '#0f1726', border: '1px solid #2f4b70', borderRadius: 12 }}
                    formatter={(v) => usd(v)}
                  />
                  <Legend />
                  <Bar dataKey="paid" fill="#5ec7b7" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="pending" fill="#7a8fff" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </LinkedTile>

          <LinkedTile href={airtableLinks.earnings} className="glass-tile p-5 border border-[#2f4b70]">
            <div className="flex items-start justify-between gap-2 mb-4">
              <p className="text-xs uppercase tracking-[0.2em] text-graphite-faint">Monthly trend</p>
              <span className="text-[10px] uppercase text-graphite-faint">Earnings.Date</span>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(136,164,204,0.18)" />
                  <XAxis dataKey="month" stroke="#9db2d5" tick={{ fill: '#9db2d5', fontSize: 11 }} />
                  <YAxis stroke="#9db2d5" tick={{ fill: '#9db2d5', fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                  <Tooltip
                    contentStyle={{ background: '#0f1726', border: '1px solid #2f4b70', borderRadius: 12 }}
                    formatter={(v) => usd(v)}
                  />
                  <Line type="monotone" dataKey="total" stroke="#7fb5ff" strokeWidth={3} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </LinkedTile>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <LinkedTile href={airtableLinks.earnings} className="glass-tile p-5 border border-[#2f4b70]">
            <div className="flex items-start justify-between gap-2 mb-4">
              <p className="text-xs uppercase tracking-[0.2em] text-graphite-faint">Recent earnings events</p>
              <span className="text-[10px] uppercase text-graphite-faint">Earnings.Rows</span>
            </div>
            <div className="space-y-3 max-h-[360px] overflow-auto pr-1">
              {analytics.recentEarnings.length === 0 && (
                <p className="text-sm text-graphite-faint">No earnings logged yet.</p>
              )}

              {analytics.recentEarnings.map((entry) => (
                <div key={entry.id} className="rounded-xl border border-[#2a3f5d] bg-[#0d1522] p-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{entry.platform}</p>
                    <p className="text-xs text-graphite-faint">
                      {entry.project || 'Unmapped project'}  -  {new Date(entry.date).toLocaleDateString('en-US')}  -  {entry.status || 'Pending'}
                    </p>
                  </div>
                  <p className="font-semibold text-accent">{usd(entry.amount)}</p>
                </div>
              ))}
            </div>
          </LinkedTile>

          <LinkedTile href={airtableLinks.applicants} className="glass-tile p-5 border border-[#2f4b70]">
            <div className="flex items-start justify-between gap-2 mb-4">
              <p className="text-xs uppercase tracking-[0.2em] text-graphite-faint">Client tracker</p>
              <span className="text-[10px] uppercase text-graphite-faint">Applicants.Name/Status</span>
            </div>
            <div className="space-y-3 max-h-[360px] overflow-auto pr-1">
              {!clientsLoading && clients.length === 0 && (
                <p className="text-sm text-graphite-faint">No client records found.</p>
              )}

              {clients.map((client) => (
                <div key={client.id} className="rounded-xl border border-[#2a3f5d] bg-[#0d1522] p-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{client.name}</p>
                    <p className="text-xs text-graphite-faint">{client.role}  -  {client.email}</p>
                    <p className="text-xs text-graphite-faint">Experience: {client.experience}</p>
                  </div>
                  <span className="text-[10px] uppercase tracking-widest px-2 py-1 rounded-full bg-[#17314f] text-[#9ec5ff] border border-[#365a84]">
                    {client.status || 'Unknown'}
                  </span>
                </div>
              ))}
            </div>
          </LinkedTile>
        </div>
      </div>
    </div>
  );
}
