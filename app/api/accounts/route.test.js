import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/airtable/client', () => ({
  fetchAllRecords: vi.fn(),
  createRecord: vi.fn(),
}))

vi.mock('next/server', () => ({
  NextResponse: {
    json: (data, init) => ({
      status: init?.status ?? 200,
      json: () => Promise.resolve(data),
    }),
  },
}))

import { GET, POST } from './route.js'
import { fetchAllRecords, createRecord } from '@/lib/airtable/client'

function makeRequest(body) {
  return new Request('http://localhost/api/accounts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ---------------------------------------------------------------------------
// GET /api/accounts
// ---------------------------------------------------------------------------
describe('GET /api/accounts', () => {
  it('returns accounts sorted alphabetically by name', async () => {
    fetchAllRecords.mockResolvedValue({
      ok: true,
      data: {
        records: [
          { id: 'rec2', fields: { 'Account Name': 'Savings', Type: 'Bank', 'Current Balance': 5000 } },
          { id: 'rec1', fields: { 'Account Name': 'Checking', Type: 'Bank', 'Current Balance': 1200 } },
        ],
      },
    })

    const response = await GET()
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data).toHaveLength(2)
    expect(data[0].accountName).toBe('Checking')
    expect(data[1].accountName).toBe('Savings')
  })

  it('returns error when Airtable fails', async () => {
    fetchAllRecords.mockResolvedValue({
      ok: false,
      status: 401,
      error: { code: 'UNAUTHORIZED', message: 'Invalid API key' },
    })

    const response = await GET()
    expect(response.status).toBe(401)
    const data = await response.json()
    expect(data.code).toBe('UNAUTHORIZED')
  })

  it('maps currentBalance and type correctly', async () => {
    fetchAllRecords.mockResolvedValue({
      ok: true,
      data: {
        records: [
          {
            id: 'recA',
            fields: {
              'Account Name': 'Crypto',
              Type: 'Investment',
              'Starting Balance': 0,
              'Net Transfers': 2000,
              'Current Balance': 2000,
            },
          },
        ],
      },
    })

    const response = await GET()
    const data = await response.json()
    expect(data[0].type).toBe('Investment')
    expect(data[0].currentBalance).toBe(2000)
    expect(data[0].hasCurrentBalance).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// POST /api/accounts
// ---------------------------------------------------------------------------
describe('POST /api/accounts', () => {
  it('returns 400 INVALID_JSON for a non-JSON body', async () => {
    const req = new Request('http://localhost/api/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{broken',
    })
    const response = await POST(req)
    expect(response.status).toBe(400)
    expect((await response.json()).code).toBe('INVALID_JSON')
  })

  it('returns 400 MISSING_REQUIRED_FIELDS when accountName is absent', async () => {
    const response = await POST(makeRequest({ type: 'Bank' }))
    expect(response.status).toBe(400)
    expect((await response.json()).code).toBe('MISSING_REQUIRED_FIELDS')
  })

  it('returns 400 MISSING_REQUIRED_FIELDS when accountName is whitespace-only', async () => {
    const response = await POST(makeRequest({ accountName: '   ' }))
    expect(response.status).toBe(400)
    expect((await response.json()).code).toBe('MISSING_REQUIRED_FIELDS')
  })

  it('creates a record with accountName only and returns id', async () => {
    createRecord.mockResolvedValue({ ok: true, data: { id: 'recNewAcc' } })

    const response = await POST(makeRequest({ accountName: 'Emergency Fund' }))
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.id).toBe('recNewAcc')
  })

  it('includes type and startingBalance in the record when provided', async () => {
    createRecord.mockResolvedValue({ ok: true, data: { id: 'recFull' } })

    await POST(makeRequest({ accountName: 'Savings', type: 'Bank', startingBalance: 1000 }))

    const callArgs = createRecord.mock.calls[0][0]
    const fields = callArgs.fields
    // Should have the type and startingBalance fields present
    const fieldValues = Object.values(fields)
    expect(fieldValues).toContain('Bank')
    expect(fieldValues).toContain(1000)
  })

  it('omits type and startingBalance when not provided', async () => {
    createRecord.mockResolvedValue({ ok: true, data: { id: 'recMinimal' } })

    await POST(makeRequest({ accountName: 'Minimal Account' }))

    const callArgs = createRecord.mock.calls[0][0]
    const fieldValues = Object.values(callArgs.fields)
    expect(fieldValues).not.toContain('Bank')
    expect(fieldValues.filter((v) => typeof v === 'number')).toHaveLength(0)
  })

  it('returns error when Airtable create fails', async () => {
    createRecord.mockResolvedValue({
      ok: false,
      status: 422,
      error: { code: 'INVALID_FIELDS', message: 'Field validation failed' },
    })

    const response = await POST(makeRequest({ accountName: 'Bad Account' }))
    expect(response.status).toBe(422)
    expect((await response.json()).code).toBe('INVALID_FIELDS')
  })
})
