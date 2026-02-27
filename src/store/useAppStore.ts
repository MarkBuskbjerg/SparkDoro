import { create } from 'zustand'
import { canPersist, canReportCrash, canTrackAnalytics } from '../domain/privacy/policy'
import { transitionTimer } from '../domain/timer/engine'
import type { Preset, TimerConfig, TimerEffect, TimerEvent } from '../domain/timer/types'
import { getLocalDate, incrementDailyCount } from '../domain/stats/stats'
import { analyticsGateway } from '../services/analytics'
import { crashGateway } from '../services/crash'
import { hapticsGateway } from '../platform/capacitor/hapticsGateway'
import { notificationGateway } from '../platform/capacitor/notificationGateway'
import { capacitorStorageGateway } from '../platform/capacitor/storageGateway'
import { applyTheme, prefersDarkSystemTheme, resolveTheme, subscribeToSystemTheme } from '../theme/theme'
import { DEFAULT_SETTINGS, DEFAULT_STATE } from './defaults'
import type { AppActions, AppSettings, AppStore, NewPresetInput } from './types'
import i18n from '../i18n'

function createPresetId(): string {
  return `preset-${Date.now()}`
}

function defaultPresetName(index: number): string {
  return `Preset ${index + 1}`
}

function normalizeDuration(value: number, fallback: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return fallback
  }
  return Math.round(value)
}

function sanitizeNewPreset(input: NewPresetInput, fallbackName: string): NewPresetInput {
  return {
    name: input.name.trim() || fallbackName,
    workMinutes: normalizeDuration(input.workMinutes, DEFAULT_SETTINGS.presets[0].workMinutes),
    shortBreakMinutes: normalizeDuration(input.shortBreakMinutes, DEFAULT_SETTINGS.presets[0].shortBreakMinutes),
    longBreakMinutes: normalizeDuration(input.longBreakMinutes, DEFAULT_SETTINGS.presets[0].longBreakMinutes),
    longBreakInterval: normalizeDuration(input.longBreakInterval, DEFAULT_SETTINGS.presets[0].longBreakInterval),
  }
}

function durationFromPreset(preset: Preset, sessionType: AppStore['timer']['sessionType']): number {
  if (sessionType === 'work') {
    return preset.workMinutes * 60_000
  }
  if (sessionType === 'short_break') {
    return preset.shortBreakMinutes * 60_000
  }
  return preset.longBreakMinutes * 60_000
}

function syncIdleTimerToPreset(timer: AppStore['timer'], preset: Preset): AppStore['timer'] {
  if (timer.status !== 'idle') {
    return timer
  }
  return {
    ...timer,
    remainingMs: durationFromPreset(preset, timer.sessionType),
  }
}

function activePreset(settings: AppSettings): Preset {
  return settings.presets.find((preset) => preset.id === settings.activePresetId) ?? settings.presets[0]
}

function timerConfig(settings: AppSettings): TimerConfig {
  return {
    preset: activePreset(settings),
    focusMode: settings.focusMode,
    strictPauseLimit: settings.strictPauseLimit,
    autoStartBreaks: settings.autoStartBreaks,
    autoStartWork: settings.autoStartWork,
  }
}

function isSettingsLocked(timerStatus: AppStore['timer']): boolean {
  return timerStatus.sessionType === 'work' && timerStatus.status !== 'idle'
}

function applyTelemetryPolicies(settings: AppSettings) {
  analyticsGateway.setEnabled(canTrackAnalytics(settings.privacyMode, settings.analyticsConsent))
  crashGateway.setEnabled(canReportCrash(settings.privacyMode))
}

async function persistSettingsAndHistory(settings: AppSettings, history: AppStore['history']) {
  if (!canPersist(settings.privacyMode)) {
    await capacitorStorageGateway.clearAll()
    return
  }
  await Promise.all([
    capacitorStorageGateway.saveSettings(settings),
    capacitorStorageGateway.saveHistory(history),
  ])
}

