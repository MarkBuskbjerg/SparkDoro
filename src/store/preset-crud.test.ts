import { beforeEach, describe, expect, it } from 'vitest'
import { DEFAULT_STATE } from './defaults'
import { useAppStore } from './useAppStore'

const basePresetInput = {
  name: 'Deep Work',
  workMinutes: 50,
  shortBreakMinutes: 10,
  longBreakMinutes: 20,
  longBreakInterval: 3,
}

describe('preset CRUD', () => {
  beforeEach(() => {
    useAppStore.setState({
      ...DEFAULT_STATE,
      initialized: true,
    })
  })

  it('renames the active preset with fallback when blank', async () => {
    const state = useAppStore.getState()
    const presetId = state.settings.activePresetId

    await state.renamePreset(presetId, 'Deep Work')
    expect(useAppStore.getState().settings.presets[0].name).toBe('Deep Work')

    await state.renamePreset(presetId, '   ')
    expect(useAppStore.getState().settings.presets[0].name).toBe('Preset 1')
  })

  it('deletes active preset and selects a valid fallback', async () => {
    const state = useAppStore.getState()
    await state.addPreset(basePresetInput)
    const activePresetId = useAppStore.getState().settings.activePresetId

    await state.deletePreset(activePresetId)
    expect(useAppStore.getState().settings.presets).toHaveLength(1)
    expect(useAppStore.getState().settings.activePresetId).toBe(useAppStore.getState().settings.presets[0].id)
  })

  it('does not delete when only one preset remains', async () => {
    const state = useAppStore.getState()
    const onlyPresetId = state.settings.activePresetId

    await state.deletePreset(onlyPresetId)
    expect(useAppStore.getState().settings.presets).toHaveLength(1)
  })

  it('uses add preset input values and syncs idle timer with selected preset', async () => {
    const state = useAppStore.getState()
    await state.addPreset(basePresetInput)

    const newActive = useAppStore.getState().settings.presets.find((preset) => preset.name === 'Deep Work')
    expect(newActive).toBeDefined()
    expect(newActive?.workMinutes).toBe(50)
    expect(newActive?.shortBreakMinutes).toBe(10)
    expect(newActive?.longBreakMinutes).toBe(20)
    expect(newActive?.longBreakInterval).toBe(3)

    expect(useAppStore.getState().timer.remainingMs).toBe(50 * 60_000)
  })
})
