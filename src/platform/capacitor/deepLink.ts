export type DeepLinkAction = 'start-work' | 'open-timer' | 'open-stats' | null

export function parseDeepLink(url: string): DeepLinkAction {
  if (url.includes('sparkdoro://start-work')) {
    return 'start-work'
  }
  if (url.includes('sparkdoro://open-stats')) {
    return 'open-stats'
  }
  if (url.includes('sparkdoro://open-timer')) {
    return 'open-timer'
  }
  return null
}
