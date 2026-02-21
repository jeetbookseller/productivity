/**
 * Phase 6 — Design Cleanup tests (6 tests: T6-1 through T6-6)
 * Asserts: no glass/gcard classes, .card class present on card elements,
 *          no backdrop-filter in card className strings.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import { AppDataContext } from './hooks/useAppData.js';

import { Capture  } from './sections/Capture.jsx';
import { Confirm  } from './sections/Confirm.jsx';
import { Review   } from './sections/Review.jsx';
import { Settings } from './sections/Settings.jsx';

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  localStorage.clear();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  if (!window.matchMedia) {
    window.matchMedia = (q) => ({
      matches: false,
      media: q,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
  }
});

// ── Context mock factory ──────────────────────────────────────────────────────

function mkCtx(overrides = {}) {
  return {
    todos: [], notes: [], lists: [], focus: [],
    theme: 'system', preset: 'classic',
    customT: { work: 25, short: 5, long: 15 },
    poms: 0,
    met: { d: { p: 0, t: 0, m: 0, date: '' }, w: { p: 0, t: 0, m: 0 } },
    dHist: [], fHist: [], tab: 'capture', seenAbout: false,
    setCustomT: vi.fn(), setTab: vi.fn(), setSeenAbout: vi.fn(),
    setDHist: vi.fn(), setFHist: vi.fn(),
    setTheme: vi.fn(), setPreset: vi.fn(),
    addNote: vi.fn(), editNote: vi.fn(), deleteNote: vi.fn(),
    strikeNote: vi.fn(), promoteNote: vi.fn(),
    bulkDeleteNotes: vi.fn(), bulkStrikeNotes: vi.fn(), clearStruckNotes: vi.fn(),
    addTodo: vi.fn(), editTodo: vi.fn(), deleteTodo: vi.fn(),
    toggleTodo: vi.fn(), moveTodo: vi.fn(), reorderTodo: vi.fn(),
    addSubtask: vi.fn(), editSubtask: vi.fn(), deleteSubtask: vi.fn(), toggleSubtask: vi.fn(),
    linkChecklist: vi.fn(), bulkDeleteTodos: vi.fn(), bulkMoveTodos: vi.fn(),
    addToFocus: vi.fn(), removeFromFocus: vi.fn(), reorderFocus: vi.fn(),
    addList: vi.fn(), editList: vi.fn(), deleteList: vi.fn(),
    addItem: vi.fn(), editItem: vi.fn(), deleteItem: vi.fn(),
    toggleItem: vi.fn(), bulkDeleteItems: vi.fn(),
    recordPom: vi.fn(), recordTaskDone: vi.fn(),
    ...overrides,
  };
}

function wrap(ui, ctx = mkCtx()) {
  return render(
    <AppDataContext.Provider value={ctx}>
      {ui}
    </AppDataContext.Provider>
  );
}

// ── Phase 6: Design Cleanup ───────────────────────────────────────────────────

const NOTE1 = { id: 'n1', text: 'Test note', crAt: new Date().toISOString(), struck: false, struckAt: null };
const LIST1 = {
  id: 'l1', name: 'My Checklist',
  items: [{ id: 'i1', text: 'Step 1', done: false, section: '' }],
};
const MET = { d: { p: 3, t: 2, m: 75, date: '2026-02-21' }, w: { p: 12, t: 8, m: 300 } };
const DHIST = [{ date: '2026-02-21', p: 3, t: 2, m: 75 }];

describe('Phase 6: Design Cleanup', () => {
  it('T6-1: no .glass class in any section render', () => {
    const { container: c1 } = wrap(<Capture />, mkCtx({ notes: [NOTE1] }));
    expect(c1.querySelectorAll('.glass')).toHaveLength(0);

    const { container: c2 } = wrap(<Settings />, mkCtx());
    expect(c2.querySelectorAll('.glass')).toHaveLength(0);

    const { container: c3 } = wrap(<Confirm />, mkCtx({ lists: [LIST1] }));
    expect(c3.querySelectorAll('.glass')).toHaveLength(0);

    const { container: c4 } = wrap(<Review />, mkCtx({ met: MET, dHist: DHIST }));
    expect(c4.querySelectorAll('.glass')).toHaveLength(0);
  });

  it('T6-2: no .gcard class in any section render', () => {
    const { container: c1 } = wrap(<Capture />, mkCtx({ notes: [NOTE1] }));
    expect(c1.querySelectorAll('.gcard')).toHaveLength(0);

    const { container: c2 } = wrap(<Settings />, mkCtx());
    expect(c2.querySelectorAll('.gcard')).toHaveLength(0);

    const { container: c3 } = wrap(<Confirm />, mkCtx({ lists: [LIST1] }));
    expect(c3.querySelectorAll('.gcard')).toHaveLength(0);

    const { container: c4 } = wrap(<Review />, mkCtx({ met: MET, dHist: DHIST }));
    expect(c4.querySelectorAll('.gcard')).toHaveLength(0);
  });

  it('T6-3: Settings section renders card elements with .card class', () => {
    const { container } = wrap(<Settings />, mkCtx());
    expect(container.querySelectorAll('.card').length).toBeGreaterThan(0);
  });

  it('T6-4: Confirm section renders checklist card with .card class', () => {
    const { container } = wrap(<Confirm />, mkCtx({ lists: [LIST1] }));
    expect(container.querySelectorAll('.card').length).toBeGreaterThan(0);
  });

  it('T6-5: Review section renders metric/streak/heatmap cards with .card class', () => {
    const { container } = wrap(<Review />, mkCtx({ met: MET, dHist: DHIST }));
    expect(container.querySelectorAll('.card').length).toBeGreaterThan(0);
  });

  it('T6-6: .card elements do not include backdrop-filter in their className', () => {
    const { container } = wrap(<Settings />, mkCtx());
    const cards = container.querySelectorAll('.card');
    cards.forEach((card) => {
      expect(card.className).not.toMatch(/backdrop-filter/);
      expect(card.className).not.toMatch(/backdrop-blur/);
    });
  });
});
