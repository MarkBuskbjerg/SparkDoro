import { IonButton, IonCard, IonCardContent, IonContent, IonPage, IonText } from '@ionic/react'
import { useTranslation } from 'react-i18next'
import { getCycleProgressLabel } from '../../domain/timer/engine'
import { useAppStore } from '../../store/useAppStore'
import { AnalyticsConsentCard } from '../components/AnalyticsConsentCard'
import { AppHeader } from '../components/AppHeader'
import { FocusLockModal } from '../components/FocusLockModal'

function toClockLabel(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1_000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export function TimerScreen() {
  const { t } = useTranslation()
  const timer = useAppStore((state) => state.timer)
  const settings = useAppStore((state) => state.settings)
  const startSession = useAppStore((state) => state.startSession)
  const pauseSession = useAppStore((state) => state.pauseSession)
  const resetSession = useAppStore((state) => state.resetSession)
  const dismissBanner = useAppStore((state) => state.dismissBanner)
  const remainingMs = timer.remainingMs
  const preset = settings.presets.find((item) => item.id === settings.activePresetId) ?? settings.presets[0]
  const progressLabel = getCycleProgressLabel(timer, preset.longBreakInterval)

  const buttonLabel =
    timer.status === 'paused'
      ? t('timer.resume')
      : timer.status === 'running'
        ? t('timer.pause')
        : t('timer.start')

  const onPrimaryButton = () => {
    if (timer.status === 'running') {
      pauseSession()
    } else {
      startSession()
    }
  }

  const warningMessage =
    timer.warning === 'session_reset_call'
      ? t('timer.resetCall')
      : timer.warning === 'session_reset_time_change'
        ? t('timer.resetTimeChange')
        : null

  return (
    <IonPage>
      <AppHeader title={t('appName')} showMenu />
      <IonContent fullscreen>
        <FocusLockModal />
        <div className="page-body">
          <AnalyticsConsentCard />
          <IonCard className="timer-card">
            <IonCardContent>
              <p className="session-label">{t(`session.${timer.sessionType}`)}</p>
              <h1 className="time-label" aria-label="remaining-time">
                {toClockLabel(remainingMs)}
              </h1>
              <p className="progress-label">{t('timer.progress', { value: progressLabel })}</p>
              <p className="timer-footnote">
                {preset.name} - {preset.workMinutes}/{preset.shortBreakMinutes}/{preset.longBreakMinutes} -{' '}
                {preset.longBreakInterval}x
              </p>
              <div className="control-row">
                <IonButton onClick={onPrimaryButton}>{buttonLabel}</IonButton>
                <IonButton color="medium" onClick={resetSession}>
                  {t('timer.reset')}
                </IonButton>
              </div>
            </IonCardContent>
          </IonCard>
          {warningMessage ? (
            <IonText color="warning">
              <p className="warning-banner" onClick={dismissBanner}>
                {warningMessage}
              </p>
            </IonText>
          ) : null}
        </div>
      </IonContent>
    </IonPage>
  )
}
