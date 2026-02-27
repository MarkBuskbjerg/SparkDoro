export type PrivacyMode = 'normal' | 'privacy' | 'strict'
export type AnalyticsConsent = 'unknown' | 'granted' | 'denied'

export function canPersist(mode: PrivacyMode): boolean {
  return mode !== 'strict'
}

export function canTrackAnalytics(mode: PrivacyMode, consent: AnalyticsConsent): boolean {
  return mode === 'normal' && consent === 'granted'
}

export function canReportCrash(mode: PrivacyMode): boolean {
  return mode === 'normal'
}
