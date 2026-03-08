import { NextResponse } from 'next/server';
import { createRecord, fetchAllRecords } from '@/lib/airtable/client';
import { getAirtableSchema, getPreferredFieldName } from '@/lib/airtable/schema';
import { mapAccountRecord, toFiniteNumber } from '@/lib/services/AirtableService';

function errorResponse(status, code, message, details = {}) {
  return NextResponse.json({ error: message, code, details }, { status });
}

export async function GET() {
  const schema = getAirtableSchema();
  const response = await fetchAllRecords({ tableName: schema.tables.accounts });

  if (!response.ok) {
    return errorResponse(
      response.status || 500,
      response.error?.code || 'ACCOUNTS_TABLE_READ_FAILED',
      response.error?.message || 'Unable to read accounts table',
      { table: schema.tables.accounts }
    );
  }

  const accounts = response.data.records
    .map((record) => mapAccountRecord(record, schema.entities.accounts.fields))
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

  const schema = getAirtableSchema();
  const fieldName = (logicalField) => getPreferredFieldName(schema, 'accounts', logicalField);

  const fields = {
    [fieldName('name')]: accountName,
  };

  if (type) fields[fieldName('type')] = type;
  if (Number.isFinite(startingBalance)) fields[fieldName('startingBalance')] = startingBalance;

  const created = await createRecord({
    tableName: schema.tables.accounts,
    fields,
    typecast: true,
  });

  if (!created.ok) {
    return errorResponse(
      created.status || 500,
      created.error?.code || 'ACCOUNT_CREATE_FAILED',
      created.error?.message || 'Failed to create account',
      { table: schema.tables.accounts }
    );
  }

  return NextResponse.json({ success: true, id: created.data?.id });
}
