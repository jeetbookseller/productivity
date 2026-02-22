/**
 * useAppData — central app state + all CRUD handlers
 *
 * Exposes everything via React Context so any child component can read/write
 * without prop-drilling.
 *
 * Usage:
 *   // At app root:
 *   <AppDataProvider>...</AppDataProvider>
 *
 *   // In any child:
 *   const { todos, addTodo, ... } = useAppDataContext();
 */
import { createContext, useContext, useRef, useEffect } from 'react';
import { usePersistedState } from './usePersistedState.js';
import { uid } from '../lib/utils.js';

// ── Context ────────────────────────────────────────────────────────────────────

export const AppDataContext = createContext(null);

export function useAppDataContext() {
  return useContext(AppDataContext);
}

// Note: AppDataProvider (JSX) lives in src/components/AppDataProvider.jsx
// to keep this file as plain JS (no JSX transform needed).

// ── Default values ─────────────────────────────────────────────────────────────

const DEFAULT_MET = {
  d: { p: 0, t: 0, m: 0, date: '' },
  w: { p: 0, t: 0, m: 0 },
};

const DEFAULT_TIMER = {
  mode: 'work', left: 25 * 60, run: false,
  endAt: null, startAt: null, elapsed: 0,
};

// ── Main hook ──────────────────────────────────────────────────────────────────

