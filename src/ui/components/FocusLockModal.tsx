import { IonButton, IonModal } from '@ionic/react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../../store/useAppStore'

export function FocusLockModal() {
  const { t } = useTranslation()
  const visible = useAppStore((state) => state.focusMessageVisible)
  const setVisible = useAppStore((state) => state.setFocusMessageVisible)

  return (
    <IonModal isOpen={visible} onDidDismiss={() => setVisible(false)}>
      <div className="focus-lock-modal">
        <p className="support-text">{t('timer.focusLocked')}</p>
        <IonButton onClick={() => setVisible(false)}>OK</IonButton>
      </div>
    </IonModal>
  )
}
