import { Capacitor } from '@capacitor/core'
import { Haptics, NotificationType } from '@capacitor/haptics'

export interface HapticsGateway {
  notifyCompletion(): Promise<void>
}

export const hapticsGateway: HapticsGateway = {
  async notifyCompletion() {
    if (!Capacitor.isNativePlatform()) {
      return
    }
    await Haptics.notification({ type: NotificationType.Success })
  },
}
