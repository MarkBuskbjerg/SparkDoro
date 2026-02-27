import { App as CapacitorApp } from '@capacitor/app'

export interface LifecycleHandlers {
  onResume: () => void
  onPause: () => void
  onCallInterruption: () => void
  onTimeChange: () => void
  onDeepLink: (url: string) => void
}

function supportsNavigatorWakeLock(): boolean {
  return typeof document !== 'undefined'
}

export async function registerLifecycleHandlers(handlers: LifecycleHandlers): Promise<() => void> {
  const listeners = await Promise.all([
    CapacitorApp.addListener('resume', handlers.onResume),
    CapacitorApp.addListener('pause', handlers.onPause),
    CapacitorApp.addListener('appUrlOpen', (event) => handlers.onDeepLink(event.url)),
  ])

  const visibilityChange = () => {
    if (document.visibilityState === 'visible') {
      handlers.onResume()
    } else {
      handlers.onPause()
    }
  }

  const timeChangeHandler = () => handlers.onTimeChange()
  const callHandler = () => handlers.onCallInterruption()
  const onlineHandler = () => handlers.onResume()

  if (supportsNavigatorWakeLock()) {
    document.addEventListener('visibilitychange', visibilityChange)
  }
  window.addEventListener('sparkdoro:time-change', timeChangeHandler as EventListener)
  window.addEventListener('sparkdoro:call', callHandler as EventListener)
  window.addEventListener('online', onlineHandler)

  return () => {
    for (const listener of listeners) {
      listener.remove()
    }
    if (supportsNavigatorWakeLock()) {
      document.removeEventListener('visibilitychange', visibilityChange)
    }
    window.removeEventListener('sparkdoro:time-change', timeChangeHandler as EventListener)
    window.removeEventListener('sparkdoro:call', callHandler as EventListener)
    window.removeEventListener('online', onlineHandler)
  }
}
