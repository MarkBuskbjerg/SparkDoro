import { describe, expect, it } from 'vitest'
import { canPersist, canReportCrash, canTrackAnalytics } from './policy'

describe('privacy policy', () => {
  it('disables persistence in strict mode', () => {
    expect(canPersist('normal')).toBe(true)
    expect(canPersist('privacy')).toBe(true)
    expect(canPersist('strict')).toBe(false)
  })

  it('tracks analytics only in normal mode with consent', () => {
    expect(canTrackAnalytics('normal', 'granted')).toBe(true)
    expect(canTrackAnalytics('normal', 'denied')).toBe(false)
    expect(canTrackAnalytics('privacy', 'granted')).toBe(false)
    expect(canTrackAnalytics('strict', 'granted')).toBe(false)
  })

  it('enables crash reporting only in normal mode', () => {
    expect(canReportCrash('normal')).toBe(true)
    expect(canReportCrash('privacy')).toBe(false)
    expect(canReportCrash('strict')).toBe(false)
  })
})
