/**
 * Settings section
 * Theme, timer presets, data management, PWA install, explainer accordion, TestRunner.
 */
import React, { useState, useRef, lazy, Suspense } from 'react';
import { version } from '../../package.json';
import { useAppDataContext } from '../hooks/useAppData.js';
import { useAuthContext } from '../components/AuthProvider.jsx';
import { useDesk } from '../hooks/useResponsive.js';
import { S } from '../lib/storage.js';
import { dlFile, notify, PRESETS } from '../lib/utils.js';
import { pushKey, SYNCED_KEYS } from '../lib/sync.js';
import { I } from '../components/icons.jsx';
import { ConfirmDialog } from '../components/ConfirmDialog.jsx';

// Lazy-load TestRunner
const TestRunner = lazy(() => import('../components/TestRunner.jsx').catch(() => ({
  default: () => (
    <p className="text-sm font-semibold text-bark/50 text-center py-8">
      TestRunner not available in this build.
    </p>
  ),
})));

const THEMES = [
  { key: 'light',  label: 'Light',  icon: '☀️' },
  { key: 'dark',   label: 'Dark',   icon: '🌙' },
  { key: 'system', label: 'System', icon: '💻' },
];

const PRESET_LIST = Object.entries(PRESETS)
  .filter(([, v]) => v !== null)
  .map(([key, val]) => ({ key, label: val.label, work: val.work, short: val.short, long: val.long }));

const GUIDE_SECTIONS = [
  {
    key: 'bujo',
    title: '📓 Bullet Journal Method',
    body: BulletJournalSection,
  },
  {
    key: 'gtd',
    title: '📊 GTD Weekly Review',
    body: GTDSection,
  },
  {
    key: 'pomodoro',
    title: '🍅 Pomodoro Technique',
    body: PomodoroSection,
  },
  {
    key: 'deepwork',
    title: '🎯 Deep Work',
    body: DeepWorkSection,
  },
  {
    key: 'eisenhower',
    title: '📊 Eisenhower Matrix',
    body: EisenhowerSection,
  },
];


