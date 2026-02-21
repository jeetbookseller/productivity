/**
 * Clarify — Eisenhower Matrix section
 * 4 quadrants, drag-drop on desktop, quadrant-picker on mobile, bulk actions.
 */
import React, { useState, useRef, useCallback } from 'react';
import { useAppDataContext } from '../hooks/useAppData.js';
import { useDesk } from '../hooks/useResponsive.js';
import { QuickAdd } from '../components/QuickAdd.jsx';
import { StickyHeader } from '../components/StickyHeader.jsx';
import { BulkActionBar } from '../components/BulkActionBar.jsx';
import { ContextMenu } from '../components/ContextMenu.jsx';
import { EditModal } from '../components/EditModal.jsx';
import { ConfirmDialog } from '../components/ConfirmDialog.jsx';
import { LinkPicker } from '../components/LinkPicker.jsx';
import { I } from '../components/icons.jsx';
import { QUADS, CATS } from '../lib/utils.js';

const QUAD_ORDER = ['ui', 'ni', 'un', 'nn'];

export function Clarify() {
  const {
    todos, lists, focus,
    addTodo, editTodo, deleteTodo, toggleTodo, moveTodo, reorderTodo,
    linkChecklist, bulkDeleteTodos, bulkMoveTodos,
    addToFocus, removeFromFocus,
  } = useAppDataContext();
  const isDesk = useDesk();

  // Context menu
  const [menuOpen,   setMenuOpen]   = useState(false);
  const [menuTodo,   setMenuTodo]   = useState(null);
  const [menuAnchor, setMenuAnchor] = useState(null);

  // Edit modal
  const [editOpen,   setEditOpen]   = useState(false);
  const [editTodoId, setEditTodoId] = useState(null);
  const [editText,   setEditText]   = useState('');

  // Confirm dialog
  const [confirmOpen,   setConfirmOpen]   = useState(false);
  const [confirmMsg,    setConfirmMsg]    = useState('');
  const [pendingDelete, setPendingDelete] = useState(null);

  // Link picker
  const [linkOpen,      setLinkOpen]      = useState(false);
  const [linkTodoId,    setLinkTodoId]    = useState(null);
  const [linkCurrentId, setLinkCurrentId] = useState(null);

  // Mobile quadrant mover
  const [moveOpen,  setMoveOpen]  = useState(false);
  const [movingTodo, setMovingTodo] = useState(null);

  // Bulk select
  const [bulkMode,     setBulkMode]     = useState(false);
  const [selected,     setSelected]     = useState(new Set());
  const [bulkQuadMove, setBulkQuadMove] = useState(false);

  // Drag-drop (desktop)
  const dragItem = useRef(null);

  // ── Helpers ───────────────────────────────────────────────────────────────

  const openMenu = useCallback((todo, anchorRect) => {
    setMenuTodo(todo);
    setMenuAnchor(anchorRect);
    setMenuOpen(true);
  }, []);

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    setMenuTodo(null);
    setMenuAnchor(null);
  }, []);

  const menuItems = menuTodo ? [
    {
      label: menuTodo.done ? 'Mark undone' : 'Mark done',
      icon: <I.Check width={15} height={15} />,
      action: () => {
        toggleTodo(menuTodo.id);
      },
    },
    {
      label: 'Edit',
      icon: <I.Edit width={15} height={15} />,
      action: () => {
        setEditTodoId(menuTodo.id);
        setEditText(menuTodo.text);
        setEditOpen(true);
      },
    },
    {
      label: focus.includes(menuTodo.id) ? 'Remove from Focus' : 'Add to Focus',
      icon: <I.Zap width={15} height={15} />,
      action: () => {
        if (focus.includes(menuTodo.id)) removeFromFocus(menuTodo.id);
        else addToFocus(menuTodo.id);
      },
    },
    {
      label: 'Move quadrant',
      icon: <I.ArrowRight width={15} height={15} />,
      action: () => { setMovingTodo(menuTodo); setMoveOpen(true); },
    },
    {
      label: 'Link checklist',
      icon: <I.Link width={15} height={15} />,
      action: () => {
        setLinkTodoId(menuTodo.id);
        setLinkCurrentId(menuTodo.linkedList);
        setLinkOpen(true);
      },
    },
    {
      label: 'Delete',
      icon: <I.Trash width={15} height={15} />,
      danger: true,
      action: () => {
        setConfirmMsg('Delete this task?');
        setPendingDelete(menuTodo.id);
        setConfirmOpen(true);
      },
    },
  ] : [];

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleBulk = () => { setBulkMode((v) => !v); setSelected(new Set()); };

  const allTodosCount = todos.length;
  const selectAll = () => {
    setSelected(selected.size === allTodosCount ? new Set() : new Set(todos.map((t) => t.id)));
  };

  const bulkActions = [
    {
      label: 'Move',
      icon: <I.ArrowRight width={14} height={14} />,
      onClick: () => setBulkQuadMove(true),
    },
    {
      label: 'Delete',
      icon: <I.Trash width={14} height={14} />,
      danger: true,
      onClick: () => {
        setConfirmMsg(`Delete ${selected.size} task${selected.size !== 1 ? 's' : ''}?`);
        setPendingDelete([...selected]);
        setConfirmOpen(true);
      },
    },
  ];

  // ── Drag-drop (desktop) ───────────────────────────────────────────────────

  const handleDragStart = (e, quad, idx) => {
    dragItem.current = { quad, idx };
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e, quad, toIdx) => {
    e.preventDefault();
    if (!dragItem.current) return;
    if (dragItem.current.quad === quad) {
      reorderTodo(quad, dragItem.current.idx, toIdx);
    } else {
      const todo = todos.filter((t) => t.quad === dragItem.current.quad)[dragItem.current.idx];
      if (todo) moveTodo(todo.id, quad);
    }
    dragItem.current = null;
  };

  const handleDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full">
      <StickyHeader
        title="Clarify"
        bulkMode={bulkMode}
        allSelected={allTodosCount > 0 && selected.size === allTodosCount}
        onToggleBulk={toggleBulk}
        onSelectAll={selectAll}
      />

      <div className="flex-1 overflow-y-auto pb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
          {QUAD_ORDER.map((qKey) => {
            const q = QUADS[qKey];
            const qTodos = todos.filter((t) => t.quad === qKey);
            return (
              <QuadrantPanel
                key={qKey}
                quad={q}
                todos={qTodos}
                focus={focus}
                lists={lists}
                bulkMode={bulkMode}
                selected={selected}
                isDesk={isDesk}
                onAdd={(text) => addTodo(text, qKey)}
                onTap={(todo) => {
                  if (bulkMode) toggleSelect(todo.id);
                  else toggleTodo(todo.id);
                }}
                onOpenMenu={openMenu}
                onContextMenu={(todo, rect) => openMenu(todo, rect)}
                onDragStart={handleDragStart}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              />
            );
          })}
        </div>
      </div>

      {bulkMode && (
        <BulkActionBar
          count={selected.size}
          actions={bulkActions}
          onClearSelect={toggleBulk}
        />
      )}

      {/* Bulk quadrant move picker */}
      {bulkQuadMove && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
          <div className="absolute inset-0 bg-bark/50" onClick={() => setBulkQuadMove(false)} />
          <div className="relative bg-white w-full md:max-w-sm rounded-t-2xl md:rounded-2xl shadow-xl p-5 anim-in">
            <h3 className="text-base font-bold text-bark mb-4">Move to Quadrant</h3>
            {QUAD_ORDER.map((qKey) => (
              <button
                key={qKey}
                onClick={() => {
                  bulkMoveTodos([...selected], qKey);
                  setSelected(new Set());
                  setBulkMode(false);
                  setBulkQuadMove(false);
                }}
                className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl mb-2
                  font-semibold text-sm ${QUADS[qKey].bg} ${QUADS[qKey].border} border`}
              >
                {QUADS[qKey].label}
                <span className="text-xs text-bark/50 font-normal">{QUADS[qKey].sub}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mobile quadrant move */}
      {moveOpen && movingTodo && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
          <div className="absolute inset-0 bg-bark/50" onClick={() => setMoveOpen(false)} />
          <div className="relative bg-white w-full md:max-w-sm rounded-t-2xl md:rounded-2xl shadow-xl p-5 anim-in">
            <h3 className="text-base font-bold text-bark mb-4">Move to Quadrant</h3>
            {QUAD_ORDER.map((qKey) => (
              <button
                key={qKey}
                onClick={() => { moveTodo(movingTodo.id, qKey); setMoveOpen(false); setMovingTodo(null); }}
                className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl mb-2
                  font-semibold text-sm ${QUADS[qKey].bg} ${QUADS[qKey].border} border
                  ${movingTodo.quad === qKey ? 'ring-2 ring-sage/50' : ''}`}
              >
                {QUADS[qKey].label}
                <span className="text-xs text-bark/50 font-normal">{QUADS[qKey].sub}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <ContextMenu
        open={menuOpen}
        items={menuItems}
        onClose={closeMenu}
        anchorRect={menuAnchor}
        isDesktop={isDesk}
      />

      <EditModal
        open={editOpen}
        title="Edit task"
        value={editText}
        onSave={(text) => { if (editTodoId) editTodo(editTodoId, { text }); }}
        onClose={() => { setEditOpen(false); setEditTodoId(null); }}
      />

      <LinkPicker
        open={linkOpen}
        lists={lists}
        currentListId={linkCurrentId}
        onSelect={(listId) => { if (linkTodoId) linkChecklist(linkTodoId, listId); }}
        onClose={() => { setLinkOpen(false); setLinkTodoId(null); }}
      />

      <ConfirmDialog
        open={confirmOpen}
        message={confirmMsg}
        confirmLabel="Delete"
        danger
        onConfirm={() => {
          if (Array.isArray(pendingDelete)) {
            bulkDeleteTodos(pendingDelete);
            setBulkMode(false);
            setSelected(new Set());
          } else {
            deleteTodo(pendingDelete);
          }
          setPendingDelete(null);
        }}
        onClose={() => { setConfirmOpen(false); setPendingDelete(null); }}
      />
    </div>
  );
}

// ── QuadrantPanel ─────────────────────────────────────────────────────────────

function QuadrantPanel({
  quad, todos, focus, lists, bulkMode, selected, isDesk,
  onAdd, onTap, onOpenMenu, onDragStart, onDrop, onDragOver,
}) {
  return (
    <div
      className={`rounded-2xl border ${quad.bg} ${quad.border} flex flex-col min-h-[180px]`}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, quad.key, todos.length)}
    >
      {/* Quadrant header */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-bark">{quad.label}</h3>
            <p className="text-xs text-bark/50 font-semibold">{quad.sub}</p>
          </div>
          <span className="text-xs font-bold text-bark/40 bg-white/60 px-2 py-0.5 rounded-full">
            {todos.filter((t) => !t.done).length}
          </span>
        </div>
        <div className="mt-3">
          <QuickAdd onAdd={onAdd} placeholder={`Add to ${quad.label}…`} />
        </div>
      </div>

      {/* Task list */}
      <ul className="flex-1 px-3 pb-3 space-y-2">
        {todos.map((todo, idx) => (
          <TodoRow
            key={todo.id}
            todo={todo}
            idx={idx}
            quad={quad}
            isInFocus={focus.includes(todo.id)}
            linkedList={lists.find((l) => l.id === todo.linkedList)}
            bulkMode={bulkMode}
            selected={selected.has(todo.id)}
            isDesk={isDesk}
            onTap={() => onTap(todo)}
            onOpenMenu={(anchorRect) => onOpenMenu(todo, anchorRect)}
            onDragStart={(e) => onDragStart(e, quad.key, idx)}
            onDrop={(e) => onDrop(e, quad.key, idx)}
            onDragOver={onDragOver}
          />
        ))}
      </ul>
    </div>
  );
}

