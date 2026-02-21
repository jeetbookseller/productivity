# Productivity Hub — Redesign Plan
**Author:** Jeet Bookseller
**Date:** February 2026
**Purpose:** Full reference document for a clean-repo rebuild of the Productivity Hub app.
Preserves 100% of existing features, adds cross-device sync, cleaner UI, and a maintainable codebase.
 
---
 
## 1. Why Rebuild
 
| Problem | Impact |
|---------|--------|
| Single 3,052-line HTML file | Hard to navigate, edit, review changes |
| In-browser Babel (~10MB CDN) | Slow initial load; transpiles JSX at runtime |
| React + Tailwind from CDN | No tree-shaking, no offline CDN resilience |
| Glassmorphism-heavy CSS | Visual complexity, performance cost (backdrop-filter) |
| No real cross-device sync | Manual JSON export/import only |
 
**Goal:** Keep every feature. Remove the overhead. Split into focused files. Clean up the UI. Add lightweight sync.
 
---
 
## 2. Feature Inventory (Must Preserve 100%)
 
### 2a. Capture (Bullet Journal)
- Brain-dump quick notes
- Inline edit on tap
- 3-dot menu: promote to Clarify, copy text, strikethrough, delete
- Right-click context menu (desktop)
- Header checkbox → bulk select mode
- Auto-clear struck notes after 30 days
- `data-menu-btn` prevents tap propagation; 10px scroll guard
 
### 2b. Clarify (Eisenhower Matrix)
- 4 quadrants: **Do First** (Urgent+Important / terracotta), **Schedule** (Not Urgent+Important / ocean), **Delegate** (Urgent+Not Important / sand), **Eliminate** (Not Urgent+Not Important / lavender)
- Categories: Work 💼, Personal 🏠, Health 💪, Learning 📚
- Tap → toggle done/undone
- Desktop: drag-and-drop reorder; Mobile: quadrant picker modal
- 3-dot menu: done / edit / add to focus queue / link checklist / delete
- Right-click context menu (desktop)
- Subtasks, deadline field, pomodoro counter per task
 
### 2c. Focus (Pomodoro Timer)
- Modes: Work (default 25min), Short Break (5min), Long Break (15min)
- Presets: Classic, Long, Short, Custom (user-defined)
- Focus Queue: 3–5 tasks selected from Clarify
- Timer state persists across tab switches (IndexedDB `focusTimerState`)
- Soft dual-tone chime (440Hz + 554Hz via Web Audio API)
- Haptic feedback on completion
- Screen Wake Lock toggle
- Side-by-side layout on tablet+
- Progress bar (% complete)
- Sidebar/bottom-tab shows live timer when away from Focus tab
 
### 2d. Confirm (Checklists)
- Create named checklists with sections
- Tap to toggle items done/incomplete
- 3-dot menu: edit, delete items
- Link Clarify tasks to checklists (step-by-step workflow)
- 2-column layout on tablet+
- Bulk actions via header checkbox
 
### 2e. Review (Weekly Stats)
- Weekly metrics: Pomodoros completed, tasks done, focus minutes
- 13-week × 7-day GitHub-style streak heatmap (color: 0 → 5+ poms)
- Current streak + longest streak display
- Eisenhower matrix distribution chart
- Dynamic insights (suggestions based on patterns)
- 2-column layout on wide desktop (1280px+)
 
### 2f. Settings
- **Theme:** Light / Dark / System (persisted)
- **Timer:** Select preset + custom work/break durations
- **Data:** Export JSON backup, Import JSON, Reset all data
- **Install as App:** PWA install prompt integration
- **Explainer:** 7 accordion sections (mobile) / 2-col grid (tablet+)
- **Test Suite:** Lazy-loaded in-app TDD runner (45 tests, 3 tiers)
 
### 2g. Cross-Cutting Patterns (Must Preserve)
- Always-visible 3-dot menu on all items
- Right-click = same actions as 3-dot (desktop 1280px+)
- Tap: Capture → inline edit | Clarify → toggle done | Confirm → toggle done
- Header checkbox (left) → bulk select mode
- No long-press, no swipe gestures
- 10px scroll guard prevents accidental edits
- Sticky section headers
- Modal exit animations (anim-out 0.2s)
- Tab/section enter animations (anim-in 0.2s)
- Debounced state writes to IndexedDB (300ms)
- Toast notifications for user feedback
 
