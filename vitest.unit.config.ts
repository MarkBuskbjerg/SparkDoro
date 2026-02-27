import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    include: ['src/domain/**/*.test.ts', 'src/theme/**/*.test.ts'],
    environment: 'node',
  },
})
