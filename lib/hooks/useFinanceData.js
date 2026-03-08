"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';

function safeDate(value) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function round2(value) {
  return Math.round((value || 0) * 100) / 100;
}

function mondayKey(dateValue) {
  const date = safeDate(dateValue);
  if (!date) return null;

  const d = new Date(date);
  const day = d.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + offset);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

function monthKey(dateValue) {
  const date = safeDate(dateValue);
  if (!date) return null;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function accountKey(value) {
  return String(value || '').trim().toLowerCase();
}

export default function useFinanceData() {
  const [earnings, setEarnings] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadFinanceData = useCallback(async () => {
    setIsLoading(true);

    try {
      const [earningsRes, accountsRes, transfersRes] = await Promise.all([
        fetch('/api/earnings', { cache: 'no-store' }),
        fetch('/api/accounts', { cache: 'no-store' }),
        fetch('/api/transfers', { cache: 'no-store' }),
      ]);

      const [earningsData, accountsData, transfersData] = await Promise.all([
        earningsRes.json(),
        accountsRes.json(),
        transfersRes.json(),
      ]);

      setEarnings(Array.isArray(earningsData) ? earningsData : []);
      setAccounts(Array.isArray(accountsData) ? accountsData : []);
      setTransfers(Array.isArray(transfersData) ? transfersData : []);
    } catch {
      setEarnings([]);
      setAccounts([]);
      setTransfers([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFinanceData();
  }, [loadFinanceData]);

  const earningsAnalytics = useMemo(() => {
    const normalized = earnings
      .map((entry) => {
        const dateObj = safeDate(entry?.date);
        const amount = Number(entry?.amount || 0);
        const twoWeekForecast = Number(entry?.twoWeekForecast || 0);
        const oneMonthForecast = Number(entry?.oneMonthForecast || 0);
        const sixMonthForecast = Number(entry?.sixMonthForecast || 0);

        if (!dateObj || !Number.isFinite(amount)) return null;

        return {
          id: entry.id,
          date: entry.date,
          dateObj,
          platform: entry.platform || 'Unknown',
          project: entry.project || 'Unassigned',
          hoursWorked: Number(entry.hoursWorked || 0),
          ratePerHour: Number(entry.ratePerHour || 0),
          amount,
          weekStartDate: entry.weekStartDate || mondayKey(entry.date),
          twoWeekForecast,
          oneMonthForecast,
          sixMonthForecast,
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

    const totalEarnings = normalized.reduce((sum, entry) => sum + entry.amount, 0);

    const weeklyMap = new Map();
    for (const entry of normalized) {
      const key = entry.weekStartDate || mondayKey(entry.date);
      if (!key) continue;

      if (!weeklyMap.has(key)) {
        weeklyMap.set(key, { week: key, total: 0 });
      }

      weeklyMap.get(key).total += entry.amount;
    }

    const weeklyEarnings = [...weeklyMap.values()]
      .sort((a, b) => String(a.week).localeCompare(String(b.week)))
      .map((row) => ({ week: row.week, total: round2(row.total) }));

    const monthlyMap = new Map();
    for (const entry of normalized) {
      const key = monthKey(entry.date);
      if (!key) continue;
      monthlyMap.set(key, (monthlyMap.get(key) || 0) + entry.amount);
    }

    const monthlyTrend = [...monthlyMap.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-12)
      .map(([month, total]) => ({ month, total: round2(total) }));

    const platformMap = new Map();
    for (const entry of normalized) {
      const key = entry.platform || 'Unknown';
      platformMap.set(key, (platformMap.get(key) || 0) + entry.amount);
    }

    const platformTotals = [...platformMap.entries()]
      .map(([platform, amount]) => ({ platform, amount: round2(amount) }))
      .sort((a, b) => b.amount - a.amount);

    const lastWeek = weeklyEarnings[weeklyEarnings.length - 1]?.total || 0;
    const lastEntry = normalized[normalized.length - 1] || null;

    const twoWeekForecast =
      Number.isFinite(lastEntry?.twoWeekForecast) && lastEntry.twoWeekForecast > 0
        ? lastEntry.twoWeekForecast
        : lastWeek * 2;

    const oneMonthForecast =
      Number.isFinite(lastEntry?.oneMonthForecast) && lastEntry.oneMonthForecast > 0
        ? lastEntry.oneMonthForecast
        : lastWeek * 4.33;

    const sixMonthForecast =
      Number.isFinite(lastEntry?.sixMonthForecast) && lastEntry.sixMonthForecast > 0
        ? lastEntry.sixMonthForecast
        : oneMonthForecast * 6;

    const recentEarnings = [...normalized]
      .sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime())
      .slice(0, 10);

    return {
      totalEarnings,
      lastWeek,
      twoWeekForecast,
      oneMonthForecast,
      sixMonthForecast,
      weeklyEarnings,
      monthlyTrend,
      platformTotals,
      recentEarnings,
    };
  }, [earnings]);

  const wealthAnalytics = useMemo(() => {
    const normalizedTransfers = transfers
      .map((transfer) => {
        const dateObj = safeDate(transfer?.date);
        if (!dateObj) return null;

        return {
          id: transfer.id,
          date: transfer.date,
          dateObj,
          account: transfer.account || 'Unknown Account',
          category: transfer.category || 'Deposit',
          amount: Number(transfer.amount || 0),
          signedAmount: Number(transfer.signedAmount || 0),
          source: transfer.source || 'Manual',
          weekStartDate: transfer.weekStartDate || mondayKey(transfer.date),
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());

    const transferTotalsByAccount = new Map();
    for (const transfer of normalizedTransfers) {
      const key = accountKey(transfer.account);
      if (!key || key === 'unknown account') continue;
      transferTotalsByAccount.set(key, (transferTotalsByAccount.get(key) || 0) + transfer.signedAmount);
    }

    const normalizedAccounts = accounts.map((account) => {
      const accountName = account.accountName || 'Unnamed Account';
      const key = accountKey(accountName);
      const startingBalance = Number(account.startingBalance || 0);
      const hasNetTransfers = Boolean(account.hasNetTransfers);
      const hasCurrentBalance = Boolean(account.hasCurrentBalance);
      const derivedNetTransfers = transferTotalsByAccount.get(key) || 0;
      const netTransfers = hasNetTransfers ? Number(account.netTransfers || 0) : derivedNetTransfers;
      const currentBalance = hasCurrentBalance
        ? Number(account.currentBalance || 0)
        : startingBalance + netTransfers;

      return {
        id: account.id,
        accountName,
        type: account.type || 'Uncategorized',
        startingBalance,
        netTransfers: round2(netTransfers),
        currentBalance: round2(currentBalance),
      };
    });

    const totalCurrentBalance = normalizedAccounts.reduce((sum, account) => sum + account.currentBalance, 0);
    const totalNetTransfers = normalizedAccounts.reduce((sum, account) => sum + account.netTransfers, 0);
    const accountBalances = [...normalizedAccounts].sort((a, b) => b.currentBalance - a.currentBalance);

    const typeMap = new Map();
    for (const account of normalizedAccounts) {
      typeMap.set(account.type, (typeMap.get(account.type) || 0) + account.currentBalance);
    }

    const typeTotals = [...typeMap.entries()].map(([type, total]) => ({ type, total: round2(total) }));

    const sourceMap = new Map();
    for (const transfer of normalizedTransfers) {
      sourceMap.set(transfer.source, (sourceMap.get(transfer.source) || 0) + transfer.signedAmount);
    }

    const transferBySource = [...sourceMap.entries()].map(([source, total]) => ({ source, total: round2(total) }));

    return {
      totalCurrentBalance,
      totalNetTransfers,
      accountBalances,
      typeTotals,
      recentTransfers: normalizedTransfers.slice(0, 12),
      transferBySource,
    };
  }, [accounts, transfers]);

  return {
    isLoading,
    earnings,
    accounts,
    transfers,
    loadFinanceData,
    earningsAnalytics,
    wealthAnalytics,
  };
}
