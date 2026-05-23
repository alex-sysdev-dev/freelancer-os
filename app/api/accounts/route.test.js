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
  return new Request('http://localhost/api/accounts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('GET /api/accounts', () => {
  it('returns accounts sorted alphabetically by name', async () => {
    supabaseRequest.mockResolvedValue({
      ok: true,
      data: [
        { id: 'acc-2', account_name: 'Savings', type: 'Bank', current_balance: 5000 },
        { id: 'acc-1', account_name: 'Checking', type: 'Bank', current_balance: 1200 },
      ],
    })

    const response = await GET()
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data).toHaveLength(2)
    expect(data[0].accountName).toBe('Checking')
    expect(data[1].accountName).toBe('Savings')
  })

  it('returns error when Supabase fails', async () => {
    supabaseRequest.mockResolvedValue({
      ok: false,
      status: 401,
      error: { code: 'UNAUTHORIZED', message: 'Invalid API key' },
    })

    const response = await GET()
    const data = await response.json()
    expect(response.status).toBe(401)
    expect(data.code).toBe('UNAUTHORIZED')
  })

  it('maps currentBalance and type correctly', async () => {
    supabaseRequest.mockResolvedValue({
      ok: true,
      data: [
        {
          id: 'acc-a',
          account_name: 'Crypto',
          type: 'Investment',
          starting_balance: 0,
          net_transfers: 2000,
          current_balance: 2000,
        },
      ],
    })

    const response = await GET()
    const data = await response.json()
    expect(data[0].type).toBe('Investment')
    expect(data[0].currentBalance).toBe(2000)
    expect(data[0].hasCurrentBalance).toBe(true)
  })
})

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
    supabaseRequest.mockResolvedValue({ ok: true, data: [{ id: 'acc-new' }] })

    const response = await POST(makeRequest({ accountName: 'Emergency Fund' }))
    const data = await response.json()
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.id).toBe('acc-new')
    expect(supabaseRequest).toHaveBeenCalledWith('/accounts?select=*', {
      method: 'POST',
      prefer: 'return=representation',
      body: { account_name: 'Emergency Fund' },
    })
  })

  it('includes type and startingBalance in the record when provided', async () => {
    supabaseRequest.mockResolvedValue({ ok: true, data: [{ id: 'acc-full' }] })

    await POST(makeRequest({ accountName: 'Savings', type: 'Bank', startingBalance: 1000 }))

    expect(supabaseRequest.mock.calls[0][1].body).toEqual({
      account_name: 'Savings',
      type: 'Bank',
      starting_balance: 1000,
    })
  })

  it('omits type and startingBalance when not provided', async () => {
    supabaseRequest.mockResolvedValue({ ok: true, data: [{ id: 'acc-minimal' }] })

    await POST(makeRequest({ accountName: 'Minimal Account' }))

    expect(supabaseRequest.mock.calls[0][1].body).toEqual({
      account_name: 'Minimal Account',
    })
  })

  it('returns error when Supabase create fails', async () => {
    supabaseRequest.mockResolvedValue({
      ok: false,
      status: 422,
      error: { code: 'INVALID_FIELDS', message: 'Field validation failed' },
    })

    const response = await POST(makeRequest({ accountName: 'Bad Account' }))
    expect(response.status).toBe(422)
    expect((await response.json()).code).toBe('INVALID_FIELDS')
  })
})
