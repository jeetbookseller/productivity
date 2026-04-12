/**
 * Capture — Bullet Journal section
 * Brain-dump quick notes grouped by collapsible date sections.
 * Inline edit, 3-dot menu, bulk select, auto-clear, and end-of-day migration.
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAppDataContext } from '../hooks/useAppData.js';
import { useDesk } from '../hooks/useResponsive.js';
import { QuickAdd } from '../components/QuickAdd.jsx';
import { StickyHeader } from '../components/StickyHeader.jsx';
import { BulkActionBar } from '../components/BulkActionBar.jsx';
import { ContextMenu } from '../components/ContextMenu.jsx';
import { ConfirmDialog } from '../components/ConfirmDialog.jsx';
import { I } from '../components/icons.jsx';
import { shareItem } from '../lib/utils.js';

// ── Date helpers ─────────────────────────────────────────────────────────────

function toDateStr(d) { return d.toISOString().slice(0, 10); }

function todayStr() { return toDateStr(new Date()); }

/** Build ordered array: today, future +1…+10, past -1…-5 */
function buildDateSlots() {
  const now = new Date();
  const today = toDateStr(now);
  const slots = [today];
  for (let i = 1; i <= 10; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    slots.push(toDateStr(d));
  }
  for (let i = 1; i <= 5; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    slots.push(toDateStr(d));
  }
  return slots;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                     'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDateLabel(dateStr) {
  const today = todayStr();
  if (dateStr === today) return 'Today';

  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);

  // Tomorrow / Yesterday
  const t = new Date();
  const tmr = new Date(t); tmr.setDate(t.getDate() + 1);
  const yest = new Date(t); yest.setDate(t.getDate() - 1);
  if (dateStr === toDateStr(tmr)) return 'Tomorrow';
  if (dateStr === toDateStr(yest)) return 'Yesterday';

  return `${DAY_NAMES[date.getDay()]}, ${MONTH_NAMES[date.getMonth()]} ${date.getDate()}`;
}

// ── Capture ──────────────────────────────────────────────────────────────────

