/**
 * LinkPicker — modal to pick a checklist and link it to a Clarify task
 * Shows "None" option at top to unlink, then all available lists
 */
import React, { useEffect } from 'react';
import { I } from './icons.jsx';

export function LinkPicker({ open, lists = [], currentListId, onSelect, onClose }) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const handlePick = (listId) => {
    onSelect(listId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-bark/50" onClick={onClose} />

      {/* Panel */}
      <div className="relative bg-surface w-full md:max-w-sm rounded-t-2xl md:rounded-2xl
        shadow-xl max-h-[70vh] flex flex-col anim-in">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-sand">
          <h3 className="text-base font-bold text-bark">Link Checklist</h3>
          <button onClick={onClose} className="text-bark/40 hover:text-bark transition-colors">
            <I.X width={20} height={20} />
          </button>
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1 py-2">
          {/* None / unlink option */}
          <button
            onClick={() => handlePick(null)}
            className={`w-full flex items-center gap-3 px-5 py-3 text-sm font-semibold
              transition-colors text-left
              ${!currentListId
                ? 'text-sage bg-sage/10'
                : 'text-bark/50 hover:bg-cream'
              }`}
          >
            <I.Unlink width={16} height={16} />
            None
            {!currentListId && <I.Check width={14} height={14} className="ml-auto text-sage" />}
          </button>

          {lists.map((list) => (
            <button
              key={list.id}
              onClick={() => handlePick(list.id)}
              className={`w-full flex items-center gap-3 px-5 py-3 text-sm font-semibold
                transition-colors text-left border-t border-sand/30
                ${list.id === currentListId
                  ? 'text-sage bg-sage/10'
                  : 'text-bark hover:bg-cream'
                }`}
            >
              <I.Link width={16} height={16} className="flex-shrink-0" />
              <span className="flex-1 truncate">{list.name}</span>
              {list.id === currentListId && (
                <I.Check width={14} height={14} className="ml-auto text-sage flex-shrink-0" />
              )}
            </button>
          ))}

          {lists.length === 0 && (
            <p className="px-5 py-4 text-sm text-bark/40 font-semibold text-center">
              No checklists yet
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
