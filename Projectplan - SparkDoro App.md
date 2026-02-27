# Projectplan - SparkDoro app

## Product Requirements Specification (PRS)

**Product name (working):** SparkDoro
**Platforms:** iOS, Android
**Tech:** Web app + Capacitor (recommended: **Ionic UI + React** + Capacitor)
**Primary users:** Knowledge workers (Danish public sector), focus-mode productivity users
**Core promise:** One-tap strict Pomodoro with reliable background/lockscreen behavior, plus optional data-driven workflows and multiple presets for heavy users.

---

# 1. Goals and non-goals

## 1.1 Goals

1. **Minimal friction:** open app → one-tap start (default autostart protocol).
2. **Reliability:** timer continues correctly when **screen locked** and when app in **background**.
3. **Strict by default:** sessions count only if completed; settings locked during active work session.
4. **Local-first:** all data stored locally; no sign-in; works offline.
5. **Data-driven optional:** advanced users can manage multiple Pomodoro presets and analyze usage.
6. **Privacy controls:** a strict privacy mode disables data storage and disables analytics.

## 1.2 Non-goals (explicit)

- No cloud sync.
- If the OS kills the app or the user swipes it away: timer is **reset/stopped** (no continuation).
- No streak gamification.
- No gestures-based UI.

---

# 2. Core Pomodoro protocol

## 2.1 Default protocol (MVP baseline)

- Work session: **25 min**
- Short break: **5 min**
- Long break: **15 min**
- Long break occurs **after every 4 completed work sessions**
- Default flow: **Auto-start enabled**
  - Work → auto-start break
  - Break → auto-start next work

## 2.2 Modes

### Strict mode (default)

- User cannot switch session types mid-session.
- Only actions allowed mid-session:
  - **Pause** (if you want strict to still allow pause; see 2.3)
  - **Reset** (ends current session; does not count)

- **Counting rule:** a Pomodoro counts in stats **only if a full work session completes**.

### Loose mode (optional setting)

- User may end work early to start a break (explicit UI action).
- Work sessions ended early do **not** count as completed Pomodoros.

## 2.3 Pause behavior (decision required for build; I propose this)

To keep “strict mode” meaningful while still practical:

- **Strict mode:** pause allowed but limited:
  - Max **1 pause** per session (default) OR configurable (advanced).

- **Loose mode:** pause freely.

(If you want _true_ strict: disable pause entirely in Strict mode. This is easy to toggle as a config flag.)

---

# 3. User experience and information architecture

## 3.1 Screens

1. **Timer (primary)**
2. **Settings**
3. **Stats**
4. **About**
5. **Privacy Mode explainer** (can be a section inside Settings)

Navigation:

- Timer screen has a **top-right icon** (gear/menu) leading to Settings/Stats/About.

## 3.2 Timer screen requirements

**Must display:**

- Remaining time (MM:SS)
- Current session type: Work / Break / Long break
- Session count (e.g., **2/4** toward long break)
- Controls: **Start**, **Stop**, **Reset**
  - Start: begins timer (one tap)
  - Stop: interpreted as **Pause** (recommended label: “Pause” to avoid ambiguity)
  - Reset: stops and resets current session

**No gestures.** Touch targets must meet mobile accessibility guidelines.

## 3.3 Settings behavior (focus enforcement)

When a **work session is active**:

- Settings entry is disabled OR tapping it shows a modal:
  - “Stay focused — finish your session before changing settings.”

- Duration/preset changes are blocked mid-work session.

(Allow viewing About/Privacy policy during an active session if required; but keep changes disabled.)

## 3.4 Themes

- Light and Dark theme.
- One primary brand color; otherwise minimal, clean UI.
- Respect system theme by default, with manual override.

---

# 4. Timer engine and lifecycle rules

## 4.1 Timing model (implementation requirement)

Use a timestamp-based engine:

- Store `sessionStartTimestamp`, `sessionPlannedEndTimestamp`, `sessionType`, `isRunning`.
- UI derives remaining time from **current time minus planned end**.
- On app resume from background, recompute remaining time deterministically.

This avoids drift and keeps the timer correct during backgrounding/lock.

## 4.2 App background / lock screen behavior

**Required:**

- Timer continues when:
  - screen locked
  - app in background

**Not required / explicitly not desired:**

- If app is killed/swiped away or OS terminates it:
  - timer resets/stops on next launch
  - no attempt to recover and notify

## 4.3 End-of-session behavior

When a session completes:

- Fire alert:
  - sound + vibration **respecting system settings**

- Show notification:
  - default: one notification per session completion

- Auto-start next session if enabled.

---

# 5. Notifications and “live” surfaces

## 5.1 Local notifications (default)

- Schedule a **local notification** at `plannedEndTimestamp`.
- If user has disabled notifications:
  - the app must still show in-app completion state on return
  - provide guidance in Settings (“Enable notifications for alerts”)