---
 
## 3. Data Models
 
### Todo (Clarify task)
```js
{
  id: string,           // uid()
  text: string,
  quad: 'ui'|'ni'|'un'|'nn',  // Eisenhower quadrant
  cat: 'work'|'personal'|'health'|'learning'|null,
  deadline: string,     // ISO date YYYY-MM-DD
  subtasks: [{ id: string, text: string, done: boolean }],
  poms: number,         // Pomodoro count for this task
  done: boolean,
  linkedList: string    // ID of linked checklist (optional)
}
```
 
### Note (Capture)
```js
{
  id: string,
  text: string,
  crAt: string,         // ISO timestamp (created)
  struck: boolean,
  struckAt: string      // ISO timestamp (for 30-day auto-clear)
}
```
 
### List (Confirm checklist)
```js
{
  id: string,
  name: string,
  items: [{
    id: string,
    text: string,
    done: boolean,
    section: string     // Optional group label
  }]
}
```
 
### Metrics
```js
// Current day/week (key: 'met')
{ d: { p: number, t: number, m: number, date: string }, w: { p: number, t: number, m: number } }
 
// Daily history (key: 'dHist', max 180 days)
[{ date: string, p: number, t: number, m: number }, ...]
```
 
### Timer State (key: 'focusTimerState')
```js
{ mode: 'work'|'short'|'long', left: number, run: boolean, endAt: number, startAt: number, elapsed: number }
```
 
### Storage Keys (IndexedDB: 'ProductivityHub' / store: 'data')
```
todos, lists, notes, focus, theme, preset, customT, poms, met, dHist, fHist, tab, seenAbout, focusTimerState
```
Test keys: `__TEST__*` (auto-cleaned by test runner)
 
---
 
## 4. Target Architecture
 
### Build System
| | Current | New |
|-|---------|-----|
| JSX transpile | Babel standalone (~10MB, runtime) | Vite (build-time, zero runtime cost) |
| React | unpkg CDN | npm, tree-shaken |
| Tailwind | CDN | PostCSS plugin, purged |
| Output | Single HTML file | `dist/` static bundle (deployable anywhere) |
 
### State Management (unchanged logic, new file locations)
- `usePersistedState(key, default)` — IndexedDB primary + localStorage fallback, 300ms debounce
- `useAppData()` — central state + all CRUD handlers, exposed via React Context
- `ThemeProv` — synchronous localStorage read on boot + async IndexedDB reconciliation
 
### File Structure
```
/                              ← new repo root
├── index.html                 ← Vite entry (replaces productivity_hub.html shell)
├── vite.config.js
├── package.json
├── manifest.json              ← unchanged
├── sw.js                      ← updated cache name only
├── src/
│   ├── main.jsx               ← ReactDOM.createRoot bootstrap
│   ├── App.jsx                ← tab routing, nav, modal state, ThemeProv + AppDataProv
│   ├── hooks/
│   │   ├── usePersistedState.js   ← migrated from Block A (logic unchanged)
│   │   ├── useAppData.js          ← migrated from Block C (logic unchanged)
│   │   └── useResponsive.js       ← useDesk(), useWide() breakpoints
│   ├── lib/
│   │   ├── storage.js             ← S API from app_core.js (get/set/exp/imp/clr)
│   │   └── utils.js               ← uid, notify, shareItem, dlFile, PRESETS, QUADS, CATS
│   ├── components/
│   │   ├── icons.jsx              ← SVG icon system (I object), unchanged
│   │   ├── ContextMenu.jsx        ← unified modal/positioned menu
│   │   ├── EditModal.jsx          ← universal edit modal
│   │   ├── ConfirmDialog.jsx      ← confirm/info dialogs
│   │   ├── BulkActionBar.jsx
│   │   ├── QuickAdd.jsx
│   │   ├── StickyHeader.jsx
│   │   ├── LinkPicker.jsx
│   │   ├── AboutModal.jsx
│   │   └── QRCanvas.jsx           ← NEW: canvas-based QR renderer (no library, ~80 lines)
│   ├── sections/
│   │   ├── Capture.jsx
│   │   ├── Clarify.jsx
│   │   ├── Focus.jsx              ← FocusTimer stays React.memo sub-component
│   │   ├── Confirm.jsx
│   │   ├── Review.jsx             ← Heatmap + Chart as internal sub-components
│   │   └── Settings.jsx           ← TestRunner lazy-load preserved
│   └── styles/
│       └── index.css              ← Tailwind + CSS custom props + simplified animations
├── scripts/
│   └── pwa_setup.js               ← updated for Vite asset paths
└── docs/
    ├── PLAN.md                    ← this document
    ├── release_notes.md
    └── technical_details.md
```
 
