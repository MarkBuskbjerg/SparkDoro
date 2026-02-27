import { useEffect } from 'react'
import { useAppStore } from './useAppStore'

export function useTimerTicker() {
  const isRunning = useAppStore((state) => state.timer.status === 'running')
  const tick = useAppStore((state) => state.tick)

  useEffect(() => {
    if (!isRunning) {
      return
    }
    const interval = window.setInterval(() => tick(Date.now()), 1_000)
    return () => window.clearInterval(interval)
  }, [isRunning, tick])
}
