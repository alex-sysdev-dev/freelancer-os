import { NextResponse } from 'next/server';
import { supabaseRequest } from '@/lib/supabase/client';
import { mapTransferRow, sortByDateDesc, toFiniteNumber } from '@/lib/services/SupabaseFinanceService';

function errorResponse(status, code, message, details = {}) {
  return NextResponse.json({ error: message, code, details }, { status });
}

function isValidDateString(value) {
  if (typeof value !== 'string' || !value.trim()) return false;
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime());
}

function isValidWeekKey(value) {
  return typeof value === 'string' && /^\d{4}-W\d{2}$/i.test(value.trim());
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

async function resolveAccountId(accountInput) {
  if (!accountInput) return null;
  if (isUuid(accountInput)) return accountInput;

  const response = await supabaseRequest(
    `/accounts?select=id,account_name&account_name=ilike.${encodeURIComponent(accountInput)}`
  );

  if (!response.ok || !Array.isArray(response.data)) return null;

  const lowered = accountInput.trim().toLowerCase();
  const match = response.data.find((account) =>
    typeof account?.account_name === 'string' && account.account_name.trim().toLowerCase() === lowered
  );

  return match?.id || null;
}

export async function GET() {
  const response = await supabaseRequest('/transfers?select=*,accounts(account_name)');

  if (!response.ok) {
    return errorResponse(
      response.status || 500,
      response.error?.code || 'TRANSFERS_TABLE_READ_FAILED',
      response.error?.message || 'Unable to read transfers table',
      response.error?.details ? { details: response.error.details } : {}
    );
  }

  const rows = Array.isArray(response.data) ? response.data : [];
  return NextResponse.json(sortByDateDesc(rows.map(mapTransferRow)));
}

export async function POST(req) {
  let payload;
  try {
    payload = await req.json();
  } catch {
    return errorResponse(400, 'INVALID_JSON', 'Request body must be valid JSON');
  }

  const date = typeof payload?.date === 'string' ? payload.date.trim() : '';
  const accountInput = typeof payload?.accountId === 'string'
    ? payload.accountId.trim()
    : typeof payload?.account === 'string'
      ? payload.account.trim()
      : '';

  const category = typeof payload?.category === 'string' ? payload.category.trim() : 'Deposit';
  const source = typeof payload?.source === 'string' ? payload.source.trim() : 'Manual';
  const weekStartDate = typeof payload?.weekStartDate === 'string' ? payload.weekStartDate.trim() : '';
  const amount = toFiniteNumber(payload?.amount);

  if (!date || !isValidDateString(date) || !accountInput || !Number.isFinite(amount)) {
    return errorResponse(
      400,
      'MISSING_REQUIRED_FIELDS',
      'date, account/accountId, and amount are required and must be valid'
    );
  }

  if (weekStartDate && !isValidWeekKey(weekStartDate)) {
    return errorResponse(
      400,
      'INVALID_WEEK_KEY',
      'weekStartDate must be in the format YYYY-Www when provided'
    );
  }

  const accountId = await resolveAccountId(accountInput);

  if (!accountId) {
    return errorResponse(400, 'ACCOUNT_NOT_FOUND', 'Unable to resolve account record');
  }

  const body = {
    date,
    account_id: accountId,
    category,
    amount,
    source,
  };

  if (weekStartDate) body.week_start_date = weekStartDate;

  const created = await supabaseRequest('/transfers?select=*,accounts(account_name)', {
    method: 'POST',
    prefer: 'return=representation',
    body,
  });

  if (!created.ok) {
    return errorResponse(
      created.status || 500,
      created.error?.code || 'TRANSFER_CREATE_FAILED',
      created.error?.message || 'Failed to create transfer',
      created.error?.details ? { details: created.error.details } : {}
    );
  }

  const row = Array.isArray(created.data) ? created.data[0] : created.data;
  return NextResponse.json({ success: true, id: row?.id });
}