---
 
## 5. Design Changes
 
### What changes
- **Remove** glassmorphism (`.glass`, `.gcard` with `backdrop-filter: blur`) → clean flat cards (subtle border + light shadow)
- **Replace** ad-hoc Tailwind color config with CSS custom properties:
  ```css
  :root {
    --sage: #7CB69D;
    --terracotta: #E07A5F;
    --ocean: #5A9BBF;
    --lavender: #9B8AA6;
    --sand: #E8DFD0;
    --cream: #F7F5F0;
    --bark: #3D352D;
  }
  ```
- **Simplify animations**: keep `anim-in` / `anim-out`, remove `anim-float` (3s pulse)
- **Reduce** deeply nested Tailwind class chains in JSX
 
### What stays exactly the same
- Color palette values (sage, terracotta, ocean, lavender, sand, cream, bark)
- Typography: Nunito (400, 600, 700, 800 weights)
- Responsive breakpoints: mobile < 768px | tablet 768px+ | wide 1280px+
- Bottom tab bar (mobile) / sidebar nav (wide)
- All interaction patterns (3-dot, bulk select, right-click, scroll guard, sticky headers)
 
---
 
## 6. Cross-Device Sync (New Feature)
 
### Approach: Sync Code — No backend, no accounts, zero infrastructure
 
1. User taps **"Share Data"** in Settings → Data
2. App encodes all data: `JSON.stringify(data)` → compressed → base64 string ("sync code")
3. User shares via:
   - **Copy Code** → clipboard
   - **Web Share** → native share sheet (mobile: AirDrop, Messages, etc.)
   - **Show QR** → canvas-rendered QR code in modal → scan on other device
4. On the receiving device: paste code → decode → `S.imp(data)` (same path as existing JSON import)
 
### Implementation additions
- `src/lib/utils.js`: add `encodeSync(data): string` and `decodeSync(code): object`
- `src/components/QRCanvas.jsx`: canvas QR renderer, no third-party library
- `src/sections/Settings.jsx`: add "Share Data" card with Copy / Share / QR / Paste-import UI
 
### What stays unchanged
- Existing JSON file export (download backup)
- Existing JSON file import (restore from file)
- Existing data reset
 
---
 
## 7. Phased Build Plan (TDD)
 
**Rule:** Each phase: write/adapt tests first → implement → all tests pass → commit.
**Branch:** `claude/plan-app-redesign-u1hb8`
**Commit message format:** `Phase N: <description> — T0 11/11, T1 15/15, T2 ≥17/19`
 
---
 
### Phase 1 — Project Scaffold + Storage Layer
**Deliverable:** Vite boots; storage API works identically to `app_core.js`.
 
Tests first:
- T0 storage contract tests: `S.get`, `S.set`, `S.exp`, `S.imp`, `S.clr`
- Unit tests: `uid()` uniqueness, `dlFile()` invocation, `shareItem()` fallback
 
Implement:
- `npm create vite@latest` with React template
- `src/lib/storage.js` — migrate S API from `scripts/app_core.js` (no logic changes)
- `src/lib/utils.js` — migrate uid, notify, reqNotifyPerm, shareItem, dlFile, PRESETS, QUADS, CATS
- `vite.config.js` — Tailwind plugin, `@` path alias
- `package.json` — React 18, Tailwind 3, PostCSS, Vitest
 
Gate: T0 storage tests 11/11. `npm run dev` serves blank page, no console errors.
 
---
 
### Phase 2 — Hooks Migration
**Deliverable:** `usePersistedState` and `useAppData` work as standalone ES modules.
 
