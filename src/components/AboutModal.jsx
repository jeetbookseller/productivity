/**
 * AboutModal — about/help modal
 * Flat non-collapsible summary of the 5 workflow tabs.
 */
import React, { useEffect } from 'react';
import { I } from './icons.jsx';

const STEPS = [
  { icon: '📝', step: 'Capture',  desc: 'Brain dump everything. No organizing yet.' },
  { icon: '🎯', step: 'Clarify',  desc: 'Sort by urgency & importance. Tap to toggle done. ⋮ for actions.' },
  { icon: '⏱',  step: 'Focus',   desc: 'Queue 3–5 tasks. Work in timed sessions.' },
  { icon: '✅', step: 'Confirm',  desc: 'Checklists for tasks. Link from Clarify to break work into steps.' },
  { icon: '📊', step: 'Review',   desc: 'Weekly stats, streaks & insights.' },
];

export function AboutModal({ open, onClose }) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-bark/50" onClick={onClose} />

      {/* Panel */}
      <div className="relative bg-surface w-full max-w-lg rounded-2xl
        shadow-xl max-h-[80vh] flex flex-col anim-in">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-sand flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-bark">Productivity Hub</h2>
            <p className="text-xs text-bark/50 font-semibold">v2-alpha</p>
          </div>
          <button onClick={onClose} className="text-bark/40 hover:text-bark transition-colors">
            <I.X width={20} height={20} />
          </button>
        </div>

        {/* Content — flat non-collapsible */}
        <div className="overflow-y-auto flex-1">
          <div className="px-5 py-4 space-y-4">

            <p className="text-sm font-bold text-bark">🌿 About Productivity</p>

            {/* 5 steps */}
            <div className="space-y-3">
              {STEPS.map(({ icon, step, desc }) => (
                <div key={step} className="flex gap-3 items-start">
                  <span className="text-base leading-snug flex-shrink-0">{icon}</span>
                  <p className="text-sm font-semibold text-bark/80 leading-snug">
                    <span className="font-bold text-bark">{step}</span>
                    {' — '}
                    {desc}
                  </p>
                </div>
              ))}
            </div>

            {/* Workflow tagline */}
            <p className="text-xs font-bold text-bark/50 tracking-wide text-center pt-1">
              Capture → Clarify → Focus → Confirm → Review → Repeat
            </p>

            {/* Footer note */}
            <p className="text-xs font-semibold text-bark/50 text-center border-t border-sand pt-3">
              📚 Visit <span className="font-bold text-bark/70">Settings</span> → Methodologies for the full guide
            </p>

          </div>
        </div>
      </div>
    </div>
  );
}
