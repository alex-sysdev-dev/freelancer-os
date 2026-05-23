import { NextResponse } from 'next/server';
import { supabaseRequest } from '@/lib/supabase/client';
import { mapEarningRow, sortByDateAsc, toFiniteNumber } from '@/lib/services/SupabaseFinanceService';

function errorResponse(status, code, message, details = {}) {
  return NextResponse.json({ error: message, code, details }, { status });
}

function isValidDateString(value) {
  if (typeof value !== 'string' || !value.trim()) return false;
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime());
}

export async function GET() {
  const response = await supabaseRequest('/earnings?select=*');

  if (!response.ok) {
    return errorResponse(
      response.status || 500,
      response.error?.code || 'EARNINGS_TABLE_READ_FAILED',
      response.error?.message || 'Unable to read earnings table',
      response.error?.details ? { details: response.error.details } : {}
    );
  }

  const rows = Array.isArray(response.data) ? response.data : [];
  return NextResponse.json(sortByDateAsc(rows.map(mapEarningRow)));
}

export async function POST(req) {
  let payload;
  try {
    payload = await req.json();
  } catch {
    return errorResponse(400, 'INVALID_JSON', 'Request body must be valid JSON');
  }

  const platform = typeof payload?.platform === 'string' ? payload.platform.trim() : '';
  const project = typeof payload?.project === 'string' ? payload.project.trim() : '';
  const date = typeof payload?.date === 'string' ? payload.date.trim() : '';
  const hoursWorked = toFiniteNumber(payload?.hoursWorked);
  const ratePerHour = toFiniteNumber(payload?.ratePerHour);

  if (!platform || !project || !date || !isValidDateString(date)) {
    return errorResponse(
      400,
      'MISSING_REQUIRED_FIELDS',
      'platform, project, and a valid date are required'
    );
  }

  if (!Number.isFinite(hoursWorked) || !Number.isFinite(ratePerHour)) {
    return errorResponse(
      400,
      'INVALID_NUMERIC_FIELDS',
      'hoursWorked and ratePerHour must be valid numbers'
    );
  }

  const created = await supabaseRequest('/earnings?select=*', {
    method: 'POST',
    prefer: 'return=representation',
    body: {
      date,
      platform,
      project,
      hours_worked: hoursWorked,
      rate_per_hour: ratePerHour,
    },
  });

  if (!created.ok) {
    return errorResponse(
      created.status || 500,
      created.error?.code || 'EARNINGS_CREATE_FAILED',
      created.error?.message || 'Failed to create earnings entry',
      created.error?.details ? { details: created.error.details } : {}
    );
  }

  const row = Array.isArray(created.data) ? created.data[0] : created.data;
  return NextResponse.json(mapEarningRow(row || {
    id: null,
    date,
    platform,
    project,
    hours_worked: hoursWorked,
    rate_per_hour: ratePerHour,
  }));
}
