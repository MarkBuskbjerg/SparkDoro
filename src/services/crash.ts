export interface CrashGateway {
  setEnabled(enabled: boolean): void
}

class ConsoleCrashGateway implements CrashGateway {
  setEnabled(enabled: boolean): void {
    console.info(`[crash-reporting] ${enabled ? 'enabled' : 'disabled'}`)
  }
}

export const crashGateway: CrashGateway = new ConsoleCrashGateway()
