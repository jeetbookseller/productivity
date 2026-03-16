# CLAUDE.md

This file gives Claude Code context for working on Productivity Hub.

## Project Overview

Productivity Hub is an offline-first Progressive Web App (PWA) that combines six productivity methodologies into a single browser-based tool. There is no backend — all data lives in the user's browser (IndexedDB + localStorage). The app is deployed as a static site to GitHub Pages.

Live URL: https://jeetbookseller.github.io/productivity/

## Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Start Vite dev server (http://localhost:5173)
npm run build        # Production build → dist/
npm run preview      # Serve the production build locally
npm test             # Run test suite once (Vitest)
npm run test:watch   # Run tests in watch mode
```

Tests run in a jsdom environment — no browser needed. There is no separate lint command; the project relies on tests and code discipline rather than automated formatting.

## Architecture

### State Management

All application state lives in `src/hooks/useAppData.js`, which exposes a React Context (`AppDataContext`) with CRUD operations for every data type. `src/components/AppDataProvider.jsx` wraps the tree with this context. Components consume state via the `useAppData` hook — do not add Redux, Zustand, or other state libraries.

### Persistence

`src/hooks/usePersistedState.js` implements a dual-layer strategy:

- **localStorage** — synchronous, used for instant first-render hydration.
- **IndexedDB** — async truth source (`src/lib/storage.js`), debounced writes at 300 ms. On mount, IndexedDB overwrites localStorage when a stored value is present.

Do not bypass this hook for persistent state.

**Planned: Supabase sync layer** — see "Planned Work" section below. When implemented, `usePersistedState` will push to Supabase (debounced 2s) on every write and pull+merge on mount when the user is signed in. Sync is opt-in; the offline-first path remains unchanged for unauthenticated users.

### Routing

Tab-based navigation only — no URL router. `src/App.jsx` holds the active-tab state and renders one section at a time. The six sections are:

| Tab | File | Methodology |
|-----|------|-------------|
| Capture | `src/sections/Capture.jsx` | Bullet Journal |
| Clarify | `src/sections/Clarify.jsx` | Eisenhower Matrix |
| Focus | `src/sections/Focus.jsx` | Pomodoro Timer |
| Confirm | `src/sections/Confirm.jsx` | Checklists |
| Review | `src/sections/Review.jsx` | Analytics / heatmap |
| Settings | `src/sections/Settings.jsx` | Config + PWA install |

### Styling

Tailwind CSS 3 with a custom palette defined in `tailwind.config.js` (sage, terracotta, ocean, lavender, sand, cream, bark). Dark mode toggles via a `[data-theme="dark"]` attribute on the root element. Theme CSS variables are declared in `src/styles/index.css` as RGB channels to support opacity variants. Always use theme tokens rather than hard-coded colors.

### PWA / Service Worker

`public/sw.js` implements a cache-first strategy with a versioned cache name. `public/manifest.json` declares the PWA manifest. The service worker version constant in `sw.js` must be bumped manually when cached assets change significantly.

## Key Files

| Path | Role |
|------|------|
| `src/App.jsx` | Root component — nav, theme, tab routing |
| `src/main.jsx` | React DOM entry point |
| `src/hooks/useAppData.js` | All application state and CRUD logic |
| `src/hooks/usePersistedState.js` | Dual-layer (localStorage + IndexedDB) persistence |
| `src/lib/storage.js` | IndexedDB and localStorage wrapper |
| `src/lib/utils.js` | Shared utilities (uid, share, notifications, download) |
| `src/components/icons.jsx` | SVG icon components — add new icons here |
| `public/sw.js` | Service worker (cache-first) |
| `vite.config.js` | Build config, base path `/productivity/`, Vitest config |
| `tailwind.config.js` | Custom palette and dark-mode selector |
| `.github/workflows/deploy.yml` | CI/CD: build + deploy to GitHub Pages on push to `main` |

## Testing

Tests use Vitest + Testing Library and run in jsdom. Test files sit next to the code they test:

- `src/app.test.jsx` — root component
- `src/hooks/useAppData.test.js` — state hook
- `src/lib/storage.test.js` — storage layer
- `src/components/components.test.jsx` — shared components
- `src/components/design.test.jsx` — visual/design checks
- `src/sections/sections.test.jsx` — section integration

The suite is tiered (T0 = smoke, T1 = integration, T2 = edge cases) with a flake-consistency gate. Keep all 45 tests passing. An in-app test runner is also available in the Settings tab (`src/components/TestRunner.jsx`).

When adding a feature, add or update tests in the corresponding test file. Do not add a separate test framework.

## Deployment

Deployment is fully automated. Pushing to `main` triggers `.github/workflows/deploy.yml`, which runs `npm ci && npm run build` on Node 20 and publishes the `dist/` folder to GitHub Pages. Do not commit build artifacts.

The Vite base path is `/productivity/` — required for GitHub Pages subdirectory hosting. Do not change this without also updating the service worker cache and manifest.

## Conventions

- **No backend** beyond Supabase sync (opt-in, see Planned Work). All features must work without an account.
- **No new dependencies** without a clear need. Exception: `@supabase/supabase-js` is approved for the sync feature.
- **No CSS frameworks** beyond Tailwind. Do not add CSS-in-JS libraries.
- **No client-side router.** Tab state is managed in `App.jsx`.
- Use the existing `uid()` helper from `src/lib/utils.js` for generating IDs.
- Context menus use a 3-dot button and right-click; do not add long-press or swipe gestures.
- Bulk-select mode is triggered by the section header checkbox — keep this pattern consistent across sections.

---

## Planned Work: Supabase Cross-Device Sync

**Goal:** Optional cloud sync so signed-in users can access their data across devices. Offline-first behavior is preserved for all unauthenticated users.

### New files to create

| File | Purpose |
|------|---------|
| `src/lib/supabase.js` | Supabase client + module-level session cache (`currentUser`) |
| `src/hooks/useAuth.js` | Auth state hook (session, user, signInWithEmail, signInWithMagicLink, signInWithOAuth, signOut) |
| `src/components/AuthProvider.jsx` | React context wrapper for auth state |
| `src/lib/sync.js` | `pushKey(userId, key, value)`, `pullAll(userId, keys)`, `mergeValues(key, local, remote)` |
| `supabase/schema.sql` | `user_data` table + RLS policies SQL script |
| `.env.example` | Template: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` |

