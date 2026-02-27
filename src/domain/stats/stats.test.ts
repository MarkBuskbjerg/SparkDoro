import dayjs from 'dayjs'
import { describe, expect, it } from 'vitest'
import { buildStatsSeries, getRange, incrementDailyCount } from './stats'

describe('stats domain', () => {
  it('increments daily count', () => {
    const entries = incrementDailyCount([], '2026-02-26')
    const next = incrementDailyCount(entries, '2026-02-26')

    expect(next[0]).toEqual({ date: '2026-02-26', completedWorkSessions: 2 })
  })

  it('returns last 7 day range by default', () => {
    const now = dayjs('2026-02-27')
    const range = getRange({ preset: '7' }, now)
    expect(range).toEqual({ start: '2026-02-21', end: '2026-02-27' })
  })

  it('fills missing days for chart series', () => {
    const entries = [{ date: '2026-02-25', completedWorkSessions: 3 }]
    const series = buildStatsSeries(entries, {
      preset: 'custom',
      customStart: '2026-02-24',
      customEnd: '2026-02-26',
    })

    expect(series).toEqual([
      { date: '2026-02-24', completedWorkSessions: 0 },
      { date: '2026-02-25', completedWorkSessions: 3 },
      { date: '2026-02-26', completedWorkSessions: 0 },
    ])
  })
})
