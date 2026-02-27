import { beforeEach, describe, expect, it } from 'vitest'
import axe from 'axe-core'
import { DEFAULT_STATE } from '../store/defaults'
import { useAppStore } from '../store/useAppStore'
import { renderWithProviders } from '../test/renderWithProviders'
import { AboutScreen } from '../ui/screens/AboutScreen'
import { SettingsScreen } from '../ui/screens/SettingsScreen'
import { StatsScreen } from '../ui/screens/StatsScreen'
import { TimerScreen } from '../ui/screens/TimerScreen'

describe('accessibility checks', () => {
  beforeEach(() => {
    useAppStore.setState({
      ...DEFAULT_STATE,
      initialized: true,
    })
  })

  it('timer screen has no serious violations', async () => {
    const { container } = renderWithProviders(<TimerScreen />)
    const result = await axe.run(container)
    expect(result.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')).toHaveLength(0)
  })

  it('settings screen has no serious violations', async () => {
    const { container } = renderWithProviders(<SettingsScreen />)
    const result = await axe.run(container)
    expect(result.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')).toHaveLength(0)
  })

  it('stats and about screens have no serious violations', async () => {
    const view = renderWithProviders(<StatsScreen />)
    let result = await axe.run(view.container)
    expect(result.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')).toHaveLength(0)
    const utils = renderWithProviders(<AboutScreen />)
    result = await axe.run(utils.container)
    expect(result.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')).toHaveLength(0)
  })
})
