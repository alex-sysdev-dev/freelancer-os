import { NextResponse } from 'next/server';
import { createRecord, fetchAllRecords } from '@/lib/airtable/client';
import { getAirtableSchema, getPreferredFieldName } from '@/lib/airtable/schema';
import { mapEarningRecord, sortByDateAsc, toFiniteNumber } from '@/lib/services/AirtableService';

function errorResponse(status, code, message, details = {}) {
  return NextResponse.json({ error: message, code, details }, { status });
}

function uniqueValues(values) {
  const seen = new Set();
  const output = [];

  for (const value of values) {
    if (value === undefined || value === null || value === '') continue;

    const key = JSON.stringify(value);
    if (seen.has(key)) continue;

    seen.add(key);
    output.push(value);
  }

  return output;
}

async function createWithFieldFallbacks({ tableName, attempts }) {
  const errors = [];

  for (const fields of attempts) {
    const result = await createRecord({
      tableName,
      fields,
      typecast: true,
    });

    if (result.ok) return result;
    errors.push(result.error?.message || 'Unknown Airtable create failure');
  }

  return {
    ok: false,
    status: 500,
    error: {
      code: 'EARNINGS_CREATE_FAILED',
      message: errors.join(' | '),
    },
  };
}

export async function GET() {
  const schema = getAirtableSchema();
  const response = await fetchAllRecords({ tableName: schema.tables.earnings });

  if (!response.ok) {
    return errorResponse(
      response.status || 500,
      response.error?.code || 'EARNINGS_TABLE_READ_FAILED',
      response.error?.message || 'Unable to read earnings table',
      { table: schema.tables.earnings }
    );
  }

  const mapped = response.data.records.map((record) =>
    mapEarningRecord(record, schema.entities.earnings.fields)
  );

  return NextResponse.json(sortByDateAsc(mapped));
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
  const date = payload?.date;
  const hoursWorked = toFiniteNumber(payload?.hoursWorked);
  const ratePerHour = toFiniteNumber(payload?.ratePerHour);

  if (!platform || !project || !date) {
    return errorResponse(
      400,
      'MISSING_REQUIRED_FIELDS',
      'platform, project, and date are required'
    );
  }

  if (!Number.isFinite(hoursWorked) || !Number.isFinite(ratePerHour)) {
    return errorResponse(
      400,
      'INVALID_NUMERIC_FIELDS',
      'hoursWorked and ratePerHour must be valid numbers'
    );
  }

  const schema = getAirtableSchema();
  const fieldName = (logicalField) => getPreferredFieldName(schema, 'earnings', logicalField);

  const prefersDuration = process.env.AIRTABLE_HOURS_IS_DURATION !== 'false';
  const hoursAsSeconds = Math.round(hoursWorked * 3600);
  const hoursCandidates = prefersDuration
    ? uniqueValues([hoursAsSeconds, hoursWorked])
    : uniqueValues([hoursWorked, hoursAsSeconds]);

  const attempts = hoursCandidates.map((hoursValue) => ({
    [fieldName('date')]: date,
    [fieldName('platform')]: platform,
    [fieldName('project')]: project,
    [fieldName('hoursWorked')]: hoursValue,
    [fieldName('ratePerHour')]: ratePerHour,
  }));

  const created = await createWithFieldFallbacks({
    tableName: schema.tables.earnings,
    attempts,
  });

  if (!created.ok) {
    return errorResponse(
      created.status || 500,
      created.error?.code || 'EARNINGS_CREATE_FAILED',
      created.error?.message || 'Failed to create earnings entry',
      {
        table: schema.tables.earnings,
      }
    );
  }

  return NextResponse.json({
    id: created.data?.id,
    date,
    platform,
    project,
    hoursWorked,
    ratePerHour,
    amount: Math.round(hoursWorked * ratePerHour * 100) / 100,
  });
}
