export type AnalyticsEventName =
  | 'app_opened'
  | 'session_started'
  | 'session_completed_work'
  | 'session_completed_break'
  | 'mode_changed'

export interface AnalyticsGateway {
  setEnabled(enabled: boolean): void
  track(eventName: AnalyticsEventName, payload?: Record<string, unknown>): void
}

class ConsoleAnalyticsGateway implements AnalyticsGateway {
  private enabled = false

  setEnabled(enabled: boolean) {
    this.enabled = enabled
  }

  track(eventName: AnalyticsEventName, payload: Record<string, unknown> = {}) {
    if (!this.enabled) {
      return
    }
    console.info('[analytics]', eventName, payload)
  }
}

export const analyticsGateway: AnalyticsGateway = new ConsoleAnalyticsGateway()
