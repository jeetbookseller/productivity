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

Do not bypass this hook for persistent state. Do not add a backend or cloud sync layer.

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

- **No backend.** All features must work entirely in the browser.
- **No new dependencies** without a clear need. The bundle is intentionally lean.
- **No CSS frameworks** beyond Tailwind. Do not add CSS-in-JS libraries.
- **No client-side router.** Tab state is managed in `App.jsx`.
- Use the existing `uid()` helper from `src/lib/utils.js` for generating IDs.
- Context menus use a 3-dot button and right-click; do not add long-press or swipe gestures.
- Bulk-select mode is triggered by the section header checkbox — keep this pattern consistent across sections.
