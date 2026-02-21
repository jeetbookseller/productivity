/**
 * StickyHeader — sticky section header with bulk-select checkbox
 * Left: checkbox (enters/exits bulk mode; when in bulk mode selects all/none)
 * Center: title
 * Right: optional actions slot
 */
import React from 'react';
import { I } from './icons.jsx';

export function StickyHeader({
  title,
  bulkMode = false,
  allSelected = false,
  someSelected = false,
  onToggleBulk,
  onSelectAll,
  actions,
}) {
  const handleCheckbox = () => {
    if (!bulkMode) {
      onToggleBulk();
    } else {
      onSelectAll();
    }
  };

  const checkboxIcon = bulkMode && allSelected
    ? <I.CheckboxChecked width={20} height={20} />
    : bulkMode && someSelected
      ? <I.CheckboxMinus width={20} height={20} />
      : <I.Checkbox width={20} height={20} />;

  return (
    <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3
      bg-cream border-b border-sand/70">
      {/* Bulk-select checkbox */}
      <button
        onClick={handleCheckbox}
        className={`flex-shrink-0 transition-colors
          ${bulkMode ? 'text-sage' : 'text-bark/30 hover:text-bark/60'}`}
        aria-label={bulkMode ? (allSelected ? 'Deselect all' : 'Select all') : 'Enter bulk select'}
      >
        {checkboxIcon}
      </button>

      {/* Title */}
      <h2 className="flex-1 text-base font-bold text-bark truncate">{title}</h2>

      {/* Right slot */}
      {actions && (
        <div className="flex items-center gap-1 flex-shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
