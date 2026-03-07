import { NextResponse } from 'next/server';
import { createRecord, fetchAllRecords } from '@/lib/airtable/client';
import {
  getAirtableSchema,
  getPreferredFieldName,
} from '@/lib/airtable/schema';
import {
  buildRateLookup,
  mapEarningRecord,
  parseProjectFromTags,
  sortByDateAsc,
  toFiniteNumber,
} from '@/lib/services/AirtableService';

function errorResponse(status, code, message, details = {}) {
  return NextResponse.json({ error: message, code, details }, { status });
}

export async function GET() {
  const schema = getAirtableSchema();
  const earningsResult = await fetchAllRecords({
    tableName: schema.tables.earnings,
  });

  if (!earningsResult.ok) {
    return errorResponse(
      earningsResult.status || 500,
      earningsResult.error?.code || 'EARNINGS_TABLE_READ_FAILED',
      earningsResult.error?.message || 'Unable to read earnings table',
      { table: schema.tables.earnings }
    );
  }

  const rateLookupResult = await buildRateLookup(schema);

  const normalized = earningsResult.data.records.map((record) =>
    mapEarningRecord(record, schema.entities.earnings.fields, rateLookupResult.lookup)
  );

  const sorted = sortByDateAsc(normalized);

  // Keep the route response array-shaped so existing UI consumers do not break.
  return NextResponse.json(
    sorted.map((entry) => {
      if (rateLookupResult.issues.length === 0) return entry;
      return {
        ...entry,
        lookupWarning: rateLookupResult.issues,
      };
    })
  );
}

export async function POST(req) {
  let payload;
  try {
    payload = await req.json();
  } catch {
    return errorResponse(400, 'INVALID_JSON', 'Request body must be valid JSON');
  }

  const platform = payload.platform || payload.source;
  const date = payload.date;
  const hoursWorked = toFiniteNumber(payload.hoursWorked ?? payload.amount);
  const providedProject = typeof payload.project === 'string' ? payload.project.trim() : '';
  let tags = typeof payload.tags === 'string' ? payload.tags.trim() : '';

  if (!platform || !date) {
    return errorResponse(
      400,
      'MISSING_REQUIRED_FIELDS',
      'platform/source and date are required'
    );
  }

  if (!Number.isFinite(hoursWorked)) {
    return errorResponse(
      400,
      'INVALID_HOURS',
      'hoursWorked (or amount) must be a valid number'
    );
  }

  if (!tags && providedProject) {
    tags = providedProject;
  }

  if (tags && !parseProjectFromTags(tags)) {
    return errorResponse(
      400,
      'INVALID_TAG_FORMAT',
      'Tags must include a project value'
    );
  }

  const schema = getAirtableSchema();
  const fields = {
    [getPreferredFieldName(schema, 'earnings', 'platform')]: platform,
    [getPreferredFieldName(schema, 'earnings', 'hoursWorked')]: hoursWorked,
    [getPreferredFieldName(schema, 'earnings', 'date')]: date,
  };

  if (tags) {
    fields[getPreferredFieldName(schema, 'earnings', 'tags')] = tags;
  }

  if (payload.status) {
    fields[getPreferredFieldName(schema, 'earnings', 'status')] = payload.status;
  }

  const created = await createRecord({
    tableName: schema.tables.earnings,
    fields,
  });

  if (!created.ok) {
    return errorResponse(
      created.status || 500,
      created.error?.code || 'EARNINGS_CREATE_FAILED',
      created.error?.message || 'Failed to create earnings entry',
      { table: schema.tables.earnings }
    );
  }

  return NextResponse.json({
    id: created.data?.id,
    source: platform,
    amount: hoursWorked,
    date,
    platform,
    project: parseProjectFromTags(tags),
    hoursWorked,
    ratePerHour: null,
    tags: tags || '',
    status: payload.status || null,
  });
}
