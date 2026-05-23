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

const DEFAULT_FINANCE_SETTINGS = {
  monthlyExpenseTarget: 3200,
  taxReserveRate: 0.25,
  minimumCashBuffer: 5000,
};

const LOCAL_RUNWAY_SETTINGS_KEY = 'finance_runway_settings';

function readLocalRunwaySettings() {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(LOCAL_RUNWAY_SETTINGS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function normalizeSettings(value) {
  const monthlyExpenseTarget = Number(value?.monthlyExpenseTarget);
  const taxReserveRate = Number(value?.taxReserveRate);
  const minimumCashBuffer = Number(value?.minimumCashBuffer);

  return {
    id: value?.id || null,
    monthlyExpenseTarget: Number.isFinite(monthlyExpenseTarget) && monthlyExpenseTarget >= 0
      ? monthlyExpenseTarget
      : DEFAULT_FINANCE_SETTINGS.monthlyExpenseTarget,
    taxReserveRate: Number.isFinite(taxReserveRate) && taxReserveRate >= 0
      ? taxReserveRate
      : DEFAULT_FINANCE_SETTINGS.taxReserveRate,
    minimumCashBuffer: Number.isFinite(minimumCashBuffer) && minimumCashBuffer >= 0
      ? minimumCashBuffer
      : DEFAULT_FINANCE_SETTINGS.minimumCashBuffer,
    configured: Boolean(value?.configured),
  };
}

export default function useFinanceData() {
  const [earnings, setEarnings] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_FINANCE_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadFinanceData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const fetchAndParse = async (url) => {
      const res = await fetch(url, { cache: 'no-store' });
      const data = await res.json().catch(() => null);
      return { res, data };
    };

    try {
      const [earningsResult, accountsResult, transfersResult, settingsResult] = await Promise.all([
        fetchAndParse('/api/earnings'),
        fetchAndParse('/api/accounts'),
        fetchAndParse('/api/transfers'),
        fetchAndParse('/api/settings'),
      ]);

      const errors = [];

      if (!earningsResult.res.ok) {
        errors.push(
          earningsResult.data?.error || earningsResult.data?.message || `Earnings fetch failed (${earningsResult.res.status})`
        );
      }
      if (!accountsResult.res.ok) {
        errors.push(
          accountsResult.data?.error || accountsResult.data?.message || `Accounts fetch failed (${accountsResult.res.status})`
        );
      }
      if (!transfersResult.res.ok) {
        errors.push(
          transfersResult.data?.error || transfersResult.data?.message || `Transfers fetch failed (${transfersResult.res.status})`
        );
      }
      if (!settingsResult.res.ok) {
        errors.push(
          settingsResult.data?.error || settingsResult.data?.message || `Settings fetch failed (${settingsResult.res.status})`
        );
      }

      setEarnings(Array.isArray(earningsResult.data) ? earningsResult.data : []);
      setAccounts(Array.isArray(accountsResult.data) ? accountsResult.data : []);
      setTransfers(Array.isArray(transfersResult.data) ? transfersResult.data : []);
      const remoteSettings = normalizeSettings(settingsResult.data);
      const localSettings = remoteSettings.configured ? null : readLocalRunwaySettings();
      setSettings(localSettings ? normalizeSettings({ ...localSettings, configured: false }) : remoteSettings);

      if (errors.length > 0) {
        setError(errors.join(' | '));
      }
    } catch (fetchError) {
      setEarnings([]);
      setAccounts([]);
      setTransfers([]);
      setSettings(DEFAULT_FINANCE_SETTINGS);
      setError(fetchError instanceof Error ? fetchError.message : 'Unable to load finance data');
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



  const runwayAnalytics = useMemo(() => {
    const taxReserveNeeded = round2(earningsAnalytics.totalEarnings * settings.taxReserveRate);
    const safeToSpend = round2(wealthAnalytics.totalCurrentBalance - taxReserveNeeded);
    const runwayBase = Math.max(safeToSpend, 0);
    const runwayMonths = settings.monthlyExpenseTarget > 0
      ? round2(runwayBase / settings.monthlyExpenseTarget)
      : null;
    const bufferGap = round2(safeToSpend - settings.minimumCashBuffer);

    return {
      monthlyExpenseTarget: settings.monthlyExpenseTarget,
      taxReserveRate: settings.taxReserveRate,
      minimumCashBuffer: settings.minimumCashBuffer,
      taxReserveNeeded,
      safeToSpend,
      runwayMonths,
      bufferGap,
      isBelowBuffer: bufferGap < 0,
    };
  }, [earningsAnalytics.totalEarnings, settings, wealthAnalytics.totalCurrentBalance]);

  return {
    isLoading,
    error,
    earnings,
    accounts,
    transfers,
    settings,
    runwayAnalytics,
    loadFinanceData,
    earningsAnalytics,
    wealthAnalytics,
  };
}
