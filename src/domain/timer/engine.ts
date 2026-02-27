import type {
  SessionType,
  TimerConfig,
  TimerEffect,
  TimerEvent,
  TimerState,
  TimerTransitionResult,
} from './types'

const MAX_RESUME_ADVANCE_STEPS = 24

function sessionDurationMs(sessionType: SessionType, config: TimerConfig): number {
  switch (sessionType) {
    case 'work':
      return config.preset.workMinutes * 60_000
    case 'short_break':
      return config.preset.shortBreakMinutes * 60_000
    case 'long_break':
      return config.preset.longBreakMinutes * 60_000
    default:
      return config.preset.workMinutes * 60_000
  }
}

function getNextSession(
  current: TimerState,
  completedSession: SessionType,
  config: TimerConfig,
): {
  nextType: SessionType
  completedWorkInCycle: number
  autoStart: boolean
} {
  if (completedSession === 'work') {
    const nextCycleCount = current.completedWorkInCycle + 1
    const reachedLongBreak = nextCycleCount >= config.preset.longBreakInterval

    return {
      nextType: reachedLongBreak ? 'long_break' : 'short_break',
      completedWorkInCycle: reachedLongBreak ? 0 : nextCycleCount,
      autoStart: config.autoStartBreaks,
    }
  }

  return {
    nextType: 'work',
    completedWorkInCycle: current.completedWorkInCycle,
    autoStart: config.autoStartWork,
  }
}

function buildRunningState(
  base: TimerState,
  sessionType: SessionType,
  startTs: number,
  config: TimerConfig,
): TimerState {
  const durationMs = sessionDurationMs(sessionType, config)
  return {
    ...base,
    sessionType,
    sessionStartTimestamp: startTs,
    sessionPlannedEndTimestamp: startTs + durationMs,
    status: 'running',
    isRunning: true,
    isPaused: false,
    pausedRemainingMs: null,
    remainingMs: durationMs,
    warning: null,
  }
}

function buildIdleResetState(previous: TimerState, config: TimerConfig): TimerState {
  return {
    ...previous,
    sessionStartTimestamp: null,
    sessionPlannedEndTimestamp: null,
    status: 'idle',
    isRunning: false,
    isPaused: false,
    pausedRemainingMs: null,
    remainingMs: sessionDurationMs(previous.sessionType, config),
    pauseCount: 0,
  }
}

function tryCompleteUntilNow(
  currentState: TimerState,
  nowTs: number,
  config: TimerConfig,
): TimerTransitionResult {
  let state = currentState
  const effects: TimerEffect[] = []
  let steps = 0

  while (
    state.status === 'running' &&
    state.sessionPlannedEndTimestamp !== null &&
    nowTs >= state.sessionPlannedEndTimestamp &&
    steps < MAX_RESUME_ADVANCE_STEPS
  ) {
    const completedSessionType = state.sessionType
    const transition = getNextSession(state, completedSessionType, config)

    effects.push(
      { type: 'cancel-notification' },
      {
        type: 'session-completed',
        sessionType: completedSessionType,
        completedWork: completedSessionType === 'work',
      },
    )

    if (!transition.autoStart) {
      state = {
        ...state,
        sessionType: transition.nextType,
        completedWorkInCycle: transition.completedWorkInCycle,
        sessionStartTimestamp: null,
        sessionPlannedEndTimestamp: null,
        status: 'idle',
        isRunning: false,
        isPaused: false,
        pausedRemainingMs: null,
        remainingMs: sessionDurationMs(transition.nextType, config),
        pauseCount: 0,
        lastCompletedSessionType: completedSessionType,
        warning: null,
      }
      break
    }

    const newStart = state.sessionPlannedEndTimestamp
    const nextRunning = buildRunningState(state, transition.nextType, newStart, config)
    state = {
      ...nextRunning,
      completedWorkInCycle: transition.completedWorkInCycle,
      pauseCount: 0,
      lastCompletedSessionType: completedSessionType,
    }

    effects.push({
      type: 'schedule-notification',
      plannedEndTs: state.sessionPlannedEndTimestamp!,
      sessionType: state.sessionType,
    })

    steps += 1
  }

  if (state.status === 'running' && state.sessionPlannedEndTimestamp !== null) {
    state = {
      ...state,
      remainingMs: Math.max(0, state.sessionPlannedEndTimestamp - nowTs),
    }
  }

  return { state, effects }
}

