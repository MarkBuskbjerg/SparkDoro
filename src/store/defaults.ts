import { DEFAULT_PRESET, DEFAULT_TIMER_STATE } from '../domain/timer/defaults'
import type { AppSettings, AppState } from './types'

export const DEFAULT_SETTINGS: AppSettings = {
  presets: [DEFAULT_PRESET],
  activePresetId: DEFAULT_PRESET.id,
  autoStartBreaks: true,
  autoStartWork: true,
  focusMode: 'strict',
  strictPauseLimit: 1,
  sound: 'chime',
  theme: 'system',
  language: 'en',
  showLiveActivity: false,
  showAndroidOngoingNotification: false,
  showWidgetQuickStart: false,
  analyticsConsent: 'unknown',
  privacyMode: 'normal',
}

export const DEFAULT_STATE: AppState = {
  initialized: false,
  timer: DEFAULT_TIMER_STATE,
  settings: DEFAULT_SETTINGS,
  resolvedTheme: 'light',
  history: [],
  timeframe: { preset: '7' },
  focusMessageVisible: false,
  bannerWarning: null,
}
