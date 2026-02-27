import { useEffect, useMemo, useState } from 'react'
import {
  IonButton,
  IonContent,
  IonInput,
  IonItem,
  IonLabel,
  IonPage,
  IonSelect,
  IonSelectOption,
  IonToggle,
} from '@ionic/react'
import { useTranslation } from 'react-i18next'
import { notificationGateway } from '../../platform/capacitor/notificationGateway'
import { hapticsGateway } from '../../platform/capacitor/hapticsGateway'
import { AppHeader } from '../components/AppHeader'
import { FocusLockModal } from '../components/FocusLockModal'
import { useAppStore } from '../../store/useAppStore'
import type { PrivacyMode } from '../../domain/privacy/policy'
import type { AppSettings, NewPresetInput } from '../../store/types'

function toNumber(value: unknown, fallback: number): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : fallback
}

function buildPresetDraft(name: string): NewPresetInput {
  return {
    name,
    workMinutes: 25,
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
    longBreakInterval: 4,
  }
}

export function SettingsScreen() {
  const { t } = useTranslation()
  const timer = useAppStore((state) => state.timer)
  const settings = useAppStore((state) => state.settings)
  const updateSettings = useAppStore((state) => state.updateSettings)
  const addPreset = useAppStore((state) => state.addPreset)
  const selectPreset = useAppStore((state) => state.selectPreset)
  const renamePreset = useAppStore((state) => state.renamePreset)
  const deletePreset = useAppStore((state) => state.deletePreset)
  const [notificationEnabled, setNotificationEnabled] = useState(true)
  const [showPresetForm, setShowPresetForm] = useState(false)
  const [newPreset, setNewPreset] = useState<NewPresetInput>(buildPresetDraft(''))

  const activePreset = useMemo(
    () => settings.presets.find((preset) => preset.id === settings.activePresetId) ?? settings.presets[0],
    [settings.activePresetId, settings.presets],
  )
  const lockChanges = timer.sessionType === 'work' && timer.status !== 'idle'
  const hasMultiplePresets = settings.presets.length > 1

  useEffect(() => {
    void notificationGateway.ensurePermission().then(setNotificationEnabled)
  }, [])

  const onSettingChange = (partial: Partial<AppSettings>) => {
    void updateSettings(partial)
  }

  const openCreatePreset = () => {
    const draft = buildPresetDraft(`${t('settings.preset')} ${settings.presets.length + 1}`)
    setNewPreset(draft)
    setShowPresetForm(true)
  }

  const submitPreset = () => {
    void addPreset(newPreset)
    setShowPresetForm(false)
  }

  return (
    <IonPage>
      <AppHeader title={t('settings.title')} showBack />
      <IonContent fullscreen>
        <FocusLockModal />
        <div className="page-body settings-layout">
          <h2 className="screen-heading">{t('settings.title')}</h2>
          {!notificationEnabled ? (
            <p className="support-text">{t('settings.notificationsHint')}</p>
          ) : null}

          <section className="settings-section">
            <h3 className="settings-heading">{t('settings.presets')}</h3>
            <IonItem className="settings-item">
              <IonLabel>{t('settings.presets')}</IonLabel>
              <IonSelect
                value={settings.activePresetId}
                onIonChange={(event) => void selectPreset(event.detail.value)}
                disabled={lockChanges}
              >
                {settings.presets.map((preset) => (
                  <IonSelectOption key={preset.id} value={preset.id}>
                    {preset.name}
                  </IonSelectOption>
                ))}
              </IonSelect>
            </IonItem>
            <IonItem className="settings-item">
              <IonLabel position="stacked">{t('settings.presetName')}</IonLabel>
              <IonInput
                value={activePreset.name}
                placeholder={t('settings.presetNamePlaceholder')}
                onIonChange={(event) => void renamePreset(activePreset.id, String(event.detail.value ?? ''))}
                disabled={lockChanges}
              />
            </IonItem>
            <div className="preset-summary">
              <span className="preset-pill">{t('settings.workMinutes')}: {activePreset.workMinutes}m</span>
              <span className="preset-pill">{t('settings.shortBreakMinutes')}: {activePreset.shortBreakMinutes}m</span>
              <span className="preset-pill">{t('settings.longBreakMinutes')}: {activePreset.longBreakMinutes}m</span>
              <span className="preset-pill">{t('settings.longBreakInterval')}: {activePreset.longBreakInterval}</span>
            </div>
            <div className="control-row control-row-stack">
              <IonButton expand="block" fill="outline" onClick={openCreatePreset} disabled={lockChanges}>
                {t('settings.addPreset')}
              </IonButton>
              <IonButton
                expand="block"
                fill="clear"
                color="danger"
                onClick={() => void deletePreset(activePreset.id)}
                disabled={lockChanges || !hasMultiplePresets}
              >
                {t('settings.deletePreset')}
              </IonButton>
            </div>
            {!hasMultiplePresets ? (
              <p className="support-text">{t('settings.keepOnePreset')}</p>
            ) : null}
            {showPresetForm ? (
              <div className="preset-form">
                <h4 className="settings-heading">{t('settings.newPreset')}</h4>
                <div className="preset-form-grid">
                  <IonItem className="settings-item">
                    <IonLabel position="stacked">{t('settings.presetName')}</IonLabel>
                    <IonInput
                      value={newPreset.name}
                      onIonChange={(event) =>
                        setNewPreset((prev) => ({ ...prev, name: String(event.detail.value ?? '') }))
                      }
                    />
                  </IonItem>
                  <IonItem className="settings-item">
                    <IonLabel>{t('settings.workMinutes')}</IonLabel>
                    <IonInput
                      type="number"
                      inputMode="numeric"
                      value={newPreset.workMinutes}
                      onIonChange={(event) =>
                        setNewPreset((prev) => ({
                          ...prev,
                          workMinutes: toNumber(event.detail.value, prev.workMinutes),
                        }))
                      }
                    />
                  </IonItem>
                  <IonItem className="settings-item">
                    <IonLabel>{t('settings.shortBreakMinutes')}</IonLabel>
                    <IonInput
                      type="number"
                      inputMode="numeric"
                      value={newPreset.shortBreakMinutes}
                      onIonChange={(event) =>
                        setNewPreset((prev) => ({
                          ...prev,
                          shortBreakMinutes: toNumber(event.detail.value, prev.shortBreakMinutes),
                        }))
                      }
                    />
                  </IonItem>
                  <IonItem className="settings-item">
                    <IonLabel>{t('settings.longBreakMinutes')}</IonLabel>
                    <IonInput
                      type="number"
                      inputMode="numeric"
                      value={newPreset.longBreakMinutes}
                      onIonChange={(event) =>
                        setNewPreset((prev) => ({
                          ...prev,
                          longBreakMinutes: toNumber(event.detail.value, prev.longBreakMinutes),
                        }))
                      }
                    />
                  </IonItem>
                  <IonItem className="settings-item">
                    <IonLabel>{t('settings.longBreakInterval')}</IonLabel>
                    <IonInput
                      type="number"
                      inputMode="numeric"
                      value={newPreset.longBreakInterval}
                      onIonChange={(event) =>
                        setNewPreset((prev) => ({
                          ...prev,
                          longBreakInterval: toNumber(event.detail.value, prev.longBreakInterval),
                        }))
                      }
                    />
                  </IonItem>
                </div>
                <div className="control-row control-row-stack">
                  <IonButton expand="block" onClick={submitPreset}>
                    {t('settings.savePreset')}
                  </IonButton>
                  <IonButton expand="block" fill="clear" color="medium" onClick={() => setShowPresetForm(false)}>
                    {t('settings.cancelPreset')}
                  </IonButton>
                </div>
              </div>
            ) : null}
          </section>

          <section className="settings-section">
            <h3 className="settings-heading">{t('settings.timerBehavior')}</h3>
            <IonItem className="settings-item">
              <IonLabel>{t('settings.autoStartBreaks')}</IonLabel>
              <IonToggle
                checked={settings.autoStartBreaks}
                onIonChange={(event) => onSettingChange({ autoStartBreaks: event.detail.checked })}
                disabled={lockChanges}
              />
            </IonItem>
            <IonItem className="settings-item">
              <IonLabel>{t('settings.autoStartWork')}</IonLabel>
              <IonToggle
                checked={settings.autoStartWork}
                onIonChange={(event) => onSettingChange({ autoStartWork: event.detail.checked })}
                disabled={lockChanges}
              />
            </IonItem>
            <IonItem className="settings-item">
              <IonLabel>{t('settings.focusMode')}</IonLabel>
              <IonSelect
                value={settings.focusMode}
                onIonChange={(event) => onSettingChange({ focusMode: event.detail.value })}
                disabled={lockChanges}
              >
                <IonSelectOption value="strict">{t('settings.strict')}</IonSelectOption>
                <IonSelectOption value="loose">{t('settings.loose')}</IonSelectOption>
              </IonSelect>
            </IonItem>
            <IonItem className="settings-item">
              <IonLabel>{t('settings.strictPauseLimit')}</IonLabel>
              <IonInput
                type="number"
                inputMode="numeric"
                value={settings.strictPauseLimit}
                onIonChange={(event) =>
                  onSettingChange({ strictPauseLimit: toNumber(event.detail.value, settings.strictPauseLimit) })
                }
                disabled={lockChanges}
              />
            </IonItem>
          </section>

          <section className="settings-section">
            <h3 className="settings-heading">{t('settings.appearance')}</h3>
            <IonItem className="settings-item">
              <IonLabel>{t('settings.theme')}</IonLabel>
              <IonSelect value={settings.theme} onIonChange={(event) => onSettingChange({ theme: event.detail.value })}>
                <IonSelectOption value="system">{t('settings.system')}</IonSelectOption>
                <IonSelectOption value="light">{t('settings.light')}</IonSelectOption>
                <IonSelectOption value="dark">{t('settings.dark')}</IonSelectOption>
              </IonSelect>
            </IonItem>
            <IonItem className="settings-item">
              <IonLabel>{t('settings.language')}</IonLabel>
              <IonSelect
                value={settings.language}
                onIonChange={(event) => onSettingChange({ language: event.detail.value })}
              >
                <IonSelectOption value="en">{t('settings.english')}</IonSelectOption>
                <IonSelectOption value="da">{t('settings.danish')}</IonSelectOption>
              </IonSelect>
            </IonItem>
          </section>

          <section className="settings-section">
            <h3 className="settings-heading">{t('settings.privacyAndFeatures')}</h3>
            <IonItem className="settings-item">
              <IonLabel>{t('settings.analyticsConsent')}</IonLabel>
              <IonToggle
                checked={settings.analyticsConsent === 'granted'}
                onIonChange={(event) =>
                  onSettingChange({ analyticsConsent: event.detail.checked ? 'granted' : 'denied' })
                }
              />
            </IonItem>
            <IonItem className="settings-item">
              <IonLabel>{t('settings.privacyMode')}</IonLabel>
              <IonSelect
                value={settings.privacyMode}
                onIonChange={(event) => onSettingChange({ privacyMode: event.detail.value as PrivacyMode })}
              >
                <IonSelectOption value="normal">{t('settings.privacyNormal')}</IonSelectOption>
                <IonSelectOption value="privacy">{t('settings.privacyPrivacy')}</IonSelectOption>
                <IonSelectOption value="strict">{t('settings.privacyStrict')}</IonSelectOption>
              </IonSelect>
            </IonItem>
            <IonItem className="settings-item">
              <IonLabel>{t('settings.showLiveActivity')}</IonLabel>
              <IonToggle
                checked={settings.showLiveActivity}
                onIonChange={(event) => onSettingChange({ showLiveActivity: event.detail.checked })}
              />
            </IonItem>
            <IonItem className="settings-item">
              <IonLabel>{t('settings.showAndroidOngoing')}</IonLabel>
              <IonToggle
                checked={settings.showAndroidOngoingNotification}
                onIonChange={(event) =>
                  onSettingChange({
                    showAndroidOngoingNotification: event.detail.checked,
                  })
                }
              />
            </IonItem>
            <IonItem className="settings-item">
              <IonLabel>{t('settings.showWidgetQuickStart')}</IonLabel>
              <IonToggle
                checked={settings.showWidgetQuickStart}
                onIonChange={(event) => onSettingChange({ showWidgetQuickStart: event.detail.checked })}
              />
            </IonItem>
            <IonButton expand="block" fill="outline" onClick={() => void hapticsGateway.notifyCompletion()}>
              {t('settings.testSound')}
            </IonButton>
            <p className="support-text">{t('settings.privacyExplainer')}</p>
          </section>
        </div>
      </IonContent>
    </IonPage>
  )
}
