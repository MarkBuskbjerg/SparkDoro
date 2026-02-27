# SparkDoro

Local-first strict Pomodoro app built with Ionic React + Capacitor.

## Stack

- React + TypeScript + Vite
- Ionic UI + Capacitor plugins
- Zustand state store with pure domain modules
- i18next localization (English + Danish)
- Vitest + RTL + Playwright + Maestro + axe-core

## Prerequisites

1. Node 22 (`.nvmrc` is pinned to `22`)
2. npm 10+
3. Java 17 + Android SDK + `adb` for Android test flows
4. Optional: Maestro CLI for Android E2E flows

## Install

```bash
npm install
```

## Development

```bash
npm run dev
```

## Quality Gates

- `npm run lint`
- `npm run typecheck`
- `npm run test:unit`
- `npm run test:component`
- `npm run test:a11y`
- `npm run test:a11y:browser`
- `npm run test:e2e:web`
- `npm run test:e2e:android` (requires emulator + Maestro)
- `npm run verify` (all non-Android local checks)
- `npm run verify:android` (verify + Maestro)

## Accessibility Testing

- `npm run test:a11y` runs jsdom-based smoke checks with `axe-core`.
- `npm run test:a11y:browser` runs the primary compliance gate in real Chromium via Playwright + axe.

## Capacitor

```bash
npx cap add android
npx cap add ios
npm run build
npx cap sync
```

## Key Features Implemented

- Timestamp-based timer engine with strict/loose mode
- One-pause limit in strict mode
- 25/5/15 protocol with long break every 4 work sessions
- Settings lock during active work session
- Local notifications + haptics adapters
- Local-only history and stats (7/30/custom)
- Privacy modes (Normal/Privacy/Strict)
- Analytics consent and crash reporting policy gates
- Deep-link routing for widget/start intents
- English + Danish localization baseline

## CI

- `.github/workflows/ci-core.yml`
- `.github/workflows/ci-android.yml`
- `.github/workflows/ci-ios.yml`
