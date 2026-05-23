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
  return new Request('http://localhost/api/earnings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('GET /api/earnings', () => {
  it('returns mapped and sorted earnings on success', async () => {
    supabaseRequest.mockResolvedValue({
      ok: true,
      data: [
        {
          id: 'earn-2',
          date: '2026-02-01',
          platform: 'Fiverr',
          project: 'Logo',
          hours_worked: 4,
          rate_per_hour: 50,
          amount: 200,
        },
        {
          id: 'earn-1',
          date: '2026-01-01',
          platform: 'Upwork',
          project: 'API',
          hours_worked: 8,
          rate_per_hour: 75,
          amount: 600,
        },
      ],
    })

    const response = await GET()
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data).toHaveLength(2)
    expect(data[0].platform).toBe('Upwork')
    expect(data[1].platform).toBe('Fiverr')
    expect(data[0].amount).toBe(600)
  })

  it('returns a 500-level error when Supabase fails', async () => {
    supabaseRequest.mockResolvedValue({
      ok: false,
      status: 503,
      error: { code: 'SUPABASE_DOWN', message: 'Service unavailable' },
    })

    const response = await GET()
    expect(response.status).toBe(503)
    const data = await response.json()
    expect(data.code).toBe('SUPABASE_DOWN')
    expect(data.error).toBe('Service unavailable')
  })

  it('falls back to 500 when error has no status', async () => {
    supabaseRequest.mockResolvedValue({ ok: false })

    const response = await GET()
    expect(response.status).toBe(500)
  })
})

describe('POST /api/earnings', () => {
  it('returns 400 INVALID_JSON for a non-JSON body', async () => {
    const req = new Request('http://localhost/api/earnings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not valid json{{',
    })
    const response = await POST(req)
    const data = await response.json()
    expect(response.status).toBe(400)
    expect(data.code).toBe('INVALID_JSON')
  })

  it('returns 400 MISSING_REQUIRED_FIELDS when platform is absent', async () => {
    const response = await POST(makeRequest({ project: 'Test', date: '2026-01-01', hoursWorked: 5, ratePerHour: 50 }))
    expect(response.status).toBe(400)
    expect((await response.json()).code).toBe('MISSING_REQUIRED_FIELDS')
  })

  it('returns 400 INVALID_NUMERIC_FIELDS when hoursWorked is non-numeric', async () => {
    const response = await POST(makeRequest({ platform: 'Upwork', project: 'Test', date: '2026-01-01', hoursWorked: 'abc', ratePerHour: 50 }))
    expect(response.status).toBe(400)
    expect((await response.json()).code).toBe('INVALID_NUMERIC_FIELDS')
  })

  it('creates a record and returns the new earning on success', async () => {
    supabaseRequest.mockResolvedValue({
      ok: true,
      data: [{
        id: 'earn-new',
        date: '2026-03-01',
        platform: 'Upwork',
        project: 'My Project',
        hours_worked: 10,
        rate_per_hour: 100,
        amount: 1000,
      }],
    })

    const response = await POST(makeRequest({
      platform: 'Upwork',
      project: 'My Project',
      date: '2026-03-01',
      hoursWorked: 10,
      ratePerHour: 100,
    }))

    expect(response.status).toBe(200)
    expect(supabaseRequest).toHaveBeenCalledWith('/earnings?select=*', {
      method: 'POST',
      prefer: 'return=representation',
      body: {
        date: '2026-03-01',
        platform: 'Upwork',
        project: 'My Project',
        hours_worked: 10,
        rate_per_hour: 100,
      },
    })
    const data = await response.json()
    expect(data.id).toBe('earn-new')
    expect(data.amount).toBe(1000)
  })

  it('trims whitespace from platform and project', async () => {
    supabaseRequest.mockResolvedValue({
      ok: true,
      data: [{
        id: 'earn-trimmed',
        date: '2026-03-01',
        platform: 'Fiverr',
        project: 'Logo Work',
        hours_worked: 2,
        rate_per_hour: 50,
        amount: 100,
      }],
    })

    const response = await POST(makeRequest({
      platform: '  Fiverr  ',
      project: '  Logo Work  ',
      date: '2026-03-01',
      hoursWorked: 2,
      ratePerHour: 50,
    }))
    const data = await response.json()
    expect(data.platform).toBe('Fiverr')
    expect(data.project).toBe('Logo Work')
  })

  it('returns 500 EARNINGS_CREATE_FAILED when Supabase create fails', async () => {
    supabaseRequest.mockResolvedValue({
      ok: false,
      status: 500,
      error: { code: 'SUPABASE_ERROR', message: 'Column mismatch' },
    })

    const response = await POST(makeRequest({
      platform: 'Upwork',
      project: 'Fail Test',
      date: '2026-03-01',
      hoursWorked: 5,
      ratePerHour: 50,
    }))
    expect(response.status).toBe(500)
    expect((await response.json()).code).toBe('SUPABASE_ERROR')
  })
})