export function useAppData() {
  const [todos,     setTodos]     = usePersistedState('todos',     []);
  const [notes,     setNotes]     = usePersistedState('notes',     []);
  const [lists,     setLists]     = usePersistedState('lists',     []);
  const [focus,     setFocus]     = usePersistedState('focus',     []);
  const [theme,     setThemeRaw]  = usePersistedState('theme',     'system');
  const [preset,    setPresetRaw] = usePersistedState('preset',    'classic');
  const [customT,   setCustomT]   = usePersistedState('customT',   { work: 25, short: 5, long: 15 });
  const [poms,      setPoms]      = usePersistedState('poms',      0);
  const [met,       setMet]       = usePersistedState('met',       DEFAULT_MET);
  const [dHist,     setDHist]     = usePersistedState('dHist',     []);
  const [fHist,     setFHist]     = usePersistedState('fHist',     []);
  const [tab,       setTab]       = usePersistedState('tab',       'capture');
  const [seenAbout,   setSeenAbout]   = usePersistedState('seenAbout',       false);
  const [timerState,  setTimerState]  = usePersistedState('focusTimerState', DEFAULT_TIMER);

  // Refs for reading current state inside callbacks without stale closures
  const notesRef = useRef(notes);
  useEffect(() => { notesRef.current = notes; }, [notes]);

  // ── Notes (Capture) ──────────────────────────────────────────────────────────

  const addNote = (text) => {
    const note = { id: uid(), text, crAt: new Date().toISOString(), struck: false, struckAt: null };
    setNotes((prev) => [note, ...prev]);
    return note;
  };

  const editNote = (id, text) => {
    setNotes((prev) => prev.map((n) => n.id === id ? { ...n, text } : n));
  };

  const deleteNote = (id) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  const strikeNote = (id) => {
    setNotes((prev) => prev.map((n) =>
      n.id === id
        ? { ...n, struck: !n.struck, struckAt: !n.struck ? new Date().toISOString() : null }
        : n
    ));
  };

  const promoteNote = (id, quad = 'ui') => {
    const note = notesRef.current.find((n) => n.id === id);
    if (!note) return;
    addTodo(note.text, quad);
    deleteNote(id);
  };

  const bulkDeleteNotes = (ids) => {
    setNotes((prev) => prev.filter((n) => !ids.includes(n.id)));
  };

  const bulkStrikeNotes = (ids) => {
    const now = new Date().toISOString();
    setNotes((prev) => prev.map((n) =>
      ids.includes(n.id) ? { ...n, struck: true, struckAt: n.struckAt ?? now } : n
    ));
  };

  const clearStruckNotes = () => {
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    setNotes((prev) => prev.filter((n) =>
      !n.struck || (n.struckAt && new Date(n.struckAt).getTime() > cutoff)
    ));
  };

  // ── Todos (Clarify) ──────────────────────────────────────────────────────────

  const addTodo = (text, quad = 'ui', cat = null) => {
    const todo = { id: uid(), text, quad, cat, deadline: '', subtasks: [], poms: 0, done: false, linkedList: null };
    setTodos((prev) => [...prev, todo]);
    return todo;
  };

  const editTodo = (id, changes) => {
    setTodos((prev) => prev.map((t) => t.id === id ? { ...t, ...changes } : t));
  };

  const deleteTodo = (id) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
    setFocus((prev) => prev.filter((fid) => fid !== id));
  };

  const toggleTodo = (id) => {
    setTodos((prev) => prev.map((t) => t.id === id ? { ...t, done: !t.done } : t));
  };

  const moveTodo = (id, quad) => {
    setTodos((prev) => prev.map((t) => t.id === id ? { ...t, quad } : t));
  };

  const reorderTodo = (quad, fromIdx, toIdx) => {
    setTodos((prev) => {
      const quadItems = prev.filter((t) => t.quad === quad);
      const others    = prev.filter((t) => t.quad !== quad);
      const [moved]   = quadItems.splice(fromIdx, 1);
      quadItems.splice(toIdx, 0, moved);
      return [...others, ...quadItems];
    });
  };

  const addSubtask = (todoId, text) => {
    const sub = { id: uid(), text, done: false };
    setTodos((prev) => prev.map((t) =>
      t.id === todoId ? { ...t, subtasks: [...t.subtasks, sub] } : t
    ));
    return sub;
  };

  const editSubtask = (todoId, subId, text) => {
    setTodos((prev) => prev.map((t) =>
      t.id === todoId
        ? { ...t, subtasks: t.subtasks.map((s) => s.id === subId ? { ...s, text } : s) }
        : t
    ));
  };

  const deleteSubtask = (todoId, subId) => {
    setTodos((prev) => prev.map((t) =>
      t.id === todoId
        ? { ...t, subtasks: t.subtasks.filter((s) => s.id !== subId) }
        : t
    ));
  };

  const toggleSubtask = (todoId, subId) => {
    setTodos((prev) => prev.map((t) =>
      t.id === todoId
        ? { ...t, subtasks: t.subtasks.map((s) => s.id === subId ? { ...s, done: !s.done } : s) }
        : t
    ));
  };

  const linkChecklist = (todoId, listId) => {
    setTodos((prev) => prev.map((t) =>
      t.id === todoId ? { ...t, linkedList: listId } : t
    ));
  };

  const bulkDeleteTodos = (ids) => {
    setTodos((prev) => prev.filter((t) => !ids.includes(t.id)));
    setFocus((prev) => prev.filter((id) => !ids.includes(id)));
  };

  const bulkMoveTodos = (ids, quad) => {
    setTodos((prev) => prev.map((t) => ids.includes(t.id) ? { ...t, quad } : t));
  };

  // ── Focus queue ──────────────────────────────────────────────────────────────

  const addToFocus = (id) => {
    setFocus((prev) => prev.includes(id) ? prev : [...prev, id].slice(0, 5));
  };

  const removeFromFocus = (id) => {
    setFocus((prev) => prev.filter((fid) => fid !== id));
  };

  const reorderFocus = (fromIdx, toIdx) => {
    setFocus((prev) => {
      const next  = [...prev];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      return next;
    });
  };

  // ── Lists (Confirm) ──────────────────────────────────────────────────────────

  const addList = (name) => {
    const list = { id: uid(), name, items: [] };
    setLists((prev) => [...prev, list]);
    return list;
  };

  const editList = (id, name) => {
    setLists((prev) => prev.map((l) => l.id === id ? { ...l, name } : l));
  };

  const deleteList = (id) => {
    setLists((prev) => prev.filter((l) => l.id !== id));
    setTodos((prev) => prev.map((t) => t.linkedList === id ? { ...t, linkedList: null } : t));
  };

  const addItem = (listId, text, section = '') => {
    const item = { id: uid(), text, done: false, section };
    setLists((prev) => prev.map((l) =>
      l.id === listId ? { ...l, items: [...l.items, item] } : l
    ));
    return item;
  };

  const editItem = (listId, itemId, changes) => {
    setLists((prev) => prev.map((l) =>
      l.id === listId
        ? { ...l, items: l.items.map((i) => i.id === itemId ? { ...i, ...changes } : i) }
        : l
    ));
  };

  const deleteItem = (listId, itemId) => {
    setLists((prev) => prev.map((l) =>
      l.id === listId
        ? { ...l, items: l.items.filter((i) => i.id !== itemId) }
        : l
    ));
  };

  const toggleItem = (listId, itemId) => {
    setLists((prev) => prev.map((l) =>
      l.id === listId
        ? { ...l, items: l.items.map((i) => i.id === itemId ? { ...i, done: !i.done } : i) }
        : l
    ));
  };

  const bulkDeleteItems = (listId, itemIds) => {
    setLists((prev) => prev.map((l) =>
      l.id === listId
        ? { ...l, items: l.items.filter((i) => !itemIds.includes(i.id)) }
        : l
    ));
  };

  // ── Metrics (Review) ─────────────────────────────────────────────────────────

  const recordPom = (minutes = 25) => {
    const today = new Date().toISOString().slice(0, 10);
    setPoms((p) => p + 1);
    setMet((m) => {
      const prevD = m.d.date === today ? m.d : { p: 0, t: m.d.t, m: 0, date: today };
      const d = { ...prevD, p: prevD.p + 1, m: prevD.m + minutes };
      return { d, w: { ...m.w, p: m.w.p + 1, m: m.w.m + minutes } };
    });
  };

  const recordTaskDone = () => {
    const today = new Date().toISOString().slice(0, 10);
    setMet((m) => {
      const prevD = m.d.date === today ? m.d : { p: m.d.p, t: 0, m: m.d.m, date: today };
      const d = { ...prevD, t: prevD.t + 1 };
      return { d, w: { ...m.w, t: m.w.t + 1 } };
    });
  };

  // ── Settings ─────────────────────────────────────────────────────────────────

  const setTheme  = (t) => setThemeRaw(t);
  const setPreset = (p) => setPresetRaw(p);

  // ── Return ────────────────────────────────────────────────────────────────────

  return {
    // State
    todos, notes, lists, focus, theme, preset, customT,
    poms, met, dHist, fHist, tab, seenAbout, timerState,

    // Raw setters
    setCustomT, setTab, setSeenAbout, setDHist, setFHist, setTimerState,

    // Theme / Preset
    setTheme, setPreset,

    // Notes (Capture)
    addNote, editNote, deleteNote, strikeNote, promoteNote,
    bulkDeleteNotes, bulkStrikeNotes, clearStruckNotes,

    // Todos (Clarify)
    addTodo, editTodo, deleteTodo, toggleTodo, moveTodo, reorderTodo,
    addSubtask, editSubtask, deleteSubtask, toggleSubtask,
    linkChecklist, bulkDeleteTodos, bulkMoveTodos,

    // Focus queue
    addToFocus, removeFromFocus, reorderFocus,

    // Lists (Confirm)
    addList, editList, deleteList,
    addItem, editItem, deleteItem, toggleItem, bulkDeleteItems,

    // Metrics (Review)
    recordPom, recordTaskDone,
  };
}
