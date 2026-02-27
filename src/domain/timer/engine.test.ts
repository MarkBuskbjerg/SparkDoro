import { describe, expect, it } from 'vitest'
import { DEFAULT_PRESET, DEFAULT_TIMER_STATE } from './defaults'
import { getRemainingMs, transitionTimer } from './engine'
import type { TimerConfig, TimerState } from './types'

const BASE_CONFIG: TimerConfig = {
  preset: { ...DEFAULT_PRESET, workMinutes: 1, shortBreakMinutes: 1, longBreakMinutes: 2, longBreakInterval: 4 },
  focusMode: 'strict',
  strictPauseLimit: 1,
  autoStartBreaks: true,
  autoStartWork: true,
}

function runningWorkState(nowTs: number): TimerState {
  const started = transitionTimer(DEFAULT_TIMER_STATE, { type: 'START', nowTs }, BASE_CONFIG)
  return started.state
}

describe('timer engine', () => {
  it('starts and schedules session end', () => {
    const result = transitionTimer(DEFAULT_TIMER_STATE, { type: 'START', nowTs: 1_000 }, BASE_CONFIG)

    expect(result.state.status).toBe('running')
    expect(result.state.sessionPlannedEndTimestamp).toBe(61_000)
    expect(result.effects).toContainEqual({
      type: 'schedule-notification',
      sessionType: 'work',
      plannedEndTs: 61_000,
    })
  })

  it('only allows one pause in strict work sessions', () => {
    const started = runningWorkState(0)
    const paused = transitionTimer(started, { type: 'PAUSE', nowTs: 10_000 }, BASE_CONFIG)
    const resumed = transitionTimer(paused.state, { type: 'RESUME', nowTs: 15_000 }, BASE_CONFIG)
    const blockedPause = transitionTimer(resumed.state, { type: 'PAUSE', nowTs: 20_000 }, BASE_CONFIG)

    expect(paused.state.status).toBe('paused')
    expect(paused.state.pauseCount).toBe(1)
    expect(blockedPause.state.status).toBe('running')
    expect(blockedPause.state.pauseCount).toBe(1)
  })

  it('moves to break and counts completed work only on completion', () => {
    const started = runningWorkState(0)
    const completed = transitionTimer(started, { type: 'TICK', nowTs: 60_000 }, BASE_CONFIG)

    expect(completed.effects).toContainEqual({
      type: 'session-completed',
      sessionType: 'work',
      completedWork: true,
    })
    expect(completed.state.sessionType).toBe('short_break')
    expect(completed.state.status).toBe('running')
    expect(completed.state.completedWorkInCycle).toBe(1)
  })

  it('manual reset does not count session completion', () => {
    const started = runningWorkState(0)
    const reset = transitionTimer(started, { type: 'RESET', nowTs: 59_000 }, BASE_CONFIG)
    const completionEffects = reset.effects.filter((effect) => effect.type === 'session-completed')

    expect(reset.state.status).toBe('idle')
    expect(completionEffects).toHaveLength(0)
  })

  it('stops auto-start when breaks are disabled', () => {
    const config: TimerConfig = {
      ...BASE_CONFIG,
      autoStartBreaks: false,
    }
    const started = transitionTimer(DEFAULT_TIMER_STATE, { type: 'START', nowTs: 0 }, config)
    const completed = transitionTimer(started.state, { type: 'TICK', nowTs: 60_000 }, config)

    expect(completed.state.status).toBe('idle')
    expect(completed.state.sessionType).toBe('short_break')
  })

  it('resets timer on call interruption with warning', () => {
    const started = runningWorkState(0)
    const interrupted = transitionTimer(started, { type: 'CALL_INTERRUPTION', nowTs: 5_000 }, BASE_CONFIG)

    expect(interrupted.state.status).toBe('idle')
    expect(interrupted.state.warning).toBe('session_reset_call')
  })

  it('resets timer on device time change with warning', () => {
    const started = runningWorkState(0)
    const changed = transitionTimer(started, { type: 'TIME_CHANGE', nowTs: 5_000 }, BASE_CONFIG)

    expect(changed.state.status).toBe('idle')
    expect(changed.state.warning).toBe('session_reset_time_change')
  })

  it('computes remaining time from timestamps for running and paused states', () => {
    const started = runningWorkState(0)
    const paused = transitionTimer(started, { type: 'PAUSE', nowTs: 10_000 }, BASE_CONFIG)

    expect(getRemainingMs(started, 20_000)).toBe(40_000)
    expect(getRemainingMs(paused.state, 20_000)).toBe(50_000)
  })
})
