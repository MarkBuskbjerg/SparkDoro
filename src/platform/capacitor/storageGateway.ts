import { Preferences } from '@capacitor/preferences'
import type { AppSettings } from '../../store/types'
import type { DailyHistoryEntry } from '../../domain/stats/stats'

const SETTINGS_KEY = 'sparkdoro.settings.v1'
const HISTORY_KEY = 'sparkdoro.history.v1'
const SESSION_KEY = 'sparkdoro.session.v1'

export interface StorageGateway {
  loadSettings(): Promise<AppSettings | null>
  saveSettings(settings: AppSettings): Promise<void>
  loadHistory(): Promise<DailyHistoryEntry[]>
  saveHistory(entries: DailyHistoryEntry[]): Promise<void>
  loadSession(): Promise<string | null>
  saveSession(serialized: string): Promise<void>
  clearSession(): Promise<void>
  clearAll(): Promise<void>
}

function safeParse<T>(value: string | null): T | null {
  if (!value) {
    return null
  }
  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}

export const capacitorStorageGateway: StorageGateway = {
  async loadSettings() {
    const { value } = await Preferences.get({ key: SETTINGS_KEY })
    return safeParse<AppSettings>(value)
  },
  async saveSettings(settings) {
    await Preferences.set({
      key: SETTINGS_KEY,
      value: JSON.stringify(settings),
    })
  },
  async loadHistory() {
    const { value } = await Preferences.get({ key: HISTORY_KEY })
    return safeParse<DailyHistoryEntry[]>(value) ?? []
  },
  async saveHistory(entries) {
    await Preferences.set({
      key: HISTORY_KEY,
      value: JSON.stringify(entries),
    })
  },
  async loadSession() {
    const { value } = await Preferences.get({ key: SESSION_KEY })
    return value ?? null
  },
  async saveSession(serialized) {
    await Preferences.set({ key: SESSION_KEY, value: serialized })
  },
  async clearSession() {
    await Preferences.remove({ key: SESSION_KEY })
  },
  async clearAll() {
    await Promise.all([
      Preferences.remove({ key: SETTINGS_KEY }),
      Preferences.remove({ key: HISTORY_KEY }),
      Preferences.remove({ key: SESSION_KEY }),
    ])
  },
}
