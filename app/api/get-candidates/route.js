import { NextResponse } from 'next/server';
import { fetchAllRecords } from '@/lib/airtable/client';
import { getAirtableSchema, pickRecordValue } from '@/lib/airtable/schema';

function errorResponse(status, code, message, details = {}) {
  return NextResponse.json({ error: message, code, details }, { status });
}

export async function GET() {
  const schema = getAirtableSchema();
  const applicantsConfig = schema.entities.applicants.fields;

  const response = await fetchAllRecords({ tableName: schema.tables.applicants });

  if (!response.ok) {
    return errorResponse(
      response.status || 500,
      response.error?.code || 'APPLICANTS_READ_FAILED',
      response.error?.message || 'Unable to read applicants table',
      { table: schema.tables.applicants }
    );
  }

  const formatted = response.data.records.map((record) => {
    const fields = record?.fields || {};
    const resumeValue = pickRecordValue(fields, applicantsConfig.resume);

    return {
      id: record.id,
      name: pickRecordValue(fields, applicantsConfig.name) || 'Unnamed Client',
      email: pickRecordValue(fields, applicantsConfig.email) || 'No Email',
      role: pickRecordValue(fields, applicantsConfig.role) || 'General',
      experience: pickRecordValue(fields, applicantsConfig.experience) || 'No details provided',
      status: pickRecordValue(fields, applicantsConfig.status) || 'Unknown',
      resumeUrl: Array.isArray(resumeValue)
        ? resumeValue[0]?.url || '#'
        : typeof resumeValue === 'string'
          ? resumeValue
          : '#',
    };
  });

  return NextResponse.json(formatted);
}
