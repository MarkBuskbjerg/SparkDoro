import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_STATE } from './defaults'
import { useAppStore } from './useAppStore'

describe('timer store flow', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-02-27T08:00:00Z'))
    useAppStore.setState({
      ...DEFAULT_STATE,
      initialized: true,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('supports start pause resume reset cycle', () => {
    const store = useAppStore.getState()

    store.startSession()
    expect(useAppStore.getState().timer.status).toBe('running')

    store.pauseSession()
    expect(useAppStore.getState().timer.status).toBe('paused')

    store.resumeSession()
    expect(useAppStore.getState().timer.status).toBe('running')

    store.resetSession()
    expect(useAppStore.getState().timer.status).toBe('idle')
  })
})
