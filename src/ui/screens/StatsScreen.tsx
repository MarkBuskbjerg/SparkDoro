import {
  IonContent,
  IonDatetime,
  IonItem,
  IonLabel,
  IonPage,
  IonSegment,
  IonSegmentButton,
} from '@ionic/react'
import { useTranslation } from 'react-i18next'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { buildStatsSeries } from '../../domain/stats/stats'
import { useAppStore } from '../../store/useAppStore'
import { AppHeader } from '../components/AppHeader'

export function StatsScreen() {
  const { t } = useTranslation()
  const timeframe = useAppStore((state) => state.timeframe)
  const history = useAppStore((state) => state.history)
  const setTimeframe = useAppStore((state) => state.setTimeframe)

  const data = buildStatsSeries(history, timeframe)

  return (
    <IonPage>
      <AppHeader title={t('stats.title')} showBack />
      <IonContent fullscreen>
        <div className="page-body stats-layout">
          <h2 className="screen-heading">{t('stats.title')}</h2>
          <section className="settings-section stats-filters">
            <IonSegment
              className="stats-segment"
              value={timeframe.preset}
              onIonChange={(event) => setTimeframe({ preset: event.detail.value as '7' | '30' | 'custom' })}
            >
              <IonSegmentButton value="7">
                <IonLabel>{t('stats.last7')}</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="30">
                <IonLabel>{t('stats.last30')}</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="custom">
                <IonLabel>{t('stats.custom')}</IonLabel>
              </IonSegmentButton>
            </IonSegment>
            {timeframe.preset === 'custom' ? (
              <div className="stats-date-grid">
                <IonItem className="settings-item">
                  <IonLabel>{t('stats.startDate')}</IonLabel>
                  <IonDatetime
                    presentation="date"
                    value={timeframe.customStart}
                    onIonChange={(event) =>
                      setTimeframe({
                        ...timeframe,
                        customStart: String(event.detail.value ?? ''),
                      })
                    }
                  />
                </IonItem>
                <IonItem className="settings-item">
                  <IonLabel>{t('stats.endDate')}</IonLabel>
                  <IonDatetime
                    presentation="date"
                    value={timeframe.customEnd}
                    onIonChange={(event) =>
                      setTimeframe({
                        ...timeframe,
                        customEnd: String(event.detail.value ?? ''),
                      })
                    }
                  />
                </IonItem>
              </div>
            ) : null}
          </section>

          <section className="settings-section">
            <h3 className="settings-heading">{t('stats.completed')}</h3>
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="completedWorkSessions"
                    stroke="var(--spark-accent)"
                    fill="var(--spark-accent-soft)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>
      </IonContent>
    </IonPage>
  )
}