function processEffects(
  effects: TimerEffect[],
  event: TimerEvent,
  settings: AppSettings,
  history: AppStore['history'],
): { nextHistory: AppStore['history']; banner: AppStore['bannerWarning'] } {
  let nextHistory = history
  let banner: AppStore['bannerWarning'] = null

  for (const effect of effects) {
    if (effect.type === 'schedule-notification') {
      void notificationGateway.scheduleSessionEnd(effect.sessionType, effect.plannedEndTs)
    }

    if (effect.type === 'cancel-notification') {
      void notificationGateway.cancelSessionEnd()
    }

    if (effect.type === 'session-completed') {
      void hapticsGateway.notifyCompletion()
      if (effect.completedWork) {
        const date = getLocalDate(new Date(event.nowTs))
        nextHistory = incrementDailyCount(nextHistory, date)
        analyticsGateway.track('session_completed_work')
      } else {
        analyticsGateway.track('session_completed_break', {
          sessionType: effect.sessionType,
        })
      }
    }

    if (effect.type === 'banner') {
      banner = effect.warning
    }
  }

  if (event.type === 'START') {
    analyticsGateway.track('session_started', {
      mode: settings.focusMode,
    })
  }

  return { nextHistory, banner }
}

let stopThemeListener: (() => void) | null = null

