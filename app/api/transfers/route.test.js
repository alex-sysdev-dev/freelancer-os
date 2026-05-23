import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/client', () => ({
  supabaseRequest: vi.fn(),
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
import { supabaseRequest } from '@/lib/supabase/client'

function makeRequest(body) {
  return new Request('http://localhost/api/transfers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const SAVINGS_ID = '11111111-1111-4111-8111-111111111111'
const CHECKING_ID = '22222222-2222-4222-8222-222222222222'

const MOCK_TRANSFERS = [
  {
    id: 'tr-1',
    date: '2026-03-01',
    account_id: SAVINGS_ID,
    accounts: { account_name: 'Savings' },
    category: 'Deposit',
    amount: 1500,
    signed_amount: 1500,
    source: 'Upwork',
  },
  {
    id: 'tr-2',
    date: '2026-01-15',
    account_id: CHECKING_ID,
    accounts: { account_name: 'Checking' },
    category: 'Withdrawal',
    amount: 200,
    signed_amount: -200,
    source: 'Manual',
  },
]

beforeEach(() => {
  vi.clearAllMocks()
})

describe('GET /api/transfers', () => {
  it('returns transfers sorted newest-first with account names', async () => {
    supabaseRequest.mockResolvedValue({ ok: true, data: MOCK_TRANSFERS })

    const response = await GET()
    const data = await response.json()
    expect(response.status).toBe(200)
    expect(data).toHaveLength(2)
    expect(data[0].date).toBe('2026-03-01')
    expect(data[1].date).toBe('2026-01-15')
    expect(data[0].account).toBe('Savings')
    expect(data[1].account).toBe('Checking')
  })

  it('returns error when transfers fetch fails', async () => {
    supabaseRequest.mockResolvedValue({
      ok: false,
      status: 500,
      error: { code: 'DB_ERROR', message: 'Supabase unavailable' },
    })

    const response = await GET()
    expect(response.status).toBe(500)
    expect((await response.json()).code).toBe('DB_ERROR')
  })

  it('falls back to account_id when the joined account name is absent', async () => {
    supabaseRequest.mockResolvedValue({
      ok: true,
      data: [{ ...MOCK_TRANSFERS[0], accounts: null }],
    })

    const response = await GET()
    const data = await response.json()
    expect(data[0].account).toBe(SAVINGS_ID)
  })
})

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
    const response = await POST(makeRequest({ accountId: SAVINGS_ID, amount: 100 }))
    expect(response.status).toBe(400)
    expect((await response.json()).code).toBe('MISSING_REQUIRED_FIELDS')
  })

  it('returns 400 MISSING_REQUIRED_FIELDS when accountId/account is absent', async () => {
    const response = await POST(makeRequest({ date: '2026-01-01', amount: 100 }))
    expect(response.status).toBe(400)
    expect((await response.json()).code).toBe('MISSING_REQUIRED_FIELDS')
  })

  it('returns 400 MISSING_REQUIRED_FIELDS when amount is absent', async () => {
    const response = await POST(makeRequest({ date: '2026-01-01', accountId: SAVINGS_ID }))
    expect(response.status).toBe(400)
    expect((await response.json()).code).toBe('MISSING_REQUIRED_FIELDS')
  })

  it('returns 400 ACCOUNT_NOT_FOUND when account name cannot be resolved', async () => {
    supabaseRequest.mockResolvedValue({
      ok: true,
      data: [{ id: SAVINGS_ID, account_name: 'Savings' }],
    })

    const response = await POST(makeRequest({ date: '2026-01-01', account: 'Nonexistent Account', amount: 500 }))
    expect(response.status).toBe(400)
    expect((await response.json()).code).toBe('ACCOUNT_NOT_FOUND')
  })

  it('creates a transfer using a direct Supabase account UUID', async () => {
    supabaseRequest.mockResolvedValue({ ok: true, data: [{ id: 'tr-new' }] })

    const response = await POST(makeRequest({
      date: '2026-03-15',
      accountId: SAVINGS_ID,
      amount: 750,
      category: 'Deposit',
      source: 'Upwork',
    }))

    const data = await response.json()
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.id).toBe('tr-new')
    expect(supabaseRequest).toHaveBeenCalledTimes(1)
    expect(supabaseRequest.mock.calls[0][1].body).toMatchObject({
      date: '2026-03-15',
      account_id: SAVINGS_ID,
      amount: 750,
      category: 'Deposit',
      source: 'Upwork',
    })
  })

  it('creates a transfer by resolving an account name to an ID', async () => {
    supabaseRequest
      .mockResolvedValueOnce({ ok: true, data: [{ id: SAVINGS_ID, account_name: 'Savings' }] })
      .mockResolvedValueOnce({ ok: true, data: [{ id: 'tr-new-2' }] })

    const response = await POST(makeRequest({
      date: '2026-03-15',
      account: 'Savings',
      amount: 300,
    }))

    const data = await response.json()
    expect(response.status).toBe(200)
    expect(data.id).toBe('tr-new-2')
    expect(supabaseRequest.mock.calls[1][1].body.account_id).toBe(SAVINGS_ID)
  })

  it('defaults category to Deposit and source to Manual when omitted', async () => {
    supabaseRequest.mockResolvedValue({ ok: true, data: [{ id: 'tr-defaults' }] })

    await POST(makeRequest({ date: '2026-03-15', accountId: SAVINGS_ID, amount: 100 }))

    const body = supabaseRequest.mock.calls[0][1].body
    expect(body.category).toBe('Deposit')
    expect(body.source).toBe('Manual')
  })

  it('returns error when Supabase create fails', async () => {
    supabaseRequest.mockResolvedValue({
      ok: false,
      status: 422,
      error: { code: 'FIELD_ERROR', message: 'Invalid linked record' },
    })

    const response = await POST(makeRequest({
      date: '2026-03-15',
      accountId: SAVINGS_ID,
      amount: 500,
    }))
    expect(response.status).toBe(422)
    expect((await response.json()).code).toBe('FIELD_ERROR')
  })
})
