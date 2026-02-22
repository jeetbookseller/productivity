/**
 * Capture — Bullet Journal section
 * Brain-dump quick notes with inline edit, 3-dot menu, bulk select, and auto-clear.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAppDataContext } from '../hooks/useAppData.js';
import { useDesk } from '../hooks/useResponsive.js';
import { QuickAdd } from '../components/QuickAdd.jsx';
import { StickyHeader } from '../components/StickyHeader.jsx';
import { BulkActionBar } from '../components/BulkActionBar.jsx';
import { ContextMenu } from '../components/ContextMenu.jsx';
import { ConfirmDialog } from '../components/ConfirmDialog.jsx';
import { I } from '../components/icons.jsx';
import { shareItem } from '../lib/utils.js';

export function Capture() {
  const {
    notes, addNote, editNote, deleteNote, strikeNote, promoteNote,
    bulkDeleteNotes, bulkStrikeNotes, clearStruckNotes,
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

  // Auto-clear struck notes older than 30 days on mount
  useEffect(() => { clearStruckNotes(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Focus inline edit input when editing starts
  useEffect(() => {
    if (editingId) setTimeout(() => editInputRef.current?.focus(), 30);
  }, [editingId]);

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
    setSelected(
      selected.size === notes.length
        ? new Set()
        : new Set(notes.map((n) => n.id))
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
        <div className="px-4 py-3">
          <QuickAdd onAdd={addNote} placeholder="Brain-dump anything…" />
        </div>

        {notes.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
            <I.Clock width={40} height={40} className="text-bark/15" />
            <p className="text-sm font-semibold text-bark/40">
              Nothing captured yet — add a thought above
            </p>
          </div>
        ) : (
          <ul className="px-4 space-y-2">
            {notes.map((note) => (
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
