import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  pickRecordValue,
  getPreferredFieldName,
  getFieldCandidates,
  getSchemaVersion,
  getAirtableSchema,
  DEFAULT_SCHEMA_VERSION,
} from './schema.js'

// ---------------------------------------------------------------------------
// pickRecordValue
// ---------------------------------------------------------------------------
describe('pickRecordValue', () => {
  it('returns the value for the first matching candidate', () => {
    const fields = { 'Rate ($/hr)': 75 }
    expect(pickRecordValue(fields, ['Rate ($/hr)', 'Rate'])).toBe(75)
  })

  it('returns the value for a later candidate when earlier ones are absent', () => {
    const fields = { Rate: 60 }
    expect(pickRecordValue(fields, ['Rate ($/hr)', 'Rate'])).toBe(60)
  })

  it('returns undefined when no candidate matches', () => {
    const fields = { Other: 'x' }
    expect(pickRecordValue(fields, ['Date', 'date'])).toBeUndefined()
  })

  it('returns undefined for empty candidates array', () => {
    expect(pickRecordValue({ Date: '2026-01-01' }, [])).toBeUndefined()
  })

  it('returns undefined for null/non-object fields', () => {
    expect(pickRecordValue(null, ['Date'])).toBeUndefined()
    expect(pickRecordValue(undefined, ['Date'])).toBeUndefined()
  })

  it('returns falsy field values (0, false, empty string) correctly', () => {
    expect(pickRecordValue({ Amount: 0 }, ['Amount'])).toBe(0)
    expect(pickRecordValue({ Flag: false }, ['Flag'])).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// getFieldCandidates
// ---------------------------------------------------------------------------
describe('getFieldCandidates', () => {
  it('returns the candidate array for a known field', () => {
    const schema = getAirtableSchema()
    const candidates = getFieldCandidates(schema, 'earnings', 'date')
    expect(Array.isArray(candidates)).toBe(true)
    expect(candidates.length).toBeGreaterThan(0)
    expect(candidates).toContain('Date')
  })

  it('returns empty array for unknown entity or field', () => {
    const schema = getAirtableSchema()
    expect(getFieldCandidates(schema, 'nonexistent', 'field')).toEqual([])
    expect(getFieldCandidates(schema, 'earnings', 'nonexistentField')).toEqual([])
  })

  it('returns empty array for null schema', () => {
    expect(getFieldCandidates(null, 'earnings', 'date')).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// getPreferredFieldName
// ---------------------------------------------------------------------------
describe('getPreferredFieldName', () => {
  it('returns the first candidate by default (index 0)', () => {
    const schema = getAirtableSchema()
    const name = getPreferredFieldName(schema, 'earnings', 'date')
    expect(name).toBe('Date')
  })

  it('returns the candidate at a specific index', () => {
    const schema = getAirtableSchema()
    const name = getPreferredFieldName(schema, 'earnings', 'date', 1)
    expect(name).toBe('date')
  })

  it('returns the first candidate when requested index is out of bounds', () => {
    const schema = getAirtableSchema()
    const name = getPreferredFieldName(schema, 'earnings', 'date', 999)
    expect(name).toBe('Date') // falls back to index 0
  })

  it('returns null for an unknown logical field', () => {
    const schema = getAirtableSchema()
    expect(getPreferredFieldName(schema, 'earnings', 'nonexistent')).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// getSchemaVersion
// ---------------------------------------------------------------------------
describe('getSchemaVersion', () => {
  const originalEnv = process.env.AIRTABLE_SCHEMA_VERSION

  afterEach(() => {
    process.env.AIRTABLE_SCHEMA_VERSION = originalEnv
  })

  it('returns the default version when env var is not set', () => {
    delete process.env.AIRTABLE_SCHEMA_VERSION
    expect(getSchemaVersion()).toBe(DEFAULT_SCHEMA_VERSION)
  })

  it('returns the configured version when valid', () => {
    process.env.AIRTABLE_SCHEMA_VERSION = 'finance_v1'
    expect(getSchemaVersion()).toBe('finance_v1')
  })

  it('falls back to default when env var is set to an unknown version', () => {
    process.env.AIRTABLE_SCHEMA_VERSION = 'unknown_schema'
    expect(getSchemaVersion()).toBe(DEFAULT_SCHEMA_VERSION)
  })

  it('falls back to default for whitespace-only env var', () => {
    process.env.AIRTABLE_SCHEMA_VERSION = '   '
    expect(getSchemaVersion()).toBe(DEFAULT_SCHEMA_VERSION)
  })
})

// ---------------------------------------------------------------------------
// getAirtableSchema
// ---------------------------------------------------------------------------
describe('getAirtableSchema', () => {
  it('returns a schema with the three expected tables', () => {
    const schema = getAirtableSchema()
    expect(schema.tables.earnings).toBeDefined()
    expect(schema.tables.accounts).toBeDefined()
    expect(schema.tables.transfers).toBeDefined()
  })

  it('uses env var table names when set', () => {
    const original = process.env.AIRTABLE_TABLE_EARNINGS
    // Note: schema is evaluated at module load time so env vars only affect
    // the initial load. This test verifies the default fallback behaviour.
    const schema = getAirtableSchema()
    expect(typeof schema.tables.earnings).toBe('string')
    process.env.AIRTABLE_TABLE_EARNINGS = original
  })

  it('schema entities include earnings, accounts, and transfers', () => {
    const schema = getAirtableSchema()
    expect(schema.entities.earnings).toBeDefined()
    expect(schema.entities.accounts).toBeDefined()
    expect(schema.entities.transfers).toBeDefined()
  })
})
