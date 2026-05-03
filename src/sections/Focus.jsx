/**
 * Focus — Pomodoro Timer section
 * Modes: Work / Short Break / Long Break. Focus queue. Persists via IndexedDB.
 */
import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { useAppDataContext } from '../hooks/useAppData.js';
import { useDesk } from '../hooks/useResponsive.js';
import { I } from '../components/icons.jsx';
import { PRESETS } from '../lib/utils.js';

const MODES = {
  work:  { label: 'Work',        key: 'work' },
  short: { label: 'Short Break', key: 'short' },
  long:  { label: 'Long Break',  key: 'long' },
};

export function Focus() {
  const {
    todos, focus, preset, customT,
    addToFocus, removeFromFocus, reorderFocus,
    recordPom, recordTaskDone,
    timerState, setTimerState,
  } = useAppDataContext();
  const isDesk = useDesk();

  // Live display countdown (derived from timerState)
  const [display, setDisplay] = useState(timerState.left);
  const tickRef = useRef(null);
  const chimeRef = useRef(false);

  // ── Timer helpers ─────────────────────────────────────────────────────────

  const getDuration = useCallback((mode) => {
    const times = preset === 'custom'
      ? customT
      : (PRESETS[preset] || PRESETS.classic);
    return (times[mode] || 25) * 60;
  }, [preset, customT]);

  const computeLeft = useCallback((ts) => {
    if (!ts.run || !ts.endAt) return ts.left;
    return Math.max(0, Math.round((ts.endAt - Date.now()) / 1000));
  }, []);

  // Tick loop
  useEffect(() => {
    const tick = () => {
      setTimerState((prev) => {
        if (!prev.run) return prev;
        const left = computeLeft(prev);
        setDisplay(left);
        if (left === 0 && !chimeRef.current) {
          chimeRef.current = true;
          playChime();
          if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
          recordPom(getDuration(prev.mode) / 60);
        }
        if (left === 0) {
          const pomCycle = prev.mode === 'work'
            ? ((prev.pomCycle ?? 0) + 1) % 4
            : (prev.pomCycle ?? 0);
          return { ...prev, left: 0, run: false, endAt: null, completed: true, pomCycle };
        }
        return { ...prev, left };
      });
    };

    tickRef.current = setInterval(tick, 500);
    tick(); // immediate first tick
    return () => clearInterval(tickRef.current);
  }, [computeLeft, getDuration, recordPom, setTimerState]);

  // Sync display when timer state changes from outside (e.g. tab switch restore)
  useEffect(() => {
    setDisplay(computeLeft(timerState));
  }, [timerState.run, timerState.endAt]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Controls ──────────────────────────────────────────────────────────────

  const start = () => {
    chimeRef.current = false;
    const now = Date.now();
    const left = timerState.left > 0 ? timerState.left : getDuration(timerState.mode);
    setTimerState((prev) => ({
      ...prev,
      run: true,
      left,
      endAt: now + left * 1000,
      startAt: now,
      completed: false,
    }));
  };

  const stop = () => {
    chimeRef.current = false;
    const left = getDuration(timerState.mode);
    setTimerState((prev) => ({ ...prev, run: false, left, endAt: null, startAt: null, elapsed: 0, completed: false }));
    setDisplay(left);
  };

  const switchMode = (mode) => {
    chimeRef.current = false;
    const left = getDuration(mode);
    setTimerState((prev) => ({ ...prev, mode, left, run: false, endAt: null, startAt: null, elapsed: 0, completed: false }));
    setDisplay(left);
  };

  // Derive next phase after timer completion
  const nextMode = timerState.completed
    ? (timerState.mode === 'work'
        ? (timerState.pomCycle === 0 ? 'long' : 'short')
        : 'work')
    : null;
  const nextModeLabel = nextMode === 'short' ? 'Start Short Break'
    : nextMode === 'long' ? 'Start Long Break'
    : 'Start Focus';

  const startNext = () => {
    if (!nextMode) return;
    chimeRef.current = false;
    const left = getDuration(nextMode);
    const now = Date.now();
    setTimerState((prev) => ({
      ...prev,
      mode: nextMode,
      left,
      run: true,
      endAt: now + left * 1000,
      startAt: now,
      elapsed: 0,
      completed: false,
    }));
    setDisplay(left);
  };

  // ── Screen Wake Lock ──────────────────────────────────────────────────────

  const wakeLockRef = useRef(null);
  const [wakeLock, setWakeLock] = useState(false);

  const toggleWakeLock = async () => {
    if (wakeLock && wakeLockRef.current) {
      await wakeLockRef.current.release();
      wakeLockRef.current = null;
      setWakeLock(false);
    } else if ('wakeLock' in navigator) {
      try {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
        setWakeLock(true);
        wakeLockRef.current.addEventListener('release', () => setWakeLock(false));
      } catch { /* denied */ }
    }
  };

  // ── Focus queue helpers ───────────────────────────────────────────────────

  const queueTodos = focus.map((id) => todos.find((t) => t.id === id)).filter(Boolean);
  const availableTodos = todos.filter((t) => !t.done && !focus.includes(t.id));

  // ── Overtime counter (counts up after completion, display-only) ──────────

  const [overTime, setOverTime] = useState(0);
  const overRef = useRef(null);

  useEffect(() => {
    if (timerState.completed) {
      setOverTime(0);
      overRef.current = setInterval(() => setOverTime((s) => s + 1), 1000);
    } else {
      clearInterval(overRef.current);
      setOverTime(0);
    }
    return () => clearInterval(overRef.current);
  }, [timerState.completed]);

  // ── Format time ───────────────────────────────────────────────────────────

  const fmt = (secs) => {
    const m = Math.floor(Math.abs(secs) / 60).toString().padStart(2, '0');
    const s = (Math.abs(secs) % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const totalSecs = getDuration(timerState.mode);
  const progress = totalSecs > 0 ? Math.max(0, 1 - display / totalSecs) : 0;

  return (
    <div className={`flex flex-col h-full ${isDesk ? 'md:flex-row' : ''}`}>
      {/* Timer panel */}
      <div className={`flex flex-col items-center justify-center p-8 gap-6 ${isDesk ? 'md:flex-1' : ''}`}>
        {/* Mode buttons */}
        <div className="flex gap-2 bg-surface/70 rounded-2xl p-1 border border-sand">
          {Object.values(MODES).map((m) => (
            <button
              key={m.key}
              onClick={() => switchMode(m.key)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all
                ${timerState.mode === m.key
                  ? 'bg-sage text-white shadow-sm'
                  : 'text-bark/60 hover:text-bark'
                }`}
              aria-label={m.label}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Circular timer display */}
        <FocusTimer
          display={display}
          fmt={fmt}
          progress={progress}
          running={timerState.run}
          mode={timerState.mode}
          overTime={timerState.completed ? overTime : 0}
        />

        {/* Controls */}
        <div className="flex items-center gap-4">
          {/* Left spacer matches wake lock button size */}
          <div className="w-[46px]" />

          {timerState.completed ? (
            <button
              onClick={startNext}
              className="px-5 h-16 rounded-full bg-sage text-white shadow-lg flex items-center justify-center
                gap-2 hover:opacity-90 transition-opacity text-sm font-bold"
              aria-label={nextModeLabel}
            >
              <I.Play width={20} height={20} />
              {nextModeLabel}
            </button>
          ) : timerState.run ? (
            <button
              onClick={stop}
              className="w-16 h-16 rounded-full bg-terracotta text-white shadow-lg flex items-center justify-center
                hover:opacity-90 transition-opacity"
              aria-label="Stop timer"
            >
              <I.Stop width={24} height={24} />
            </button>
          ) : (
            <button
              onClick={start}
              className="w-16 h-16 rounded-full bg-sage text-white shadow-lg flex items-center justify-center
                hover:opacity-90 transition-opacity"
              aria-label="Start"
            >
              <I.Play width={24} height={24} />
            </button>
          )}

          <button
            onClick={toggleWakeLock}
            className={`p-3 rounded-full border transition-colors
              ${wakeLock
                ? 'bg-sage/10 border-sage/30 text-sage'
                : 'bg-surface border-sand text-bark/40 hover:text-bark'
              }`}
            aria-label={wakeLock ? 'Disable wake lock' : 'Enable wake lock'}
            title="Screen Wake Lock"
          >
            <I.Eye width={20} height={20} />
          </button>
        </div>

        {/* Progress bar */}
        <div className="w-full max-w-xs h-2 bg-sand/60 rounded-full overflow-hidden">
          <div
            className="h-full bg-sage rounded-full transition-all duration-500"
            style={{ width: `${progress * 100}%` }}
          />
        </div>

        {/* Preset selector */}
        <div className="flex gap-2 flex-wrap justify-center">
          {Object.entries(PRESETS).map(([key, val]) => val && (
            <PresetChip key={key} presetKey={key} label={val.label} />
          ))}
        </div>
      </div>

      {/* Focus Queue */}
      <div className={`flex flex-col border-sand ${isDesk ? 'md:flex-1 md:border-l' : 'border-t'}`}>
        <div className="px-4 py-3 border-b border-sand/70 flex items-center justify-between">
          <h3 className="text-sm font-bold text-bark flex items-center gap-2">
            <I.Zap width={15} height={15} className="text-ocean" />
            Focus Queue
            <span className="text-xs text-bark/40 font-semibold">({queueTodos.length}/5)</span>
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto">
          {queueTodos.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
              <I.Zap width={40} height={40} className="text-bark/15" />
              <p className="text-sm text-bark/40 font-semibold">
                Add tasks from Clarify to focus on them here
              </p>
            </div>
          ) : (
            <ul className="p-3 space-y-2">
              {queueTodos.map((todo) => (
                <li
                  key={todo.id}
                  className="flex items-center gap-2 p-3 bg-surface rounded-xl border border-sand text-sm font-semibold text-bark"
                >
                  <I.Zap width={13} height={13} className="text-ocean flex-shrink-0" />
                  <span className="flex-1 truncate">{todo.text}</span>
                  <button
                    onClick={() => removeFromFocus(todo.id)}
                    className="text-bark/30 hover:text-terracotta transition-colors flex-shrink-0"
                    aria-label="Remove from focus"
                  >
                    <I.X width={14} height={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* Available tasks to add */}
          {availableTodos.length > 0 && queueTodos.length < 5 && (
            <div className="px-3 pb-3">
              <p className="text-xs font-bold text-bark/40 px-1 mb-2">Add from Clarify</p>
              {availableTodos.slice(0, 8).map((todo) => (
                <button
                  key={todo.id}
                  onClick={() => addToFocus(todo.id)}
                  className="w-full flex items-center gap-2 p-2.5 text-left text-sm font-semibold text-bark/70
                    hover:bg-cream rounded-xl transition-colors"
                  aria-label={`Add ${todo.text} to focus`}
                >
                  <I.Plus width={13} height={13} className="text-bark/30 flex-shrink-0" />
                  <span className="truncate">{todo.text}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── FocusTimer ────────────────────────────────────────────────────────────────

const FocusTimer = memo(function FocusTimer({ display, fmt, progress, running, mode, overTime }) {
  const size = 200;
  const r = 85;
  const circ = 2 * Math.PI * r;
  const dash = circ * (1 - progress);

  const modeColor = { work: '#dc2626', short: '#4f46e5', long: '#2563eb' }[mode] || '#4f46e5';

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e2ec" strokeWidth="8" />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke={modeColor}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={dash}
          style={{ transition: 'stroke-dashoffset 0.5s linear' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span
          className="text-4xl font-bold text-bark tabular-nums"
          data-testid="timer-display"
        >
          {fmt(display)}
        </span>
        {running && (
          <span className="text-xs font-semibold text-bark/40 mt-1">running</span>
        )}
        {overTime > 0 && (
          <span className="text-xs font-semibold text-terracotta/70 mt-1 tabular-nums">
            +{fmt(overTime)}
          </span>
        )}
      </div>
    </div>
  );
});

// ── PresetChip ────────────────────────────────────────────────────────────────

function PresetChip({ presetKey, label }) {
  const { preset, setPreset, customT, setCustomT } = useAppDataContext();
  const active = preset === presetKey;

  return (
    <button
      onClick={() => setPreset(presetKey)}
      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border
        ${active
          ? 'bg-bark text-cream border-bark'
          : 'bg-surface text-bark/60 border-sand hover:border-bark/30'
        }`}
      aria-label={`${label} preset`}
    >
      {label}
    </button>
  );
}

// ── Web Audio chime ───────────────────────────────────────────────────────────

function playChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [[440, 0], [554, 0.3], [440, 0.6]].forEach(([freq, when]) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.3, ctx.currentTime + when);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + when + 0.8);
      osc.start(ctx.currentTime + when);
      osc.stop(ctx.currentTime + when + 0.9);
    });
  } catch { /* audio not available */ }
}
