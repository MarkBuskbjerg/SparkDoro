import { IonContent, IonPage } from '@ionic/react'
import { useTranslation } from 'react-i18next'
import { AppHeader } from '../components/AppHeader'

export function AboutScreen() {
  const { t } = useTranslation()
  return (
    <IonPage>
      <AppHeader title={t('about.title')} showBack />
      <IonContent fullscreen>
        <div className="page-body about-layout">
          <h2 className="screen-heading">{t('about.title')}</h2>
          <section className="about-card">
            <h3 className="settings-heading">{t('appName')}</h3>
            <p>{t('about.text')}</p>
          </section>

          <section className="about-card">
            <h3 className="settings-heading">{t('about.focusIntegration')}</h3>
            <p>{t('about.focusHint')}</p>
            <p>{t('about.widgetHint')}</p>
          </section>
        </div>
      </IonContent>
    </IonPage>
  )
}
