import { describe, expect, it } from 'vitest'
import { resolveTheme } from './theme'

describe('theme resolution', () => {
  it('resolves explicit theme directly', () => {
    expect(resolveTheme('light', true)).toBe('light')
    expect(resolveTheme('dark', false)).toBe('dark')
  })

  it('resolves system theme from media preference', () => {
    expect(resolveTheme('system', true)).toBe('dark')
    expect(resolveTheme('system', false)).toBe('light')
  })
})
