import { useEffect, useRef } from 'react'
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react'
import { IonReactRouter } from '@ionic/react-router'
import { Redirect, Route, useHistory } from 'react-router-dom'
import { parseDeepLink } from './platform/capacitor/deepLink'
import { registerLifecycleHandlers } from './platform/capacitor/lifecycleGateway'
import { useAppStore } from './store/useAppStore'
import { useTimerTicker } from './store/useTimerTicker'
import { AboutScreen } from './ui/screens/AboutScreen'
import { SettingsScreen } from './ui/screens/SettingsScreen'
import { StatsScreen } from './ui/screens/StatsScreen'
import { TimerScreen } from './ui/screens/TimerScreen'
import './App.css'

setupIonicReact()

function AppBridge() {
  const history = useHistory()
  const appResumed = useAppStore((state) => state.appResumed)
  const applyCallInterruption = useAppStore((state) => state.applyCallInterruption)
  const applyTimeChange = useAppStore((state) => state.applyTimeChange)
  const startSession = useAppStore((state) => state.startSession)
  const timeSnapshot = useRef({
    wall: 0,
    monotonic: 0,
  })

  useEffect(() => {
    if (timeSnapshot.current.wall === 0) {
      timeSnapshot.current = {
        wall: Date.now(),
        monotonic: performance.now(),
      }
    }

    const onResume = () => {
      const currentWall = Date.now()
      const currentMono = performance.now()
      const elapsedMono = currentMono - timeSnapshot.current.monotonic
      const expectedWall = timeSnapshot.current.wall + elapsedMono
      const drift = Math.abs(currentWall - expectedWall)

      timeSnapshot.current = { wall: currentWall, monotonic: currentMono }

      if (drift > 90_000) {
        applyTimeChange()
        return
      }

      appResumed(currentWall)
    }

    let cleanup: (() => void) | undefined
    void registerLifecycleHandlers({
      onResume,
      onPause: () => undefined,
      onCallInterruption: applyCallInterruption,
      onTimeChange: applyTimeChange,
      onDeepLink: (url) => {
        const action = parseDeepLink(url)
        if (action === 'open-stats') {
          history.push('/stats')
        }
        if (action === 'open-timer') {
          history.push('/timer')
        }
        if (action === 'start-work') {
          history.push('/timer')
          startSession()
        }
      },
    }).then((value) => {
      cleanup = value
    })
    return () => cleanup?.()
  }, [appResumed, applyCallInterruption, applyTimeChange, history, startSession])

  useEffect(() => {
    let managedButton: HTMLButtonElement | null = null

    const focusableSelectButton = (event: FocusEvent): HTMLButtonElement | null => {
      const [target] = event.composedPath()
      if (!(target instanceof HTMLButtonElement)) {
        return null
      }
      return target.closest('ion-select') ? target : null
    }

    const getActiveSelectButton = (): HTMLButtonElement | null => {
      let active: Element | null = document.activeElement
      while (active instanceof HTMLElement && active.shadowRoot?.activeElement) {
        active = active.shadowRoot.activeElement
      }
      if (!(active instanceof HTMLButtonElement)) {
        return null
      }
      return active.closest('ion-select') ? active : null
    }

    const applyFocusRing = (button: HTMLButtonElement) => {
      if (managedButton && managedButton !== button) {
        clearFocusRing(managedButton)
      }
      if (button.dataset.sparkFocusManaged === 'true') {
        return
      }
      button.dataset.sparkFocusManaged = 'true'
      button.dataset.sparkPrevOutline = button.style.outline
      button.dataset.sparkPrevOutlineOffset = button.style.outlineOffset
      button.dataset.sparkPrevBoxShadow = button.style.boxShadow
      button.style.outline = '2px solid var(--spark-focus-ring)'
      button.style.outlineOffset = '2px'
      button.style.boxShadow = '0 0 0 3px rgba(244, 114, 182, 0.34)'
      managedButton = button
    }

    const clearFocusRing = (button: HTMLButtonElement) => {
      if (button.dataset.sparkFocusManaged !== 'true') {
        return
      }
      button.style.outline = button.dataset.sparkPrevOutline ?? ''
      button.style.outlineOffset = button.dataset.sparkPrevOutlineOffset ?? ''
      button.style.boxShadow = button.dataset.sparkPrevBoxShadow ?? ''
      delete button.dataset.sparkFocusManaged
      delete button.dataset.sparkPrevOutline
      delete button.dataset.sparkPrevOutlineOffset
      delete button.dataset.sparkPrevBoxShadow
      if (managedButton === button) {
        managedButton = null
      }
    }

    const onFocusIn = (event: FocusEvent) => {
      const button = focusableSelectButton(event)
      if (button) {
        applyFocusRing(button)
      }
    }

    const onFocusOut = (event: FocusEvent) => {
      const button = focusableSelectButton(event)
      if (button) {
        clearFocusRing(button)
      }
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') {
        return
      }
      window.setTimeout(() => {
        const button = getActiveSelectButton()
        if (button) {
          applyFocusRing(button)
        } else if (managedButton) {
          clearFocusRing(managedButton)
        }
      }, 0)
    }

    document.addEventListener('focusin', onFocusIn, true)
    document.addEventListener('focusout', onFocusOut, true)
    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      document.removeEventListener('focusin', onFocusIn, true)
      document.removeEventListener('focusout', onFocusOut, true)
      document.removeEventListener('keydown', onKeyDown, true)
    }
  }, [])

  return null
}

function App() {
  const init = useAppStore((state) => state.init)
  const initialized = useAppStore((state) => state.initialized)
  useTimerTicker()

  useEffect(() => {
    void init()
  }, [init])

  if (!initialized) {
    return <div className="app-loader">Loading SparkDoro...</div>
  }

  return (
    <IonApp>
      <IonReactRouter>
        <AppBridge />
        <IonRouterOutlet>
          <Route path="/timer" component={TimerScreen} exact />
          <Route path="/settings" component={SettingsScreen} exact />
          <Route path="/stats" component={StatsScreen} exact />
          <Route path="/about" component={AboutScreen} exact />
          <Route path="/" render={() => <Redirect to="/timer" />} exact />
        </IonRouterOutlet>
      </IonReactRouter>
    </IonApp>
  )
}

export default App