Tests first:
- `usePersistedState`: debounce timing, sync reads, async reconciliation
- `useAppData` contract: all state fields present, all handlers callable
- `withAppDataHarness` utility (used by T1 tests)
 
Implement:
- `src/hooks/usePersistedState.js` — from Block A (unchanged logic)
- `src/hooks/useAppData.js` — from Block C (all handlers unchanged)
- `src/hooks/useResponsive.js` — `useDesk()`, `useWide()` from Block A
 
Gate: T0 + T1 hook contract tests pass (26/26).
 
---
 
### Phase 3 — Shared UI Components
**Deliverable:** All shared components mount and behave correctly in isolation.
 
Tests first:
- ContextMenu: opens, closes, fires correct callback on item click
- EditModal: saves on confirm, discards on cancel
- ConfirmDialog: danger variant shows correctly, cancel fires onClose
- BulkActionBar: shows item count, fires action callbacks
 
Implement:
- `src/components/icons.jsx` — SVG icon system
- `src/components/ContextMenu.jsx`
- `src/components/EditModal.jsx`
- `src/components/ConfirmDialog.jsx`
- `src/components/BulkActionBar.jsx`
- `src/components/QuickAdd.jsx`
- `src/components/StickyHeader.jsx`
- `src/components/LinkPicker.jsx`
- `src/components/AboutModal.jsx`
 
Gate: All component render + interaction tests pass.
 
---
 
### Phase 4 — Sections (one sub-phase per section)
Each sub-phase: adapt relevant T1/T2 tests → migrate section → verify.
 
**4a — Capture**
- `src/sections/Capture.jsx`
- Tests: add note, inline edit, strikethrough, delete, promote to Clarify, bulk select, 30-day auto-clear logic
- Gate: Capture T1/T2 tests pass
 
**4b — Clarify**
- `src/sections/Clarify.jsx`
- Tests: add task, edit, move quadrant (mobile picker + desktop drag-drop), done/undone, focus queue, link checklist, delete, bulk actions, category badge
- Gate: Clarify T1/T2 tests pass
 
**4c — Focus**
- `src/sections/Focus.jsx` (FocusTimer as `React.memo`)
- Tests: start/pause/reset, mode switch, preset change, queue add/remove, timer persists across tab switch, chime fires, screen wake lock, sidebar label sync
- Gate: Focus T1/T2 tests pass
 
**4d — Confirm**
- `src/sections/Confirm.jsx`
- Tests: create checklist, add/edit/delete items, toggle done, sections, link from Clarify, 2-col layout on tablet
- Gate: Confirm T1/T2 tests pass
 
**4e — Review**
- `src/sections/Review.jsx` with Heatmap + Chart sub-components
- Tests: weekly metrics display, 13×7 heatmap renders, streak calculation, insights text, 2-col on wide desktop
- Gate: Review T1/T2 tests pass
 
**4f — Settings**
- `src/sections/Settings.jsx`
- Tests: theme toggle persists, timer preset saves, export generates JSON, import restores data, test runner lazy-loads, explainer accordion (mobile) and 2-col grid (tablet)
- Gate: Settings T1/T2 tests pass; TestRunner runs all 45 tests
 
---
 
### Phase 5 — App Shell + Full Integration
**Deliverable:** All sections wired together; navigation and global state work end-to-end.
 
Tests first:
- T2 crossover: tab switch preserves timer state, linked task opens checklist, focus queue pulls from Clarify
- Layout: mobile bottom nav, desktop sidebar, live timer in nav when away from Focus
 
Implement:
- `src/App.jsx` — tab routing, ThemeProv, AppDataProv, modal state, nav timer sync
- `src/main.jsx` — ReactDOM.createRoot
- `src/styles/index.css` — Tailwind directives + carry over existing CSS (glassmorphism still intact at this phase)
 
Gate: Full 45-test suite passes — T0 (11/11), T1 (15/15), T2 (≥17/19). `npm run build` produces working `dist/`.
 
---
 
### Phase 6 — Design Cleanup
**Deliverable:** Cleaner flat UI; zero behavior changes; all tests still pass.
 
Tests first:
- Assert no component uses `.glass` or `.gcard` class names
- Assert card elements use new `.card` class with expected border/shadow tokens
- No test should reference backdrop-filter in computed styles
 
