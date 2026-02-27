import { useState } from 'react'
import {
  IonButton,
  IonButtons,
  IonHeader,
  IonIcon,
  IonPopover,
  IonTitle,
  IonToolbar,
} from '@ionic/react'
import { chevronBackOutline, settingsOutline } from 'ionicons/icons'
import { useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'
import { useAppStore } from '../../store/useAppStore'

interface AppHeaderProps {
  title: string
  showMenu?: boolean
  showBack?: boolean
  backTo?: string
}

export function AppHeader({ title, showMenu = false, showBack = false, backTo = '/timer' }: AppHeaderProps) {
  const { t } = useTranslation()
  const history = useHistory()
  const [open, setOpen] = useState(false)
  const timer = useAppStore((state) => state.timer)
  const setFocusMessageVisible = useAppStore((state) => state.setFocusMessageVisible)

  const activeWorkLocked = timer.sessionType === 'work' && timer.status !== 'idle'

  const goTo = (route: string) => {
    setOpen(false)
    if (route === '/settings' && activeWorkLocked) {
      setFocusMessageVisible(true)
      return
    }
    history.push(route)
  }

  return (
    <IonHeader className="app-header">
      <IonToolbar className="app-toolbar">
        {showBack ? (
          <IonButtons slot="start">
            <IonButton className="header-icon-button" aria-label={t('menu.back')} onClick={() => history.push(backTo)}>
              <IonIcon icon={chevronBackOutline} />
            </IonButton>
          </IonButtons>
        ) : null}
        <IonTitle>{title}</IonTitle>
        {showMenu ? (
          <IonButtons slot="end">
            <IonButton className="header-icon-button" aria-label={t('timer.openMenu')} onClick={() => setOpen(true)}>
              <IonIcon icon={settingsOutline} />
            </IonButton>
          </IonButtons>
        ) : null}
      </IonToolbar>
      <IonPopover isOpen={open} onDidDismiss={() => setOpen(false)}>
        <div className="menu-popover">
          <IonButton expand="block" fill="clear" onClick={() => goTo('/settings')}>
            {t('menu.settings')}
          </IonButton>
          <IonButton expand="block" fill="clear" onClick={() => goTo('/stats')}>
            {t('menu.stats')}
          </IonButton>
          <IonButton expand="block" fill="clear" onClick={() => goTo('/about')}>
            {t('menu.about')}
          </IonButton>
        </div>
      </IonPopover>
    </IonHeader>
  )
}
