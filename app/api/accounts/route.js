import { NextResponse } from 'next/server';
import { supabaseRequest } from '@/lib/supabase/client';
import { mapAccountRow, toFiniteNumber } from '@/lib/services/SupabaseFinanceService';

function errorResponse(status, code, message, details = {}) {
  return NextResponse.json({ error: message, code, details }, { status });
}

export async function GET() {
  const response = await supabaseRequest('/accounts?select=*');

  if (!response.ok) {
    return errorResponse(
      response.status || 500,
      response.error?.code || 'ACCOUNTS_TABLE_READ_FAILED',
      response.error?.message || 'Unable to read accounts table',
      response.error?.details ? { details: response.error.details } : {}
    );
  }

  const rows = Array.isArray(response.data) ? response.data : [];
  const accounts = rows
    .map(mapAccountRow)
    .sort((a, b) => a.accountName.localeCompare(b.accountName));

  return NextResponse.json(accounts);
}

export async function POST(req) {
  let payload;
  try {
    payload = await req.json();
  } catch {
    return errorResponse(400, 'INVALID_JSON', 'Request body must be valid JSON');
  }

  const accountName = typeof payload?.accountName === 'string' ? payload.accountName.trim() : '';
  const type = typeof payload?.type === 'string' ? payload.type.trim() : '';
  const startingBalance = toFiniteNumber(payload?.startingBalance);

  if (!accountName) {
    return errorResponse(400, 'MISSING_REQUIRED_FIELDS', 'accountName is required');
  }

  const body = {
    account_name: accountName,
  };

  if (type) body.type = type;
  if (Number.isFinite(startingBalance)) body.starting_balance = startingBalance;

  const created = await supabaseRequest('/accounts?select=*', {
    method: 'POST',
    prefer: 'return=representation',
    body,
  });

  if (!created.ok) {
    return errorResponse(
      created.status || 500,
      created.error?.code || 'ACCOUNT_CREATE_FAILED',
      created.error?.message || 'Failed to create account',
      created.error?.details ? { details: created.error.details } : {}
    );
  }

  const row = Array.isArray(created.data) ? created.data[0] : created.data;
  return NextResponse.json({ success: true, id: row?.id });
}
