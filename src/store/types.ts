import type { AnalyticsConsent, PrivacyMode } from '../domain/privacy/policy'
import type { Preset, TimerState } from '../domain/timer/types'
import type { DailyHistoryEntry, Timeframe } from '../domain/stats/stats'

export type Language = 'en' | 'da'
export type ThemePreference = 'system' | 'light' | 'dark'
export type SoundOption = 'chime' | 'bell' | 'digital'

export interface NewPresetInput {
  name: string
  workMinutes: number
  shortBreakMinutes: number
  longBreakMinutes: number
  longBreakInterval: number
}

export interface AppSettings {
  presets: Preset[]
  activePresetId: string
  autoStartBreaks: boolean
  autoStartWork: boolean
  focusMode: 'strict' | 'loose'
  strictPauseLimit: number
  sound: SoundOption
  theme: ThemePreference
  language: Language
  showLiveActivity: boolean
  showAndroidOngoingNotification: boolean
  showWidgetQuickStart: boolean
  analyticsConsent: AnalyticsConsent
  privacyMode: PrivacyMode
}

export interface AppState {
  initialized: boolean
  timer: TimerState
  settings: AppSettings
  resolvedTheme: 'light' | 'dark'
  history: DailyHistoryEntry[]
  timeframe: Timeframe
  focusMessageVisible: boolean
  bannerWarning: TimerState['warning']
}

export interface AppActions {
  init(): Promise<void>
  startSession(): void
  pauseSession(): void
  resumeSession(): void
  resetSession(): void
  tick(nowTs?: number): void
  appResumed(nowTs?: number): void
  applyCallInterruption(): void
  applyTimeChange(): void
  setTimeframe(timeframe: Timeframe): void
  dismissBanner(): void
  setFocusMessageVisible(visible: boolean): void
  updateSettings(partial: Partial<AppSettings>): Promise<void>
  updatePreset(preset: Preset): Promise<void>
  addPreset(input: NewPresetInput): Promise<void>
  selectPreset(presetId: string): Promise<void>
  renamePreset(presetId: string, name: string): Promise<void>
  deletePreset(presetId: string): Promise<void>
}

export type AppStore = AppState & AppActions
