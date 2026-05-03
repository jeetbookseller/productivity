/**
 * App — root component
 * Provides AppDataContext, ThemeProv, tab routing, nav (mobile bottom bar /
 * desktop sidebar), About modal, and live timer badge.
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppDataProvider } from './components/AppDataProvider.jsx';
import { AuthProvider, useAuthContext } from './components/AuthProvider.jsx';
import AuthForm from './components/AuthForm.jsx';
import { useAppDataContext } from './hooks/useAppData.js';
import { useWide } from './hooks/useResponsive.js';
import { I } from './components/icons.jsx';
import { AboutModal } from './components/AboutModal.jsx';
import { usePullToRefresh } from './hooks/usePullToRefresh.js';

import { Capture  } from './sections/Capture.jsx';
import { Clarify  } from './sections/Clarify.jsx';
import { Focus    } from './sections/Focus.jsx';
import { Confirm  } from './sections/Confirm.jsx';
import { Review   } from './sections/Review.jsx';
import { Settings } from './sections/Settings.jsx';

// ── Constants ─────────────────────────────────────────────────────────────────

const TABS = [
  { key: 'capture',  label: 'Capture',  Icon: I.Clock     },
  { key: 'clarify',  label: 'Clarify',  Icon: I.Zap       },
  { key: 'focus',    label: 'Focus',    Icon: I.Timer     },
  { key: 'confirm',  label: 'Confirm',  Icon: I.Checkbox  },
  { key: 'review',   label: 'Review',   Icon: I.Check     },
  { key: 'settings', label: 'Settings', Icon: I.Dots      },
];

const SECTIONS = {
  capture:  Capture,
  clarify:  Clarify,
  focus:    Focus,
  confirm:  Confirm,
  review:   Review,
  settings: Settings,
};

// ── ThemeProv ─────────────────────────────────────────────────────────────────

function ThemeProv({ children }) {
  const { theme } = useAppDataContext();

  useEffect(() => {
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
    const isDark = theme === 'dark' || (theme === 'system' && prefersDark);
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }, [theme]);

  return children;
}

// ── Timer badge helpers ───────────────────────────────────────────────────────

function fmtSecs(secs) {
  const m = Math.floor(Math.abs(secs) / 60).toString().padStart(2, '0');
  const s = (Math.abs(secs) % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function liveLeft(ts) {
  if (!ts.run || !ts.endAt) return ts.left;
  return Math.max(0, Math.round((ts.endAt - Date.now()) / 1000));
}

// ── NavButton ─────────────────────────────────────────────────────────────────

function NavButton({ tabKey, label, Icon, active, onClick, showTimerBadge, timerLeft, isWide }) {
  return (
    <button
      onClick={onClick}
      aria-label={`Go to ${label}`}
      aria-current={active ? 'page' : undefined}
      className={`
        flex items-center gap-2 rounded-xl transition-colors font-bold
        ${isWide
          ? 'w-full px-3 py-2.5 text-sm'
          : 'flex-col px-2 py-1.5 text-[10px] flex-1'
        }
        ${active
          ? 'bg-sage/10 text-sage'
          : 'text-bark/50 hover:text-bark hover:bg-cream'
        }
      `}
    >
      <Icon width={isWide ? 16 : 18} height={isWide ? 16 : 18} className="flex-shrink-0" />
      <span className={isWide ? '' : 'leading-tight'}>{label}</span>
      {showTimerBadge && (
        <span
          data-testid="nav-timer-badge"
          className="text-[10px] font-bold text-ocean tabular-nums ml-auto"
        >
          {fmtSecs(timerLeft)}
        </span>
      )}
    </button>
  );
}

// ── AppShell ─────────────────────────────────────────────────────────────────

// THRESHOLD must match the value in usePullToRefresh.js
const PTR_THRESHOLD = 64;

const OTHER_APP_URL =
  import.meta.env.VITE_OTHER_APP_URL ||
  'https://jeetbookseller.github.io/friction-journal/';

function PersonalLink() {
  return (
    <a
      href={OTHER_APP_URL}
      className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-bark/50
                 hover:text-bark/80 transition-colors rounded-lg hover:bg-cream"
      aria-label="Open Friction Journal"
    >
      <I.BookOpen width={14} height={14} />
      <span>Personal Journal</span>
    </a>
  );
}

function AppShell() {
  const { tab, setTab, timerState } = useAppDataContext();
  const [showAbout, setShowAbout] = useState(false);
  const isWide = useWide();
  const mainRef = useRef(null);
  const { pullY, refreshing } = usePullToRefresh(mainRef, () => window.location.reload());

  const closeAbout = () => setShowAbout(false);

  // Live-updating timer badge for nav
  const [timerLeft, setTimerLeft] = useState(() => liveLeft(timerState));

  useEffect(() => {
    if (!timerState.run) {
      setTimerLeft(timerState.left);
      return;
    }
    const tick = () => setTimerLeft(liveLeft(timerState));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [timerState.run, timerState.endAt, timerState.left]);

  // Show timer badge in nav when timer is running and we're not on Focus tab
  const showTimerBadge = timerState.run && tab !== 'focus';

  const ActiveSection = SECTIONS[tab] || Capture;

  const navButtons = TABS.map(({ key, label, Icon }) => (
    <NavButton
      key={key}
      tabKey={key}
      label={label}
      Icon={Icon}
      active={tab === key}
      onClick={() => setTab(key)}
      showTimerBadge={key === 'focus' && showTimerBadge}
      timerLeft={timerLeft}
      isWide={isWide}
    />
  ));

  return (
    <ThemeProv>
      {isWide ? (
        /* ── Desktop: sidebar layout ──────────────────────────────────────── */
        <div className="flex h-[100dvh] bg-cream overflow-hidden">
          <aside className="w-48 bg-surface border-r border-sand flex flex-col py-4 gap-1 px-2 flex-shrink-0">
            <div className="px-3 pb-4 mb-2 border-b border-sand">
              <span className="text-sm font-semibold tracking-wide text-bark/50 uppercase">
                Productivity Hub
              </span>
            </div>
            <nav aria-label="Sidebar navigation" className="flex flex-col gap-0.5">
              {navButtons}
            </nav>
            <div className="mt-auto pt-2 border-t border-sand">
              <PersonalLink />
            </div>
          </aside>
          <main className="flex-1 overflow-y-auto">
            <ActiveSection />
          </main>
        </div>
      ) : (
        /* ── Mobile: bottom tab bar layout ───────────────────────────────── */
        <div className="flex flex-col h-[100dvh] bg-cream relative overflow-hidden">
          <div className="bg-surface border-b border-sand flex items-center justify-between px-3 py-1.5 flex-shrink-0">
            <div>
              <span className="text-sm font-semibold tracking-wide text-bark/50 uppercase">
                Productivity Hub
              </span>
            </div>
            <PersonalLink />
          </div>
          {/* Pull-to-refresh indicator */}
          <div
            aria-hidden="true"
            className="absolute left-0 right-0 flex justify-center z-40 pointer-events-none"
            style={{ top: 0, transform: `translateY(${(refreshing ? PTR_THRESHOLD : pullY) - 48}px)` }}
          >
            <div className="bg-surface rounded-full shadow-md p-2 mt-1 border border-sand">
              <I.Reset
                width={16}
                height={16}
                className={refreshing ? 'text-sage animate-spin' : 'text-bark/50'}
                style={refreshing ? undefined : { transform: `rotate(${(pullY / PTR_THRESHOLD) * 360}deg)` }}
              />
            </div>
          </div>
          <main ref={mainRef} className="flex-1 overflow-y-auto min-h-0">
            <ActiveSection />
          </main>
          <nav
            aria-label="Bottom navigation"
            className="bg-surface border-t border-sand flex justify-around px-1 pt-1 pb-safe flex-shrink-0"
          >
            {navButtons}
          </nav>
        </div>
      )}

      <AboutModal open={showAbout} onClose={closeAbout} />
    </ThemeProv>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────

function AuthGate() {
  const { user } = useAuthContext();

  if (!user) return <AuthForm />;

  return (
    <AppDataProvider>
      <AppShell />
    </AppDataProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}
