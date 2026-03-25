import { describe, it, expect } from 'vitest'
import {
  toFiniteNumber,
  toHoursWorked,
  mapEarningRecord,
  mapAccountRecord,
  mapTransferRecord,
  sortByDateAsc,
  sortByDateDesc,
} from './AirtableService.js'

// Shared field maps matching the finance_v1 schema
const earningsFields = {
  date: ['Date', 'date', 'Name'],
  platform: ['Platform', 'Source'],
  project: ['Project', 'project', 'Tags'],
  hoursWorked: ['Hours Worked', 'hours worked', 'Hours'],
  ratePerHour: ['Rate ($/hr)', 'Rate ($ /hr)', 'Rate Per Hour', 'Rate', 'Rate_Per_Hour'],
  calculatedEarnings: ['Calculated Earnings', 'calculated earnings', 'Amount'],
  weekStartDate: ['Week Start Date', 'Week'],
  recordCreatedTime: ['Record Created Time', 'Created Time'],
  oneMonthForecast: ['1 Month Earnings Forecast', '1 month earnings forecast'],
  twoWeekForecast: ['2 Week Earnings Forecast', '2 week earnings forecast'],
  sixMonthForecast: ['6 Month Earnings Forecast', '6 month earnings forecast'],
}

const accountsFields = {
  name: ['Account Name', 'Name'],
  type: ['Type'],
  startingBalance: ['Starting Balance'],
  transfers: ['Transfers'],
  netTransfers: ['Net Transfers'],
  currentBalance: ['Current Balance'],
}

const transfersFields = {
  date: ['Date'],
  account: ['Account'],
  accountName: ['Account Name (from Account)', 'Account Name (from Accounts)'],
  category: ['Category'],
  amount: ['Amount'],
  signedAmount: ['Signed Amount'],
  source: ['Source'],
  weekStartDate: ['Week Start Date'],
}

