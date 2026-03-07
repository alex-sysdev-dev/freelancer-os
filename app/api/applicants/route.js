import { NextResponse } from 'next/server';
import { createRecord, fetchAllRecords } from '@/lib/airtable/client';
import {
  getAirtableSchema,
  getPreferredFieldName,
  pickRecordValue,
} from '@/lib/airtable/schema';

function errorResponse(status, code, message, details = {}) {
  return NextResponse.json({ error: message, code, details }, { status });
}

export async function GET() {
  const schema = getAirtableSchema();
  const fields = schema.entities.applicants.fields;

  const response = await fetchAllRecords({ tableName: schema.tables.applicants });

  if (!response.ok) {
    return errorResponse(
      response.status || 500,
      response.error?.code || 'CLIENTS_READ_FAILED',
      response.error?.message || 'Unable to read client records',
      { table: schema.tables.applicants }
    );
  }

  const rows = response.data.records.map((record) => ({
    id: record.id,
    name: pickRecordValue(record.fields, fields.name) || 'Unnamed Client',
    email: pickRecordValue(record.fields, fields.email) || '',
    role: pickRecordValue(record.fields, fields.role) || '',
    experience: pickRecordValue(record.fields, fields.experience) || '',
    status: pickRecordValue(record.fields, fields.status) || 'Unknown',
  }));

  return NextResponse.json(rows);
}

export async function POST(req) {
  let payload;
  try {
    payload = await req.json();
  } catch {
    return errorResponse(400, 'INVALID_JSON', 'Request body must be valid JSON');
  }

  if (!payload?.name || !payload?.email || !payload?.role || !payload?.experience) {
    return errorResponse(
      400,
      'MISSING_REQUIRED_FIELDS',
      'name, email, role, and experience are required'
    );
  }

  const schema = getAirtableSchema();
  const fieldName = (logicalField) => getPreferredFieldName(schema, 'applicants', logicalField);

  const createResponse = await createRecord({
    tableName: schema.tables.applicants,
    fields: {
      [fieldName('name')]: payload.name,
      [fieldName('email')]: payload.email,
      [fieldName('role')]: payload.role,
      [fieldName('experience')]: payload.experience,
      [fieldName('status')]: payload.status || 'New',
    },
  });

  if (!createResponse.ok) {
    return errorResponse(
      createResponse.status || 500,
      createResponse.error?.code || 'CLIENT_CREATE_FAILED',
      createResponse.error?.message || 'Unable to create client',
      { table: schema.tables.applicants }
    );
  }

  return NextResponse.json({ success: true, id: createResponse.data?.id });
}
