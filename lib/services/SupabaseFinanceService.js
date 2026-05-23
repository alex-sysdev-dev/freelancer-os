function safeDate(value) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

export function toFiniteNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function mapEarningRow(row) {
  const hoursWorked = toFiniteNumber(row?.hours_worked) || 0;
  const ratePerHour = toFiniteNumber(row?.rate_per_hour) || 0;
  const amount = toFiniteNumber(row?.amount);

  return {
    id: row.id,
    date: row.date || null,
    dateObj: safeDate(row.date),
    platform: row.platform || 'Unknown',
    project: row.project || row.platform || 'Unassigned',
    hoursWorked,
    ratePerHour,
    amount: Number.isFinite(amount) ? amount : Math.round(hoursWorked * ratePerHour * 100) / 100,
    weekStartDate: row.week_start_date || null,
    recordCreatedTime: row.created_at || null,
    oneMonthForecast: toFiniteNumber(row.one_month_forecast) || 0,
    twoWeekForecast: toFiniteNumber(row.two_week_forecast) || 0,
    sixMonthForecast: toFiniteNumber(row.six_month_forecast) || 0,
  };
}

export function mapAccountRow(row) {
  const netTransfers = toFiniteNumber(row?.net_transfers);
  const currentBalance = toFiniteNumber(row?.current_balance);

  return {
    id: row.id,
    accountName: row.account_name || 'Unnamed Account',
    type: row.type || 'Uncategorized',
    startingBalance: toFiniteNumber(row.starting_balance) || 0,
    netTransfers: Number.isFinite(netTransfers) ? netTransfers : 0,
    currentBalance: Number.isFinite(currentBalance) ? currentBalance : 0,
    hasNetTransfers: Number.isFinite(netTransfers),
    hasCurrentBalance: Number.isFinite(currentBalance),
    linkedTransfers: [],
  };
}

export function mapTransferRow(row) {
  const accountName = row?.accounts?.account_name;

  return {
    id: row.id,
    date: row.date || null,
    dateObj: safeDate(row.date),
    account: accountName || row.account_id || 'Unknown Account',
    accountId: row.account_id || null,
    category: row.category || 'Deposit',
    amount: toFiniteNumber(row.amount) || 0,
    signedAmount: toFiniteNumber(row.signed_amount) || 0,
    source: row.source || 'Manual',
    weekStartDate: row.week_start_date || null,
  };
}

export function sortByDateAsc(records) {
  return [...records].sort((a, b) => {
    const left = a?.dateObj ? a.dateObj.getTime() : Number.POSITIVE_INFINITY;
    const right = b?.dateObj ? b.dateObj.getTime() : Number.POSITIVE_INFINITY;
    return left - right;
  });
}

export function sortByDateDesc(records) {
  return [...records].sort((a, b) => {
    const left = a?.dateObj ? a.dateObj.getTime() : Number.NEGATIVE_INFINITY;
    const right = b?.dateObj ? b.dateObj.getTime() : Number.NEGATIVE_INFINITY;
    return right - left;
  });
}


export const DEFAULT_FINANCE_SETTINGS = {
  monthlyExpenseTarget: 3200,
  taxReserveRate: 0.25,
  minimumCashBuffer: 5000,
};

function toNonNegativeNumber(value, fallback = 0) {
  const parsed = toFiniteNumber(value);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return parsed;
}

export function mapFinanceSettingsRow(row) {
  if (!row) {
    return {
      id: null,
      ...DEFAULT_FINANCE_SETTINGS,
      configured: false,
    };
  }

  return {
    id: row.id || null,
    monthlyExpenseTarget: toNonNegativeNumber(row.monthly_expense_target, DEFAULT_FINANCE_SETTINGS.monthlyExpenseTarget),
    taxReserveRate: toNonNegativeNumber(row.tax_reserve_rate, DEFAULT_FINANCE_SETTINGS.taxReserveRate),
    minimumCashBuffer: toNonNegativeNumber(row.minimum_cash_buffer, DEFAULT_FINANCE_SETTINGS.minimumCashBuffer),
    configured: true,
  };
}

export function normalizeFinanceSettingsPayload(payload) {
  const errors = [];
  const monthlyExpenseTarget = toFiniteNumber(payload?.monthlyExpenseTarget);
  const minimumCashBuffer = toFiniteNumber(payload?.minimumCashBuffer);
  let taxReserveRate = toFiniteNumber(payload?.taxReserveRate);

  if (Number.isFinite(taxReserveRate) && taxReserveRate > 1) {
    taxReserveRate = taxReserveRate / 100;
  }

  if (!Number.isFinite(monthlyExpenseTarget) || monthlyExpenseTarget < 0) {
    errors.push('monthlyExpenseTarget must be a non-negative number');
  }

  if (!Number.isFinite(taxReserveRate) || taxReserveRate < 0 || taxReserveRate > 1) {
    errors.push('taxReserveRate must be between 0 and 1, or between 0 and 100 when entered as a percent');
  }

  if (!Number.isFinite(minimumCashBuffer) || minimumCashBuffer < 0) {
    errors.push('minimumCashBuffer must be a non-negative number');
  }

  return {
    ok: errors.length === 0,
    errors,
    body: {
      monthly_expense_target: monthlyExpenseTarget,
      tax_reserve_rate: taxReserveRate,
      minimum_cash_buffer: minimumCashBuffer,
    },
  };
}
