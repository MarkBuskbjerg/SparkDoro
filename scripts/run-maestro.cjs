#!/usr/bin/env node
const { spawnSync } = require('node:child_process')

const check = spawnSync('maestro', ['--version'], { stdio: 'ignore', shell: true })
if (check.status !== 0) {
  console.error('Maestro CLI is not installed. Install via: curl -Ls "https://get.maestro.mobile.dev" | bash')
  process.exit(1)
}

const result = spawnSync('maestro', ['test', 'maestro/flows/smoke.yaml'], {
  stdio: 'inherit',
  shell: true,
})
process.exit(result.status ?? 1)
