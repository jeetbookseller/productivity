# CLAUDE.md

This file gives Claude Code context for working on Productivity Hub.

## Project Overview

Productivity Hub is a Progressive Web App (PWA) that combines six productivity methodologies into a single browser-based tool. **Authentication is required** — the app uses Supabase for auth and data storage. Local storage (IndexedDB + localStorage) serves as a performance cache; Supabase is the source of truth. The app is deployed as a static site to GitHub Pages.

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

`src/hooks/usePersistedState.js` implements a three-layer strategy:

- **localStorage** — synchronous, used for instant first-render hydration (cache).
- **IndexedDB** — async local cache (`src/lib/storage.js`), debounced writes at 300 ms.
- **Supabase** — source of truth (`src/lib/sync.js`), debounced writes at 2 s. On mount, Supabase data is pulled and merged with local cache.

Do not bypass this hook for persistent state.

The app requires authentication. `App.jsx` renders `AuthForm` when no session exists; `AppDataProvider` only mounts when the user is authenticated, so `usePersistedState` can safely assume a logged-in user for sync operations.

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
| `src/App.jsx` | Root component — auth gate, nav, theme, tab routing |
| `src/main.jsx` | React DOM entry point |
| `src/hooks/useAppData.js` | All application state and CRUD logic |
| `src/hooks/usePersistedState.js` | Three-layer persistence (localStorage + IndexedDB + Supabase) |
| `src/hooks/useAuth.js` | Auth state hook — session, hash detection, sign-in/up/out, password reset |
| `src/lib/storage.js` | IndexedDB and localStorage wrapper |
| `src/lib/supabase.js` | Supabase client initialization |
| `src/lib/sync.js` | Supabase push/pull/merge logic for synced keys |
| `src/lib/utils.js` | Shared utilities (uid, share, notifications, download) |
| `src/components/AuthProvider.jsx` | React context wrapper for auth state |
| `src/components/AuthForm.jsx` | Full-screen auth form (login, signup, forgot, reset password) |
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

- **Authentication required.** The app shows a full-screen auth form until the user signs in. No anonymous/local-only usage.
- **Supabase is the data backend.** `@supabase/supabase-js` is the only external runtime dependency beyond React.
- **No new dependencies** without a clear need.
- **No CSS frameworks** beyond Tailwind. Do not add CSS-in-JS libraries.
- **No client-side router.** Tab state is managed in `App.jsx`.
- Use the existing `uid()` helper from `src/lib/utils.js` for generating IDs.
- Context menus use a 3-dot button and right-click; do not add long-press or swipe gestures.
- Bulk-select mode is triggered by the section header checkbox — keep this pattern consistent across sections.
- **Data import compatibility:** The JSON export format from the pre-Supabase version of the app must be importable. The Settings import handler should accept the old format and push imported data to Supabase.

---

## Authentication

**Provider:** Supabase Auth (email/password only, no OAuth).

### Auth Architecture

```
App.jsx loads → AuthProvider → if no session → AuthForm (full screen)
                             → if session → AppDataProvider → all tabs
```

`AuthProvider` wraps the entire app. `AppDataProvider` only mounts when authenticated.

### Auth Features

1. **Email/password login** — `signInWithPassword`, error display, loading spinner
2. **Email/password signup** — client-side password validation (15 chars, lowercase, uppercase, digit, symbol), confirm password, enumeration protection (`identities.length === 0`), email confirmation flow
3. **Email confirmation detection** — captures `window.location.hash` before Supabase cleans it; detects `type=signup` → signs out, shows "Email confirmed" banner
4. **Forgot password** — `resetPasswordForEmail` with `redirectTo` for GitHub Pages
5. **Password reset** — detects `type=recovery` in hash → shows "Set new password" form with same validation as signup → `updateUser({ password })` → signs out
6. **Logout** — `signOut()`, available from Settings tab
7. **Session persistence** — `getSession()` on load, `onAuthStateChange` listener with guards for `emailConfirmed` / `passwordRecovery` flags

### Auth Files

| File | Role |
|------|------|
| `src/lib/supabase.js` | `createClient(url, anonKey)` from env vars |
| `src/hooks/useAuth.js` | All auth logic: init, hash detection, sign-in/up/out, password reset, `onAuthStateChange` guards |
| `src/components/AuthProvider.jsx` | React context wrapper exposing `useAuthContext()` |
| `src/components/AuthForm.jsx` | Full-screen form with 4 modes: `login`, `signup`, `forgot`, `reset` |

---

## Data Sync

### Supabase DB Schema

```sql
CREATE TABLE user_data (
  user_id    uuid REFERENCES auth.users NOT NULL,
  key        text NOT NULL,
  value      jsonb NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (user_id, key)
);
ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own data" ON user_data
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

### Sync Module (`src/lib/sync.js`)

- `pushKey(userId, key, value)` — upsert single key to `user_data`
- `pullAll(userId, keys)` — fetch all rows for user
- `mergeValues(key, local, remote)` — merge strategy per key type

### Keys Synced (11 of 14)

Synced: `todos`, `notes`, `lists`, `focus`, `theme`, `preset`, `customT`, `poms`, `met`, `dHist`, `fHist`

Excluded (device-specific): `tab`, `focusTimerState`, `seenAbout`

### Merge Logic

- **Arrays with `id` field** (`todos`, `notes`, `lists`, `dHist`, `fHist`): union by `id`; remote wins for same-ID conflicts
- **`focus`** (array of IDs): union, deduplicated, capped at 5
- **Scalars** (`theme`, `preset`, `customT`, `poms`, `met`): remote wins

### Environment Variables

Requires `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` set in environment (or `.env.local`). See `.env.example`.
