/**
 * Review — Weekly Stats section
 * Heatmap, metrics, streak, Eisenhower distribution, insights.
 */
import React, { useState, useMemo } from 'react';
import { useAppDataContext } from '../hooks/useAppData.js';
import { useWide } from '../hooks/useResponsive.js';
import { I } from '../components/icons.jsx';
import { QUADS } from '../lib/utils.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function isoToday() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(dateStr, n) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

// Monday-anchored week start for today offset by `weekOffset` weeks.
function getWeekMonday(weekOffset) {
  const today = new Date();
  const day = today.getDay();
  const offsetToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setDate(today.getDate() + offsetToMonday + weekOffset * 7);
  return monday.toISOString().slice(0, 10);
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function buildWeekData(dHist, weekMondayStr) {
  return DAY_LABELS.map((label, i) => {
    const dateStr = addDays(weekMondayStr, i);
    const entry = (dHist || []).find((e) => e.date === dateStr);
    return { date: dateStr, p: entry?.p || 0, t: entry?.t || 0, m: entry?.m || 0, label };
  });
}

function formatWeekRange(mondayStr) {
  const sunday = addDays(mondayStr, 6);
  const fmt = (s) => {
    const d = new Date(s);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  const year = new Date(sunday).getFullYear();
  return `${fmt(mondayStr)} – ${fmt(sunday)}, ${year}`;
}

function streakFromHistory(dHist) {
  if (!dHist || dHist.length === 0) return { current: 0, longest: 0 };
  const sorted = [...dHist].sort((a, b) => b.date.localeCompare(a.date));
  const today = isoToday();
  let current = 0;
  let longest = 0;
  let streak = 0;
  let prev = null;

  for (const day of sorted) {
    if (!day.p) continue;
    if (prev === null) {
      streak = (day.date === today || day.date === addDays(today, -1)) ? 1 : 0;
      current = streak;
    } else {
      streak = addDays(day.date, 1) === prev ? streak + 1 : 1;
    }
    prev = day.date;
    if (streak > longest) longest = streak;
  }
  return { current, longest };
}

function pomColor(p) {
  if (p === 0) return 'bg-sand/50';
  if (p === 1) return 'bg-sage/30';
  if (p === 2) return 'bg-sage/50';
  if (p === 3) return 'bg-sage/70';
  if (p === 4) return 'bg-sage/90';
  return 'bg-sage';
}

// ── Review ────────────────────────────────────────────────────────────────────

export function Review() {
  const { met, dHist, todos, poms } = useAppDataContext();
  const isWide = useWide();
  const [weekOffset, setWeekOffset] = useState(0);

  const isCurrentWeek = weekOffset === 0;
  const weekMonday = useMemo(() => getWeekMonday(weekOffset), [weekOffset]);
  const weekLabel = useMemo(() => formatWeekRange(weekMonday), [weekMonday]);

  const weekCells = useMemo(() => buildWeekData(dHist, weekMonday), [dHist, weekMonday]);

  // For the current week, blend dHist with live met.w so in-progress data shows.
  // For past weeks, derive purely from dHist.
  const weekPoms  = isCurrentWeek ? (met?.w?.p || 0) : weekCells.reduce((s, c) => s + c.p, 0);
  const weekTasks = isCurrentWeek ? (met?.w?.t || 0) : weekCells.reduce((s, c) => s + c.t, 0);
  const weekMins  = isCurrentWeek ? (met?.w?.m || 0) : weekCells.reduce((s, c) => s + c.m, 0);

  const { current: currentStreak, longest: longestStreak } = useMemo(
    () => streakFromHistory(dHist),
    [dHist]
  );

  // Eisenhower distribution (always reflects current task list)
  const quadDist = useMemo(() => {
    const total = todos.length || 1;
    return Object.keys(QUADS).map((q) => ({
      key: q,
      label: QUADS[q].label,
      count: todos.filter((t) => t.quad === q).length,
      pct: Math.round((todos.filter((t) => t.quad === q).length / total) * 100),
      badge: QUADS[q].badge,
    }));
  }, [todos]);

  const insights = useMemo(() => {
    if (!isCurrentWeek) return [];
    const msgs = [];
    if (currentStreak >= 7) msgs.push('🔥 You\'re on a 7+ day streak — keep it up!');
    else if (currentStreak === 0) msgs.push('Start a pomodoro today to begin your streak.');
    const uiCount = todos.filter((t) => t.quad === 'ui' && !t.done).length;
    if (uiCount > 5) msgs.push(`⚡ You have ${uiCount} urgent+important tasks — consider tackling them first.`);
    const doneRatio = todos.length > 0 ? todos.filter((t) => t.done).length / todos.length : 0;
    if (doneRatio >= 0.5) msgs.push('✅ Over half your tasks are done — great progress this week!');
    if (met.w.p >= 10) msgs.push(`🎯 ${met.w.p} pomodoros this week — you're in the zone.`);
    if (msgs.length === 0) msgs.push('Complete tasks and pomodoros to see personalised insights here.');
    return msgs;
  }, [isCurrentWeek, currentStreak, todos, met]);

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="sticky top-0 z-10 flex items-center px-4 py-3 bg-cream border-b border-sand/70">
        <h2 className="text-base font-bold text-bark">Review</h2>
      </div>

      <div className={`p-4 ${isWide ? 'grid grid-cols-2 gap-6 items-start' : 'space-y-6'}`}>
        {/* Left column / top */}
        <div className="space-y-6">
          {/* Week navigator + metrics */}
          <section aria-label="Weekly metrics">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-bark/50 uppercase tracking-wide">
                {isCurrentWeek ? 'This Week' : weekLabel}
              </h3>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setWeekOffset((o) => o - 1)}
                  className="p-1 rounded hover:bg-sand/60 text-bark/50 hover:text-bark transition-colors"
                  aria-label="Previous week"
                >
                  <I.ChevronLeft width={16} height={16} />
                </button>
                {!isCurrentWeek && (
                  <button
                    onClick={() => setWeekOffset(0)}
                    className="text-[10px] font-bold text-ocean hover:underline px-1"
                  >
                    Today
                  </button>
                )}
                <button
                  onClick={() => setWeekOffset((o) => o + 1)}
                  disabled={isCurrentWeek}
                  className="p-1 rounded hover:bg-sand/60 text-bark/50 hover:text-bark transition-colors disabled:opacity-30 disabled:pointer-events-none"
                  aria-label="Next week"
                >
                  <I.ChevronRight width={16} height={16} />
                </button>
              </div>
            </div>
            {!isCurrentWeek && (
              <p className="text-[11px] text-bark/40 font-semibold mb-2">{weekLabel}</p>
            )}
            <div className="grid grid-cols-3 gap-3">
              <MetricCard label="Pomodoros" value={weekPoms} icon={<I.Timer width={18} height={18} />} color="terracotta" />
              <MetricCard label="Tasks done" value={weekTasks} icon={<I.Check width={18} height={18} />} color="sage" />
              <MetricCard label="Focus min" value={weekMins} icon={<I.Clock width={18} height={18} />} color="ocean" />
            </div>
          </section>

          {/* Streak — always shows overall streak */}
          <section aria-label="Streak">
            <h3 className="text-xs font-bold text-bark/50 uppercase tracking-wide mb-3">Streak</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="card p-4 text-center">
                <p className="text-3xl font-bold text-sage">{currentStreak}</p>
                <p className="text-xs font-semibold text-bark/50 mt-1">Current streak</p>
              </div>
              <div className="card p-4 text-center">
                <p className="text-3xl font-bold text-ocean">{longestStreak}</p>
                <p className="text-xs font-semibold text-bark/50 mt-1">Longest streak</p>
              </div>
            </div>
          </section>

          {/* Heatmap — follows selected week */}
          <section aria-label="Activity heatmap">
            <h3 className="text-xs font-bold text-bark/50 uppercase tracking-wide mb-3">
              Activity
            </h3>
            <div className="card p-4" data-testid="heatmap">
              <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
                {weekCells.map((cell) => (
                  <div key={cell.date} className="flex flex-col items-center gap-1">
                    <div
                      title={`${cell.date}: ${cell.p} pomodoros`}
                      className={`w-full aspect-square rounded-sm ${pomColor(cell.p)}`}
                      aria-label={`${cell.date}: ${cell.p} pomodoros`}
                    />
                    <span className="text-[10px] font-semibold text-bark/40">{cell.label}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-1.5 mt-3 justify-end">
                <span className="text-xs text-bark/40 font-semibold">Less</span>
                {[0, 1, 2, 3, 4, 5].map((p) => (
                  <div key={p} className={`w-3 h-3 rounded-sm ${pomColor(p)}`} />
                ))}
                <span className="text-xs text-bark/40 font-semibold">More</span>
              </div>
            </div>
          </section>
        </div>

        {/* Right column / bottom */}
        <div className="space-y-6">
          {/* Eisenhower distribution */}
          <section aria-label="Eisenhower distribution">
            <h3 className="text-xs font-bold text-bark/50 uppercase tracking-wide mb-3">
              Task Distribution
            </h3>
            <div className="card p-4 space-y-3">
              {quadDist.map(({ key, label, count, pct, badge }) => (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-bark">{label}</span>
                    <span className="text-xs font-semibold text-bark/50">{count} tasks ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-sand/40 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${badge.split(' ')[0]}`}
                      style={{ width: `${pct}%`, transition: 'width 0.5s ease' }}
                    />
                  </div>
                </div>
              ))}
              {todos.length === 0 && (
                <p className="text-sm text-bark/40 font-semibold text-center py-2">
                  Add tasks in Clarify to see distribution
                </p>
              )}
            </div>
          </section>

          {/* Insights — current week only */}
          {isCurrentWeek && (
            <section aria-label="Insights">
              <h3 className="text-xs font-bold text-bark/50 uppercase tracking-wide mb-3">Insights</h3>
              <div className="card p-4 space-y-3">
                {insights.map((msg, i) => (
                  <p key={i} className="text-sm font-semibold text-bark leading-relaxed">
                    {msg}
                  </p>
                ))}
              </div>
            </section>
          )}

          {/* All-time total */}
          <section aria-label="All-time stats">
            <h3 className="text-xs font-bold text-bark/50 uppercase tracking-wide mb-3">All Time</h3>
            <div className="card p-4 flex items-center gap-4">
              <I.Timer width={24} height={24} className="text-terracotta flex-shrink-0" />
              <div>
                <p className="text-2xl font-bold text-bark">{poms}</p>
                <p className="text-xs font-semibold text-bark/50">Total pomodoros completed</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

// ── MetricCard ────────────────────────────────────────────────────────────────

function MetricCard({ label, value, icon, color }) {
  return (
    <div className="card p-4 flex flex-col items-center gap-1">
      <span className={`text-${color}`}>{icon}</span>
      <p className="text-2xl font-bold text-bark">{value}</p>
      <p className="text-xs font-semibold text-bark/50 text-center">{label}</p>
    </div>
  );
}
