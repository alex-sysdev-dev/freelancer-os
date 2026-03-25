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
  return new Request('http://localhost/api/earnings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ---------------------------------------------------------------------------
// GET /api/earnings
// ---------------------------------------------------------------------------
describe('GET /api/earnings', () => {
  it('returns mapped and sorted earnings on success', async () => {
    fetchAllRecords.mockResolvedValue({
      ok: true,
      data: {
        records: [
          {
            id: 'rec2',
            fields: { Date: '2026-02-01', Platform: 'Fiverr', Project: 'Logo', 'Hours Worked': 4, 'Rate ($/hr)': 50 },
          },
          {
            id: 'rec1',
            fields: { Date: '2026-01-01', Platform: 'Upwork', Project: 'API', 'Hours Worked': 8, 'Rate ($/hr)': 75 },
          },
        ],
      },
    })

    const response = await GET()
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data).toHaveLength(2)
    // sortByDateAsc — Jan before Feb
    expect(data[0].platform).toBe('Upwork')
    expect(data[1].platform).toBe('Fiverr')
    expect(data[0].amount).toBe(600) // 8 * 75
  })

  it('returns a 500-level error when Airtable fails', async () => {
    fetchAllRecords.mockResolvedValue({
      ok: false,
      status: 503,
      error: { code: 'AIRTABLE_DOWN', message: 'Service unavailable' },
    })

    const response = await GET()
    expect(response.status).toBe(503)
    const data = await response.json()
    expect(data.code).toBe('AIRTABLE_DOWN')
    expect(data.error).toBe('Service unavailable')
  })

  it('falls back to 500 when error has no status', async () => {
    fetchAllRecords.mockResolvedValue({ ok: false })

    const response = await GET()
    expect(response.status).toBe(500)
  })
})

// ---------------------------------------------------------------------------
// POST /api/earnings
// ---------------------------------------------------------------------------
describe('POST /api/earnings', () => {
  it('returns 400 INVALID_JSON for a non-JSON body', async () => {
    const req = new Request('http://localhost/api/earnings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not valid json{{',
    })
    const response = await POST(req)
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.code).toBe('INVALID_JSON')
  })

  it('returns 400 MISSING_REQUIRED_FIELDS when platform is absent', async () => {
    const response = await POST(makeRequest({ project: 'Test', date: '2026-01-01', hoursWorked: 5, ratePerHour: 50 }))
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.code).toBe('MISSING_REQUIRED_FIELDS')
  })

  it('returns 400 MISSING_REQUIRED_FIELDS when project is absent', async () => {
    const response = await POST(makeRequest({ platform: 'Upwork', date: '2026-01-01', hoursWorked: 5, ratePerHour: 50 }))
    expect(response.status).toBe(400)
    expect((await response.json()).code).toBe('MISSING_REQUIRED_FIELDS')
  })

  it('returns 400 MISSING_REQUIRED_FIELDS when date is absent', async () => {
    const response = await POST(makeRequest({ platform: 'Upwork', project: 'Test', hoursWorked: 5, ratePerHour: 50 }))
    expect(response.status).toBe(400)
    expect((await response.json()).code).toBe('MISSING_REQUIRED_FIELDS')
  })

  it('returns 400 INVALID_NUMERIC_FIELDS when hoursWorked is non-numeric', async () => {
    const response = await POST(makeRequest({ platform: 'Upwork', project: 'Test', date: '2026-01-01', hoursWorked: 'abc', ratePerHour: 50 }))
    expect(response.status).toBe(400)
    expect((await response.json()).code).toBe('INVALID_NUMERIC_FIELDS')
  })

  it('returns 400 INVALID_NUMERIC_FIELDS when ratePerHour is non-numeric', async () => {
    const response = await POST(makeRequest({ platform: 'Upwork', project: 'Test', date: '2026-01-01', hoursWorked: 8, ratePerHour: null }))
    expect(response.status).toBe(400)
    expect((await response.json()).code).toBe('INVALID_NUMERIC_FIELDS')
  })

  it('creates a record and returns the new earning on success', async () => {
    createRecord.mockResolvedValue({ ok: true, data: { id: 'recNew123' } })

    const response = await POST(makeRequest({
      platform: 'Upwork',
      project: 'My Project',
      date: '2026-03-01',
      hoursWorked: 10,
      ratePerHour: 100,
    }))

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.id).toBe('recNew123')
    expect(data.platform).toBe('Upwork')
    expect(data.project).toBe('My Project')
    expect(data.hoursWorked).toBe(10)
    expect(data.ratePerHour).toBe(100)
    expect(data.amount).toBe(1000)
  })

  it('trims whitespace from platform and project', async () => {
    createRecord.mockResolvedValue({ ok: true, data: { id: 'recTrimmed' } })

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

  it('returns 500 EARNINGS_CREATE_FAILED when all Airtable attempts fail', async () => {
    createRecord.mockResolvedValue({
      ok: false,
      status: 500,
      error: { code: 'AIRTABLE_ERROR', message: 'Field type mismatch' },
    })

    const response = await POST(makeRequest({
      platform: 'Upwork',
      project: 'Fail Test',
      date: '2026-03-01',
      hoursWorked: 5,
      ratePerHour: 50,
    }))
    expect(response.status).toBe(500)
    const data = await response.json()
    expect(data.code).toBe('EARNINGS_CREATE_FAILED')
  })
})
