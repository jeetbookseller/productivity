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
