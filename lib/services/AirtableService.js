import { pickRecordValue } from "@/lib/airtable/schema";

export function toFiniteNumber(value) {
  if (Array.isArray(value)) {
    for (const item of value) {
      const parsed = toFiniteNumber(item);
      if (Number.isFinite(parsed)) return parsed;
    }
    return null;
  }

  if (value === null || value === undefined) return null;

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  if (trimmed.includes(":")) {
    const parts = trimmed.split(":").map((part) => Number(part));
    if (parts.every((part) => Number.isFinite(part))) {
      if (parts.length === 2) {
        const [hours, minutes] = parts;
        return hours + minutes / 60;
      }
      if (parts.length === 3) {
        const [hours, minutes, seconds] = parts;
        return hours + minutes / 60 + seconds / 3600;
      }
    }
  }

  const numberLike = trimmed.match(/-?\d+(?:,\d{3})*(?:\.\d+)?/);
  if (numberLike) {
    const parsed = Number(numberLike[0].replace(/,/g, ""));
    return Number.isFinite(parsed) ? parsed : null;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

export function toHoursWorked(value) {
  const parsed = toFiniteNumber(value);
  if (!Number.isFinite(parsed)) return null;

  // Airtable Duration values are stored as seconds in API responses.
  if (Number.isInteger(parsed) && parsed >= 600) {
    return parsed / 3600;
  }

  return parsed;
}

function toLinkedRecordName(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "")).filter(Boolean).join(", ");
  }

  if (typeof value === "string") return value;
  return null;
}

function safeDate(value) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function dateFromWeekKey(value) {
  if (typeof value !== "string") return null;
  const match = /^(\d{4})-W(\d{2})$/i.exec(value.trim());
  if (!match) return null;

  const year = Number(match[1]);
  const week = Number(match[2]);
  if (!Number.isFinite(year) || !Number.isFinite(week) || week < 1 || week > 53) return null;

  // ISO week: Jan 4th is always in week 1.
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7;
  const weekOneMonday = new Date(jan4);
  weekOneMonday.setUTCDate(jan4.getUTCDate() - jan4Day + 1);
  weekOneMonday.setUTCDate(weekOneMonday.getUTCDate() + (week - 1) * 7);
  return weekOneMonday;
}

export function mapEarningRecord(record, earningsFieldMap) {
  const fields = record?.fields || {};

  const weekStartDate = pickRecordValue(fields, earningsFieldMap.weekStartDate) || null;
  const recordCreatedTime = pickRecordValue(fields, earningsFieldMap.recordCreatedTime) || null;
  const date =
    pickRecordValue(fields, earningsFieldMap.date) ||
    recordCreatedTime ||
    weekStartDate ||
    null;

  const platform = pickRecordValue(fields, earningsFieldMap.platform) || "Unknown";
  const project = pickRecordValue(fields, earningsFieldMap.project) || platform || "Unassigned";
  const hoursWorked = toHoursWorked(pickRecordValue(fields, earningsFieldMap.hoursWorked));
  const ratePerHour = toFiniteNumber(pickRecordValue(fields, earningsFieldMap.ratePerHour));
  const calculatedEarnings = toFiniteNumber(pickRecordValue(fields, earningsFieldMap.calculatedEarnings));

  const amount =
    Number.isFinite(calculatedEarnings)
      ? calculatedEarnings
      : Number.isFinite(hoursWorked) && Number.isFinite(ratePerHour)
        ? Math.round(hoursWorked * ratePerHour * 100) / 100
        : 0;

  return {
    id: record.id,
    date,
    dateObj: safeDate(date) || dateFromWeekKey(weekStartDate),
    platform,
    project,
    hoursWorked,
    ratePerHour,
    amount,
    weekStartDate,
    recordCreatedTime,
    oneMonthForecast: toFiniteNumber(pickRecordValue(fields, earningsFieldMap.oneMonthForecast)) || 0,
    twoWeekForecast: toFiniteNumber(pickRecordValue(fields, earningsFieldMap.twoWeekForecast)) || 0,
    sixMonthForecast: toFiniteNumber(pickRecordValue(fields, earningsFieldMap.sixMonthForecast)) || 0,
  };
}

export function mapAccountRecord(record, accountsFieldMap) {
  const fields = record?.fields || {};
  const parsedStartingBalance = toFiniteNumber(pickRecordValue(fields, accountsFieldMap.startingBalance));
  const parsedNetTransfers = toFiniteNumber(pickRecordValue(fields, accountsFieldMap.netTransfers));
  const parsedCurrentBalance = toFiniteNumber(pickRecordValue(fields, accountsFieldMap.currentBalance));

  return {
    id: record.id,
    accountName: pickRecordValue(fields, accountsFieldMap.name) || "Unnamed Account",
    type: pickRecordValue(fields, accountsFieldMap.type) || "Uncategorized",
    startingBalance: Number.isFinite(parsedStartingBalance) ? parsedStartingBalance : 0,
    netTransfers: Number.isFinite(parsedNetTransfers) ? parsedNetTransfers : 0,
    currentBalance: Number.isFinite(parsedCurrentBalance) ? parsedCurrentBalance : 0,
    hasNetTransfers: Number.isFinite(parsedNetTransfers),
    hasCurrentBalance: Number.isFinite(parsedCurrentBalance),
    linkedTransfers: pickRecordValue(fields, accountsFieldMap.transfers) || [],
  };
}

export function mapTransferRecord(record, transfersFieldMap) {
  const fields = record?.fields || {};
  const preferredAccountName = pickRecordValue(fields, transfersFieldMap.accountName);
  const linkedAccountName = toLinkedRecordName(pickRecordValue(fields, transfersFieldMap.account));

  return {
    id: record.id,
    date: pickRecordValue(fields, transfersFieldMap.date) || null,
    dateObj: safeDate(pickRecordValue(fields, transfersFieldMap.date)),
    account: preferredAccountName || linkedAccountName || "Unknown Account",
    category: pickRecordValue(fields, transfersFieldMap.category) || "Deposit",
    amount: toFiniteNumber(pickRecordValue(fields, transfersFieldMap.amount)) || 0,
    signedAmount: toFiniteNumber(pickRecordValue(fields, transfersFieldMap.signedAmount)) || 0,
    source: pickRecordValue(fields, transfersFieldMap.source) || "Manual",
    weekStartDate: pickRecordValue(fields, transfersFieldMap.weekStartDate) || null,
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
