import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'dk.sparkdoro.app',
  appName: 'SparkDoro',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#1f7a8c',
      sound: 'beep.wav',
    },
  },
}

export default config
