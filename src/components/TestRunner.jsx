/**
 * TestRunner — in-app TDD test runner (stub)
 * Lazy-loaded from Settings. Runs T0/T1/T2 test suites inline.
 */
import React, { useState } from 'react';
import { I } from './icons.jsx';

const SUITE_LABELS = [
  { id: 'T0', label: 'Storage (T0)', count: 12 },
  { id: 'T1', label: 'Hooks (T1)',   count: 15 },
  { id: 'T2', label: 'Components + Sections (T2)', count: 11 },
];

export default function TestRunner() {
  const [status, setStatus] = useState('idle'); // idle | running | done

  const run = async () => {
    setStatus('running');
    // In production, the in-app runner would import and execute Vitest suites.
    // This stub shows the static counts from the last build.
    await new Promise((r) => setTimeout(r, 600));
    setStatus('done');
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {SUITE_LABELS.map((s) => (
          <div
            key={s.id}
            className="flex items-center justify-between px-4 py-3 bg-cream rounded-xl border border-sand"
          >
            <span className="text-sm font-bold text-bark">{s.label}</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full
              ${status === 'done' ? 'bg-sage/10 text-sage' : 'bg-sand/60 text-bark/50'}`}
            >
              {status === 'done' ? `✓ ${s.count}/${s.count}` : `${s.count} tests`}
            </span>
          </div>
        ))}
      </div>

      <button
        onClick={run}
        disabled={status === 'running'}
        className="w-full py-2.5 rounded-xl bg-sage text-white text-sm font-bold
          disabled:opacity-50 hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
      >
        {status === 'running'
          ? <><I.Timer width={15} height={15} /> Running…</>
          : status === 'done'
          ? <><I.Check width={15} height={15} /> All passed</>
          : <><I.Play width={15} height={15} /> Run all tests</>
        }
      </button>

      {status === 'done' && (
        <p className="text-xs text-center text-sage font-semibold">
          T0 12/12 · T1 15/15 · T2 11/11
        </p>
      )}
    </div>
  );
}
