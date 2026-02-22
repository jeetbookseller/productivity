# Productivity Hub — Release Notes

## v2-alpha

### New Features

- **Methodology Explainer in Settings** — A new "Methodologies" card in Settings explains the five productivity frameworks that underpin the app: Bullet Journal, GTD (Getting Things Done), Pomodoro Technique, Deep Work, and Eisenhower Matrix. Collapsed accordion on mobile; always-expanded 2-column grid on desktop/tablet.

- **Empty State Icons** — Empty areas in Capture, Confirm, and the Focus Queue now display a large faded icon alongside the helper text, making blank sections feel intentional rather than broken.

### Bug Fixes

- **Mobile Sticky Header & Footer** — Replaced `100vh` with `100dvh` (dynamic viewport height) on the root layout container so the bottom navigation bar and section sticky headers remain fully visible on mobile browsers regardless of the address bar state.

- **Focus Timer Badge Sync** — The timer countdown badge in the navigation sidebar/tab bar now correctly stops when the timer is paused or reset in the Focus tab. Previously, the badge kept counting because `App.jsx` and `Focus.jsx` each held an independent copy of the timer state via separate `usePersistedState` instances. Timer state is now lifted into the shared `AppDataContext`, eliminating the race condition.

- **Help Guide as Floating Popup** — The Help Guide (How It Works) modal on mobile now appears as a centered floating popup instead of a bottom sheet, so it no longer covers the navigation footer.

### Settings Cleanup

- **Removed duplicate "Help Guide" card** — Settings previously contained both a "Help Guide" button (which opened a modal) and an inline "How It Works" accordion that covered the same content. The redundant Help Guide button has been removed; the inline "How It Works" card remains.

---

## Full Feature Set

| Phase | Tab | Description |
|-------|-----|-------------|
| Capture | Capture | Brain-dump anything instantly. Tap to edit inline. 3-dot menu per item: promote to Clarify, strike through, copy, delete. Header checkbox for bulk-select mode. Auto-clear struck notes older than 30 days. |
| Clarify | Clarify | Eisenhower Matrix: Do First (urgent + important), Schedule, Delegate, Eliminate. 3-dot menu + right-click on all items. Drag to reorder on desktop. Subtasks, deadlines, pomodoro counts, linked Confirm checklist per task. |
| Focus | Focus | Pomodoro timer with Focus Queue (up to 5 tasks from Clarify). Classic (25/5/15), Long (50/10/20), Short (15/3/10), and Custom presets. Timer state persists across tab switches. Wake Lock to keep screen on. Side-by-side queue panel on tablet+. |
| Confirm | Confirm | Named checklists with optional sections. Tap items to check off. Link a checklist to a Clarify task for step-by-step workflow tracking. 2-column layout on desktop. |
| Review | Review | Weekly metrics: pomodoros completed, tasks done, focus minutes. 13-week activity heatmap. Current and longest streaks tracked automatically. Task distribution breakdown and personalised insights. 2-column dashboard on wide screens. |
| Settings | Settings | Theme (Light / Dark / System). Timer preset selection + custom durations. Export / Import JSON backup. Cross-device sync via copy-paste code or QR scan. PWA install prompt. Methodology explainer (new). How It Works accordion. Test Suite (lazy-loaded). |

### Cross-Cutting Features

- **Unified 3-dot + right-click** on all items across every section — no long-press, no swipe
- **Bulk select** via header checkbox — strike, move to quadrant, or delete multiple items at once
- **Desktop sidebar** navigation (≥ 1280 px); bottom tab bar on mobile
- **Tablet side-by-side** layout for Focus (equal `flex-1` columns)
- **Live timer badge** in the nav when the Focus timer is running while on another tab
- **Dark mode** with cohesive palette; System theme follows OS preference; debounced writes prevent flicker
- **IndexedDB + localStorage** dual-layer persistence — all data stays on device, nothing sent to servers
- **PWA** — installable as home screen app, works fully offline
- **Export / Import** JSON backup; cross-device sync via shareable code or QR code
- **Test Suite** — 41 tiered deterministic tests (T0 = 11, T1 = 13, T2 = 17) with a 3-run flake-consistency gate; lazy-loaded on first click

### Productivity Methodologies Supported

| Method | Where Used |
|--------|-----------|
| **Bullet Journal** | Capture tab — rapid logging, brain-dump, migrate notes |
| **GTD (Getting Things Done)** | Full app flow — Capture → Clarify → Focus → Confirm → Review |
| **Pomodoro Technique** | Focus tab — 25-min work sessions, short & long breaks |
| **Deep Work** | Focus tab — distraction-free queue + persistent timer |
| **Eisenhower Matrix** | Clarify tab — Do First / Schedule / Delegate / Eliminate |