### Files to modify

| File | Change |
|------|--------|
| `src/hooks/usePersistedState.js` | Debounced `pushKey` on write; `pullAll` + merge on mount |
| `src/sections/Settings.jsx` | "Sync & Account" section: email/password form, magic link, OAuth buttons (Google/GitHub), sync status |
| `src/App.jsx` | Wrap `AppDataProvider` with `AuthProvider` |
| `package.json` | Add `@supabase/supabase-js` |

### Supabase DB schema

```sql
create table user_data (
  user_id    uuid references auth.users not null,
  key        text not null,
  value      jsonb not null,
  updated_at timestamptz default now() not null,
  primary key (user_id, key)
);
alter table user_data enable row level security;
create policy "Users manage own data" on user_data for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

Enable in Supabase dashboard: Email (password + magic link), Google OAuth, GitHub OAuth.

### Keys synced (11 of 13)

Synced: `todos`, `notes`, `lists`, `focus`, `theme`, `preset`, `customT`, `poms`, `met`, `dHist`, `fHist`, `seenAbout`

Excluded (device-specific/ephemeral): `tab`, `focusTimerState`

### Merge logic

- **Arrays with `id` field** (`todos`, `notes`, `lists`, `dHist`, `fHist`): union by `id`; remote wins for same-ID conflicts; local-only items preserved (offline additions survive)
- **`focus`** (array of IDs): union, deduplicated, capped at 5
- **Scalars** (`theme`, `preset`, `customT`, `poms`, `met`, `seenAbout`): remote wins

### Implementation phases (can be parallelised)

**Phase 1 — Foundation (3 tasks in parallel):**
- P1-A: `supabase/schema.sql`, `.env.example`
- P1-B: `src/lib/supabase.js`, `src/hooks/useAuth.js`, `src/components/AuthProvider.jsx`
- P1-C: `src/lib/sync.js`

**Phase 2 — Integration (2 tasks in parallel, after Phase 1):**
- P2-A: Modify `src/hooks/usePersistedState.js`
- P2-B: Auth + sync UI in `src/sections/Settings.jsx`

**Phase 3 — Wire-up & Tests (after Phase 2):**
- P3-A: Wire `AuthProvider` in `src/App.jsx`, `npm install @supabase/supabase-js`
- P3-B: Tests — add auth/sync tests, verify all 45 existing tests still pass
