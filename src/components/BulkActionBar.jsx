/**
 * BulkActionBar — bottom action bar for bulk-select mode
 * Shows selected count, action buttons, and a clear (X) button
 */
import React from 'react';
import { I } from './icons.jsx';

export function BulkActionBar({ count, actions = [], onClearSelect }) {
  if (count === 0) return null;

  return (
    <div className="fixed bottom-16 left-0 right-0 z-30 flex items-center justify-between
      px-4 py-3 bg-bark text-cream shadow-lg md:bottom-0">
      <div className="flex items-center gap-2">
        <button
          onClick={onClearSelect}
          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          aria-label="Clear selection"
        >
          <I.X width={16} height={16} />
        </button>
        <span className="text-sm font-semibold">{count} selected</span>
      </div>

      <div className="flex items-center gap-1">
        {actions.map((action, idx) => (
          <button
            key={idx}
            onClick={action.onClick}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
              transition-colors
              ${action.danger
                ? 'text-terracotta hover:bg-terracotta/20'
                : 'text-cream hover:bg-white/10'
              }`}
          >
            {action.icon && <span>{action.icon}</span>}
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}
