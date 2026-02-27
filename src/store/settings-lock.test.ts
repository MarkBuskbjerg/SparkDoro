import { beforeEach, describe, expect, it } from 'vitest'
import { DEFAULT_STATE } from './defaults'
import { useAppStore } from './useAppStore'

describe('settings lock behavior', () => {
  beforeEach(() => {
    useAppStore.setState({
      ...DEFAULT_STATE,
      initialized: true,
      timer: {
        ...DEFAULT_STATE.timer,
        sessionType: 'work',
        status: 'running',
        isRunning: true,
      },
    })
  })

  it('blocks settings changes during active work session', async () => {
    const oldMode = useAppStore.getState().settings.focusMode
    await useAppStore.getState().updateSettings({ focusMode: 'loose' })

    expect(useAppStore.getState().settings.focusMode).toBe(oldMode)
    expect(useAppStore.getState().focusMessageVisible).toBe(true)
  })
})