export function Capture() {
  const {
    notes, addNote, editNote, deleteNote, strikeNote, promoteNote,
    bulkDeleteNotes, bulkStrikeNotes, clearStruckNotes, migrateNotes,
  } = useAppDataContext();
  const isDesk = useDesk();

  // Inline edit
  const [editingId, setEditingId]   = useState(null);
  const [editText,  setEditText]    = useState('');
  const editInputRef                = useRef(null);

  // Context menu
  const [menuOpen,   setMenuOpen]   = useState(false);
  const [menuNote,   setMenuNote]   = useState(null);
  const [menuAnchor, setMenuAnchor] = useState(null);

  // Confirm dialog
  const [confirmOpen,   setConfirmOpen]   = useState(false);
  const [confirmMsg,    setConfirmMsg]    = useState('');
  const [pendingDelete, setPendingDelete] = useState(null);

  // Bulk select
  const [bulkMode, setBulkMode] = useState(false);
  const [selected, setSelected] = useState(new Set());

  // Date slots and collapse state
  const dateSlots = useMemo(buildDateSlots, []);
  const today = dateSlots[0];
  const [collapsed, setCollapsed] = useState(() => new Set(dateSlots.slice(1)));

  // Auto-clear + migrate on mount
  useEffect(() => { clearStruckNotes(); migrateNotes(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Focus inline edit input when editing starts
  useEffect(() => {
    if (editingId) setTimeout(() => editInputRef.current?.focus(), 30);
  }, [editingId]);

  // ── Group notes by date ──────────────────────────────────────────────────

  const notesByDate = useMemo(() => {
    const map = {};
    for (const n of notes) {
      const d = n.date || n.crAt.slice(0, 10);
      (map[d] ||= []).push(n);
    }
    return map;
  }, [notes]);

  // ── Collapse toggle ───────────────────────────────────────────────────────

  const toggleCollapse = useCallback((dateStr) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(dateStr)) next.delete(dateStr); else next.add(dateStr);
      return next;
    });
  }, []);

  // ── Inline edit ────────────────────────────────────────────────────────────

  const startEdit = useCallback((note) => {
    setEditingId(note.id);
    setEditText(note.text);
  }, []);

  const saveEdit = useCallback(() => {
    if (editingId && editText.trim()) editNote(editingId, editText.trim());
    setEditingId(null);
    setEditText('');
  }, [editingId, editText, editNote]);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setEditText('');
  }, []);

  // ── Context menu ──────────────────────────────────────────────────────────

  const openMenu = useCallback((note, anchorRect) => {
    setMenuNote(note);
    setMenuAnchor(anchorRect);
    setMenuOpen(true);
  }, []);

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    setMenuNote(null);
    setMenuAnchor(null);
  }, []);

  const menuItems = menuNote ? [
    {
      label: 'Promote to Clarify',
      icon: <I.ArrowRight width={15} height={15} />,
      action: () => promoteNote(menuNote.id),
    },
    {
      label: 'Copy text',
      icon: <I.Copy width={15} height={15} />,
      action: () => shareItem(menuNote.text),
    },
    {
      label: menuNote.struck ? 'Unstrike' : 'Strikethrough',
      icon: <I.Strike width={15} height={15} />,
      action: () => strikeNote(menuNote.id),
    },
    {
      label: 'Delete',
      icon: <I.Trash width={15} height={15} />,
      danger: true,
      action: () => {
        setConfirmMsg('Delete this note?');
        setPendingDelete(menuNote.id);
        setConfirmOpen(true);
      },
    },
  ] : [];

  // ── Bulk select ───────────────────────────────────────────────────────────

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleBulk = () => {
    setBulkMode((v) => !v);
    setSelected(new Set());
  };

  const selectAll = () => {
    // Only select notes from expanded sections
    const visibleIds = [];
    for (const ds of dateSlots) {
      if (collapsed.has(ds)) continue;
      const sectionNotes = notesByDate[ds];
      if (sectionNotes) sectionNotes.forEach((n) => visibleIds.push(n.id));
    }
    setSelected(
      selected.size === visibleIds.length && visibleIds.every((id) => selected.has(id))
        ? new Set()
        : new Set(visibleIds)
    );
  };

  const bulkActions = [
    {
      label: 'Strike',
      icon: <I.Strike width={14} height={14} />,
      onClick: () => { bulkStrikeNotes([...selected]); setSelected(new Set()); },
    },
    {
      label: 'Delete',
      icon: <I.Trash width={14} height={14} />,
      danger: true,
      onClick: () => {
        setConfirmMsg(`Delete ${selected.size} note${selected.size !== 1 ? 's' : ''}?`);
        setPendingDelete([...selected]);
        setConfirmOpen(true);
      },
    },
  ];

  // ── Scroll guard ──────────────────────────────────────────────────────────

  const downPos = useRef(null);

  const handlePointerDown = (e) => {
    downPos.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e, note) => {
    if (!downPos.current) return;
    const dx = Math.abs(e.clientX - downPos.current.x);
    const dy = Math.abs(e.clientY - downPos.current.y);
    downPos.current = null;
    if (dx > 10 || dy > 10) return;
    if (bulkMode) toggleSelect(note.id);
    else startEdit(note);
  };

  // ── Determine which sections to show ──────────────────────────────────────

  const isPast = (ds) => ds < today;
  const hasAnyNotes = notes.length > 0;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full">
      <StickyHeader
        title="Capture"
        bulkMode={bulkMode}
        allSelected={notes.length > 0 && selected.size === notes.length}
        someSelected={selected.size > 0 && selected.size < notes.length}
        onToggleBulk={toggleBulk}
        onSelectAll={selectAll}
      />

      <div className="flex-1 overflow-y-auto pb-4">
        {!hasAnyNotes && collapsed.has(today) ? (
          /* Global empty state only if today is collapsed and no notes exist at all */
          <div className="px-4 pt-3">
            <DateSection
              dateStr={today}
              label={formatDateLabel(today)}
              count={0}
              isCollapsed={false}
              isPast={false}
              onToggle={() => toggleCollapse(today)}
              onAdd={(text) => addNote(text, today)}
            />
            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
              <I.Clock width={40} height={40} className="text-bark/15" />
              <p className="text-sm font-semibold text-bark/40">
                Nothing captured yet — add a thought above
              </p>
            </div>
          </div>
        ) : (
          <div className="px-4 pt-3 space-y-2">
            {dateSlots.map((ds) => {
              const sectionNotes = notesByDate[ds] || [];
              const past = isPast(ds);
              // Hide past sections with no items
              if (past && sectionNotes.length === 0) return null;
              const isOpen = !collapsed.has(ds);

              return (
                <div key={ds}>
                  <DateSection
                    dateStr={ds}
                    label={formatDateLabel(ds)}
                    count={sectionNotes.length}
                    isCollapsed={!isOpen}
                    isPast={past}
                    onToggle={() => toggleCollapse(ds)}
                    onAdd={!past ? (text) => addNote(text, ds) : null}
                  />

                  {isOpen && (
                    <div className="mt-1">
                      {!past && (
                        <div className="mb-2">
                          <QuickAdd
                            onAdd={(text) => addNote(text, ds)}
                            placeholder={ds === today ? 'Brain-dump anything…' : `Add to ${formatDateLabel(ds)}…`}
                          />
                        </div>
                      )}

                      {sectionNotes.length > 0 ? (
                        <ul className="space-y-2">
                          {sectionNotes.map((note) => (
                            <NoteRow
                              key={note.id}
                              note={note}
                              editing={editingId === note.id}
                              editText={editText}
                              editInputRef={editInputRef}
                              bulkMode={bulkMode}
                              selected={selected.has(note.id)}
                              isDesk={isDesk}
                              onPointerDown={handlePointerDown}
                              onPointerUp={(e) => handlePointerUp(e, note)}
                              onEditTextChange={setEditText}
                              onSaveEdit={saveEdit}
                              onCancelEdit={cancelEdit}
                              onOpenMenu={openMenu}
                              onToggleSelect={toggleSelect}
                            />
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-bark/30 text-center py-3">No items</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {bulkMode && (
        <BulkActionBar
          count={selected.size}
          actions={bulkActions}
          onClearSelect={toggleBulk}
        />
      )}

      <ContextMenu
        open={menuOpen}
        items={menuItems}
        onClose={closeMenu}
        anchorRect={menuAnchor}
        isDesktop={isDesk}
      />

      <ConfirmDialog
        open={confirmOpen}
        message={confirmMsg}
        confirmLabel="Delete"
        danger
        onConfirm={() => {
          if (Array.isArray(pendingDelete)) {
            bulkDeleteNotes(pendingDelete);
            setBulkMode(false);
            setSelected(new Set());
          } else {
            deleteNote(pendingDelete);
          }
          setPendingDelete(null);
        }}
        onClose={() => { setConfirmOpen(false); setPendingDelete(null); }}
      />
    </div>
  );
}

// ── DateSection header ───────────────────────────────────────────────────────

function DateSection({ dateStr, label, count, isCollapsed, isPast, onToggle }) {
  const isToday = label === 'Today';

  return (
    <button
      onClick={onToggle}
      aria-label={`${isCollapsed ? 'Expand' : 'Collapse'} ${label}`}
      className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl transition-colors
        ${isToday
          ? 'bg-sage/10 hover:bg-sage/15'
          : isPast
            ? 'bg-cream hover:bg-sand/40'
            : 'bg-surface hover:bg-cream'}
      `}
    >
      <span className={`transition-transform ${isCollapsed ? '' : 'rotate-90'}`}>
        <I.ChevronRight width={14} height={14} className="text-bark/40" />
      </span>
      <span className={`text-sm font-bold ${isToday ? 'text-sage' : 'text-bark/70'}`}>
        {label}
      </span>
      {count > 0 && (
        <span className="text-xs text-bark/40 ml-auto">
          {count} {count === 1 ? 'item' : 'items'}
        </span>
      )}
    </button>
  );
}

// ── NoteRow ───────────────────────────────────────────────────────────────────

function NoteRow({
  note, editing, editText, editInputRef,
  bulkMode, selected, isDesk,
  onPointerDown, onPointerUp,
  onEditTextChange, onSaveEdit, onCancelEdit, onOpenMenu,
  onToggleSelect,
}) {
  const handleDotsClick = (e) => {
    e.stopPropagation();
    onOpenMenu(note, e.currentTarget.getBoundingClientRect());
  };

  const handleContextMenu = (e) => {
    if (!isDesk) return;
    e.preventDefault();
    onOpenMenu(note, { bottom: e.clientY, left: e.clientX });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter')  { e.preventDefault(); onSaveEdit(); }
    if (e.key === 'Escape') { e.preventDefault(); onCancelEdit(); }
  };

  return (
    <li
      className={`relative flex items-start gap-2 p-3 rounded-xl border transition-colors
        ${note.struck
          ? 'bg-cream border-sand/40 opacity-60'
          : 'bg-surface border-sand hover:border-sage/30'}
        ${selected ? 'ring-2 ring-sage/50 border-sage/40' : ''}
      `}
      onContextMenu={handleContextMenu}
    >
      {/* Bulk checkbox */}
      {bulkMode && (
        <button
          className={`flex-shrink-0 mt-0.5 ${selected ? 'text-sage' : 'text-bark/30'}`}
          aria-label={selected ? 'Deselect' : 'Select'}
          onClick={(e) => { e.stopPropagation(); onToggleSelect(note.id); }}
        >
          {selected
            ? <I.CheckboxChecked width={18} height={18} />
            : <I.Checkbox width={18} height={18} />
          }
        </button>
      )}

      {/* Text / inline edit */}
      <div
        className="flex-1 min-w-0"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
      >
        {editing ? (
          <input
            ref={editInputRef}
            type="text"
            value={editText}
            onChange={(e) => onEditTextChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={onSaveEdit}
            className="w-full text-sm font-semibold text-bark bg-transparent focus:outline-none"
          />
        ) : (
          <span className={`text-sm font-semibold text-bark break-words
            ${note.struck ? 'line-through text-bark/50' : ''}`}
          >
            {note.text}
          </span>
        )}
      </div>

      {/* 3-dot menu */}
      {!bulkMode && (
        <button
          data-menu-btn="true"
          onClick={handleDotsClick}
          className="flex-shrink-0 p-1 text-bark/30 hover:text-bark/60 transition-colors rounded-lg"
          aria-label="Note options"
        >
          <I.Dots width={16} height={16} />
        </button>
      )}
    </li>
  );
}