export function Settings() {
  const {
    theme, setTheme,
    preset, setPreset,
    customT, setCustomT,
  } = useAppDataContext();
  const isDesk = useDesk();

  // Custom timer inputs
  const [customWork,  setCustomWork]  = useState(customT.work);
  const [customShort, setCustomShort] = useState(customT.short);
  const [customLong,  setCustomLong]  = useState(customT.long);

  // Confirm dialog
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMsg,  setConfirmMsg]  = useState('');
  const [confirmAct,  setConfirmAct]  = useState(null);

  // Accordion state
  const [dailyWorkflowOpen, setDailyWorkflowOpen] = useState(false);
  const [openGuideSection, setOpenGuideSection] = useState(null);

  // PWA install
  const [installPrompt, setInstallPrompt] = useState(null);
  const [testRunnerOpen, setTestRunnerOpen] = useState(false);

  // Capture PWA install event
  React.useEffect(() => {
    const handler = (e) => { e.preventDefault(); setInstallPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleExport = async () => {
    try {
      const data = await S.exp();
      dlFile(
        `productivity-hub-backup-${new Date().toISOString().slice(0, 10)}.json`,
        JSON.stringify(data, null, 2)
      );
      notify('Backup exported', 'success');
    } catch { notify('Export failed', 'error'); }
  };

  const importRef = useRef(null);
  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        await S.imp(data);
        // Push imported data to Supabase so it's synced
        if (user) {
          for (const key of SYNCED_KEYS) {
            if (data[key] !== undefined) {
              await pushKey(user.id, key, data[key]);
            }
          }
        }
        notify('Data restored — reload to see changes', 'success');
      } catch { notify('Import failed — invalid file', 'error'); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleReset = () => {
    setConfirmMsg('Reset ALL data? This cannot be undone.');
    setConfirmAct(() => async () => {
      await S.clr();
      notify('All data cleared — reload to start fresh', 'success');
    });
    setConfirmOpen(true);
  };

  const handleInstall = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    setInstallPrompt(null);
  };

  const handleSaveCustom = () => {
    setCustomT({ work: Number(customWork), short: Number(customShort), long: Number(customLong) });
    setPreset('custom');
    notify('Custom timer saved', 'success');
  };

  const { user, signOut } = useAuthContext();

  const handleLogout = async () => {
    await signOut();
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="sticky top-0 z-10 flex items-center px-4 py-3 bg-cream border-b border-sand/70">
        <h2 className="text-base font-bold text-bark">Settings</h2>
      </div>

      <div className={`p-4 ${isDesk ? 'grid grid-cols-2 gap-6 items-start' : 'space-y-6'}`}>

        {/* ── Account ──────────────────────────────────────────────────── */}
        <Card title="Account">
          <div className="space-y-2">
            <div className="px-4 py-3 rounded-xl bg-cream border border-sand">
              <p className="text-xs font-semibold text-bark/50">Signed in as</p>
              <p className="text-sm font-bold text-bark">{user?.email}</p>
            </div>
            <ActionButton
              icon={<I.Dots width={16} height={16} />}
              label="Log out"
              onClick={handleLogout}
              danger
            />
          </div>
        </Card>

        {/* ── Theme ─────────────────────────────────────────────────────── */}
        <Card title="Theme">
          <div className="flex gap-2">
            {THEMES.map((t) => (
              <button
                key={t.key}
                onClick={() => setTheme(t.key)}
                className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl border font-semibold text-xs transition-all
                  ${theme === t.key
                    ? 'bg-sage/10 border-sage/50 text-sage'
                    : 'bg-surface border-sand text-bark/60 hover:border-bark/30'
                  }`}
                aria-label={`Theme: ${t.label}`}
              >
                <span className="text-lg">{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>
        </Card>

        {/* ── Timer ─────────────────────────────────────────────────────── */}
        <Card title="Timer">
          {/* Presets */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {PRESET_LIST.map((p) => (
              <button
                key={p.key}
                onClick={() => setPreset(p.key)}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all
                  ${preset === p.key
                    ? 'bg-bark text-cream border-bark'
                    : 'bg-surface text-bark/60 border-sand hover:border-bark/30'
                  }`}
                aria-label={`Preset: ${p.label}`}
              >
                {p.label}
                {p.key !== 'custom' && (
                  <span className="text-[10px] ml-1 opacity-60">
                    {p.work}m
                  </span>
                )}
              </button>
            ))}
            <button
              onClick={() => setPreset('custom')}
              className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all
                ${preset === 'custom'
                  ? 'bg-bark text-cream border-bark'
                  : 'bg-surface text-bark/60 border-sand hover:border-bark/30'
                }`}
              aria-label="Preset: Custom"
            >
              Custom
            </button>
          </div>

          {/* Custom durations */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            {[
              { label: 'Work (min)', value: customWork, set: setCustomWork },
              { label: 'Short (min)', value: customShort, set: setCustomShort },
              { label: 'Long (min)', value: customLong, set: setCustomLong },
            ].map(({ label, value, set }) => (
              <div key={label}>
                <label className="text-xs font-semibold text-bark/50 block mb-1">{label}</label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={value}
                  onChange={(e) => set(Number(e.target.value))}
                  className="w-full border border-sand rounded-xl px-3 py-2 text-sm font-bold text-bark
                    focus:outline-none focus:ring-2 focus:ring-sage/40 bg-cream"
                  aria-label={label}
                />
              </div>
            ))}
          </div>
          <button
            onClick={handleSaveCustom}
            className="w-full py-2.5 rounded-xl bg-sage text-white text-sm font-bold hover:opacity-90 transition-opacity"
          >
            Save Custom Durations
          </button>
        </Card>

        {/* ── Data ──────────────────────────────────────────────────────── */}
        <Card title="Data">
          <div className="space-y-2">
            <ActionButton
              icon={<I.Download width={16} height={16} />}
              label="Export JSON backup"
              onClick={handleExport}
              aria-label="Export data"
            />
            <ActionButton
              icon={<I.Upload width={16} height={16} />}
              label="Import JSON backup"
              onClick={() => importRef.current?.click()}
              aria-label="Import data"
            />
            <input
              ref={importRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImport}
              aria-label="Import file"
            />
            <ActionButton
              icon={<I.Trash width={16} height={16} />}
              label="Reset all data"
              onClick={handleReset}
              danger
              aria-label="Reset data"
            />
          </div>
        </Card>

        {/* ── Install ───────────────────────────────────────────────────── */}
        {installPrompt && (
          <Card title="Install App">
            <button
              onClick={handleInstall}
              className="w-full py-3 rounded-xl bg-ocean text-white text-sm font-bold hover:opacity-90 transition-opacity"
              aria-label="Install as app"
            >
              Install as App
            </button>
            <p className="text-xs text-bark/50 font-semibold mt-2 text-center">
              Works offline after install
            </p>
          </Card>
        )}

        {/* ── How it works ──────────────────────────────────────────────── */}
        <div className={isDesk ? 'col-span-2' : ''}>
          <Card title="How it works">
            <div className="text-xs font-semibold text-bark/60 leading-relaxed mb-4">
              <WorkflowSection />
            </div>
            <AccordionItem
              title="📅 Daily Workflow Example"
              body={<DailyWorkflowSection />}
              open={dailyWorkflowOpen}
              onToggle={() => setDailyWorkflowOpen((v) => !v)}
            />
          </Card>
        </div>

        {/* ── Methodologies ─────────────────────────────────────────────── */}
        <div className={isDesk ? 'col-span-2' : ''}>
          <Card title="Methodologies">
            <div className="space-y-1">
              {GUIDE_SECTIONS.map(({ key, title, body: BodyComponent }) => (
                <AccordionItem
                  key={key}
                  title={title}
                  body={<BodyComponent />}
                  open={openGuideSection === key}
                  onToggle={() => setOpenGuideSection(openGuideSection === key ? null : key)}
                />
              ))}
            </div>
          </Card>
        </div>

        {/* ── Test Suite ────────────────────────────────────────────────── */}
        <div className={isDesk ? 'col-span-2' : ''}>
          <Card title="Test Suite">
            <button
              onClick={() => setTestRunnerOpen((v) => !v)}
              className="w-full py-2.5 rounded-xl bg-lavender/10 border border-lavender/30 text-lavender
                text-sm font-bold hover:bg-lavender/20 transition-colors"
              aria-label="Run test suite"
            >
              {testRunnerOpen ? 'Hide' : 'Run'} Test Suite
            </button>
            {testRunnerOpen && (
              <div className="mt-3">
                <Suspense fallback={<p className="text-sm text-bark/50 text-center py-4 font-semibold">Loading…</p>}>
                  <TestRunner />
                </Suspense>
              </div>
            )}
          </Card>
        </div>

      </div>

      <p className="text-center text-xs font-semibold text-bark/30 py-4">v{version}</p>

      <ConfirmDialog
        open={confirmOpen}
        message={confirmMsg}
        confirmLabel="Reset"
        danger
        onConfirm={() => { confirmAct?.(); setConfirmAct(null); }}
        onClose={() => { setConfirmOpen(false); setConfirmAct(null); }}
      />

    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function WorkflowSection() {
  return (
    <div className="space-y-3">
      <p>
        Productivity Hub combines the Bullet Journal method, GTD (Getting Things Done),
        Deep Work, and the Eisenhower Matrix into one seamless workflow. Every productivity
        system follows one cycle — ours has five steps, each mapped to a tab:
      </p>
      {[
        {
          icon: '📝', n: '1', title: 'Capture',
          body: "Get everything out of your head. Jot quick bullet notes — ideas, tasks, thoughts, anything. Don't organize yet, just capture. Tap to edit inline, use ⋮ menu for actions (promote to Clarify, strikethrough, delete), or use the ☐ header checkbox for bulk operations.",
        },
        {
          icon: '📋', n: '2', title: 'Clarify',
          body: "Decide what each item means. Place tasks in the Eisenhower Matrix: Do First, Schedule, Delegate, or Eliminate. Add categories, deadlines, and subtasks. Drag tasks between quadrants to re-prioritize. Tap any task to toggle done/undone. Use ⋮ menu or right-click (desktop) for actions: edit, add to Focus Queue, link a checklist, or delete.",
        },
        {
          icon: '🎯', n: '3', title: 'Focus',
          body: "Pick 3–5 tasks for today's Focus Queue. Use the Pomodoro timer: 25 min work, 5 min break. After 4 cycles, take a longer break. On desktop, timer and queue display side-by-side. When the timer is running, a live countdown replaces the Focus tab label.",
        },
        {
          icon: '✅', n: '4', title: 'Confirm',
          body: "Use checklists to break tasks into steps. Link a checklist to a Clarify task via ⋮ menu → Link Checklist. When all items are checked, you'll be prompted to mark the task done. Tap items to toggle done, use ⋮ to edit or delete, and ☐ header checkbox for bulk operations.",
        },
        {
          icon: '📊', n: '5', title: 'Review',
          body: 'Check your weekly stats, matrix balance, and insights. The Review tab analyzes your patterns — overloaded quadrants, overdue tasks, unprocessed notes — and suggests next actions. On desktop, displays as a 2-column dashboard. Do this weekly.',
        },
      ].map(({ icon, n, title, body }) => (
        <div key={n}>
          <p className="font-bold text-bark mb-1">{icon} {n}. {title}</p>
          <p>{body}</p>
        </div>
      ))}
    </div>
  );
}

function DailyWorkflowSection() {
  return (
    <div className="space-y-3">
      {[
        {
          heading: 'Morning (5 min)',
          items: [
            'Open Capture — jot anything on your mind',
            'Go to Clarify — review matrix, drag tasks to correct quadrants',
            'Tap → on 3–5 tasks to add them to Focus queue',
            'Optionally check Confirm for any process checklists',
          ],
        },
        {
          heading: 'Work Sessions (2–4 hours)',
          items: [
            'Open Focus, tap a task to activate it',
            'Start Pomodoro — 25 min of deep work',
            'Take 5 min break, then repeat',
            'After 4 pomodoros, take a 15 min long break',
            'Quick-capture stray thoughts in Capture to stay focused',
          ],
        },
        {
          heading: 'End of Day (5 min)',
          items: [
            'Clear completed tasks (🧹 button in Clarify)',
            'Process any unread Capture notes → strikethrough or → Clarify',
            "Glance at Review for today's pomodoro count and streak",
            'Set priorities for tomorrow in Clarify',
          ],
        },
      ].map(({ heading, items }) => (
        <div key={heading}>
          <p className="font-bold text-bark/80 mb-1">{heading}</p>
          <ol className="list-decimal list-inside space-y-0.5 pl-1">
            {items.map((item, i) => <li key={i}>{item}</li>)}
          </ol>
        </div>
      ))}
    </div>
  );
}

function BulletJournalSection() {
  return (
    <div className="space-y-3">
      <p>
        The Capture tab is inspired by Ryder Carroll's Bullet Journal — a rapid logging system
        that clears your mind so you can focus.
      </p>
      <div>
        <p className="font-bold text-bark/80 mb-1">Rapid Logging:</p>
        <ul className="list-disc list-inside space-y-0.5 pl-1">
          <li>Capture everything — tasks, ideas, thoughts, questions</li>
          <li>One bullet per thought — keep it short and atomic</li>
          <li>Press Enter to add instantly, no friction</li>
          <li>Don't organize yet — that's what Clarify is for</li>
        </ul>
      </div>
      <div>
        <p className="font-bold text-bark/80 mb-1">Migration (Processing Notes):</p>
        <ul className="list-disc list-inside space-y-0.5 pl-1">
          <li>Tap: Edit a note inline</li>
          <li>⋮ Menu: Edit, Promote to Clarify, Strikethrough, or Delete</li>
          <li>Right-click (desktop): Same actions as ⋮</li>
          <li>☐ Checkbox (top-right): Bulk actions — Move to Clarify, Strikethrough, Delete</li>
          <li>Auto-clear: Struck-through notes removed after 30 days</li>
        </ul>
      </div>
      <p>Day Sections: Notes grouped by day — Today, Yesterday, and past dates.</p>
    </div>
  );
}

function GTDSection() {
  return (
    <div className="space-y-3">
      <div>
        <p className="font-bold text-bark/80 mb-1">Weekly Review Checklist:</p>
        <ol className="list-decimal list-inside space-y-0.5 pl-1">
          <li>Get Clear — Process all Capture notes (migrate or strike)</li>
          <li>Get Current — Review Clarify matrix, update or delete stale tasks</li>
          <li>Get Creative — Check Review insights, act on suggestions</li>
        </ol>
      </div>
      <div>
        <p className="font-bold text-bark/80 mb-1">What Review Tab Shows:</p>
        <ul className="list-disc list-inside space-y-0.5 pl-1">
          <li>Weekly stats: Pomodoros, tasks completed, focus time</li>
          <li>Streak heatmap: 13-week grid — darker = more pomodoros</li>
          <li>Streak counter: Current consecutive days and longest streak</li>
          <li>Matrix overview: Active tasks per quadrant</li>
          <li>Insights: Overloaded quadrants, overdue tasks, unprocessed notes</li>
          <li>Next actions: Specific suggestions based on patterns</li>
        </ul>
      </div>
    </div>
  );
}

function PomodoroSection() {
  return (
    <div className="space-y-3">
      <p>
        The Pomodoro Technique, created by Francesco Cirillo, uses timed work intervals
        separated by short breaks to build sustained focus and prevent burnout. By working
        in discrete sprints you create a sense of urgency, reduce the temptation to
        multitask, and make large projects feel manageable.
      </p>
      <div>
        <p className="font-bold text-bark/80 mb-1">The Cycle:</p>
        <ol className="list-decimal list-inside space-y-0.5 pl-1">
          <li>Work Session — 25 minutes of uninterrupted focus on one task</li>
          <li>Short Break — 5 minutes to rest and reset</li>
          <li>Repeat steps 1–2 four times</li>
          <li>Long Break — 15–30 minutes after completing 4 cycles</li>
        </ol>
      </div>
      <div>
        <p className="font-bold text-bark/80 mb-1">Why it works:</p>
        <ul className="list-disc list-inside space-y-0.5 pl-1">
          <li>Parkinson's Law — work expands to fill the time given; short sprints force efficiency</li>
          <li>Regular breaks prevent cognitive fatigue and maintain quality</li>
          <li>Counting pomodoros gives a concrete measure of effort, not just outcomes</li>
          <li>The ritual of starting a timer creates a clear on/off switch for focus mode</li>
        </ul>
      </div>
      <div>
        <p className="font-bold text-bark/80 mb-1">In this app:</p>
        <ul className="list-disc list-inside space-y-0.5 pl-1">
          <li>Use the Focus tab — select tasks, then start the timer</li>
          <li>Presets: Classic (25/5/15), Short (15/3/10), Long (50/10/20)</li>
          <li>Custom durations available in Settings → Timer</li>
          <li>Completed pomodoros are tracked in Review for weekly insights</li>
        </ul>
      </div>
    </div>
  );
}

function DeepWorkSection() {
  return (
    <div className="space-y-3">
      <p>
        Deep Work, coined by Cal Newport, is the practice of focusing without distraction
        on a cognitively demanding task. It's the opposite of shallow work — email, quick
        replies, admin — and is the activity that creates the most professional value and
        builds skills that are hard to replicate.
      </p>
      <div>
        <p className="font-bold text-bark/80 mb-1">Core principles:</p>
        <ul className="list-disc list-inside space-y-0.5 pl-1">
          <li>Schedule deep work blocks in advance — protect them like meetings</li>
          <li>Eliminate distractions during blocks: phone away, notifications off</li>
          <li>Embrace boredom — resist the urge to check feeds during breaks</li>
          <li>Quit shallow work at a set time each day to preserve mental energy</li>
        </ul>
      </div>
      <div>
        <p className="font-bold text-bark/80 mb-1">Focus Queue — limiting tasks for depth:</p>
        <p className="mb-1">
          The Focus Queue intentionally caps you at 3–5 tasks per session. More than 5
          tasks signals shallow planning; fewer than 3 is fine for intensive work.
        </p>
        <ul className="list-disc list-inside space-y-0.5 pl-1">
          <li>3 tasks — maximum depth, complex or creative work requiring long stretches</li>
          <li>4 tasks — balanced day with one or two multi-pomodoro tasks</li>
          <li>5 tasks — varied day, shorter tasks, or 8+ hour work day</li>
        </ul>
      </div>
      <div>
        <p className="font-bold text-bark/80 mb-1">In this app:</p>
        <ul className="list-disc list-inside space-y-0.5 pl-1">
          <li>Add tasks to Focus Queue from Clarify via ⋮ menu → Add to Focus</li>
          <li>Activate a task in Focus tab, then start a Pomodoro — one task at a time</li>
          <li>Keep Capture open in a second tab to catch stray thoughts without losing focus</li>
        </ul>
      </div>
    </div>
  );
}

function EisenhowerSection() {
  return (
    <div className="space-y-3">
      <p>
        The Eisenhower Matrix, popularised by Stephen Covey in <em>The 7 Habits of Highly Effective People</em>,
        organises tasks by two axes — urgency and importance — to help you spend less time
        fighting fires and more time on work that moves the needle.
      </p>
      <div>
        <p className="font-bold text-bark/80 mb-1">The four quadrants:</p>
        <div className="space-y-2">
          <div>
            <p className="font-bold text-bark/70">Q1 — Do First (Urgent &amp; Important)</p>
            <p>Crises, hard deadlines, emergencies. Act immediately. Aim to shrink this quadrant over time by better planning — most Q1 items arrive because Q2 was neglected.</p>
          </div>
          <div>
            <p className="font-bold text-bark/70">Q2 — Schedule (Not Urgent, Important)</p>
            <p>Strategic planning, skill-building, relationship maintenance, prevention. This is where high performers live. Block time for Q2 proactively — it rarely feels urgent until it's too late.</p>
          </div>
          <div>
            <p className="font-bold text-bark/70">Q3 — Delegate (Urgent, Not Important)</p>
            <p>Interruptions, some emails, requests that feel pressing but don't serve your goals. Handle quickly, delegate when possible, or reschedule. Don't let Q3 crowd out Q2.</p>
          </div>
          <div>
            <p className="font-bold text-bark/70">Q4 — Eliminate (Not Urgent, Not Important)</p>
            <p>Mindless scrolling, busywork, excessive re-checking. Minimise ruthlessly. New tasks land here by default so you must consciously promote them — this prevents reactive prioritisation.</p>
          </div>
        </div>
      </div>
      <div>
        <p className="font-bold text-bark/80 mb-1">In this app (Clarify tab):</p>
        <ul className="list-disc list-inside space-y-0.5 pl-1">
          <li>New tasks default to Q4 — forcing a deliberate placement decision</li>
          <li>Drag tasks between quadrants to reprioritise on desktop</li>
          <li>Use ⋮ menu → Edit to change quadrant on mobile</li>
          <li>Review tab shows your quadrant distribution — a healthy week has most tasks in Q1/Q2</li>
        </ul>
      </div>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div className="card p-4">
      <h3 className="text-sm font-bold text-bark mb-3">{title}</h3>
      {children}
    </div>
  );
}

function ActionButton({ icon, label, onClick, danger = false, ...rest }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border font-semibold text-sm
        transition-colors text-left
        ${danger
          ? 'text-terracotta border-terracotta/20 hover:bg-terracotta/5'
          : 'text-bark border-sand hover:bg-cream'
        }`}
      {...rest}
    >
      {icon}
      {label}
    </button>
  );
}

function AccordionItem({ title, body, open, onToggle }) {
  return (
    <div className="border border-sand rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-bold text-bark
          hover:bg-cream transition-colors text-left"
        aria-expanded={open}
      >
        {title}
        <span className={`transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`}>
          <I.ChevronDown width={16} height={16} />
        </span>
      </button>
      {open && (
        <div className="px-4 pb-4 text-xs font-semibold text-bark/60 leading-relaxed border-t border-sand/60 pt-3">
          {body}
        </div>
      )}
    </div>
  );
}
