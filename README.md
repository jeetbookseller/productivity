Copyright © 2026 Jeet Bookseller. All Rights Reserved. This code is for demonstration purposes only. It may not be used, modified, or distributed for commercial or non-commercial purposes without my explicit written permission.

# Productivity Hub

A personal productivity web app combining multiple proven methodologies into one unified, offline-first tool.

**Live app:** https://jeetbookseller.github.io/productivity/

---

## Features

### Six integrated sections

| Section | Methodology | What it does |
|---------|-------------|--------------|
| **Capture** | Bullet Journal | Quick brain-dump notes with inline editing, strikethrough, and auto-clear after 30 days |
| **Clarify** | Eisenhower Matrix | Organize tasks across 4 priority quadrants with categories, subtasks, and deadlines |
| **Focus** | Pomodoro Timer | Work timer with presets (Classic 25/5, Long 50/10, Short 15/3, Custom), Focus Queue (up to 5 tasks), and screen wake lock |
| **Confirm** | Checklists | Named checklists with sections, linkable to Clarify tasks for step-by-step workflows |
| **Review** | Analytics | Weekly metrics, 13-week heatmap, streak tracking, Eisenhower distribution charts |
| **Settings** | — | Theme toggle, timer presets, export/import/reset data, PWA install prompt |

### Cross-cutting capabilities

- **Offline-first PWA** — full functionality after first visit; installable on iOS and Android
- **No backend** — all data lives on-device (IndexedDB + localStorage); no account required
- **Cross-device sync** — share data via copy-paste code or QR code
- **Dark mode** — light / dark / system preference
- **Responsive layout** — mobile bottom tab bar, tablet side-by-side panels, desktop sidebar
- **Live timer badge** — nav shows countdown when Pomodoro is running on another tab
- **Bulk actions** — header checkbox for multi-select on all item lists
- **Context menu** — 3-dot button and right-click on every item
- **Web Audio chime** — browser-native sound at session end (no audio files)
- **45-test suite** — deterministic unit + integration tests, runnable in-app from Settings

---

## Technical overview

Productivity Hub is a **static single-page application** with no server component. The entire app ships as pre-built HTML/CSS/JS to GitHub Pages and runs entirely in the browser.

**Architecture.** State is managed centrally in a single React context (`useAppData`) and flows down to six section components. A custom `usePersistedState` hook provides dual-layer persistence: writes go to `localStorage` immediately (so reads on next paint are synchronous) and to IndexedDB on a 300 ms debounce (the source of truth for larger payloads). On mount, the hook reconciles any IndexedDB value over the initial localStorage read.

**Offline / PWA.** A cache-first service worker pre-caches the app shell on install and serves all assets offline. The Web Manifest enables home-screen installation on iOS and Android. The Pomodoro timer state is persisted to storage so a session survives tab closes and page reloads.

**No-backend sync.** Cross-device data transfer is done entirely client-side: the full app state is JSON-serialised, base64-encoded, and either copied to the clipboard or rendered as a QR code (drawn on a `<canvas>` without any library) for the receiving device to scan and import.

**Rendering & styling.** Components are plain React functional components with hooks — no Redux, no router, no component library. Layout uses Tailwind utility classes with CSS custom properties for the theme colour palette. Dark mode is toggled by setting `data-theme="dark"` on `<html>`, which flips the CSS variable values.

**Testing.** The 45-test suite (Vitest + Testing Library) is bundled into the production build and lazy-loaded in the Settings tab so it can be run directly in the browser against the live app, with no separate test environment needed.

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| UI framework | React 18 |
| Build tool | Vite 5 |
| Styling | Tailwind CSS 3 |
| Storage | IndexedDB (primary) + localStorage (sync fallback) |
| Offline / PWA | Service Worker (cache-first, v18 cache) + Web Manifest |
| Testing | Vitest 1.6 + Testing Library + jsdom |
| Fonts | Nunito (Google Fonts) |
| APIs used | Web Audio, Screen Wake Lock, Clipboard, Web Share, Vibration, Notifications |

## Project structure

```
src/
├── App.jsx                  # Root component — tab routing, theme, nav
├── hooks/
│   ├── useAppData.js        # Central state + all CRUD handlers
│   ├── usePersistedState.js # Dual IndexedDB/localStorage persistence hook
│   └── useResponsive.js     # Breakpoint hooks
├── lib/
│   ├── storage.js           # IndexedDB + localStorage wrapper
│   └── utils.js             # uid, share, download, constants
├── components/              # Shared UI: ContextMenu, EditModal, QRCanvas, etc.
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

> Deployed to GitHub Pages at the base path `/productivity/`.