// ── TodoRow ───────────────────────────────────────────────────────────────────

function TodoRow({
  todo, idx, quad, isInFocus, linkedList,
  bulkMode, selected, isDesk,
  onTap, onOpenMenu, onDragStart, onDrop, onDragOver,
}) {
  const handleDotsClick = (e) => {
    e.stopPropagation();
    onOpenMenu(e.currentTarget.getBoundingClientRect());
  };

  const handleContextMenu = (e) => {
    if (!isDesk) return;
    e.preventDefault();
    onOpenMenu({ bottom: e.clientY, left: e.clientX });
  };

  return (
    <li
      className={`flex items-start gap-2 p-3 rounded-xl bg-white/80 border border-white/60
        shadow-sm cursor-pointer transition-all
        ${todo.done ? 'opacity-50' : ''}
        ${selected ? 'ring-2 ring-sage/50' : ''}
      `}
      draggable={isDesk && !bulkMode}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onClick={onTap}
      onContextMenu={handleContextMenu}
      aria-label={`Task: ${todo.text}`}
    >
      {/* Done indicator */}
      <span className={`flex-shrink-0 mt-0.5 ${todo.done ? 'text-sage' : 'text-bark/20'}`}>
        {bulkMode
          ? (selected
            ? <I.CheckboxChecked width={16} height={16} className="text-sage" />
            : <I.Checkbox width={16} height={16} />)
          : (todo.done
            ? <I.CheckboxChecked width={16} height={16} />
            : <I.Checkbox width={16} height={16} />)
        }
      </span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold text-bark break-words
          ${todo.done ? 'line-through text-bark/50' : ''}`}
        >
          {todo.text}
        </p>

        {/* Meta badges */}
        <div className="flex flex-wrap items-center gap-1.5 mt-1">
          {todo.cat && CATS[todo.cat] && (
            <span className="text-xs font-semibold text-bark/50">
              {CATS[todo.cat].emoji} {CATS[todo.cat].label}
            </span>
          )}
          {todo.deadline && (
            <span className="text-xs font-semibold text-bark/50 flex items-center gap-0.5">
              <I.Clock width={11} height={11} /> {todo.deadline}
            </span>
          )}
          {isInFocus && (
            <span className="text-xs font-bold text-ocean flex items-center gap-0.5">
              <I.Zap width={11} height={11} /> Focus
            </span>
          )}
          {linkedList && (
            <span className="text-xs font-semibold text-lavender flex items-center gap-0.5">
              <I.Link width={11} height={11} /> {linkedList.name}
            </span>
          )}
          {todo.poms > 0 && (
            <span className="text-xs font-semibold text-terracotta flex items-center gap-0.5">
              <I.Timer width={11} height={11} /> {todo.poms}
            </span>
          )}
        </div>

        {/* Subtasks */}
        {todo.subtasks && todo.subtasks.length > 0 && (
          <p className="text-xs text-bark/40 font-semibold mt-1">
            {todo.subtasks.filter((s) => s.done).length}/{todo.subtasks.length} subtasks
          </p>
        )}
      </div>

      {/* 3-dot */}
      {!bulkMode && (
        <button
          data-menu-btn="true"
          onClick={handleDotsClick}
          className="flex-shrink-0 p-1 text-bark/30 hover:text-bark/60 transition-colors rounded-lg"
          aria-label="Task options"
        >
          <I.Dots width={16} height={16} />
        </button>
      )}
    </li>
  );
}