Implement:
- `src/styles/index.css`: add CSS custom properties, replace glassmorphism with flat card style, remove `anim-float`
- Update JSX across all sections/components: swap `.glass`/`.gcard` Tailwind chains → `.card` utility class
 
Gate: Full 45-test suite still passes. Manual visual check: mobile + desktop + light/dark mode.
 
---
 
### Phase 7 — Cross-Device Sync
**Deliverable:** Users can move data between devices with no backend.
 
Tests first:
- Round-trip: `encodeSync(data)` → `decodeSync(code)` → deep-equal to original
- QRCanvas renders to canvas without throwing (given valid short string)
- Settings "Share Data" card mounts and Copy button writes to clipboard mock
 
Implement:
- `src/lib/utils.js`: add `encodeSync(data)`, `decodeSync(code)` (JSON + btoa/atob + validation)
- `src/components/QRCanvas.jsx`: canvas QR renderer, no library dependency
- `src/sections/Settings.jsx`: add "Share Data" card (Copy Code / Share / Show QR / Import Code)
 
Gate: Round-trip test passes. Manual: generate code on device A → paste on device B → data matches.
 
---
 
### Phase 8 — PWA + Final Build
**Deliverable:** PWA install, offline, and service worker work with the Vite build output.
 
Tests first:
- Service worker registration (mock fetch, cache-first strategy)
- `manifest.json` fields valid (name, icons, display, theme_color)
- Offline: app loads from cache when network unavailable
 
Implement:
- `vite.config.js`: configure SW copy or `vite-plugin-pwa`
- `sw.js`: update cache name to `productivity-hub-v18`, update asset list to Vite filenames
- `scripts/pwa_setup.js`: update for Vite asset paths
 
Gate: `npm run build` + serve `dist/` → PWA installs on mobile. Full 45-test suite passes on production build.
 
---
 
## 8. What Never Changes
 
| Item | Status |
|------|--------|
| All 5 section feature sets (Capture, Clarify, Focus, Confirm, Review) | Identical behavior |
| All data models (todos, notes, lists, focus, metrics) | Identical schemas |
| IndexedDB + localStorage fallback (S API) | Logic unchanged |
| `usePersistedState` debounce + reconciliation | Unchanged |
| `useAppData` context + all CRUD handlers | Unchanged |
| 45-test in-app suite (T0=11, T1=15, T2=19) | Logic unchanged; paths updated |
| Color palette + Nunito typography | Unchanged |
| Responsive breakpoints + interaction patterns | Unchanged |
| PWA (service worker, offline, installable) | Preserved |
 
---
 
## 9. Backlog (Carry Over, Not in This Rebuild)
 
| Priority | Feature |
|----------|---------|
| P1 | Recurring Tasks (daily/weekly/monthly auto-recreation) |
| P2 | Tags & Filters (cross-section search by tag) |
| P2 | Command Palette (keyboard-triggered global search) |
| P3 | Task Templates (save + reuse task+subtask bundles) |
| P5 | Checklist tab management UX improvements |
 
---
 
## 10. Versioning
- First release from new repo: **v18.0-Alpha**
- Format: `vMAJOR.MINOR-Alpha`
- Small features → minor bump; major workflow/layout shifts → major bump
 
---
 
## 11. Verification Checklist (Final)
- [ ] `npm run dev` — all 5 tabs render and all features work
- [ ] `npm run build` — `dist/` builds without errors or warnings
- [ ] T0 (11/11) + T1 (15/15) + T2 (≥17/19) pass on dev build
- [ ] T0 + T1 + T2 pass on production build (`dist/`)
- [ ] Sync code: generate on device A → paste on device B → data matches
- [ ] QR code: display on device A → scan on device B → data imports
- [ ] PWA installs on iOS Safari and Android Chrome
- [ ] App loads offline after first visit (service worker cache)
- [ ] Dark / Light / System theme toggles persist across reload
- [ ] Timer persists across tab switches (IndexedDB `focusTimerState`)
- [ ] Export generates valid JSON; Import restores all data
- [ ] Right-click menus work on desktop (1280px+)
- [ ] Drag-and-drop works on Clarify desktop; quadrant picker works on mobil
