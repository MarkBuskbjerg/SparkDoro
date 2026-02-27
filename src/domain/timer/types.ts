export type SessionType = 'work' | 'short_break' | 'long_break'
export type FocusMode = 'strict' | 'loose'

export type TimerStatus = 'idle' | 'running' | 'paused'
export type TimerWarning = 'session_reset_call' | 'session_reset_time_change' | null

export interface Preset {
  id: string
  name: string
  workMinutes: number
  shortBreakMinutes: number
  longBreakMinutes: number
  longBreakInterval: number
}

export interface TimerConfig {
  preset: Preset
  focusMode: FocusMode
  strictPauseLimit: number
  autoStartBreaks: boolean
  autoStartWork: boolean
}

export interface TimerState {
  sessionType: SessionType
  sessionStartTimestamp: number | null
  sessionPlannedEndTimestamp: number | null
  status: TimerStatus
  isRunning: boolean
  isPaused: boolean
  pausedRemainingMs: number | null
  remainingMs: number
  pauseCount: number
  completedWorkInCycle: number
  lastCompletedSessionType: SessionType | null
  warning: TimerWarning
}

export type TimerEvent =
  | { type: 'START'; nowTs: number }
  | { type: 'PAUSE'; nowTs: number }
  | { type: 'RESUME'; nowTs: number }
  | { type: 'RESET'; nowTs: number; reason?: Exclude<TimerWarning, null> }
  | { type: 'TICK'; nowTs: number }
  | { type: 'APP_RESUME'; nowTs: number }
  | { type: 'CALL_INTERRUPTION'; nowTs: number }
  | { type: 'TIME_CHANGE'; nowTs: number }

export type TimerEffect =
  | {
      type: 'schedule-notification'
      sessionType: SessionType
      plannedEndTs: number
    }
  | { type: 'cancel-notification' }
  | {
      type: 'session-completed'
      sessionType: SessionType
      completedWork: boolean
    }
  | {
      type: 'banner'
      warning: Exclude<TimerWarning, null>
    }

export interface TimerTransitionResult {
  state: TimerState
  effects: TimerEffect[]
}
