import React, { useEffect, useRef } from 'react';

const TAG_OPTIONS = [
  { value: 'note',  label: 'Note',  color: 'bg-ocean/10 text-ocean hover:bg-ocean/20'  },
  { value: 'event', label: 'Event', color: 'bg-sage/10  text-sage  hover:bg-sage/20'   },
  { value: 'mood',  label: 'Mood',  color: 'bg-terracotta/10 text-terracotta hover:bg-terracotta/20' },
];

/**
 * Props:
 *   open: boolean
 *   anchorRect: DOMRect | null   — position near the 3-dot anchor
 *   onSelect: (tag: string) => void
 *   onClose: () => void
 */
export function SendToJournalPicker({ open, anchorRect, onSelect, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, onClose]);

  if (!open || !anchorRect) return null;

  return (
    <div
      ref={ref}
      style={{ position: 'fixed', top: anchorRect.bottom + 4, left: anchorRect.left }}
      className="z-50 flex gap-1 p-1.5 bg-surface border border-sand rounded-xl shadow-lg"
    >
      <span className="text-xs text-bark/40 self-center pr-1">Send as:</span>
      {TAG_OPTIONS.map(({ value, label, color }) => (
        <button
          key={value}
          onClick={() => onSelect(value)}
          className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors ${color}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
