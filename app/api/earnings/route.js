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

function uniqueValues(values) {
  const seen = new Set();
  const result = [];
  for (const value of values) {
    if (value === undefined) continue;
    const key = JSON.stringify(value);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(value);
  }
  return result;
}

function normalizeTagText(value) {
  if (typeof value !== 'string') return '';
  return value.trim();
}

function buildTagVariants(rawTags) {
  const tagText = normalizeTagText(rawTags);
  if (!tagText) return [];

  const splitTags = tagText
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);

  return uniqueValues([tagText, splitTags.length ? splitTags : undefined]);
}

async function createEarningWithFallbacks({
  tableName,
  fieldsByLogicalName,
  statusValue,
}) {
  const errors = [];

  const { platformField, hoursField, dateField, tagsField, statusField } = fieldsByLogicalName;
  const statusCandidates = uniqueValues([statusValue, undefined]);

  const attempts = [];
  for (const hours of fieldsByLogicalName.hoursCandidates) {
    for (const tags of fieldsByLogicalName.tagCandidates) {
      for (const status of statusCandidates) {
        const fields = {
          [platformField]: fieldsByLogicalName.platformValue,
          [hoursField]: hours,
          [dateField]: fieldsByLogicalName.dateValue,
        };

        if (tags !== undefined && tags !== '') {
          fields[tagsField] = tags;
        }

        if (status !== undefined && status !== '' && statusField) {
          fields[statusField] = status;
        }

        attempts.push(fields);
      }
    }
  }

  for (const fields of attempts) {
    const result = await createRecord({
      tableName,
      fields,
      typecast: true,
    });

    if (result.ok) {
      return { ok: true, result };
    }

    errors.push(result.error?.message || 'Unknown Airtable create failure');
  }

  return { ok: false, errors };
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
  const providedTags = typeof payload.tags === 'string' ? payload.tags.trim() : '';

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

  const tagText = providedTags || providedProject;
  const tagVariants = buildTagVariants(tagText);

  if (tagText && !parseProjectFromTags(tagText)) {
    return errorResponse(
      400,
      'INVALID_TAG_FORMAT',
      'Tags must include a project value'
    );
  }

  const schema = getAirtableSchema();
  const prefersDuration = process.env.AIRTABLE_HOURS_IS_DURATION !== 'false';
  const hoursAsSeconds = Math.round(hoursWorked * 3600);
  const hoursCandidates = prefersDuration
    ? uniqueValues([hoursAsSeconds, hoursWorked])
    : uniqueValues([hoursWorked, hoursAsSeconds]);

  const statusValue = payload.status || 'Paid';
  const created = await createEarningWithFallbacks({
    tableName: schema.tables.earnings,
    fieldsByLogicalName: {
      platformField: getPreferredFieldName(schema, 'earnings', 'platform'),
      hoursField: getPreferredFieldName(schema, 'earnings', 'hoursWorked'),
      dateField: getPreferredFieldName(schema, 'earnings', 'date'),
      tagsField: getPreferredFieldName(schema, 'earnings', 'tags'),
      statusField: getPreferredFieldName(schema, 'earnings', 'status'),
      platformValue: platform,
      dateValue: date,
      hoursCandidates,
      tagCandidates: uniqueValues([...tagVariants, undefined]),
    },
    statusValue,
  });

  if (!created.ok) {
    return errorResponse(
      500,
      'EARNINGS_CREATE_FAILED',
      'Failed to create earnings entry',
      {
        table: schema.tables.earnings,
        attempts: created.errors,
      }
    );
  }

  return NextResponse.json({
    id: created.result.data?.id,
    source: platform,
    amount: hoursWorked,
    date,
    platform,
    project: parseProjectFromTags(tagText),
    hoursWorked,
    ratePerHour: null,
    tags: tagText || '',
    status: statusValue,
  });
}