// ---------------------------------------------------------------------------
// toFiniteNumber
// ---------------------------------------------------------------------------
describe('toFiniteNumber', () => {
  it('returns the number when given a finite number', () => {
    expect(toFiniteNumber(42)).toBe(42)
    expect(toFiniteNumber(0)).toBe(0)
    expect(toFiniteNumber(-7.5)).toBe(-7.5)
  })

  it('returns null for non-finite numbers', () => {
    expect(toFiniteNumber(Infinity)).toBeNull()
    expect(toFiniteNumber(NaN)).toBeNull()
  })

  it('returns null for null and undefined', () => {
    expect(toFiniteNumber(null)).toBeNull()
    expect(toFiniteNumber(undefined)).toBeNull()
  })

  it('parses a plain numeric string', () => {
    expect(toFiniteNumber('100')).toBe(100)
    expect(toFiniteNumber('  50.5  ')).toBe(50.5)
  })

  it('parses a string with thousands separators', () => {
    expect(toFiniteNumber('1,234')).toBe(1234)
    expect(toFiniteNumber('10,000.50')).toBe(10000.5)
  })

  it('parses HH:MM duration strings as hours', () => {
    expect(toFiniteNumber('2:30')).toBeCloseTo(2.5)
    expect(toFiniteNumber('1:00')).toBe(1)
  })

  it('parses HH:MM:SS duration strings as hours', () => {
    expect(toFiniteNumber('1:30:00')).toBeCloseTo(1.5)
    expect(toFiniteNumber('0:00:30')).toBeCloseTo(30 / 3600)
  })

  it('returns null for empty or non-numeric strings', () => {
    expect(toFiniteNumber('')).toBeNull()
    expect(toFiniteNumber('abc')).toBeNull()
  })

  it('returns first finite number from an array', () => {
    expect(toFiniteNumber([null, undefined, '5'])).toBe(5)
    expect(toFiniteNumber([42, 99])).toBe(42)
  })

  it('returns null for an array with no finite values', () => {
    expect(toFiniteNumber([null, 'x'])).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// toHoursWorked
// ---------------------------------------------------------------------------
describe('toHoursWorked', () => {
  it('treats a large integer (>= 600) as seconds and converts to hours', () => {
    expect(toHoursWorked(3600)).toBe(1)
    expect(toHoursWorked(7200)).toBe(2)
    expect(toHoursWorked(600)).toBeCloseTo(1 / 6)
  })

  it('returns small values as-is (already hours)', () => {
    expect(toHoursWorked(8)).toBe(8)
    expect(toHoursWorked(2.5)).toBe(2.5)
    expect(toHoursWorked(0)).toBe(0)
  })

  it('returns null for non-numeric input', () => {
    expect(toHoursWorked(null)).toBeNull()
    expect(toHoursWorked('abc')).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// mapEarningRecord
// ---------------------------------------------------------------------------
describe('mapEarningRecord', () => {
  it('maps a fully-populated record correctly', () => {
    const record = {
      id: 'recABC',
      fields: {
        Date: '2026-01-15',
        Platform: 'Upwork',
        Project: 'Website Redesign',
        'Hours Worked': 8,
        'Rate ($/hr)': 50,
        'Calculated Earnings': 400,
        'Week Start Date': '2026-01-13',
      },
    }
    const result = mapEarningRecord(record, earningsFields)
    expect(result.id).toBe('recABC')
    expect(result.platform).toBe('Upwork')
    expect(result.project).toBe('Website Redesign')
    expect(result.hoursWorked).toBe(8)
    expect(result.ratePerHour).toBe(50)
    expect(result.amount).toBe(400) // prefers calculatedEarnings
    expect(result.weekStartDate).toBe('2026-01-13')
  })

  it('falls back to hours * rate when calculatedEarnings is absent', () => {
    const record = {
      id: 'rec1',
      fields: {
        Date: '2026-02-01',
        Platform: 'Fiverr',
        Project: 'Logo Design',
        'Hours Worked': 5,
        'Rate ($/hr)': 60,
      },
    }
    const result = mapEarningRecord(record, earningsFields)
    expect(result.amount).toBe(300)
  })

  it('uses amount = 0 when neither calculatedEarnings nor hours/rate are present', () => {
    const record = { id: 'rec2', fields: { Date: '2026-03-01', Platform: 'Direct' } }
    const result = mapEarningRecord(record, earningsFields)
    expect(result.amount).toBe(0)
  })

  it('uses default values for missing fields', () => {
    const record = { id: 'rec3', fields: {} }
    const result = mapEarningRecord(record, earningsFields)
    expect(result.platform).toBe('Unknown')
    expect(result.project).toBe('Unknown') // falls back to platform
    expect(result.amount).toBe(0)
  })

  it('resolves alternate field name candidates', () => {
    const record = {
      id: 'rec4',
      fields: {
        Source: 'Toptal',     // alternate for Platform
        Tags: 'API Work',     // alternate for Project
        Hours: 3600,          // seconds (alternate for Hours Worked)
        Rate: 100,
      },
    }
    const result = mapEarningRecord(record, earningsFields)
    expect(result.platform).toBe('Toptal')
    expect(result.project).toBe('API Work')
    expect(result.hoursWorked).toBe(1) // 3600 seconds = 1 hour
    expect(result.ratePerHour).toBe(100)
  })

  it('includes forecast fields when present', () => {
    const record = {
      id: 'rec5',
      fields: {
        Date: '2026-03-01',
        Platform: 'Upwork',
        '1 Month Earnings Forecast': 5000,
        '2 Week Earnings Forecast': 2500,
        '6 Month Earnings Forecast': 30000,
      },
    }
    const result = mapEarningRecord(record, earningsFields)
    expect(result.oneMonthForecast).toBe(5000)
    expect(result.twoWeekForecast).toBe(2500)
    expect(result.sixMonthForecast).toBe(30000)
  })
})

// ---------------------------------------------------------------------------
// mapAccountRecord
// ---------------------------------------------------------------------------
describe('mapAccountRecord', () => {
  it('maps a full account record correctly', () => {
    const record = {
      id: 'recAcc1',
      fields: {
        'Account Name': 'Savings',
        Type: 'Bank',
        'Starting Balance': 1000,
        'Net Transfers': 500,
        'Current Balance': 1500,
      },
    }
    const result = mapAccountRecord(record, accountsFields)
    expect(result.id).toBe('recAcc1')
    expect(result.accountName).toBe('Savings')
    expect(result.type).toBe('Bank')
    expect(result.startingBalance).toBe(1000)
    expect(result.netTransfers).toBe(500)
    expect(result.currentBalance).toBe(1500)
    expect(result.hasNetTransfers).toBe(true)
    expect(result.hasCurrentBalance).toBe(true)
  })

  it('applies defaults for missing fields', () => {
    const record = { id: 'recAcc2', fields: {} }
    const result = mapAccountRecord(record, accountsFields)
    expect(result.accountName).toBe('Unnamed Account')
    expect(result.type).toBe('Uncategorized')
    expect(result.startingBalance).toBe(0)
    expect(result.netTransfers).toBe(0)
    expect(result.currentBalance).toBe(0)
    expect(result.hasNetTransfers).toBe(false)
    expect(result.hasCurrentBalance).toBe(false)
  })

  it('resolves alternate name candidate', () => {
    const record = { id: 'recAcc3', fields: { Name: 'Checking' } }
    const result = mapAccountRecord(record, accountsFields)
    expect(result.accountName).toBe('Checking')
  })
})

// ---------------------------------------------------------------------------
// mapTransferRecord
// ---------------------------------------------------------------------------
describe('mapTransferRecord', () => {
  it('maps a full transfer record correctly', () => {
    const record = {
      id: 'recTr1',
      fields: {
        Date: '2026-01-10',
        'Account Name (from Account)': 'Savings',
        Category: 'Income',
        Amount: 1200,
        'Signed Amount': 1200,
        Source: 'Upwork',
        'Week Start Date': '2026-01-07',
      },
    }
    const result = mapTransferRecord(record, transfersFields)
    expect(result.id).toBe('recTr1')
    expect(result.date).toBe('2026-01-10')
    expect(result.account).toBe('Savings')
    expect(result.category).toBe('Income')
    expect(result.amount).toBe(1200)
    expect(result.signedAmount).toBe(1200)
    expect(result.source).toBe('Upwork')
    expect(result.weekStartDate).toBe('2026-01-07')
  })

  it('falls back to linked Account field when accountName is absent', () => {
    const record = {
      id: 'recTr2',
      fields: {
        Date: '2026-02-01',
        Account: ['recAccId1'],
        Amount: 500,
      },
    }
    const result = mapTransferRecord(record, transfersFields)
    expect(result.account).toBe('recAccId1')
  })

  it('applies defaults for missing fields', () => {
    const record = { id: 'recTr3', fields: {} }
    const result = mapTransferRecord(record, transfersFields)
    expect(result.category).toBe('Deposit')
    expect(result.amount).toBe(0)
    expect(result.signedAmount).toBe(0)
    expect(result.source).toBe('Manual')
    expect(result.account).toBe('Unknown Account')
  })
})

// ---------------------------------------------------------------------------
// sortByDateAsc / sortByDateDesc
// ---------------------------------------------------------------------------
describe('sortByDateAsc', () => {
  it('sorts records from oldest to newest', () => {
    const records = [
      { dateObj: new Date('2026-03-01') },
      { dateObj: new Date('2026-01-01') },
      { dateObj: new Date('2026-02-01') },
    ]
    const sorted = sortByDateAsc(records)
    expect(sorted[0].dateObj.getUTCMonth()).toBe(0) // January
    expect(sorted[1].dateObj.getUTCMonth()).toBe(1) // February
    expect(sorted[2].dateObj.getUTCMonth()).toBe(2) // March
  })

  it('places records without dateObj at the end', () => {
    const records = [
      { dateObj: null },
      { dateObj: new Date('2026-01-01') },
    ]
    const sorted = sortByDateAsc(records)
    expect(sorted[0].dateObj).not.toBeNull()
    expect(sorted[1].dateObj).toBeNull()
  })

  it('does not mutate the original array', () => {
    const records = [{ dateObj: new Date('2026-03-01') }, { dateObj: new Date('2026-01-01') }]
    const original = [...records]
    sortByDateAsc(records)
    expect(records[0]).toBe(original[0])
  })
})

describe('sortByDateDesc', () => {
  it('sorts records from newest to oldest', () => {
    const records = [
      { dateObj: new Date('2026-01-01') },
      { dateObj: new Date('2026-03-01') },
      { dateObj: new Date('2026-02-01') },
    ]
    const sorted = sortByDateDesc(records)
    expect(sorted[0].dateObj.getUTCMonth()).toBe(2) // March
    expect(sorted[2].dateObj.getUTCMonth()).toBe(0) // January
  })
})
