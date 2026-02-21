/**
 * Confirm — Checklists section
 * Create named checklists with sections, tap-to-toggle items, 2-col on tablet.
 */
import React, { useState, useCallback } from 'react';
import { useAppDataContext } from '../hooks/useAppData.js';
import { useDesk } from '../hooks/useResponsive.js';
import { QuickAdd } from '../components/QuickAdd.jsx';
import { StickyHeader } from '../components/StickyHeader.jsx';
import { BulkActionBar } from '../components/BulkActionBar.jsx';
import { ContextMenu } from '../components/ContextMenu.jsx';
import { EditModal } from '../components/EditModal.jsx';
import { ConfirmDialog } from '../components/ConfirmDialog.jsx';
import { I } from '../components/icons.jsx';

export function Confirm() {
  const {
    lists,
    addList, editList, deleteList,
    addItem, editItem, deleteItem, toggleItem, bulkDeleteItems,
  } = useAppDataContext();
  const isDesk = useDesk();

  // Active list (expanded view)
  const [activeListId, setActiveListId] = useState(null);

  // Context menu — list level
  const [listMenuOpen,   setListMenuOpen]   = useState(false);
  const [listMenuTarget, setListMenuTarget] = useState(null);
  const [listMenuAnchor, setListMenuAnchor] = useState(null);

  // Context menu — item level
  const [itemMenuOpen,   setItemMenuOpen]   = useState(false);
  const [itemMenuTarget, setItemMenuTarget] = useState(null);
  const [itemMenuAnchor, setItemMenuAnchor] = useState(null);
  const [itemMenuList,   setItemMenuList]   = useState(null);

  // Edit modals
  const [editListOpen, setEditListOpen] = useState(false);
  const [editListId,   setEditListId]   = useState(null);
  const [editListName, setEditListName] = useState('');

  const [editItemOpen, setEditItemOpen] = useState(false);
  const [editItemData, setEditItemData] = useState(null); // { listId, itemId, text }

  // Confirm dialog
  const [confirmOpen,   setConfirmOpen]   = useState(false);
  const [confirmMsg,    setConfirmMsg]    = useState('');
  const [confirmAction, setConfirmAction] = useState(null);

  // Bulk select (per list)
  const [bulkListId, setBulkListId] = useState(null);
  const [selected,   setSelected]   = useState(new Set());

  // ── Helpers ───────────────────────────────────────────────────────────────

  const openListMenu = useCallback((list, anchorRect) => {
    setListMenuTarget(list);
    setListMenuAnchor(anchorRect);
    setListMenuOpen(true);
  }, []);

  const listMenuItems = listMenuTarget ? [
    {
      label: 'Rename',
      icon: <I.Edit width={15} height={15} />,
      action: () => { setEditListId(listMenuTarget.id); setEditListName(listMenuTarget.name); setEditListOpen(true); },
    },
    {
      label: 'Delete list',
      icon: <I.Trash width={15} height={15} />,
      danger: true,
      action: () => {
        setConfirmMsg(`Delete "${listMenuTarget.name}" and all its items?`);
        setConfirmAction(() => () => deleteList(listMenuTarget.id));
        setConfirmOpen(true);
      },
    },
  ] : [];

  const openItemMenu = useCallback((listId, item, anchorRect) => {
    setItemMenuList(listId);
    setItemMenuTarget(item);
    setItemMenuAnchor(anchorRect);
    setItemMenuOpen(true);
  }, []);

  const itemMenuItems = itemMenuTarget ? [
    {
      label: 'Edit',
      icon: <I.Edit width={15} height={15} />,
      action: () => {
        setEditItemData({ listId: itemMenuList, itemId: itemMenuTarget.id, text: itemMenuTarget.text });
        setEditItemOpen(true);
      },
    },
    {
      label: 'Delete',
      icon: <I.Trash width={15} height={15} />,
      danger: true,
      action: () => {
        setConfirmMsg('Delete this item?');
        setConfirmAction(() => () => deleteItem(itemMenuList, itemMenuTarget.id));
        setConfirmOpen(true);
      },
    },
  ] : [];

  const toggleBulkItem = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const exitBulk = () => { setBulkListId(null); setSelected(new Set()); };

  const activeList = lists.find((l) => l.id === activeListId);

  return (
    <div className="flex flex-col h-full">
      <StickyHeader
        title="Confirm"
        bulkMode={bulkListId !== null}
        allSelected={
          bulkListId !== null &&
          (lists.find((l) => l.id === bulkListId)?.items.length || 0) > 0 &&
          selected.size === (lists.find((l) => l.id === bulkListId)?.items.length || 0)
        }
        onToggleBulk={exitBulk}
        onSelectAll={() => {
          const list = lists.find((l) => l.id === bulkListId);
          if (!list) return;
          setSelected(
            selected.size === list.items.length
              ? new Set()
              : new Set(list.items.map((i) => i.id))
          );
        }}
      />

      <div className="flex-1 overflow-y-auto pb-4">
        {/* Create new checklist */}
        <div className="px-4 py-3">
          <QuickAdd onAdd={addList} placeholder="New checklist…" />
        </div>

        {lists.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm font-semibold text-bark/40">
            No checklists yet — create one above
          </p>
        ) : (
          <div className="px-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {lists.map((list) => (
              <ChecklistCard
                key={list.id}
                list={list}
                isActive={activeListId === list.id}
                bulkMode={bulkListId === list.id}
                selected={selected}
                isDesk={isDesk}
                onToggleActive={() => setActiveListId(activeListId === list.id ? null : list.id)}
                onOpenListMenu={openListMenu}
                onAddItem={(text) => addItem(list.id, text)}
                onToggleItem={(itemId) => toggleItem(list.id, itemId)}
                onOpenItemMenu={(item, rect) => openItemMenu(list.id, item, rect)}
                onToggleBulk={() => {
                  if (bulkListId === list.id) exitBulk();
                  else { setBulkListId(list.id); setSelected(new Set()); }
                }}
                onToggleSelectItem={toggleBulkItem}
              />
            ))}
          </div>
        )}
      </div>

      {/* Bulk action bar */}
      {bulkListId !== null && (
        <BulkActionBar
          count={selected.size}
          actions={[{
            label: 'Delete',
            icon: <I.Trash width={14} height={14} />,
            danger: true,
            onClick: () => {
              setConfirmMsg(`Delete ${selected.size} item${selected.size !== 1 ? 's' : ''}?`);
              setConfirmAction(() => () => { bulkDeleteItems(bulkListId, [...selected]); exitBulk(); });
              setConfirmOpen(true);
            },
          }]}
          onClearSelect={exitBulk}
        />
      )}

      <ContextMenu
        open={listMenuOpen}
        items={listMenuItems}
        onClose={() => { setListMenuOpen(false); setListMenuTarget(null); }}
        anchorRect={listMenuAnchor}
        isDesktop={isDesk}
      />

      <ContextMenu
        open={itemMenuOpen}
        items={itemMenuItems}
        onClose={() => { setItemMenuOpen(false); setItemMenuTarget(null); }}
        anchorRect={itemMenuAnchor}
        isDesktop={isDesk}
      />

      <EditModal
        open={editListOpen}
        title="Rename checklist"
        value={editListName}
        onSave={(name) => { if (editListId) editList(editListId, name); }}
        onClose={() => { setEditListOpen(false); setEditListId(null); }}
      />

      <EditModal
        open={editItemOpen}
        title="Edit item"
        value={editItemData?.text || ''}
        onSave={(text) => {
          if (editItemData) editItem(editItemData.listId, editItemData.itemId, { text });
        }}
        onClose={() => { setEditItemOpen(false); setEditItemData(null); }}
      />

      <ConfirmDialog
        open={confirmOpen}
        message={confirmMsg}
        confirmLabel="Delete"
        danger
        onConfirm={() => { confirmAction?.(); setConfirmAction(null); }}
        onClose={() => { setConfirmOpen(false); setConfirmAction(null); }}
      />
    </div>
  );
}

