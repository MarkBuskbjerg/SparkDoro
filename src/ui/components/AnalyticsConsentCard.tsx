import { IonButton } from '@ionic/react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../../store/useAppStore'

export function AnalyticsConsentCard() {
  const { t } = useTranslation()
  const settings = useAppStore((state) => state.settings)
  const updateSettings = useAppStore((state) => state.updateSettings)

  if (settings.analyticsConsent !== 'unknown' || settings.privacyMode !== 'normal') {
    return null
  }

  return (
    <div className="consent-card">
      <p className="support-text">{t('timer.analyticsPrompt')}</p>
      <div className="control-row">
        <IonButton size="small" onClick={() => void updateSettings({ analyticsConsent: 'granted' })}>
          {t('timer.analyticsAllow')}
        </IonButton>
        <IonButton
          size="small"
          fill="outline"
          color="medium"
          onClick={() => void updateSettings({ analyticsConsent: 'denied' })}
        >
          {t('timer.analyticsDeny')}
        </IonButton>
      </div>
    </div>
  )
}
