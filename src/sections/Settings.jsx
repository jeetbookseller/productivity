/**
 * Settings section
 * Theme, timer presets, data management, PWA install, explainer accordion, TestRunner.
 */
import React, { useState, useRef, lazy, Suspense } from 'react';
import { useAppDataContext } from '../hooks/useAppData.js';
import { useDesk } from '../hooks/useResponsive.js';
import { S } from '../lib/storage.js';
import { dlFile, notify, shareItem, PRESETS, encodeSync, decodeSync } from '../lib/utils.js';
import { QRCanvas } from '../components/QRCanvas.jsx';
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

const METHODOLOGY_ITEMS = [
  {
    title: 'Bullet Journal',
    body: 'A rapid-logging system invented by Ryder Carroll. Tasks, events, and notes are captured with symbols and migrated regularly. The Capture tab draws from this brain-dump philosophy.',
  },
  {
    title: 'GTD (Getting Things Done)',
    body: "David Allen's five-step framework: Capture → Clarify → Organise → Reflect → Engage. This app's tab flow maps directly to those phases.",
  },
  {
    title: 'Pomodoro Technique',
    body: 'Invented by Francesco Cirillo: 25 minutes of focused work followed by a 5-minute break. After four sessions, take a longer break. Used in the Focus tab timer.',
  },
  {
    title: 'Deep Work',
    body: "Cal Newport's concept: scheduled, distraction-free sessions for cognitively demanding tasks produce disproportionate results. The Focus queue and persistent timer embody this.",
  },
  {
    title: 'Eisenhower Matrix',
    body: 'A 2×2 grid that sorts tasks by urgency × importance: Do First (urgent + important), Schedule (not urgent + important), Delegate (urgent + not important), Eliminate (neither). Used in Clarify.',
  },
];

