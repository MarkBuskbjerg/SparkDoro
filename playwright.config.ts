import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e/web',
  retries: 0,
  use: {
    baseURL: 'http://localhost:4173',
    channel: 'chrome',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run dev -- --host localhost --port 4173',
    port: 4173,
    timeout: 120_000,
    reuseExistingServer: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
