import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import type { SessionType } from '../../domain/timer/types'

const SESSION_NOTIFICATION_ID = 1001

export interface NotificationGateway {
  ensurePermission(): Promise<boolean>
  scheduleSessionEnd(sessionType: SessionType, plannedEndTs: number): Promise<void>
  cancelSessionEnd(): Promise<void>
}

function labelForSession(sessionType: SessionType): string {
  if (sessionType === 'work') {
    return 'Work session complete'
  }
  if (sessionType === 'long_break') {
    return 'Long break complete'
  }
  return 'Break complete'
}

export const notificationGateway: NotificationGateway = {
  async ensurePermission() {
    if (!Capacitor.isNativePlatform()) {
      return true
    }
    const status = await LocalNotifications.requestPermissions()
    return status.display === 'granted'
  },

  async scheduleSessionEnd(sessionType, plannedEndTs) {
    if (!Capacitor.isNativePlatform()) {
      return
    }
    await LocalNotifications.schedule({
      notifications: [
        {
          id: SESSION_NOTIFICATION_ID,
          title: 'SparkDoro',
          body: labelForSession(sessionType),
          schedule: { at: new Date(plannedEndTs) },
        },
      ],
    })
  },

  async cancelSessionEnd() {
    if (!Capacitor.isNativePlatform()) {
      return
    }
    await LocalNotifications.cancel({ notifications: [{ id: SESSION_NOTIFICATION_ID }] })
  },
}
