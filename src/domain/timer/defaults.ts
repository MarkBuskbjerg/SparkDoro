import type { Preset, TimerState } from './types'

export const DEFAULT_PRESET: Preset = {
  id: 'default',
  name: 'Classic 25/5',
  workMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  longBreakInterval: 4,
}

export const DEFAULT_TIMER_STATE: TimerState = {
  sessionType: 'work',
  sessionStartTimestamp: null,
  sessionPlannedEndTimestamp: null,
  status: 'idle',
  isRunning: false,
  isPaused: false,
  pausedRemainingMs: null,
  remainingMs: DEFAULT_PRESET.workMinutes * 60_000,
  pauseCount: 0,
  completedWorkInCycle: 0,
  lastCompletedSessionType: null,
  warning: null,
}
