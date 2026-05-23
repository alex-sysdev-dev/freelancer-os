import { NextResponse } from 'next/server';
import { supabaseRequest } from '@/lib/supabase/client';
import {
  mapFinanceSettingsRow,
  normalizeFinanceSettingsPayload,
} from '@/lib/services/SupabaseFinanceService';

function errorResponse(status, code, message, details = {}) {
  return NextResponse.json({ error: message, code, details }, { status });
}

function isMissingSettingsTable(response) {
  const message = response?.error?.message || '';
  return response?.error?.code === '42P01' || message.includes('finance_settings');
}

async function fetchCurrentSettings() {
  return supabaseRequest('/finance_settings?select=*&order=updated_at.desc&limit=1');
}

export async function GET() {
  const response = await fetchCurrentSettings();

  if (!response.ok) {
    if (isMissingSettingsTable(response)) {
      return NextResponse.json(mapFinanceSettingsRow(null));
    }

    return errorResponse(
      response.status || 500,
      response.error?.code || 'SETTINGS_READ_FAILED',
      response.error?.message || 'Unable to read finance settings',
      response.error?.details ? { details: response.error.details } : {}
    );
  }

  const rows = Array.isArray(response.data) ? response.data : [];
  return NextResponse.json(mapFinanceSettingsRow(rows[0] || null));
}

export async function POST(req) {
  let payload;
  try {
    payload = await req.json();
  } catch {
    return errorResponse(400, 'INVALID_JSON', 'Request body must be valid JSON');
  }

  const normalized = normalizeFinanceSettingsPayload(payload);
  if (!normalized.ok) {
    return errorResponse(400, 'INVALID_SETTINGS', normalized.errors.join(' | '));
  }

  const current = await fetchCurrentSettings();
  if (!current.ok && isMissingSettingsTable(current)) {
    return errorResponse(
      503,
      'SETTINGS_TABLE_MISSING',
      'finance_settings table is not available yet. Run the Supabase schema update before saving runway settings.'
    );
  }

  if (!current.ok) {
    return errorResponse(
      current.status || 500,
      current.error?.code || 'SETTINGS_READ_FAILED',
      current.error?.message || 'Unable to read finance settings before save',
      current.error?.details ? { details: current.error.details } : {}
    );
  }

  const rows = Array.isArray(current.data) ? current.data : [];
  const existing = rows[0];
  const savePath = existing?.id
    ? `/finance_settings?id=eq.${existing.id}&select=*`
    : '/finance_settings?select=*';

  const saved = await supabaseRequest(savePath, {
    method: existing?.id ? 'PATCH' : 'POST',
    prefer: 'return=representation',
    body: normalized.body,
  });

  if (!saved.ok) {
    return errorResponse(
      saved.status || 500,
      saved.error?.code || 'SETTINGS_SAVE_FAILED',
      saved.error?.message || 'Failed to save finance settings',
      saved.error?.details ? { details: saved.error.details } : {}
    );
  }

  const savedRows = Array.isArray(saved.data) ? saved.data : [];
  return NextResponse.json(mapFinanceSettingsRow(savedRows[0] || null));
}
