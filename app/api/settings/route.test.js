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
  return new Request('http://localhost/api/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('GET /api/settings', () => {
  it('returns stored finance settings', async () => {
    supabaseRequest.mockResolvedValue({
      ok: true,
      data: [{
        id: 'settings-1',
        monthly_expense_target: 4200,
        tax_reserve_rate: 0.28,
        minimum_cash_buffer: 8000,
      }],
    })

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.monthlyExpenseTarget).toBe(4200)
    expect(data.taxReserveRate).toBe(0.28)
    expect(data.minimumCashBuffer).toBe(8000)
    expect(data.configured).toBe(true)
  })

  it('returns defaults when the settings table is missing', async () => {
    supabaseRequest.mockResolvedValue({
      ok: false,
      status: 404,
      error: { code: '42P01', message: 'relation "finance_settings" does not exist' },
    })

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.monthlyExpenseTarget).toBe(3200)
    expect(data.taxReserveRate).toBe(0.25)
    expect(data.configured).toBe(false)
  })
})

describe('POST /api/settings', () => {
  it('returns 400 for invalid settings', async () => {
    const response = await POST(makeRequest({ monthlyExpenseTarget: -1, taxReserveRate: 1.4, minimumCashBuffer: 0 }))

    expect(response.status).toBe(400)
    expect((await response.json()).code).toBe('INVALID_SETTINGS')
  })

  it('creates settings when none exist', async () => {
    supabaseRequest
      .mockResolvedValueOnce({ ok: true, data: [] })
      .mockResolvedValueOnce({
        ok: true,
        data: [{ id: 'settings-new', monthly_expense_target: 3500, tax_reserve_rate: 0.25, minimum_cash_buffer: 6000 }],
      })

    const response = await POST(makeRequest({ monthlyExpenseTarget: 3500, taxReserveRate: 25, minimumCashBuffer: 6000 }))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.id).toBe('settings-new')
    expect(supabaseRequest).toHaveBeenLastCalledWith('/finance_settings?select=*', {
      method: 'POST',
      prefer: 'return=representation',
      body: {
        monthly_expense_target: 3500,
        tax_reserve_rate: 0.25,
        minimum_cash_buffer: 6000,
      },
    })
  })

  it('updates settings when one exists', async () => {
    supabaseRequest
      .mockResolvedValueOnce({ ok: true, data: [{ id: 'settings-1' }] })
      .mockResolvedValueOnce({
        ok: true,
        data: [{ id: 'settings-1', monthly_expense_target: 5000, tax_reserve_rate: 0.3, minimum_cash_buffer: 10000 }],
      })

    await POST(makeRequest({ monthlyExpenseTarget: 5000, taxReserveRate: 0.3, minimumCashBuffer: 10000 }))

    expect(supabaseRequest).toHaveBeenLastCalledWith('/finance_settings?id=eq.settings-1&select=*', {
      method: 'PATCH',
      prefer: 'return=representation',
      body: {
        monthly_expense_target: 5000,
        tax_reserve_rate: 0.3,
        minimum_cash_buffer: 10000,
      },
    })
  })
})
