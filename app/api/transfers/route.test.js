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
  return new Request('http://localhost/api/transfers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const MOCK_TRANSFERS = [
  {
    id: 'recTr1',
    fields: {
      Date: '2026-03-01',
      Account: ['recAccSavings'],
      Category: 'Income',
      Amount: 1500,
      'Signed Amount': 1500,
      Source: 'Upwork',
    },
  },
  {
    id: 'recTr2',
    fields: {
      Date: '2026-01-15',
      Account: ['recAccChecking'],
      Category: 'Expense',
      Amount: -200,
      'Signed Amount': -200,
      Source: 'Manual',
    },
  },
]

const MOCK_ACCOUNTS = [
  { id: 'recAccSavings', fields: { 'Account Name': 'Savings' } },
  { id: 'recAccChecking', fields: { 'Account Name': 'Checking' } },
]

beforeEach(() => {
  vi.clearAllMocks()
})

// ---------------------------------------------------------------------------
// GET /api/transfers
// ---------------------------------------------------------------------------
describe('GET /api/transfers', () => {
  it('returns transfers sorted newest-first with resolved account names', async () => {
    fetchAllRecords
      .mockResolvedValueOnce({ ok: true, data: { records: MOCK_TRANSFERS } })
      .mockResolvedValueOnce({ ok: true, data: { records: MOCK_ACCOUNTS } })

    const response = await GET()
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data).toHaveLength(2)
    // sortByDateDesc — March before January
    expect(data[0].date).toBe('2026-03-01')
    expect(data[1].date).toBe('2026-01-15')
    // account ID resolved to name
    expect(data[0].account).toBe('Savings')
    expect(data[1].account).toBe('Checking')
  })

  it('returns error when transfers fetch fails', async () => {
    fetchAllRecords.mockResolvedValue({
      ok: false,
      status: 500,
      error: { code: 'DB_ERROR', message: 'Airtable unavailable' },
    })

    const response = await GET()
    expect(response.status).toBe(500)
    expect((await response.json()).code).toBe('DB_ERROR')
  })

  it('still returns transfers when accounts fetch fails (uses raw IDs)', async () => {
    fetchAllRecords
      .mockResolvedValueOnce({ ok: true, data: { records: MOCK_TRANSFERS } })
      .mockResolvedValueOnce({ ok: false, status: 503, error: { code: 'ACCOUNTS_FAIL' } })

    const response = await GET()
    expect(response.status).toBe(200)
    const data = await response.json()
    // Falls back gracefully — account field is the raw linked value
    expect(data).toHaveLength(2)
  })
})

// ---------------------------------------------------------------------------
// POST /api/transfers
// ---------------------------------------------------------------------------
describe('POST /api/transfers', () => {
  it('returns 400 INVALID_JSON for malformed body', async () => {
    const req = new Request('http://localhost/api/transfers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not json',
    })
    const response = await POST(req)
    expect(response.status).toBe(400)
    expect((await response.json()).code).toBe('INVALID_JSON')
  })

  it('returns 400 MISSING_REQUIRED_FIELDS when date is absent', async () => {
    const response = await POST(makeRequest({ accountId: 'recABC', amount: 100 }))
    expect(response.status).toBe(400)
    expect((await response.json()).code).toBe('MISSING_REQUIRED_FIELDS')
  })

  it('returns 400 MISSING_REQUIRED_FIELDS when accountId/account is absent', async () => {
    const response = await POST(makeRequest({ date: '2026-01-01', amount: 100 }))
    expect(response.status).toBe(400)
    expect((await response.json()).code).toBe('MISSING_REQUIRED_FIELDS')
  })

  it('returns 400 MISSING_REQUIRED_FIELDS when amount is absent', async () => {
    const response = await POST(makeRequest({ date: '2026-01-01', accountId: 'recABC' }))
    expect(response.status).toBe(400)
    expect((await response.json()).code).toBe('MISSING_REQUIRED_FIELDS')
  })

  it('returns 400 ACCOUNT_NOT_FOUND when account name cannot be resolved', async () => {
    fetchAllRecords.mockResolvedValue({
      ok: true,
      data: { records: [{ id: 'recAcc1', fields: { 'Account Name': 'Savings' } }] },
    })

    const response = await POST(makeRequest({ date: '2026-01-01', account: 'Nonexistent Account', amount: 500 }))
    expect(response.status).toBe(400)
    expect((await response.json()).code).toBe('ACCOUNT_NOT_FOUND')
  })

  it('creates a transfer using a direct Airtable record ID', async () => {
    createRecord.mockResolvedValue({ ok: true, data: { id: 'recNewTr' } })

    // Record IDs matching /^rec[a-zA-Z0-9]+$/ skip the accounts lookup
    const response = await POST(makeRequest({
      date: '2026-03-15',
      accountId: 'recAccSavings',
      amount: 750,
      category: 'Income',
      source: 'Upwork',
    }))

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.id).toBe('recNewTr')
    // fetchAllRecords should NOT have been called (ID was passed directly)
    expect(fetchAllRecords).not.toHaveBeenCalled()
  })

  it('creates a transfer by resolving an account name to a record ID', async () => {
    fetchAllRecords.mockResolvedValue({
      ok: true,
      data: { records: [{ id: 'recAccSavings', fields: { 'Account Name': 'Savings' } }] },
    })
    createRecord.mockResolvedValue({ ok: true, data: { id: 'recNewTr2' } })

    const response = await POST(makeRequest({
      date: '2026-03-15',
      account: 'Savings',
      amount: 300,
    }))

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.id).toBe('recNewTr2')
    // Verify createRecord received the resolved record ID wrapped in an array
    const fields = createRecord.mock.calls[0][0].fields
    const fieldValues = Object.values(fields)
    expect(fieldValues).toContainEqual(['recAccSavings'])
  })

  it('defaults category to Deposit and source to Manual when omitted', async () => {
    createRecord.mockResolvedValue({ ok: true, data: { id: 'recDefaults' } })

    await POST(makeRequest({ date: '2026-03-15', accountId: 'recAccXYZ', amount: 100 }))

    const fields = createRecord.mock.calls[0][0].fields
    const fieldValues = Object.values(fields)
    expect(fieldValues).toContain('Deposit')
    expect(fieldValues).toContain('Manual')
  })

  it('returns error when Airtable create fails', async () => {
    createRecord.mockResolvedValue({
      ok: false,
      status: 422,
      error: { code: 'FIELD_ERROR', message: 'Invalid linked record' },
    })

    const response = await POST(makeRequest({
      date: '2026-03-15',
      accountId: 'recAccSavings',
      amount: 500,
    }))
    expect(response.status).toBe(422)
    expect((await response.json()).code).toBe('FIELD_ERROR')
  })
})