const actions = (set: (partial: Partial<AppStore>) => void, get: () => AppStore): AppActions => ({
  async init() {
    const [storedSettings, storedHistory] = await Promise.all([
      capacitorStorageGateway.loadSettings(),
      capacitorStorageGateway.loadHistory(),
      capacitorStorageGateway.clearSession(),
    ])

    const presets =
      storedSettings?.presets?.map((preset, index) => ({
        ...preset,
        name: preset.name.trim() || defaultPresetName(index),
      })) ?? DEFAULT_SETTINGS.presets

    const settings: AppSettings = {
      ...DEFAULT_SETTINGS,
      ...storedSettings,
      presets: presets.length ? presets : DEFAULT_SETTINGS.presets,
    }

    if (!settings.presets.find((preset) => preset.id === settings.activePresetId)) {
      settings.activePresetId = settings.presets[0].id
    }

    const resolvedTheme = resolveTheme(settings.theme, prefersDarkSystemTheme())
    applyTheme(settings.theme, resolvedTheme)

    if (stopThemeListener) {
      stopThemeListener()
    }
    stopThemeListener = subscribeToSystemTheme((prefersDark) => {
      const state = get()
      if (state.settings.theme !== 'system') {
        return
      }

      const nextResolvedTheme = resolveTheme('system', prefersDark)
      applyTheme('system', nextResolvedTheme)
      set({ resolvedTheme: nextResolvedTheme })
    })

    await i18n.changeLanguage(settings.language)
    applyTelemetryPolicies(settings)
    analyticsGateway.track('app_opened')

    set({
      initialized: true,
      settings,
      resolvedTheme,
      history: canPersist(settings.privacyMode) ? storedHistory : [],
      timer: syncIdleTimerToPreset(
        {
          ...DEFAULT_STATE.timer,
        },
        activePreset(settings),
      ),
    })
  },

  startSession() {
    const state = get()
    const nowTs = Date.now()
    const event: TimerEvent =
      state.timer.status === 'paused' ? { type: 'RESUME', nowTs } : { type: 'START', nowTs }
    const transition = transitionTimer(state.timer, event, timerConfig(state.settings))
    const { nextHistory, banner } = processEffects(transition.effects, event, state.settings, state.history)

    set({
      timer: transition.state,
      history: nextHistory,
      bannerWarning: banner,
    })

    void persistSettingsAndHistory(state.settings, nextHistory)
  },

  pauseSession() {
    const state = get()
    const event: TimerEvent = { type: 'PAUSE', nowTs: Date.now() }
    const transition = transitionTimer(state.timer, event, timerConfig(state.settings))
    const { nextHistory, banner } = processEffects(transition.effects, event, state.settings, state.history)
    set({
      timer: transition.state,
      history: nextHistory,
      bannerWarning: banner,
    })
  },

  resumeSession() {
    get().startSession()
  },

  resetSession() {
    const state = get()
    const event: TimerEvent = { type: 'RESET', nowTs: Date.now() }
    const transition = transitionTimer(state.timer, event, timerConfig(state.settings))
    const { nextHistory, banner } = processEffects(transition.effects, event, state.settings, state.history)

    set({
      timer: transition.state,
      history: nextHistory,
      bannerWarning: banner,
    })
  },

  tick(nowTs = Date.now()) {
    const state = get()
    const event: TimerEvent = { type: 'TICK', nowTs }
    const transition = transitionTimer(state.timer, event, timerConfig(state.settings))
    const { nextHistory, banner } = processEffects(transition.effects, event, state.settings, state.history)

    set({
      timer: transition.state,
      history: nextHistory,
      bannerWarning: banner,
    })

    if (nextHistory !== state.history && canPersist(state.settings.privacyMode)) {
      void capacitorStorageGateway.saveHistory(nextHistory)
    }
  },

  appResumed(nowTs = Date.now()) {
    const state = get()
    const event: TimerEvent = { type: 'APP_RESUME', nowTs }
    const transition = transitionTimer(state.timer, event, timerConfig(state.settings))
    const { nextHistory, banner } = processEffects(transition.effects, event, state.settings, state.history)

    set({
      timer: transition.state,
      history: nextHistory,
      bannerWarning: banner,
    })
  },

  applyCallInterruption() {
    const state = get()
    const event: TimerEvent = { type: 'CALL_INTERRUPTION', nowTs: Date.now() }
    const transition = transitionTimer(state.timer, event, timerConfig(state.settings))
    const { nextHistory, banner } = processEffects(transition.effects, event, state.settings, state.history)
    set({ timer: transition.state, history: nextHistory, bannerWarning: banner })
  },

  applyTimeChange() {
    const state = get()
    const event: TimerEvent = { type: 'TIME_CHANGE', nowTs: Date.now() }
    const transition = transitionTimer(state.timer, event, timerConfig(state.settings))
    const { nextHistory, banner } = processEffects(transition.effects, event, state.settings, state.history)
    set({ timer: transition.state, history: nextHistory, bannerWarning: banner })
  },

  setTimeframe(timeframe) {
    set({ timeframe })
  },

  dismissBanner() {
    set({ bannerWarning: null })
  },

  setFocusMessageVisible(visible) {
    set({ focusMessageVisible: visible })
  },

  async updateSettings(partial) {
    const state = get()
    if (isSettingsLocked(state.timer)) {
      set({ focusMessageVisible: true })
      return
    }

    const previousFocusMode = state.settings.focusMode
    const nextSettings = {
      ...state.settings,
      ...partial,
    }

    if (!nextSettings.presets.find((preset) => preset.id === nextSettings.activePresetId)) {
      nextSettings.activePresetId = nextSettings.presets[0].id
    }

    if (partial.language && partial.language !== state.settings.language) {
      await i18n.changeLanguage(partial.language)
    }

    const nextResolvedTheme = resolveTheme(nextSettings.theme, prefersDarkSystemTheme())
    applyTheme(nextSettings.theme, nextResolvedTheme)

    applyTelemetryPolicies(nextSettings)
    if (partial.focusMode && partial.focusMode !== previousFocusMode) {
      analyticsGateway.track('mode_changed', { mode: partial.focusMode })
    }

    const nextHistory = canPersist(nextSettings.privacyMode) ? state.history : []
    set({
      settings: nextSettings,
      resolvedTheme: nextResolvedTheme,
      history: nextHistory,
      focusMessageVisible: false,
    })
    await persistSettingsAndHistory(nextSettings, nextHistory)
  },

  async updatePreset(preset) {
    const state = get()
    if (isSettingsLocked(state.timer)) {
      set({ focusMessageVisible: true })
      return
    }

    const presets = state.settings.presets.map((item, index) =>
      item.id === preset.id
        ? {
            ...preset,
            name: preset.name.trim() || defaultPresetName(index),
          }
        : item,
    )
    const nextSettings = { ...state.settings, presets }
    const nextActivePreset = activePreset(nextSettings)
    set({
      settings: nextSettings,
      timer: syncIdleTimerToPreset(state.timer, nextActivePreset),
    })
    await persistSettingsAndHistory(nextSettings, state.history)
  },

  async addPreset(input) {
    const state = get()
    if (isSettingsLocked(state.timer)) {
      set({ focusMessageVisible: true })
      return
    }

    const nextPresetIndex = state.settings.presets.length
    const fallbackName = defaultPresetName(nextPresetIndex)
    const sanitized = sanitizeNewPreset(input, fallbackName)
    const newPreset: Preset = {
      id: createPresetId(),
      name: sanitized.name,
      workMinutes: sanitized.workMinutes,
      shortBreakMinutes: sanitized.shortBreakMinutes,
      longBreakMinutes: sanitized.longBreakMinutes,
      longBreakInterval: sanitized.longBreakInterval,
    }

    const nextSettings = {
      ...state.settings,
      presets: [...state.settings.presets, newPreset],
      activePresetId: newPreset.id,
    }
    set({
      settings: nextSettings,
      timer: syncIdleTimerToPreset(state.timer, newPreset),
    })
    await persistSettingsAndHistory(nextSettings, state.history)
  },

  async selectPreset(presetId) {
    const state = get()
    if (isSettingsLocked(state.timer)) {
      set({ focusMessageVisible: true })
      return
    }

    if (!state.settings.presets.find((preset) => preset.id === presetId)) {
      return
    }
    const nextSettings = {
      ...state.settings,
      activePresetId: presetId,
    }
    const nextActivePreset = activePreset(nextSettings)
    set({
      settings: nextSettings,
      timer: syncIdleTimerToPreset(state.timer, nextActivePreset),
    })
    await persistSettingsAndHistory(nextSettings, state.history)
  },

  async renamePreset(presetId, name) {
    const state = get()
    if (isSettingsLocked(state.timer)) {
      set({ focusMessageVisible: true })
      return
    }

    const targetIndex = state.settings.presets.findIndex((preset) => preset.id === presetId)
    if (targetIndex < 0) {
      return
    }

    const sanitizedName = name.trim() || defaultPresetName(targetIndex)
    if (state.settings.presets[targetIndex].name === sanitizedName) {
      return
    }

    const presets = state.settings.presets.map((preset, index) =>
      index === targetIndex
        ? {
            ...preset,
            name: sanitizedName,
          }
        : preset,
    )
    const nextSettings = { ...state.settings, presets }
    set({ settings: nextSettings })
    await persistSettingsAndHistory(nextSettings, state.history)
  },

  async deletePreset(presetId) {
    const state = get()
    if (isSettingsLocked(state.timer)) {
      set({ focusMessageVisible: true })
      return
    }

    if (state.settings.presets.length <= 1) {
      return
    }

    const remainingPresets = state.settings.presets.filter((preset) => preset.id !== presetId)
    if (!remainingPresets.length) {
      return
    }

    const nextActivePresetId =
      state.settings.activePresetId === presetId ? remainingPresets[0].id : state.settings.activePresetId

    const nextSettings = {
      ...state.settings,
      presets: remainingPresets,
      activePresetId: nextActivePresetId,
    }
    const nextActivePreset = activePreset(nextSettings)
    set({
      settings: nextSettings,
      timer: syncIdleTimerToPreset(state.timer, nextActivePreset),
    })
    await persistSettingsAndHistory(nextSettings, state.history)
  },
})

export const useAppStore = create<AppStore>()((set, get) => ({
  ...DEFAULT_STATE,
  ...actions(set, get),
}))