export function getRemainingMs(state: TimerState, nowTs: number): number {
  if (state.remainingMs >= 0 && state.status !== 'running') {
    return state.remainingMs
  }
  if (state.status === 'running' && state.sessionPlannedEndTimestamp !== null) {
    return Math.max(0, state.sessionPlannedEndTimestamp - nowTs)
  }
  if (state.status === 'paused' && state.pausedRemainingMs !== null) {
    return Math.max(0, state.pausedRemainingMs)
  }
  return 0
}

export function getCycleProgressLabel(state: TimerState, interval: number): string {
  if (interval <= 0) {
    return '0/0'
  }
  const upcoming = state.sessionType === 'work' ? state.completedWorkInCycle + 1 : state.completedWorkInCycle
  const normalized = Math.min(Math.max(upcoming, 0), interval)
  return `${normalized}/${interval}`
}

export function transitionTimer(
  currentState: TimerState,
  event: TimerEvent,
  config: TimerConfig,
): TimerTransitionResult {
  const state = { ...currentState }
  const effects: TimerEffect[] = []

  switch (event.type) {
    case 'START': {
      if (state.status !== 'idle') {
        return { state, effects }
      }

      const nextState = buildRunningState(state, state.sessionType, event.nowTs, config)
      effects.push({
        type: 'schedule-notification',
        sessionType: nextState.sessionType,
        plannedEndTs: nextState.sessionPlannedEndTimestamp!,
      })
      return { state: nextState, effects }
    }

    case 'PAUSE': {
      if (state.status !== 'running' || state.sessionPlannedEndTimestamp === null) {
        return { state, effects }
      }

      const strictPauseBlocked =
        config.focusMode === 'strict' &&
        state.sessionType === 'work' &&
        state.pauseCount >= config.strictPauseLimit

      if (strictPauseBlocked) {
        return { state, effects }
      }

      const nextState: TimerState = {
        ...state,
        status: 'paused',
        isRunning: false,
        isPaused: true,
        pausedRemainingMs: Math.max(0, state.sessionPlannedEndTimestamp - event.nowTs),
        remainingMs: Math.max(0, state.sessionPlannedEndTimestamp - event.nowTs),
        pauseCount: state.pauseCount + 1,
      }
      effects.push({ type: 'cancel-notification' })
      return { state: nextState, effects }
    }

    case 'RESUME': {
      if (state.status !== 'paused' || state.pausedRemainingMs === null) {
        return { state, effects }
      }

      const nextState: TimerState = {
        ...state,
        status: 'running',
        isRunning: true,
        isPaused: false,
        sessionStartTimestamp: event.nowTs,
        sessionPlannedEndTimestamp: event.nowTs + state.pausedRemainingMs,
        pausedRemainingMs: null,
        remainingMs: state.pausedRemainingMs,
      }
      effects.push({
        type: 'schedule-notification',
        sessionType: nextState.sessionType,
        plannedEndTs: nextState.sessionPlannedEndTimestamp!,
      })
      return { state: nextState, effects }
    }

    case 'RESET': {
      const nextState = buildIdleResetState(state, config)
      if (event.reason) {
        nextState.warning = event.reason
        effects.push({ type: 'banner', warning: event.reason })
      }
      effects.push({ type: 'cancel-notification' })
      return { state: nextState, effects }
    }

    case 'CALL_INTERRUPTION': {
      const nextState = buildIdleResetState(state, config)
      nextState.warning = 'session_reset_call'
      effects.push({ type: 'cancel-notification' }, { type: 'banner', warning: 'session_reset_call' })
      return { state: nextState, effects }
    }

    case 'TIME_CHANGE': {
      const nextState = buildIdleResetState(state, config)
      nextState.warning = 'session_reset_time_change'
      effects.push(
        { type: 'cancel-notification' },
        { type: 'banner', warning: 'session_reset_time_change' },
      )
      return { state: nextState, effects }
    }

    case 'APP_RESUME':
    case 'TICK': {
      return tryCompleteUntilNow(state, event.nowTs, config)
    }

    default:
      return { state, effects }
  }
}
