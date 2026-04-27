Copyright © 2026 Jeet Bookseller. All Rights Reserved. This code is for demonstration purposes only. It may not be used, modified, or distributed for commercial or non-commercial purposes without my explicit written permission.

# Productivity Hub

A personal productivity web app combining multiple proven methodologies into one unified, offline-capable tool.

**Live app:** https://jeetbookseller.github.io/productivity/

---

## Features

### Six integrated sections

| Section | Methodology | What it does |
|---------|-------------|---------------|
| **Capture** | Bullet Journal | Quick brain-dump notes with inline editing, strikethrough, send to Friction Journal, and auto-clear after 30 days |
| **Clarify** | Eisenhower Matrix | Organize tasks across 4 priority quadrants with categories, subtasks, and deadlines |
| **Focus** | Pomodoro Timer | Work timer with presets (Classic 25/5, Long 50/10, Short 15/3, Custom), Focus Queue (up to 5 tasks), and screen wake lock |
| **Confirm** | Checklists | Named checklists with sections, linkable to Clarify tasks for step-by-step workflows |
| **Review** | Analytics | Weekly metrics, 13-week heatmap, streak tracking, Eisenhower distribution charts |
| **Settings** | — | Theme toggle, timer presets, export/import/reset data, PWA install prompt |

### Cross-cutting capabilities

- **Authentication** — email/password sign-in via Supabase; full password reset and email confirmation flow
- **Cloud sync** — data stored in Supabase and synced across devices on login
- **Offline-capable PWA** — full functionality after first visit; installable on iOS and Android
- **Friction Journal integration** — send any Capture note to Friction Journal’s Rapid Log; choose a tag (Note / Event / Mood) from an inline picker; sent notes show a `✓ Journal` badge
- **Personal link** — one-tap navigation to Friction Journal via the `Personal` button in the header
- **Dark mode** — light / dark / system preference
- **Responsive layout** — mobile bottom tab bar, tablet side-by-side panels, desktop sidebar
- **Live timer badge** — nav shows countdown when Pomodoro is running on another tab
- **Bulk actions** — header checkbox for multi-select on all item lists
- **Context menu** — 3-dot button and right-click on every item
- **Web Audio chime** — browser-native sound at session end (no audio files)
- **45-test suite** — deterministic unit + integration tests, runnable in-app from Settings

---

## Technical overview

Productivity Hub is a web app that runs in your browser — there is nothing to install. You visit the URL, log in, and your data is stored in the cloud (Supabase) and synced across your devices. It also works offline after the first visit, with changes syncing automatically when you're back online. The app's own code is pre-built and served as static files from GitHub Pages; Supabase provides the hosted backend for authentication and data storage.

**Architecture.** State is managed centrally in a single React context (`useAppData`) and flows down to six section components. A custom `usePersistedState` hook provides three-layer persistence: writes go to `localStorage` immediately, to IndexedDB on a 300 ms debounce (local cache), and to Supabase on a 2 s debounce (source of truth). On mount, Supabase data is pulled and merged with the local cache.

**Authentication.** `App.jsx` renders a full-screen `AuthForm` when no session exists. `AppDataProvider` only mounts when the user is authenticated, ensuring all sync operations are tied to a logged-in user.

**Offline / PWA.** A cache-first service worker pre-caches the app shell on install and serves all assets offline. The Web Manifest enables home-screen installation on iOS and Android. The Pomodoro timer state is persisted to storage so a session survives tab closes and page reloads.

**Cross-app integration.** PH shares a Supabase project with Friction Journal. The `sendToFrictionJournal` module writes directly into FJ’s `rapid_logs` table using the shared client. A `Personal` header button navigates to FJ (same tab, PWA-style).

**Rendering & styling.** Components are plain React functional components with hooks — no Redux, no router, no component library. Layout uses Tailwind utility classes with CSS custom properties for the theme colour palette.

**Testing.** The 45-test suite (Vitest + Testing Library) is bundled into the production build and lazy-loaded in the Settings tab so it can be run directly in the browser against the live app.

---

## Tech stack

| Layer | Technology |
|-------|------------|
| UI framework | React 18 |
| Build tool | Vite 5 |
| Styling | Tailwind CSS 3 |
| Auth & data | Supabase (email/password auth + `user_data` table) |
| Storage | IndexedDB (local cache) + localStorage (sync fallback) |
| Offline / PWA | Service Worker (cache-first) + Web Manifest |
| Testing | Vitest 1.6 + Testing Library + jsdom |
| Fonts | Nunito (Google Fonts) |
| APIs used | Web Audio, Screen Wake Lock, Clipboard, Web Share, Vibration, Notifications |

## Project structure

```
src/
├── App.jsx                  # Root — tab routing, theme, nav, Personal link to Friction Journal
├── hooks/
│   ├── useAppData.js        # Central state + all CRUD handlers (incl. stampNote)
│   ├── usePersistedState.js # Three-layer persistence hook
│   └── useResponsive.js     # Breakpoint hooks
├── lib/
│   ├── storage.js                  # IndexedDB + localStorage wrapper
│   ├── supabase.js                 # Supabase client
│   ├── sync.js                     # Supabase push/pull/merge
│   ├── sendToFrictionJournal.js    # Inserts a note copy into FJ’s rapid_logs table
│   └── utils.js                    # uid, share, download, constants
├── components/
│   ├── AuthProvider.jsx            # Auth context wrapper
│   ├── AuthForm.jsx                # Full-screen login/signup/reset form
│   ├── SendToJournalPicker.jsx     # Tag picker popover (Note / Event / Mood)
│   ├── icons.jsx                   # SVG icons (incl. ExternalLink, BookOpen)
│   └── ...                         # ContextMenu, EditModal, QRCanvas, etc.
└── sections/                # One file per tab: Capture, Clarify, Focus, Confirm, Review, Settings
public/
├── sw.js                    # Service worker
└── manifest.json            # PWA manifest + icons
```

## Local development

```bash
npm install
npm run dev        # dev server at localhost:5173
npm run build      # production build → dist/
npm test           # run test suite once
```

Copy `.env.example` to `.env.local` and fill in your Supabase credentials. Set `VITE_OTHER_APP_URL=http://localhost:5174` for local cross-app testing with Friction Journal.

> Deployed to GitHub Pages at the base path `/productivity/`.