// ── ChecklistCard ─────────────────────────────────────────────────────────────

function ChecklistCard({
  list, isActive, bulkMode, selected, isDesk,
  onToggleActive, onOpenListMenu, onAddItem, onToggleItem,
  onOpenItemMenu, onToggleBulk, onToggleSelectItem,
}) {
  const done  = list.items.filter((i) => i.done).length;
  const total = list.items.length;
  const pct   = total > 0 ? Math.round((done / total) * 100) : 0;

  // Group items by section
  const sections = [...new Set(list.items.map((i) => i.section || ''))];

  return (
    <div className="bg-white border border-sand rounded-2xl overflow-hidden shadow-sm">
      {/* Card header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-sand/60">
        <button
          onClick={onToggleBulk}
          className={`flex-shrink-0 ${bulkMode ? 'text-sage' : 'text-bark/30 hover:text-bark/60'}`}
          aria-label="Toggle bulk select"
        >
          <I.Checkbox width={18} height={18} />
        </button>
        <button
          onClick={onToggleActive}
          className="flex-1 text-left font-bold text-sm text-bark truncate"
          aria-label={`Checklist: ${list.name}`}
        >
          {list.name}
        </button>
        <span className="text-xs font-semibold text-bark/40 flex-shrink-0">{done}/{total}</span>
        <button
          onClick={(e) => { e.stopPropagation(); onOpenListMenu(list, e.currentTarget.getBoundingClientRect()); }}
          className="p-1 text-bark/30 hover:text-bark/60 transition-colors rounded-lg flex-shrink-0"
          aria-label="List options"
        >
          <I.Dots width={15} height={15} />
        </button>
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div className="h-1 bg-sand/40">
          <div
            className="h-full bg-sage transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      {/* Items */}
      <div className="px-2 py-2">
        {sections.map((section) => {
          const sectionItems = list.items.filter((i) => (i.section || '') === section);
          return (
            <div key={section}>
              {section && (
                <p className="text-xs font-bold text-bark/40 px-2 py-1.5 uppercase tracking-wide">
                  {section}
                </p>
              )}
              {sectionItems.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center gap-2 px-2 py-2 rounded-xl transition-colors cursor-pointer
                    hover:bg-cream ${selected.has(item.id) ? 'bg-sage/10' : ''}`}
                  onClick={() => {
                    if (bulkMode) onToggleSelectItem(item.id);
                    else onToggleItem(item.id);
                  }}
                  aria-label={`Item: ${item.text}`}
                >
                  <span className={`flex-shrink-0 ${item.done ? 'text-sage' : 'text-bark/30'}`}>
                    {bulkMode
                      ? (selected.has(item.id)
                        ? <I.CheckboxChecked width={16} height={16} className="text-sage" />
                        : <I.Checkbox width={16} height={16} />)
                      : (item.done
                        ? <I.CheckboxChecked width={16} height={16} />
                        : <I.Checkbox width={16} height={16} />)
                    }
                  </span>
                  <span className={`flex-1 text-sm font-semibold text-bark
                    ${item.done ? 'line-through text-bark/40' : ''}`}
                  >
                    {item.text}
                  </span>
                  {!bulkMode && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenItemMenu(item, e.currentTarget.getBoundingClientRect());
                      }}
                      className="text-bark/30 hover:text-bark/60 p-1 rounded-lg transition-colors flex-shrink-0"
                      aria-label="Item options"
                    >
                      <I.Dots width={14} height={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          );
        })}

        {/* Quick add item */}
        <div className="mt-2 px-2">
          <QuickAdd onAdd={onAddItem} placeholder="Add item…" />
        </div>
      </div>
    </div>
  );
}
