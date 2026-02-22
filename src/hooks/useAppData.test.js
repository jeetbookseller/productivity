/**
 * T1 — Hook contract tests (15 tests)
 * Covers: usePersistedState, useAppData, useDesk/useWide
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePersistedState } from './usePersistedState.js';
import { useAppData } from './useAppData.js';
import { useDesk, useWide } from './useResponsive.js';

beforeEach(() => {
  localStorage.clear();
  // Silence the S.get IDB errors in tests (IDB not available in jsdom)
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

// ── usePersistedState ─────────────────────────────────────────────────────────

describe('usePersistedState', () => {
  it('T1-1: returns defaultValue when nothing is stored', () => {
    const { result } = renderHook(() => usePersistedState('__TEST__ups1', 42));
    expect(result.current[0]).toBe(42);
  });

  it('T1-2: returns stored localStorage value on mount (sync read)', () => {
    localStorage.setItem('ph___TEST__ups2', JSON.stringify('stored-val'));
    const { result } = renderHook(() => usePersistedState('__TEST__ups2', 'default'));
    expect(result.current[0]).toBe('stored-val');
  });

  it('T1-3: setter updates state immediately', () => {
    const { result } = renderHook(() => usePersistedState('__TEST__ups3', 0));
    act(() => { result.current[1](99); });
    expect(result.current[0]).toBe(99);
  });

  it('T1-4: setter writes to localStorage via S.set', () => {
    const { result } = renderHook(() => usePersistedState('__TEST__ups4', 'a'));
    act(() => { result.current[1]('b'); });
    const stored = JSON.parse(localStorage.getItem('ph___TEST__ups4'));
    expect(stored).toBe('b');
  });

  it('T1-5: setter accepts updater function (functional update)', () => {
    const { result } = renderHook(() => usePersistedState('__TEST__ups5', 10));
    act(() => { result.current[1]((prev) => prev + 5); });
    expect(result.current[0]).toBe(15);
  });
});

// ── useAppData contract ───────────────────────────────────────────────────────

describe('useAppData — state fields', () => {
  it('T1-6: all required state fields are present', () => {
    const { result } = renderHook(() => useAppData());
    const d = result.current;
    expect(Array.isArray(d.todos)).toBe(true);
    expect(Array.isArray(d.notes)).toBe(true);
    expect(Array.isArray(d.lists)).toBe(true);
    expect(Array.isArray(d.focus)).toBe(true);
    expect(typeof d.theme).toBe('string');
    expect(typeof d.preset).toBe('string');
    expect(typeof d.customT).toBe('object');
    expect(typeof d.poms).toBe('number');
    expect(typeof d.met).toBe('object');
    expect(Array.isArray(d.dHist)).toBe(true);
    expect(Array.isArray(d.fHist)).toBe(true);
    expect(typeof d.tab).toBe('string');
    expect(typeof d.seenAbout).toBe('boolean');
  });

  it('T1-7: all note handlers are callable functions', () => {
    const { result } = renderHook(() => useAppData());
    const d = result.current;
    ['addNote','editNote','deleteNote','strikeNote','promoteNote',
     'bulkDeleteNotes','bulkStrikeNotes','clearStruckNotes']
      .forEach((fn) => expect(typeof d[fn]).toBe('function'));
  });
});

describe('useAppData — notes (Capture)', () => {
  it('T1-8: addNote creates a note with correct shape', () => {
    const { result } = renderHook(() => useAppData());
    act(() => { result.current.addNote('hello world'); });
    const note = result.current.notes[0];
    expect(note.text).toBe('hello world');
    expect(typeof note.id).toBe('string');
    expect(note.struck).toBe(false);
    expect(typeof note.crAt).toBe('string');
  });

  it('T1-9: deleteNote removes the note by id', () => {
    const { result } = renderHook(() => useAppData());
    let id;
    act(() => { id = result.current.addNote('to-delete').id; });
    act(() => { result.current.deleteNote(id); });
    expect(result.current.notes.find((n) => n.id === id)).toBeUndefined();
  });
});

describe('useAppData — todos (Clarify)', () => {
  it('T1-10: addTodo creates a todo with correct shape', () => {
    const { result } = renderHook(() => useAppData());
    act(() => { result.current.addTodo('my task', 'ui', 'work'); });
    const todo = result.current.todos[0];
    expect(todo.text).toBe('my task');
    expect(todo.quad).toBe('ui');
    expect(todo.cat).toBe('work');
    expect(todo.done).toBe(false);
    expect(Array.isArray(todo.subtasks)).toBe(true);
    expect(typeof todo.id).toBe('string');
  });

  it('T1-11: toggleTodo flips the done field', () => {
    const { result } = renderHook(() => useAppData());
    let id;
    act(() => { id = result.current.addTodo('toggle me').id; });
    expect(result.current.todos.find((t) => t.id === id).done).toBe(false);
    act(() => { result.current.toggleTodo(id); });
    expect(result.current.todos.find((t) => t.id === id).done).toBe(true);
    act(() => { result.current.toggleTodo(id); });
    expect(result.current.todos.find((t) => t.id === id).done).toBe(false);
  });
});

describe('useAppData — lists (Confirm)', () => {
  it('T1-12: addList creates a list with correct shape', () => {
    const { result } = renderHook(() => useAppData());
    act(() => { result.current.addList('My Checklist'); });
    const list = result.current.lists[0];
    expect(list.name).toBe('My Checklist');
    expect(Array.isArray(list.items)).toBe(true);
    expect(typeof list.id).toBe('string');
  });
});

describe('useAppData — notes CRUD', () => {
  it('T1-16: editNote updates the note text', () => {
    const { result } = renderHook(() => useAppData());
    let id;
    act(() => { id = result.current.addNote('original').id; });
    act(() => { result.current.editNote(id, 'updated'); });
    expect(result.current.notes.find((n) => n.id === id).text).toBe('updated');
  });

  it('T1-17: strikeNote toggles the struck field', () => {
    const { result } = renderHook(() => useAppData());
    let id;
    act(() => { id = result.current.addNote('strike me').id; });
    expect(result.current.notes.find((n) => n.id === id).struck).toBe(false);
    act(() => { result.current.strikeNote(id); });
    expect(result.current.notes.find((n) => n.id === id).struck).toBe(true);
  });

  it('T1-18: bulkDeleteNotes removes multiple notes', () => {
    const { result } = renderHook(() => useAppData());
    let id1, id2, id3;
    act(() => { id1 = result.current.addNote('a').id; });
    act(() => { id2 = result.current.addNote('b').id; });
    act(() => { id3 = result.current.addNote('c').id; });
    act(() => { result.current.bulkDeleteNotes([id1, id3]); });
    expect(result.current.notes).toHaveLength(1);
    expect(result.current.notes[0].id).toBe(id2);
  });

  it('T1-19: bulkStrikeNotes strikes multiple notes', () => {
    const { result } = renderHook(() => useAppData());
    let id1, id2;
    act(() => { id1 = result.current.addNote('x').id; });
    act(() => { id2 = result.current.addNote('y').id; });
    act(() => { result.current.bulkStrikeNotes([id1, id2]); });
    expect(result.current.notes.every((n) => n.struck)).toBe(true);
  });
});

describe('useAppData — todos CRUD', () => {
  it('T1-20: editTodo updates todo fields', () => {
    const { result } = renderHook(() => useAppData());
    let id;
    act(() => { id = result.current.addTodo('edit me', 'ui').id; });
    act(() => { result.current.editTodo(id, { text: 'edited', cat: 'health' }); });
    const todo = result.current.todos.find((t) => t.id === id);
    expect(todo.text).toBe('edited');
    expect(todo.cat).toBe('health');
  });

  it('T1-21: moveTodo changes the quadrant', () => {
    const { result } = renderHook(() => useAppData());
    let id;
    act(() => { id = result.current.addTodo('move me', 'ui').id; });
    act(() => { result.current.moveTodo(id, 'nn'); });
    expect(result.current.todos.find((t) => t.id === id).quad).toBe('nn');
  });

  it('T1-22: bulkDeleteTodos removes multiple todos', () => {
    const { result } = renderHook(() => useAppData());
    let id1, id2, id3;
    act(() => { id1 = result.current.addTodo('a').id; });
    act(() => { id2 = result.current.addTodo('b').id; });
    act(() => { id3 = result.current.addTodo('c').id; });
    act(() => { result.current.bulkDeleteTodos([id1, id3]); });
    expect(result.current.todos).toHaveLength(1);
    expect(result.current.todos[0].id).toBe(id2);
  });

  it('T1-23: bulkMoveTodos moves multiple todos to a quadrant', () => {
    const { result } = renderHook(() => useAppData());
    let id1, id2;
    act(() => { id1 = result.current.addTodo('a', 'ui').id; });
    act(() => { id2 = result.current.addTodo('b', 'ni').id; });
    act(() => { result.current.bulkMoveTodos([id1, id2], 'un'); });
    expect(result.current.todos.every((t) => t.quad === 'un')).toBe(true);
  });

  it('T1-24: deleteTodo removes the todo by id', () => {
    const { result } = renderHook(() => useAppData());
    let id;
    act(() => { id = result.current.addTodo('delete me').id; });
    act(() => { result.current.deleteTodo(id); });
    expect(result.current.todos.find((t) => t.id === id)).toBeUndefined();
  });
});

describe('useAppData — lists CRUD', () => {
  it('T1-25: addItem adds an item to the list', () => {
    const { result } = renderHook(() => useAppData());
    let listId;
    act(() => { listId = result.current.addList('Test List').id; });
    act(() => { result.current.addItem(listId, 'Item 1'); });
    const list = result.current.lists.find((l) => l.id === listId);
    expect(list.items).toHaveLength(1);
    expect(list.items[0].text).toBe('Item 1');
  });

  it('T1-26: toggleItem flips item done state', () => {
    const { result } = renderHook(() => useAppData());
    let listId;
    act(() => { listId = result.current.addList('Test').id; });
    act(() => { result.current.addItem(listId, 'Item'); });
    const itemId = result.current.lists.find((l) => l.id === listId).items[0].id;
    act(() => { result.current.toggleItem(listId, itemId); });
    expect(result.current.lists.find((l) => l.id === listId).items[0].done).toBe(true);
  });

  it('T1-27: deleteItem removes item from list', () => {
    const { result } = renderHook(() => useAppData());
    let listId;
    act(() => { listId = result.current.addList('Test').id; });
    act(() => { result.current.addItem(listId, 'Item'); });
    const itemId = result.current.lists.find((l) => l.id === listId).items[0].id;
    act(() => { result.current.deleteItem(listId, itemId); });
    expect(result.current.lists.find((l) => l.id === listId).items).toHaveLength(0);
  });

  it('T1-28: bulkDeleteItems removes multiple items', () => {
    const { result } = renderHook(() => useAppData());
    let listId;
    act(() => { listId = result.current.addList('Test').id; });
    act(() => { result.current.addItem(listId, 'A'); });
    act(() => { result.current.addItem(listId, 'B'); });
    act(() => { result.current.addItem(listId, 'C'); });
    const items = result.current.lists.find((l) => l.id === listId).items;
    act(() => { result.current.bulkDeleteItems(listId, [items[0].id, items[2].id]); });
    const remaining = result.current.lists.find((l) => l.id === listId).items;
    expect(remaining).toHaveLength(1);
    expect(remaining[0].text).toBe('B');
  });
});

describe('useAppData — metrics (Review)', () => {
  it('T1-29: recordPom increments poms, met.d.p, met.d.m, and met.w', () => {
    const { result } = renderHook(() => useAppData());
    const today = new Date().toISOString().slice(0, 10);
    act(() => { result.current.recordPom(25); });
    expect(result.current.poms).toBe(1);
    expect(result.current.met.d.p).toBe(1);
    expect(result.current.met.d.m).toBe(25);
    expect(result.current.met.d.date).toBe(today);
    expect(result.current.met.w.p).toBe(1);
    expect(result.current.met.w.m).toBe(25);
  });

  it('T1-30: recordPom creates a new dHist entry for today', () => {
    const { result } = renderHook(() => useAppData());
    const today = new Date().toISOString().slice(0, 10);
    act(() => { result.current.recordPom(25); });
    const entry = result.current.dHist.find((e) => e.date === today);
    expect(entry).toBeDefined();
    expect(entry.p).toBe(1);
  });

  it('T1-31: recordPom increments existing dHist entry when called again same day', () => {
    const { result } = renderHook(() => useAppData());
    const today = new Date().toISOString().slice(0, 10);
    act(() => { result.current.recordPom(25); });
    act(() => { result.current.recordPom(25); });
    const entries = result.current.dHist.filter((e) => e.date === today);
    expect(entries).toHaveLength(1);
    expect(entries[0].p).toBe(2);
  });

  it('T1-32: toggleTodo increments met task counts when completing a todo', () => {
    const { result } = renderHook(() => useAppData());
    const today = new Date().toISOString().slice(0, 10);
    let id;
    act(() => { id = result.current.addTodo('task to complete').id; });
    act(() => { result.current.toggleTodo(id); }); // false → true
    expect(result.current.met.d.t).toBe(1);
    expect(result.current.met.d.date).toBe(today);
    expect(result.current.met.w.t).toBe(1);
  });

  it('T1-33: toggleTodo does NOT increment met when un-completing a todo', () => {
    const { result } = renderHook(() => useAppData());
    let id;
    act(() => { id = result.current.addTodo('task to uncomplete').id; });
    act(() => { result.current.toggleTodo(id); }); // false → true  (counts once)
    act(() => { result.current.toggleTodo(id); }); // true  → false (should NOT count again)
    expect(result.current.met.d.t).toBe(1); // still 1
    expect(result.current.met.w.t).toBe(1);
  });
});

describe('useAppData — focus queue', () => {
  it('T1-13: addToFocus adds a task id to the focus queue', () => {
    const { result } = renderHook(() => useAppData());
    let id;
    act(() => { id = result.current.addTodo('focus task').id; });
    act(() => { result.current.addToFocus(id); });
    expect(result.current.focus).toContain(id);
  });

  it('T1-14: removeFromFocus removes the task id', () => {
    const { result } = renderHook(() => useAppData());
    let id;
    act(() => { id = result.current.addTodo('focus task 2').id; });
    act(() => { result.current.addToFocus(id); });
    act(() => { result.current.removeFromFocus(id); });
    expect(result.current.focus).not.toContain(id);
  });
});

// ── useResponsive ─────────────────────────────────────────────────────────────

describe('useResponsive', () => {
  it('T1-15: useDesk returns false when window.innerWidth < 768 and useWide < 1280', () => {
    // jsdom defaults to innerWidth = 1024 — override to narrow
    Object.defineProperty(window, 'innerWidth', { value: 375, writable: true, configurable: true });
    // matchMedia also needs to reflect narrow width
    window.matchMedia = (query) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    const { result: deskResult } = renderHook(() => useDesk());
    const { result: wideResult } = renderHook(() => useWide());

    expect(deskResult.current).toBe(false);
    expect(wideResult.current).toBe(false);

    // Restore
    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true, configurable: true });
  });
});
