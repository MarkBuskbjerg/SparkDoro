import dayjs from 'dayjs'

export interface DailyHistoryEntry {
  date: string
  completedWorkSessions: number
}

export type TimeframePreset = '7' | '30' | 'custom'

export interface Timeframe {
  preset: TimeframePreset
  customStart?: string
  customEnd?: string
}

export function getLocalDate(date = new Date()): string {
  return dayjs(date).format('YYYY-MM-DD')
}

export function incrementDailyCount(
  entries: DailyHistoryEntry[],
  date: string,
  delta = 1,
): DailyHistoryEntry[] {
  const map = new Map(entries.map((entry) => [entry.date, entry]))
  const current = map.get(date)
  if (current) {
    map.set(date, {
      ...current,
      completedWorkSessions: current.completedWorkSessions + delta,
    })
  } else {
    map.set(date, {
      date,
      completedWorkSessions: delta,
    })
  }
  return [...map.values()].sort((a, b) => a.date.localeCompare(b.date))
}

export function getRange(timeframe: Timeframe, now = dayjs()): { start: string; end: string } {
  if (timeframe.preset === 'custom' && timeframe.customStart && timeframe.customEnd) {
    return { start: timeframe.customStart, end: timeframe.customEnd }
  }
  if (timeframe.preset === '30') {
    return {
      start: now.subtract(29, 'day').format('YYYY-MM-DD'),
      end: now.format('YYYY-MM-DD'),
    }
  }
  return {
    start: now.subtract(6, 'day').format('YYYY-MM-DD'),
    end: now.format('YYYY-MM-DD'),
  }
}

export function buildStatsSeries(entries: DailyHistoryEntry[], timeframe: Timeframe): DailyHistoryEntry[] {
  const range = getRange(timeframe)
  const start = dayjs(range.start)
  const end = dayjs(range.end)
  const byDate = new Map(entries.map((entry) => [entry.date, entry.completedWorkSessions]))
  const result: DailyHistoryEntry[] = []

  let cursor = start
  while (cursor.isSame(end) || cursor.isBefore(end)) {
    const key = cursor.format('YYYY-MM-DD')
    result.push({
      date: key,
      completedWorkSessions: byDate.get(key) ?? 0,
    })
    cursor = cursor.add(1, 'day')
  }

  return result
}
