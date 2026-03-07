import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { createRecord } from '@/lib/airtable/client';
import {
  getAirtableSchema,
  getFieldCandidates,
  getPreferredFieldName,
} from '@/lib/airtable/schema';

function errorResponse(status, code, message, details = {}) {
  return NextResponse.json({ error: message, code, details }, { status });
}

function buildApplicantFields({ schema, variantIndex, payload }) {
  const field = (logicalField) =>
    getPreferredFieldName(schema, 'applicants', logicalField, variantIndex);

  const fields = {
    [field('name')]: payload.name,
    [field('email')]: payload.email,
    [field('role')]: payload.role,
    [field('experience')]: payload.experience,
    [field('status')]: payload.status || 'New',
  };

  if (payload.resumeUrl) {
    fields[field('resume')] = [{ url: payload.resumeUrl }];
  }

  return fields;
}

function hasAlternateCandidate(schema, logicalField) {
  return getFieldCandidates(schema, 'applicants', logicalField).length > 1;
}

function shouldRetryWithAlternateFields(response) {
  if (!response?.error) return false;

  const message = response.error.message || '';
  const type = response.error.type || '';
  return /unknown field name/i.test(message) || /unknown_field_name/i.test(type);
}

export async function POST(req) {
  const schema = getAirtableSchema();

  try {
    const formData = await req.formData();
    const file = formData.get('resume');

    const payload = {
      name: formData.get('name'),
      email: formData.get('email'),
      role: formData.get('role'),
      experience: formData.get('experience'),
      status: formData.get('status') || 'New',
      resumeUrl: null,
    };

    if (!payload.name || !payload.email || !payload.role || !payload.experience) {
      return errorResponse(
        400,
        'MISSING_REQUIRED_FIELDS',
        'name, email, role, and experience are required'
      );
    }

    if (file && typeof file === 'object' && typeof file.name === 'string' && file.size > 0) {
      const blob = await put(file.name, file, {
        access: 'public',
        addRandomSuffix: true,
      });
      payload.resumeUrl = blob.url;
    }

    const primaryFields = buildApplicantFields({ schema, variantIndex: 0, payload });
    let creation = await createRecord({
      tableName: schema.tables.applicants,
      fields: primaryFields,
    });

    const hasFallbackFields =
      hasAlternateCandidate(schema, 'experience') ||
      hasAlternateCandidate(schema, 'status') ||
      hasAlternateCandidate(schema, 'resume');

    if (!creation.ok && hasFallbackFields && shouldRetryWithAlternateFields(creation)) {
      const fallbackFields = buildApplicantFields({ schema, variantIndex: 1, payload });
      creation = await createRecord({
        tableName: schema.tables.applicants,
        fields: fallbackFields,
      });
    }

    if (!creation.ok) {
      return errorResponse(
        creation.status || 500,
        creation.error?.code || 'APPLICANT_CREATE_FAILED',
        creation.error?.message || 'Failed to create applicant record',
        { table: schema.tables.applicants }
      );
    }

    return NextResponse.json({ success: true, id: creation.data?.id });
  } catch (error) {
    return errorResponse(
      500,
      'SERVER_ERROR',
      error instanceof Error ? error.message : 'Internal server error'
    );
  }
}
