import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    include: ['src/a11y/**/*.test.tsx'],
    environment: 'jsdom',
    setupFiles: ['src/test/setup.ts', 'src/test/setup.a11y.ts'],
  },
})
