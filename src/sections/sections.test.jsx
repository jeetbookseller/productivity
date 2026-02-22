/**
 * Phase 4 — Section tests
 * Covers: Capture (4a), Clarify (4b), Focus (4c), Confirm (4d), Review (4e), Settings (4f)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import { AppDataContext } from '../hooks/useAppData.js';

import { Capture  } from './Capture.jsx';
import { Clarify  } from './Clarify.jsx';
import { Focus    } from './Focus.jsx';
import { Confirm  } from './Confirm.jsx';
import { Review   } from './Review.jsx';
import { Settings } from './Settings.jsx';

// ── Mock window.matchMedia (jsdom doesn't have it) ────────────────────────────
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
    // State
    todos: [], notes: [], lists: [], focus: [],
    theme: 'system', preset: 'classic',
    customT: { work: 25, short: 5, long: 15 },
    poms: 0,
    met: { d: { p: 0, t: 0, m: 0, date: '' }, w: { p: 0, t: 0, m: 0 } },
    dHist: [], fHist: [], tab: 'capture', seenAbout: false,
    // Setters
    setCustomT: vi.fn(), setTab: vi.fn(), setSeenAbout: vi.fn(),
    setDHist: vi.fn(), setFHist: vi.fn(),
    setTheme: vi.fn(), setPreset: vi.fn(),
    // Notes
    addNote: vi.fn(), editNote: vi.fn(), deleteNote: vi.fn(),
    strikeNote: vi.fn(), promoteNote: vi.fn(),
    bulkDeleteNotes: vi.fn(), bulkStrikeNotes: vi.fn(), clearStruckNotes: vi.fn(),
    // Todos
    addTodo: vi.fn(), editTodo: vi.fn(), deleteTodo: vi.fn(),
    toggleTodo: vi.fn(), moveTodo: vi.fn(), reorderTodo: vi.fn(),
    addSubtask: vi.fn(), editSubtask: vi.fn(), deleteSubtask: vi.fn(), toggleSubtask: vi.fn(),
    linkChecklist: vi.fn(), bulkDeleteTodos: vi.fn(), bulkMoveTodos: vi.fn(),
    // Focus queue
    addToFocus: vi.fn(), removeFromFocus: vi.fn(), reorderFocus: vi.fn(),
    // Lists
    addList: vi.fn(), editList: vi.fn(), deleteList: vi.fn(),
    addItem: vi.fn(), editItem: vi.fn(), deleteItem: vi.fn(),
    toggleItem: vi.fn(), bulkDeleteItems: vi.fn(),
    // Metrics
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

// ── 4a: Capture ───────────────────────────────────────────────────────────────

describe('Capture', () => {
  const NOTE1 = { id: 'n1', text: 'Hello world', crAt: new Date().toISOString(), struck: false, struckAt: null };
  const NOTE2 = { id: 'n2', text: 'Struck note', crAt: new Date().toISOString(), struck: true, struckAt: new Date().toISOString() };

  it('4a-1: renders notes from context', () => {
    wrap(<Capture />, mkCtx({ notes: [NOTE1, NOTE2] }));
    expect(screen.getByText('Hello world')).toBeTruthy();
    expect(screen.getByText('Struck note')).toBeTruthy();
  });

  it('4a-2: QuickAdd calls addNote on Enter', () => {
    const addNote = vi.fn();
    wrap(<Capture />, mkCtx({ addNote }));
    const input = screen.getByPlaceholderText('Brain-dump anything…');
    fireEvent.change(input, { target: { value: 'New idea' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(addNote).toHaveBeenCalledWith('New idea');
  });

  it('4a-3: clearStruckNotes is called on mount', () => {
    const clearStruckNotes = vi.fn();
    wrap(<Capture />, mkCtx({ clearStruckNotes }));
    expect(clearStruckNotes).toHaveBeenCalledTimes(1);
  });

  it('4a-4: 3-dot menu opens with expected options', () => {
    wrap(<Capture />, mkCtx({ notes: [NOTE1] }));
    fireEvent.click(screen.getByLabelText('Note options'));
    expect(screen.getByText('Promote to Clarify')).toBeTruthy();
    expect(screen.getByText('Strikethrough')).toBeTruthy();
    expect(screen.getByText('Delete')).toBeTruthy();
  });

  it('4a-5: strikeNote called from menu', () => {
    const strikeNote = vi.fn();
    wrap(<Capture />, mkCtx({ notes: [NOTE1], strikeNote }));
    fireEvent.click(screen.getByLabelText('Note options'));
    fireEvent.click(screen.getByText('Strikethrough'));
    expect(strikeNote).toHaveBeenCalledWith('n1');
  });

  it('4a-6: promoteNote called from menu', () => {
    const promoteNote = vi.fn();
    wrap(<Capture />, mkCtx({ notes: [NOTE1], promoteNote }));
    fireEvent.click(screen.getByLabelText('Note options'));
    fireEvent.click(screen.getByText('Promote to Clarify'));
    expect(promoteNote).toHaveBeenCalledWith('n1');
  });

  it('4a-7: bulk mode entered via header checkbox hides 3-dot buttons', () => {
    wrap(<Capture />, mkCtx({ notes: [NOTE1] }));
    fireEvent.click(screen.getByLabelText('Enter bulk select'));
    expect(screen.queryByLabelText('Note options')).toBeNull();
  });

  it('4a-8: struck note has line-through class', () => {
    wrap(<Capture />, mkCtx({ notes: [NOTE2] }));
    const text = screen.getByText('Struck note');
    expect(text.className).toMatch(/line-through/);
  });

  it('4a-9: bulk mode shows checkboxes on individual items', () => {
    wrap(<Capture />, mkCtx({ notes: [NOTE1, NOTE2] }));
    fireEvent.click(screen.getByLabelText('Enter bulk select'));
    // 3-dot should be hidden, checkboxes shown
    expect(screen.queryByLabelText('Note options')).toBeNull();
    expect(screen.getAllByLabelText('Select').length).toBeGreaterThanOrEqual(1);
  });

  it('4a-10: clicking item checkbox in bulk mode toggles selection', () => {
    wrap(<Capture />, mkCtx({ notes: [NOTE1] }));
    fireEvent.click(screen.getByLabelText('Enter bulk select'));
    const checkbox = screen.getByLabelText('Select');
    fireEvent.click(checkbox);
    expect(screen.getByLabelText('Deselect')).toBeTruthy();
  });

  it('4a-11: bulk delete action calls bulkDeleteNotes', () => {
    const bulkDeleteNotes = vi.fn();
    wrap(<Capture />, mkCtx({ notes: [NOTE1], bulkDeleteNotes }));
    // Enter bulk mode
    fireEvent.click(screen.getByLabelText('Enter bulk select'));
    // Select the note
    fireEvent.click(screen.getByLabelText('Select'));
    // Click delete button in BulkActionBar
    fireEvent.click(screen.getByText('Delete'));
    // Confirm the deletion
    const confirmBtn = screen.getByText('Delete', { selector: 'button.bg-terracotta' });
    fireEvent.click(confirmBtn);
    expect(bulkDeleteNotes).toHaveBeenCalled();
  });
});

// ── 4b: Clarify ───────────────────────────────────────────────────────────────

describe('Clarify', () => {
  const TODO1 = {
    id: 't1', text: 'Urgent task', quad: 'ui', cat: 'work',
    deadline: '', subtasks: [], poms: 0, done: false, linkedList: null,
  };
  const TODO2 = {
    id: 't2', text: 'Schedule me', quad: 'ni', cat: null,
    deadline: '', subtasks: [], poms: 0, done: false, linkedList: null,
  };

  it('4b-1: renders tasks grouped by quadrant', () => {
    wrap(<Clarify />, mkCtx({ todos: [TODO1, TODO2] }));
    expect(screen.getByText('Urgent task')).toBeTruthy();
    expect(screen.getByText('Schedule me')).toBeTruthy();
  });

  it('4b-2: all 4 quadrant headers rendered', () => {
    wrap(<Clarify />, mkCtx());
    expect(screen.getByText('Do First')).toBeTruthy();
    expect(screen.getByText('Schedule')).toBeTruthy();
    expect(screen.getByText('Delegate')).toBeTruthy();
    expect(screen.getByText('Eliminate')).toBeTruthy();
  });

  it('4b-3: clicking task calls toggleTodo', () => {
    const toggleTodo = vi.fn();
    wrap(<Clarify />, mkCtx({ todos: [TODO1], toggleTodo }));
    fireEvent.click(screen.getByLabelText('Task: Urgent task'));
    expect(toggleTodo).toHaveBeenCalledWith('t1');
  });

  it('4b-4: 3-dot menu opens with task options', () => {
    wrap(<Clarify />, mkCtx({ todos: [TODO1], focus: [] }));
    fireEvent.click(screen.getByLabelText('Task options'));
    expect(screen.getByText('Edit')).toBeTruthy();
    expect(screen.getByText('Delete')).toBeTruthy();
    expect(screen.getByText('Add to Focus')).toBeTruthy();
  });

  it('4b-5: addToFocus called from menu', () => {
    const addToFocus = vi.fn();
    wrap(<Clarify />, mkCtx({ todos: [TODO1], focus: [], addToFocus }));
    fireEvent.click(screen.getByLabelText('Task options'));
    fireEvent.click(screen.getByText('Add to Focus'));
    expect(addToFocus).toHaveBeenCalledWith('t1');
  });

  it('4b-6: deleteTodo called after confirm', () => {
    const deleteTodo = vi.fn();
    wrap(<Clarify />, mkCtx({ todos: [TODO1], deleteTodo }));
    fireEvent.click(screen.getByLabelText('Task options'));
    fireEvent.click(screen.getByText('Delete'));
    // Confirm dialog should appear
    const confirmBtn = screen.getByText('Delete', { selector: 'button.bg-terracotta' });
    fireEvent.click(confirmBtn);
    expect(deleteTodo).toHaveBeenCalledWith('t1');
  });

  it('4b-7: category badge shown for tasks with cat', () => {
    wrap(<Clarify />, mkCtx({ todos: [TODO1] }));
    expect(screen.getByText(/💼/)).toBeTruthy();
  });

  it('4b-8: QuickAdd in each quadrant calls addTodo', () => {
    const addTodo = vi.fn();
    wrap(<Clarify />, mkCtx({ addTodo }));
    const inputs = screen.getAllByPlaceholderText(/Add to/);
    fireEvent.change(inputs[0], { target: { value: 'My new task' } });
    fireEvent.keyDown(inputs[0], { key: 'Enter' });
    expect(addTodo).toHaveBeenCalled();
  });

  it('4b-9: bulk mode entered via header checkbox', () => {
    wrap(<Clarify />, mkCtx({ todos: [TODO1] }));
    fireEvent.click(screen.getByLabelText('Enter bulk select'));
    // Task options should be hidden in bulk mode
    expect(screen.queryByLabelText('Task options')).toBeNull();
  });

  it('4b-10: clicking task in bulk mode toggles selection instead of toggling done', () => {
    const toggleTodo = vi.fn();
    wrap(<Clarify />, mkCtx({ todos: [TODO1], toggleTodo }));
    fireEvent.click(screen.getByLabelText('Enter bulk select'));
    fireEvent.click(screen.getByLabelText('Task: Urgent task'));
    // Should NOT call toggleTodo in bulk mode — it should select instead
    expect(toggleTodo).not.toHaveBeenCalled();
  });
});

// ── 4c: Focus ─────────────────────────────────────────────────────────────────

describe('Focus', () => {
  it('4c-1: renders timer display', () => {
    wrap(<Focus />, mkCtx());
    expect(screen.getByTestId('timer-display')).toBeTruthy();
  });

  it('4c-2: timer display shows 25:00 for classic preset by default', () => {
    wrap(<Focus />, mkCtx());
    const display = screen.getByTestId('timer-display');
    expect(display.textContent).toBe('25:00');
  });

  it('4c-3: Start button has correct aria-label', () => {
    wrap(<Focus />, mkCtx());
    expect(screen.getByLabelText('Start')).toBeTruthy();
  });

  it('4c-4: mode buttons rendered (Work, Short Break, Long Break)', () => {
    wrap(<Focus />, mkCtx());
    expect(screen.getByLabelText('Work')).toBeTruthy();
    expect(screen.getByLabelText('Short Break')).toBeTruthy();
    expect(screen.getByLabelText('Long Break')).toBeTruthy();
  });

  it('4c-5: clicking Short Break mode changes timer display', () => {
    wrap(<Focus />, mkCtx());
    fireEvent.click(screen.getByLabelText('Short Break'));
    const display = screen.getByTestId('timer-display');
    expect(display.textContent).toBe('05:00');
  });

  it('4c-6: focus queue section renders', () => {
    wrap(<Focus />, mkCtx());
    expect(screen.getByText('Focus Queue')).toBeTruthy();
  });

  it('4c-7: focus queue shows queued tasks', () => {
    const todos = [{ id: 't1', text: 'Do this', quad: 'ui', cat: null, deadline: '', subtasks: [], poms: 0, done: false, linkedList: null }];
    wrap(<Focus />, mkCtx({ todos, focus: ['t1'] }));
    expect(screen.getByText('Do this')).toBeTruthy();
  });

  it('4c-8: removeFromFocus called when X clicked on queue item', () => {
    const removeFromFocus = vi.fn();
    const todos = [{ id: 't1', text: 'Do this', quad: 'ui', cat: null, deadline: '', subtasks: [], poms: 0, done: false, linkedList: null }];
    wrap(<Focus />, mkCtx({ todos, focus: ['t1'], removeFromFocus }));
    fireEvent.click(screen.getByLabelText('Remove from focus'));
    expect(removeFromFocus).toHaveBeenCalledWith('t1');
  });
});

// ── 4d: Confirm ───────────────────────────────────────────────────────────────

describe('Confirm', () => {
  const LIST1 = {
    id: 'l1', name: 'My Checklist',
    items: [
      { id: 'i1', text: 'Step 1', done: false, section: '' },
      { id: 'i2', text: 'Step 2', done: true,  section: '' },
    ],
  };

  it('4d-1: renders checklists from context', () => {
    wrap(<Confirm />, mkCtx({ lists: [LIST1] }));
    expect(screen.getByText('My Checklist')).toBeTruthy();
  });

  it('4d-2: QuickAdd calls addList', () => {
    const addList = vi.fn();
    wrap(<Confirm />, mkCtx({ addList }));
    const input = screen.getByPlaceholderText('New checklist…');
    fireEvent.change(input, { target: { value: 'Shopping' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(addList).toHaveBeenCalledWith('Shopping');
  });

  it('4d-3: checklist items rendered', () => {
    wrap(<Confirm />, mkCtx({ lists: [LIST1] }));
    expect(screen.getByText('Step 1')).toBeTruthy();
    expect(screen.getByText('Step 2')).toBeTruthy();
  });

  it('4d-4: clicking item calls toggleItem', () => {
    const toggleItem = vi.fn();
    wrap(<Confirm />, mkCtx({ lists: [LIST1], toggleItem }));
    fireEvent.click(screen.getByLabelText('Item: Step 1'));
    expect(toggleItem).toHaveBeenCalledWith('l1', 'i1');
  });

  it('4d-5: done item has line-through class', () => {
    wrap(<Confirm />, mkCtx({ lists: [LIST1] }));
    const text = screen.getByText('Step 2');
    expect(text.className).toMatch(/line-through/);
  });

  it('4d-6: list options menu opens with rename and delete', () => {
    wrap(<Confirm />, mkCtx({ lists: [LIST1] }));
    fireEvent.click(screen.getByLabelText('List options'));
    expect(screen.getByText('Rename')).toBeTruthy();
    expect(screen.getByText('Delete list')).toBeTruthy();
  });

  it('4d-7: QuickAdd inside list calls addItem', () => {
    const addItem = vi.fn();
    wrap(<Confirm />, mkCtx({ lists: [LIST1], addItem }));
    const inputs = screen.getAllByPlaceholderText('Add item…');
    fireEvent.change(inputs[0], { target: { value: 'Step 3' } });
    fireEvent.keyDown(inputs[0], { key: 'Enter' });
    expect(addItem).toHaveBeenCalledWith('l1', 'Step 3');
  });

  it('4d-8: bulk mode toggle on checklist card shows checked icon', () => {
    wrap(<Confirm />, mkCtx({ lists: [LIST1] }));
    fireEvent.click(screen.getByLabelText('Toggle bulk select'));
    // In bulk mode, clicking item should select it (not toggle done)
    fireEvent.click(screen.getByLabelText('Item: Step 1'));
    // Verify selection by checking that BulkActionBar appears with count
    expect(screen.getByText('1 selected')).toBeTruthy();
  });

  it('4d-9: bulk mode exit clears selection', () => {
    wrap(<Confirm />, mkCtx({ lists: [LIST1] }));
    fireEvent.click(screen.getByLabelText('Toggle bulk select'));
    fireEvent.click(screen.getByLabelText('Item: Step 1'));
    // Exit bulk mode via the X button
    fireEvent.click(screen.getByLabelText('Clear selection'));
    expect(screen.queryByText('selected')).toBeNull();
  });
});

// ── 4e: Review ────────────────────────────────────────────────────────────────

describe('Review', () => {
  const MET = { d: { p: 3, t: 2, m: 75, date: '2026-02-21' }, w: { p: 12, t: 8, m: 300 } };
  const DHIST = [
    { date: '2026-02-21', p: 3, t: 2, m: 75 },
    { date: '2026-02-20', p: 2, t: 1, m: 50 },
    { date: '2026-02-19', p: 1, t: 0, m: 25 },
  ];

  it('4e-1: renders weekly pomodoro count', () => {
    wrap(<Review />, mkCtx({ met: MET, dHist: DHIST }));
    // Week poms = 12
    expect(screen.getByText('12')).toBeTruthy();
  });

  it('4e-2: renders weekly tasks done count', () => {
    wrap(<Review />, mkCtx({ met: MET, dHist: DHIST }));
    expect(screen.getByText('8')).toBeTruthy();
  });

  it('4e-3: renders heatmap with 91 cells', () => {
    wrap(<Review />, mkCtx({ met: MET, dHist: DHIST }));
    const heatmap = screen.getByTestId('heatmap');
    const cells = heatmap.querySelectorAll('[aria-label*="pomodoros"]');
    expect(cells.length).toBe(91);
  });

  it('4e-4: streak section rendered', () => {
    wrap(<Review />, mkCtx({ met: MET, dHist: DHIST }));
    expect(screen.getByText('Current streak')).toBeTruthy();
    expect(screen.getByText('Longest streak')).toBeTruthy();
  });

  it('4e-5: insights section rendered', () => {
    wrap(<Review />, mkCtx({ met: MET, dHist: DHIST }));
    expect(screen.getByLabelText('Insights')).toBeTruthy();
  });

  it('4e-6: task distribution section rendered', () => {
    const todos = [
      { id: 't1', quad: 'ui', done: false },
      { id: 't2', quad: 'ni', done: false },
    ];
    wrap(<Review />, mkCtx({ todos, met: MET, dHist: DHIST }));
    expect(screen.getByText('Do First')).toBeTruthy();
  });
});

// ── 4f: Settings ──────────────────────────────────────────────────────────────

describe('Settings', () => {
  it('4f-1: renders theme buttons', () => {
    wrap(<Settings />, mkCtx());
    expect(screen.getByLabelText('Theme: Light')).toBeTruthy();
    expect(screen.getByLabelText('Theme: Dark')).toBeTruthy();
    expect(screen.getByLabelText('Theme: System')).toBeTruthy();
  });

  it('4f-2: clicking theme button calls setTheme', () => {
    const setTheme = vi.fn();
    wrap(<Settings />, mkCtx({ setTheme }));
    fireEvent.click(screen.getByLabelText('Theme: Dark'));
    expect(setTheme).toHaveBeenCalledWith('dark');
  });

  it('4f-3: preset buttons rendered', () => {
    wrap(<Settings />, mkCtx());
    expect(screen.getByLabelText('Preset: Classic')).toBeTruthy();
    expect(screen.getByLabelText('Preset: Long')).toBeTruthy();
    expect(screen.getByLabelText('Preset: Short')).toBeTruthy();
  });

  it('4f-4: clicking preset calls setPreset', () => {
    const setPreset = vi.fn();
    wrap(<Settings />, mkCtx({ setPreset }));
    fireEvent.click(screen.getByLabelText('Preset: Long'));
    expect(setPreset).toHaveBeenCalledWith('long');
  });

  it('4f-5: Export button exists', () => {
    wrap(<Settings />, mkCtx());
    expect(screen.getByLabelText('Export data')).toBeTruthy();
  });

  it('4f-6: Import button exists', () => {
    wrap(<Settings />, mkCtx());
    expect(screen.getByLabelText('Import data')).toBeTruthy();
  });

  it('4f-7: Reset button exists and triggers confirm dialog', () => {
    wrap(<Settings />, mkCtx());
    fireEvent.click(screen.getByLabelText('Reset data'));
    expect(screen.getByText(/Reset ALL data/)).toBeTruthy();
  });

  it('4f-8: Run Test Suite button exists', () => {
    wrap(<Settings />, mkCtx());
    expect(screen.getByLabelText('Run test suite')).toBeTruthy();
  });

  it('4f-9: explainer section shows accordion items (mobile layout)', () => {
    wrap(<Settings />, mkCtx());
    expect(screen.getByText('Capture')).toBeTruthy();
    expect(screen.getByText('Clarify')).toBeTruthy();
    expect(screen.getByText('Focus')).toBeTruthy();
  });

  it('4f-10: active theme button has sage styling', () => {
    wrap(<Settings />, mkCtx({ theme: 'dark' }));
    const darkBtn = screen.getByLabelText('Theme: Dark');
    expect(darkBtn.className).toMatch(/sage/);
  });

  it('T7-3: Share Data card renders with Copy sync code button', () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    wrap(<Settings />, mkCtx());
    expect(screen.getByLabelText('Copy sync code')).toBeTruthy();
  });

  it('4f-11: Show Help button renders and opens AboutModal', () => {
    wrap(<Settings />, mkCtx());
    const helpBtn = screen.getByLabelText('Show help');
    expect(helpBtn).toBeTruthy();
    fireEvent.click(helpBtn);
    // AboutModal should be visible with version info
    expect(screen.getByText('v18.0-Alpha')).toBeTruthy();
  });
});