const EXPLAINER_ITEMS = [
  {
    title: 'Capture',
    body: 'Brain-dump anything instantly. Tap an item to edit inline. Use the 3-dot menu to promote to Clarify, strikethrough, copy, or delete.',
  },
  {
    title: 'Clarify',
    body: 'Sort tasks into the Eisenhower Matrix: Do First (urgent+important), Schedule (not urgent+important), Delegate, or Eliminate.',
  },
  {
    title: 'Focus',
    body: 'Select up to 5 tasks for your focus queue, then run Pomodoro sessions. Timer state persists across tab switches.',
  },
  {
    title: 'Confirm',
    body: 'Create checklists with named sections. Link checklists to Clarify tasks for step-by-step workflows.',
  },
  {
    title: 'Review',
    body: 'See your weekly metrics, 13-week activity heatmap, streak, task distribution, and personalised insights.',
  },
  {
    title: 'Bulk Select',
    body: 'Tap the checkbox in any section header to enter bulk-select mode. Select multiple items, then strike, move, or delete them at once.',
  },
  {
    title: 'Data & Privacy',
    body: 'All data lives entirely on your device — IndexedDB with localStorage fallback. Nothing is sent to any server.',
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
  const [openAccordion, setOpenAccordion] = useState(null);
  const [openMethodologyAccordion, setOpenMethodologyAccordion] = useState(null);
  const [openCompleteGuide, setOpenCompleteGuide] = useState(false);

  // Share Data state
  const [qrOpen, setQrOpen] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [importCode, setImportCode] = useState('');

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

  const handleCopyCode = async () => {
    try {
      const data = await S.exp();
      const code = encodeSync(data);
      await navigator.clipboard.writeText(code);
      notify('Sync code copied to clipboard', 'success');
    } catch { notify('Could not copy sync code', 'error'); }
  };

  const handleShareCode = async () => {
    try {
      const data = await S.exp();
      const code = encodeSync(data);
      await shareItem(code, 'Productivity Hub Sync');
    } catch { notify('Share failed', 'error'); }
  };

  const handleShowQR = async () => {
    try {
      const data = await S.exp();
      setQrCode(encodeSync(data));
      setQrOpen(true);
    } catch { notify('Could not generate QR', 'error'); }
  };

  const handleImportCode = async () => {
    const obj = decodeSync(importCode.trim());
    if (!obj) { notify('Invalid sync code', 'error'); return; }
    await S.imp(obj);
    setImportCode('');
    notify('Data imported — reload to see changes', 'success');
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="sticky top-0 z-10 flex items-center px-4 py-3 bg-cream border-b border-sand/70">
        <h2 className="text-base font-bold text-bark">Settings</h2>
      </div>

      <div className={`p-4 ${isDesk ? 'grid grid-cols-2 gap-6 items-start' : 'space-y-6'}`}>

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

        {/* ── Share Data ────────────────────────────────────────────────── */}
        <Card title="Share Data">
          <div className="space-y-2">
            <ActionButton
              icon={<I.Copy width={16} height={16} />}
              label="Copy sync code"
              onClick={handleCopyCode}
              aria-label="Copy sync code"
            />
            <ActionButton
              icon={<I.Share width={16} height={16} />}
              label="Share sync code"
              onClick={handleShareCode}
              aria-label="Share sync code"
            />
            <ActionButton
              icon={<I.QR width={16} height={16} />}
              label="Show QR code"
              onClick={handleShowQR}
              aria-label="Show QR code"
            />
          </div>
          <div className="mt-3">
            <textarea
              value={importCode}
              onChange={(e) => setImportCode(e.target.value)}
              placeholder="Paste sync code here…"
              className="w-full border border-sand rounded-xl px-3 py-2 text-xs font-semibold text-bark
                focus:outline-none focus:ring-2 focus:ring-sage/40 bg-cream resize-none"
              rows={3}
              aria-label="Paste sync code"
            />
            <button
              onClick={handleImportCode}
              disabled={!importCode.trim()}
              className="w-full mt-2 py-2.5 rounded-xl bg-sage text-white text-sm font-bold
                hover:opacity-90 transition-opacity disabled:opacity-40"
              aria-label="Import sync code"
            >
              Import Code
            </button>
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
            <div className={isDesk ? 'grid grid-cols-2 gap-3' : 'space-y-1'}>
              {EXPLAINER_ITEMS.map((item, idx) => (
                isDesk ? (
                  <div key={idx} className="bg-cream rounded-xl p-4 border border-sand/60">
                    <p className="text-sm font-bold text-bark mb-1">{item.title}</p>
                    <p className="text-xs font-semibold text-bark/60 leading-relaxed">{item.body}</p>
                  </div>
                ) : (
                  <AccordionItem
                    key={idx}
                    title={item.title}
                    body={item.body}
                    open={openAccordion === idx}
                    onToggle={() => setOpenAccordion(openAccordion === idx ? null : idx)}
                  />
                )
              ))}
            </div>
          </Card>
        </div>

        {/* ── Methodologies ─────────────────────────────────────────────── */}
        <div className={isDesk ? 'col-span-2' : ''}>
          <Card title="Methodologies">
            <div className={isDesk ? 'grid grid-cols-2 gap-3' : 'space-y-1'}>
              {METHODOLOGY_ITEMS.map((item, idx) => (
                isDesk ? (
                  <div key={idx} className="bg-cream rounded-xl p-4 border border-sand/60">
                    <p className="text-sm font-bold text-bark mb-1">{item.title}</p>
                    <p className="text-xs font-semibold text-bark/60 leading-relaxed">{item.body}</p>
                  </div>
                ) : (
                  <AccordionItem
                    key={idx}
                    title={item.title}
                    body={item.body}
                    open={openMethodologyAccordion === idx}
                    onToggle={() => setOpenMethodologyAccordion(openMethodologyAccordion === idx ? null : idx)}
                  />
                )
              ))}
            </div>
            {/* Complete Guide — always collapsible, collapsed by default on both mobile and desktop */}
            <div className="mt-3">
              <AccordionItem
                title="📚 Complete Guide"
                body={<CompleteGuideBody />}
                open={openCompleteGuide}
                onToggle={() => setOpenCompleteGuide((v) => !v)}
              />
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

      <ConfirmDialog
        open={confirmOpen}
        message={confirmMsg}
        confirmLabel="Reset"
        danger
        onConfirm={() => { confirmAct?.(); setConfirmAct(null); }}
        onClose={() => { setConfirmOpen(false); setConfirmAct(null); }}
      />

      {/* ── QR Modal ────────────────────────────────────────────────────── */}
      {qrOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-bark/40"
          onClick={() => setQrOpen(false)}
        >
          <div
            className="card p-6 flex flex-col items-center gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-bold text-bark">Scan to sync</h3>
            <QRCanvas data={qrCode} size={220} />
            <button
              onClick={() => setQrOpen(false)}
              className="text-xs font-semibold text-bark/50 hover:text-bark"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function CompleteGuideBody() {
  return (
    <div className="max-h-[32rem] overflow-y-auto space-y-4 pr-1">

      <p>
        Productivity Hub combines the Bullet Journal method, GTD (Getting Things Done),
        Deep Work, and the Eisenhower Matrix into one seamless workflow.
      </p>

      {/* The Workflow */}
      <section>
        <p className="font-bold text-bark mb-2">🔄 The Workflow</p>
        <p className="mb-3">
          Every productivity system follows one cycle. Ours has five steps, each mapped to a tab:
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
          <div key={n} className="mb-3">
            <p className="font-bold text-bark mb-1">{icon} {n}. {title}</p>
            <p>{body}</p>
          </div>
        ))}
      </section>

      {/* Daily Workflow */}
      <section>
        <p className="font-bold text-bark mb-2">🚀 Daily Workflow</p>
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
          <div key={heading} className="mb-3">
            <p className="font-bold text-bark/80 mb-1">{heading}</p>
            <ol className="list-decimal list-inside space-y-0.5 pl-1">
              {items.map((item, i) => <li key={i}>{item}</li>)}
            </ol>
          </div>
        ))}
      </section>

      {/* Bullet Journal */}
      <section>
        <p className="font-bold text-bark mb-2">📓 Bullet Journal Method</p>
        <p className="mb-2">
          The Capture tab is inspired by Ryder Carroll's Bullet Journal — a rapid logging system
          that clears your mind so you can focus.
        </p>
        <p className="font-bold text-bark/80 mb-1">Rapid Logging:</p>
        <ul className="list-disc list-inside space-y-0.5 pl-1 mb-3">
          <li>Capture everything — tasks, ideas, thoughts, questions</li>
          <li>One bullet per thought — keep it short and atomic</li>
          <li>Press Enter to add instantly, no friction</li>
          <li>Don't organize yet — that's what Clarify is for</li>
        </ul>
        <p className="font-bold text-bark/80 mb-1">Migration (Processing Notes):</p>
        <ul className="list-disc list-inside space-y-0.5 pl-1 mb-3">
          <li>Tap: Edit a note inline</li>
          <li>⋮ Menu: Edit, Promote to Clarify, Strikethrough, or Delete</li>
          <li>Right-click (desktop): Same actions as ⋮</li>
          <li>☐ Checkbox (top-right): Bulk actions — Move to Clarify, Strikethrough, Delete</li>
          <li>Auto-clear: Struck-through notes removed after 30 days</li>
        </ul>
        <p>Day Sections: Notes grouped by day — Today, Yesterday, and past dates.</p>
      </section>

      {/* GTD Weekly Review */}
      <section>
        <p className="font-bold text-bark mb-2">📊 GTD Weekly Review</p>
        <p className="font-bold text-bark/80 mb-1">Weekly Review Checklist:</p>
        <ol className="list-decimal list-inside space-y-0.5 pl-1 mb-3">
          <li>Get Clear — Process all Capture notes (migrate or strike)</li>
          <li>Get Current — Review Clarify matrix, update or delete stale tasks</li>
          <li>Get Creative — Check Review insights, act on suggestions</li>
        </ol>
        <p className="font-bold text-bark/80 mb-1">What Review Tab Shows:</p>
        <ul className="list-disc list-inside space-y-0.5 pl-1">
          <li>Weekly stats: Pomodoros, tasks completed, focus time</li>
          <li>Streak heatmap: 13-week grid — darker = more pomodoros</li>
          <li>Streak counter: Current consecutive days and longest streak</li>
          <li>Matrix overview: Active tasks per quadrant</li>
          <li>Insights: Overloaded quadrants, overdue tasks, unprocessed notes</li>
          <li>Next actions: Specific suggestions based on patterns</li>
        </ul>
      </section>

      {/* Pomodoro */}
      <section>
        <p className="font-bold text-bark mb-2">🍅 Pomodoro Technique</p>
        <ul className="list-disc list-inside space-y-0.5 pl-1">
          <li>Work Session: 25 minutes</li>
          <li>Short Break: 5 minutes</li>
          <li>Repeat 4 times</li>
          <li>Long Break: 15 minutes after 4 cycles</li>
        </ul>
      </section>

      {/* Deep Work */}
      <section>
        <p className="font-bold text-bark mb-2">🎯 Deep Work & Focus Queue</p>
        <p className="mb-1">Focus Queue limits you to 3–5 tasks to maximize focus.</p>
        <ul className="list-disc list-inside space-y-0.5 pl-1">
          <li>3 Tasks: For highly complex work, maximum focus</li>
          <li>5 Tasks: For varied responsibilities, 8+ hour days</li>
        </ul>
      </section>

      {/* Eisenhower Matrix */}
      <section>
        <p className="font-bold text-bark mb-2">📊 Urgent/Important Matrix</p>
        <ul className="list-disc list-inside space-y-0.5 pl-1">
          <li>Q1 Do First: Urgent & Important — Crises, deadlines</li>
          <li>Q2 Schedule: Not Urgent & Important — Planning, prevention</li>
          <li>Q3 Delegate: Urgent & Not Important — Interruptions, emails</li>
          <li>Q4 Eliminate: Not Urgent & Not Important — Time wasters</li>
        </ul>
        <p className="mt-2">
          In this app: Q1 = High Priority, Q2 = Medium Priority,
          Q3 = Low Priority/Delegate, Q4 = new tasks default
        </p>
      </section>

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
