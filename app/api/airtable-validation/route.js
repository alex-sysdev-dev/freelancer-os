import { NextResponse } from 'next/server';
import { fetchAllRecords } from '@/lib/airtable/client';
import { getAirtableSchema, pickRecordValue } from '@/lib/airtable/schema';
import {
  buildRateLookup,
  mapEarningRecord,
  parseProjectFromTags,
} from '@/lib/services/AirtableService';

function errorResponse(status, code, message, details = {}) {
  return NextResponse.json({ error: message, code, details }, { status });
}

export async function GET() {
  const schema = getAirtableSchema();

  const [earningsResponse, applicantsResponse] = await Promise.all([
    fetchAllRecords({ tableName: schema.tables.earnings }),
    fetchAllRecords({ tableName: schema.tables.applicants }),
  ]);

  if (!earningsResponse.ok) {
    return errorResponse(
      earningsResponse.status || 500,
      earningsResponse.error?.code || 'EARNINGS_VALIDATION_READ_FAILED',
      earningsResponse.error?.message || 'Unable to read earnings for validation',
      { table: schema.tables.earnings }
    );
  }

  if (!applicantsResponse.ok) {
    return errorResponse(
      applicantsResponse.status || 500,
      applicantsResponse.error?.code || 'APPLICANTS_VALIDATION_READ_FAILED',
      applicantsResponse.error?.message || 'Unable to read applicants for validation',
      { table: schema.tables.applicants }
    );
  }

  const lookupResult = await buildRateLookup(schema);
  const earningsFieldMap = schema.entities.earnings.fields;

  const missingProjectTags = [];
  const missingRates = [];

  for (const record of earningsResponse.data.records) {
    const mapped = mapEarningRecord(record, earningsFieldMap, lookupResult.lookup);
    const parsedProject = parseProjectFromTags(mapped.tags);

    if (!parsedProject) {
      missingProjectTags.push({
        id: mapped.id,
        platform: mapped.platform,
        tags: mapped.tags || '',
      });
      continue;
    }

    if (mapped.warning === 'missing_rate') {
      missingRates.push({
        id: mapped.id,
        platform: mapped.platform,
        project: mapped.project,
        hoursWorked: mapped.hoursWorked,
      });
    }
  }

  const applicantFields = schema.entities.applicants.fields;
  const applicantsMissingRequired = applicantsResponse.data.records
    .map((record) => {
      const fields = record?.fields || {};
      const missing = [];

      if (!pickRecordValue(fields, applicantFields.name)) missing.push('name');
      if (!pickRecordValue(fields, applicantFields.email)) missing.push('email');
      if (!pickRecordValue(fields, applicantFields.role)) missing.push('role');
      if (!pickRecordValue(fields, applicantFields.experience)) missing.push('experience');

      if (!missing.length) return null;

      return {
        id: record.id,
        missing,
      };
    })
    .filter(Boolean);

  return NextResponse.json({
    schemaVersion: process.env.AIRTABLE_SCHEMA_VERSION || 'v2_current',
    checkedAt: new Date().toISOString(),
    summary: {
      earningsChecked: earningsResponse.data.records.length,
      applicantsChecked: applicantsResponse.data.records.length,
      missingProjectTags: missingProjectTags.length,
      missingRates: missingRates.length,
      applicantsMissingRequired: applicantsMissingRequired.length,
      lookupIssues: lookupResult.issues.length,
    },
    details: {
      missingProjectTags,
      missingRates,
      applicantsMissingRequired,
      lookupIssues: lookupResult.issues,
    },
  });
}
