/**
 * Settings section
 * Theme, timer presets, data management, PWA install, explainer accordion, TestRunner.
 */
import React, { useState, useRef, lazy, Suspense } from 'react';
import { useAppDataContext } from '../hooks/useAppData.js';
import { useDesk } from '../hooks/useResponsive.js';
import { S } from '../lib/storage.js';
import { dlFile, notify, PRESETS } from '../lib/utils.js';
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
                    : 'bg-white border-sand text-bark/60 hover:border-bark/30'
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
                    : 'bg-white text-bark/60 border-sand hover:border-bark/30'
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
                  : 'bg-white text-bark/60 border-sand hover:border-bark/30'
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

        {/* ── Explainer ─────────────────────────────────────────────────── */}
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
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

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
