/**
 * ContextMenu — unified context menu
 * Desktop: positioned panel near anchor point
 * Mobile: fixed bottom-sheet
 */
import React, { useEffect } from 'react';

export function ContextMenu({ open, items = [], onClose, anchorRect, isDesktop }) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  // Desktop: position near anchor; clamp to viewport
  let panelStyle = {};
  if (isDesktop && anchorRect) {
    const top = Math.min(anchorRect.bottom + 4, window.innerHeight - 220);
    const left = Math.min(anchorRect.left, window.innerWidth - 200);
    panelStyle = { position: 'fixed', top, left };
  }

  return (
    <>
      {/* Backdrop */}
      <div
        data-testid="cm-backdrop"
        className="fixed inset-0 z-40"
        onClick={onClose}
      />

      {/* Menu panel */}
      {isDesktop && anchorRect ? (
        // Desktop: positioned panel
        <div
          className="z-50 bg-white border border-sand rounded-xl shadow-lg py-1 min-w-[160px] anim-in"
          style={panelStyle}
        >
          {items.map((item, idx) => (
            <button
              key={idx}
              className={`w-full text-left px-4 py-2.5 text-sm font-semibold flex items-center gap-2 hover:bg-cream transition-colors
                ${item.danger ? 'text-terracotta' : 'text-bark'}`}
              onClick={() => { item.action(); onClose(); }}
            >
              {item.icon && <span className="opacity-70">{item.icon}</span>}
              {item.label}
            </button>
          ))}
        </div>
      ) : (
        // Mobile: bottom sheet
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-lg anim-in pb-safe">
          <div className="w-10 h-1 bg-sand rounded-full mx-auto mt-3 mb-2" />
          {items.map((item, idx) => (
            <button
              key={idx}
              className={`w-full text-left px-5 py-3.5 text-sm font-semibold flex items-center gap-3 border-b border-sand/50 last:border-0
                ${item.danger ? 'text-terracotta' : 'text-bark'}`}
              onClick={() => { item.action(); onClose(); }}
            >
              {item.icon && <span className="opacity-70">{item.icon}</span>}
              {item.label}
            </button>
          ))}
          <button
            className="w-full py-4 text-sm font-semibold text-bark/50 text-center"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      )}
    </>
  );
}
