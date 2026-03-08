import { NextResponse } from 'next/server';
import { createRecord, fetchAllRecords } from '@/lib/airtable/client';
import { getAirtableSchema, getPreferredFieldName, pickRecordValue } from '@/lib/airtable/schema';
import { mapTransferRecord, sortByDateDesc, toFiniteNumber } from '@/lib/services/AirtableService';

function errorResponse(status, code, message, details = {}) {
  return NextResponse.json({ error: message, code, details }, { status });
}

function buildAccountNameByIdMap(accountsRecords, schema) {
  const map = new Map();
  const nameCandidates = schema.entities.accounts.fields.name;

  for (const record of accountsRecords || []) {
    const fields = record?.fields || {};
    const accountName = pickRecordValue(fields, nameCandidates);
    if (typeof accountName === 'string' && accountName.trim()) {
      map.set(record.id, accountName.trim());
    }
  }

  return map;
}

function resolveAccountDisplayName(value, accountNameById) {
  if (Array.isArray(value)) {
    const resolved = value
      .map((item) => resolveAccountDisplayName(item, accountNameById))
      .filter(Boolean);
    return resolved.join(', ');
  }

  if (typeof value !== 'string') return 'Unknown Account';

  const trimmed = value.trim();
  if (!trimmed) return 'Unknown Account';

  const parts = trimmed.split(',').map((part) => part.trim()).filter(Boolean);
  const resolvedParts = parts.map((part) => accountNameById.get(part) || part);

  return resolvedParts.join(', ');
}

async function resolveAccountRecordId(accountInput, schema) {
  if (!accountInput) return null;
  if (/^rec[a-zA-Z0-9]+$/.test(accountInput)) return accountInput;

  const accountsResponse = await fetchAllRecords({ tableName: schema.tables.accounts });
  if (!accountsResponse.ok) return null;

  const nameCandidates = schema.entities.accounts.fields.name;
  const lowered = accountInput.trim().toLowerCase();

  const match = accountsResponse.data.records.find((record) => {
    const value = pickRecordValue(record.fields || {}, nameCandidates);
    return typeof value === 'string' && value.trim().toLowerCase() === lowered;
  });

  return match?.id || null;
}

export async function GET() {
  const schema = getAirtableSchema();
  const [transfersResponse, accountsResponse] = await Promise.all([
    fetchAllRecords({ tableName: schema.tables.transfers }),
    fetchAllRecords({ tableName: schema.tables.accounts }),
  ]);

  if (!transfersResponse.ok) {
    return errorResponse(
      transfersResponse.status || 500,
      transfersResponse.error?.code || 'TRANSFERS_TABLE_READ_FAILED',
      transfersResponse.error?.message || 'Unable to read transfers table',
      { table: schema.tables.transfers }
    );
  }

  const accountNameById = accountsResponse.ok
    ? buildAccountNameByIdMap(accountsResponse.data.records, schema)
    : new Map();

  const transfers = sortByDateDesc(
    transfersResponse.data.records
      .map((record) => mapTransferRecord(record, schema.entities.transfers.fields))
      .map((transfer) => ({
        ...transfer,
        account: resolveAccountDisplayName(transfer.account, accountNameById),
      }))
  );

  return NextResponse.json(transfers);
}

export async function POST(req) {
  let payload;
  try {
    payload = await req.json();
  } catch {
    return errorResponse(400, 'INVALID_JSON', 'Request body must be valid JSON');
  }

  const date = payload?.date;
  const accountInput = typeof payload?.accountId === 'string'
    ? payload.accountId
    : typeof payload?.account === 'string'
      ? payload.account
      : '';

  const category = typeof payload?.category === 'string' ? payload.category.trim() : 'Deposit';
  const source = typeof payload?.source === 'string' ? payload.source.trim() : 'Manual';
  const weekStartDate = typeof payload?.weekStartDate === 'string' ? payload.weekStartDate.trim() : '';
  const amount = toFiniteNumber(payload?.amount);

  if (!date || !accountInput || !Number.isFinite(amount)) {
    return errorResponse(
      400,
      'MISSING_REQUIRED_FIELDS',
      'date, account/accountId, and amount are required'
    );
  }

  const schema = getAirtableSchema();
  const accountRecordId = await resolveAccountRecordId(accountInput, schema);

  if (!accountRecordId) {
    return errorResponse(400, 'ACCOUNT_NOT_FOUND', 'Unable to resolve account record');
  }

  const fieldName = (logicalField) => getPreferredFieldName(schema, 'transfers', logicalField);

  const fields = {
    [fieldName('date')]: date,
    [fieldName('account')]: [accountRecordId],
    [fieldName('category')]: category,
    [fieldName('amount')]: amount,
    [fieldName('source')]: source,
  };

  if (weekStartDate) {
    fields[fieldName('weekStartDate')] = weekStartDate;
  }

  const created = await createRecord({
    tableName: schema.tables.transfers,
    fields,
    typecast: true,
  });

  if (!created.ok) {
    return errorResponse(
      created.status || 500,
      created.error?.code || 'TRANSFER_CREATE_FAILED',
      created.error?.message || 'Failed to create transfer',
      { table: schema.tables.transfers }
    );
  }

  return NextResponse.json({ success: true, id: created.data?.id });
}
