/**
 * AboutModal — about/help modal
 * Mobile: 7 collapsible accordion sections
 * Tablet+ (md): 2-column grid
 */
import React, { useState, useEffect } from 'react';
import { I } from './icons.jsx';

const SECTIONS = [
  {
    title: '📥 Capture',
    body: 'Brain-dump anything instantly. Tap an item to edit inline. Use the 3-dot menu to promote a note to a Clarify task, strike it through, copy it, or delete it. The header checkbox enters bulk-select mode.',
  },
  {
    title: '🗂 Clarify',
    body: 'Organize tasks across the Eisenhower Matrix — Do First (urgent+important), Schedule, Delegate, and Eliminate. Tap a task to mark it done. Add subtasks, a deadline, and pomodoro counts. Link a task to a Confirm checklist for step-by-step tracking.',
  },
  {
    title: '⏱ Focus',
    body: 'Run Pomodoro sessions against your Focus Queue (up to 5 tasks from Clarify). Choose Classic (25/5/15), Long (50/10/20), Short (15/3/10), or a Custom preset. The timer persists if you switch tabs.',
  },
  {
    title: '✅ Confirm',
    body: 'Create named checklists with optional sections. Tap items to check them off. Checklists can be linked from Clarify tasks so you can walk through a workflow step by step.',
  },
  {
    title: '📊 Review',
    body: 'See weekly metrics: pomodoros completed, tasks done, and focus minutes. A 13-week heatmap shows your daily activity. Current and longest streaks are tracked automatically.',
  },
  {
    title: '⚙️ Settings',
    body: 'Switch between Light, Dark, and System theme. Adjust timer preset durations. Export all data as a JSON backup, import from a previous backup, or reset everything. Install the app to your home screen for offline access.',
  },
  {
    title: '🔄 Cross-Device Sync',
    body: 'Share your data between devices without any account. In Settings → Data, tap "Share Data" to generate a sync code. Copy or share it, then paste it on another device to import your data instantly.',
  },
];

function AccordionItem({ title, body }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-sand/70 last:border-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3.5 text-sm font-bold text-bark text-left"
      >
        <span>{title}</span>
        <span className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
          <I.ChevronDown width={16} height={16} className="text-bark/40" />
        </span>
      </button>
      {open && (
        <p className="px-4 pb-4 text-sm text-bark/70 font-semibold leading-relaxed">
          {body}
        </p>
      )}
    </div>
  );
}

function GridCard({ title, body }) {
  return (
    <div className="bg-cream rounded-xl p-4">
      <h4 className="text-sm font-bold text-bark mb-2">{title}</h4>
      <p className="text-sm text-bark/70 font-semibold leading-relaxed">{body}</p>
    </div>
  );
}

export function AboutModal({ open, onClose }) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-bark/50" onClick={onClose} />

      {/* Panel */}
      <div className="relative bg-white w-full md:max-w-2xl rounded-t-2xl md:rounded-2xl
        shadow-xl max-h-[85vh] flex flex-col anim-in">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-sand flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-bark">Productivity Hub</h2>
            <p className="text-xs text-bark/50 font-semibold">v18.0-Alpha</p>
          </div>
          <button onClick={onClose} className="text-bark/40 hover:text-bark transition-colors">
            <I.X width={20} height={20} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1">
          {/* Mobile: accordion */}
          <div className="md:hidden">
            {SECTIONS.map((s) => (
              <AccordionItem key={s.title} title={s.title} body={s.body} />
            ))}
          </div>

          {/* Tablet+: 2-column grid */}
          <div className="hidden md:grid grid-cols-2 gap-3 p-5">
            {SECTIONS.map((s) => (
              <GridCard key={s.title} title={s.title} body={s.body} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
