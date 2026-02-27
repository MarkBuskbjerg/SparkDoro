import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_STATE } from './defaults'
import { useAppStore } from './useAppStore'

function createMediaQueryList(matches: boolean): MediaQueryList {
  return {
    matches,
    media: '(prefers-color-scheme: dark)',
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn().mockReturnValue(true),
  } as unknown as MediaQueryList
}

describe('theme settings', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: vi.fn().mockImplementation(() => createMediaQueryList(true)),
    })

    useAppStore.setState({
      ...DEFAULT_STATE,
      initialized: true,
    })
  })

  it('applies dark theme when explicitly selected', async () => {
    await useAppStore.getState().updateSettings({ theme: 'dark' })

    expect(useAppStore.getState().resolvedTheme).toBe('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(document.documentElement.classList.contains('ion-palette-dark')).toBe(true)
  })

  it('resolves system theme from matchMedia', async () => {
    await useAppStore.getState().updateSettings({ theme: 'system' })

    expect(useAppStore.getState().resolvedTheme).toBe('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
  })
})