## 5.2 Lock screen timer visibility

### iOS

- Optional feature: **Live Activity** (opt-in)
  - Shows countdown on lock screen / Dynamic Island (supported devices)
  - Controlled by a toggle in Settings (“Show Live Activity”)

### Android

- Default: no ongoing notification unless user enables it.
- Optional feature: **Ongoing notification** (opt-in)
  - Shows countdown while running

This matches your preference: iOS Live Activity is common; Android users may find persistent notifications noisy.

---

# 6. Sounds, haptics, and accessibility

## 6.1 Alerts

- Default intensity: **medium**
- Use system-respecting behavior:
  - obey silent mode / Do Not Disturb as OS allows

- Provide “Test sound” button in Settings.

## 6.2 Sound options

- A small set of pre-selected sounds (e.g., 3–5 options)
- Default sound selected out of the box.

## 6.3 Accessibility compliance

Target: **European accessibility standards** for digital products:

- Conform to **WCAG 2.1 AA** (and by extension EN 301 549 expectations)
- Requirements:
  - screen reader labels for all controls
  - sufficient contrast in both themes
  - supports system font scaling where applicable
  - reduced motion considerations (avoid essential animations)

---

# 7. Data model, stats, and privacy

## 7.1 Local storage

Stored locally (device only):

- Settings:
  - durations
  - auto-start toggles
  - strict/loose mode
  - sound selection
  - theme preference
  - live activity / ongoing notification toggles
  - language selection
  - privacy mode flags

- History entries (if enabled):
  - `date` (local day)
  - completed work sessions count (increment-only for strict completed sessions)
  - optional: per-session log (only if you decide you want detail later)

## 7.2 Stats requirements

- Primary KPI shown: **number of completed Pomodoro work sessions per day**
- Default view: **last 7 days**
- User can change timeframe:
  - last 7 / last 30 / custom range (recommended)

- No streaks.

## 7.3 Privacy modes (important)

You asked for two things that conflict unless formalized:

- “stores all data locally” **and**
- “strict privacy mode where no data is stored” (plus analytics off)

Define three states:

1. **Normal mode (default)**
   - Stores settings and history locally
   - Analytics/crash reporting depends on toggles

2. **Privacy mode (no analytics)**
   - Stores settings/history locally
   - Disables analytics events
   - Keeps crash reporting optional (you can decide if crash reporting counts as “data”)

3. **Strict privacy mode (no storage)**
   - Stores **nothing persistent** (no history, no saved settings)
   - On app close/restart: defaults reset
   - Analytics OFF
   - Crash reporting OFF (recommended to match “no data stored”)

In Strict privacy mode, clarify UX:

- Settings changes are session-only (in-memory) and discarded after app restart.

---

# 8. Analytics and crash reporting

## 8.1 Crash reporting

- Enable crash reporting in Normal/Privacy mode.
- Disable in Strict privacy mode.

Suggested acceptance requirement:

- Crash reporting must not include user-entered content (there is none) and must not transmit session history.

## 8.2 “Cookieless tracking” (Plausible-style)

Because this is a native-wrapped app, you’ll be sending events from JS. Requirements:

- Analytics is **opt-in** on first launch (recommended) _or_ default-on with a clear toggle + policy text (riskier for public-sector audience).
- Provide toggle:
  - “Share anonymous usage analytics”

- Track only:
  - app opened
  - session started
  - session completed (work/break)
  - mode changes (strict/loose)

- No user identifiers beyond what the analytics vendor inherently uses; document clearly in privacy policy.

---

# 9. Widgets and focus mode integration

## 9.1 Home screen widget (nice-to-have, v1.1)

- Widget shows:
  - “Start Pomodoro” button
  - optionally display last session count today

- Tap triggers app deep link to start a new work session immediately.

Note: widgets require native extensions:

- iOS WidgetKit + App Group shared state (or open app and trigger start)
- Android AppWidget + deep link intent

## 9.2 Focus mode / DND integration (nice-to-have, opt-in)

### iOS

- Provide an opt-in pathway using:
  - Shortcuts / automation instructions, or
  - Focus filters if feasible

- App itself has limited control over Focus; design for user-driven integration.

### Android

- DND control requires permissions and can be sensitive.
- Make this explicit opt-in with clear permission prompts.

---

# 10. Localization

- Languages: **English (default)**, **Danish**
- Requirements:
  - All user-facing strings localized
  - Date formats localized
  - Accessibility labels localized

---

# 11. Edge cases and interruption handling

## 11.1 Phone call interruption

Requirement (your rule):

- If the user chooses to answer a call:
  - current session resets and becomes ready to start over after call ends
    Implementation spec:

- On audio focus loss / call state change:
  - stop timer, mark as reset, do not count
  - show a subtle banner when app returns: “Session reset due to call.”

## 11.2 Disallowed actions

- In strict mode:
  - cannot switch session mid-way
  - can only reset (and possibly pause per 2.3)

- Settings cannot be changed during active work session.

## 11.3 Time changes

- If device time changes during a session (manual change/timezone shift):
  - timer uses absolute timestamps; the result may jump.
  - app should detect large time delta and show a warning:
    - “Your device time changed. Timer accuracy may be affected; session reset.”

---

# 12. Functional requirements list (testable)

## Timer

- FR-1 One-tap start from Timer screen.
- FR-2 Default protocol 25/5/15 with long break every 4.
- FR-3 Autostart enabled by default; toggle to disable.
- FR-4 Strict mode default; toggle to loose.
- FR-5 Strict mode counting: only completed work sessions increment stats.
- FR-6 Settings locked during active work session (show focus message).
- FR-7 Timer remains accurate when app backgrounded or screen locked.
- FR-8 If app killed: timer is stopped/reset on next launch.

## Notifications

- FR-9 Local notification at end-of-session (if permission granted).
- FR-10 Sound + vibration respecting system settings.
- FR-11 iOS Live Activity opt-in (v1.0 or v1.1; see roadmap).
- FR-12 Android ongoing notification opt-in.

## Stats

- FR-13 Daily completed Pomodoros view with last 7 days default.
- FR-14 Timeframe selection (at minimum: 7/30/custom).
- FR-15 Local-only storage; no sign-in.

## Privacy

- FR-16 Strict privacy mode: no persistence, no analytics, no crash reporting.
- FR-17 Normal mode: local persistence enabled.
- FR-18 Analytics toggle and clear disclosure.

## Localization & accessibility

- FR-19 English default, Danish supported.
- FR-20 WCAG 2.1 AA compliance practices implemented across UI.

---

# 13. Non-functional requirements

- NFR-1 Launch-to-timer-interactive < 1s on modern devices (best effort).
- NFR-2 Battery: no busy loops; use 1Hz UI updates at most; background work relies on notifications and timestamp math.
- NFR-3 Offline-first: app fully functional without network.
- NFR-4 Data integrity: never lose current session state during backgrounding (unless app is killed).
- NFR-5 Privacy by design: minimal data collection, explicit toggles.

---

# 14. Technical architecture (Capacitor-oriented)

## 14.1 Recommended stack

- **React + Ionic UI + Capacitor**
  - Ionic provides polished components and theming without the “locked-in” feel if you use it selectively (and style with CSS variables).
  - Avoid full “Ionic look” by customizing typography, spacing, and using a small set of Ionic primitives.

## 14.2 Key native features and plugins

- Local notifications: Capacitor Local Notifications plugin
- Haptics: Capacitor Haptics plugin
- App lifecycle: Capacitor App plugin (foreground/background events)
- Preferences/Storage: Capacitor Preferences (but obey strict privacy mode)
- Live Activity (iOS): likely requires custom native implementation (Swift)
- Android ongoing notification: custom native service or plugin
- Widgets: native extensions (iOS WidgetKit / Android AppWidget)

## 14.3 Timer implementation detail

- Maintain session state in memory + persisted (unless strict privacy mode).
- When scheduling notification:
  - schedule at session end
  - on resume, if time passed, transition session immediately and show completion UI.

---

# 15. Roadmap: MVP vs v1.1

## MVP (ship-ready, minimal friction)

- Timer screen + Settings + Stats + About
- Default protocol + advanced custom durations (single preset)
- Strict mode default + loose mode toggle
- Autostart default + toggle off
- Local notifications + sound + haptics
- Accurate background/lock behavior via timestamp model
- Local history + last 7 days stats + timeframe (7/30)
- English + Danish
- Privacy modes:
  - Normal
  - Strict privacy (no persistence, no analytics, no crash)

## v1.1 (power + polish)

- Multiple presets (“Workflows”) for high-volume users
- iOS Live Activity (opt-in)
- Android ongoing notification (opt-in)
- Widget: “Start Pomodoro”
- More stats timeframe controls (custom date range)
- Optional Focus/DND integration guidance + deep links/Shortcuts

---

# 16. Acceptance criteria (sample)

1. Start a Pomodoro, lock the phone for 10 minutes, unlock: remaining time is correct within ±1s.
2. Complete a strict work session: daily count increments by 1.
3. Reset a strict work session at minute 24: daily count does not increment.
4. During active work session, entering Settings shows focus message and prevents changes.
5. Toggle autostart off: after work completes, the break does not automatically start.
6. Enable strict privacy mode: relaunch app → no history, no saved settings, analytics/crash disabled.
7. Switch language to Danish: all UI strings, settings, and stats labels are Danish.
