/**
 * EditModal — universal text-edit modal
 * Single-line input or multiline textarea with Save / Cancel
 */
import React, { useState, useEffect, useRef } from 'react';

export function EditModal({
  open,
  title,
  value = '',
  placeholder,
  multiline = false,
  onSave,
  onClose,
}) {
  const [text, setText] = useState(value);
  const inputRef = useRef(null);
  const [phase, setPhase] = useState('closed'); // 'open' | 'closing' | 'closed'

  useEffect(() => {
    if (open) {
      setPhase('open');
    } else {
      setPhase((prev) => (prev === 'open' ? 'closing' : prev));
    }
  }, [open]);

  useEffect(() => {
    if (phase !== 'closing') return;
    const t = setTimeout(() => setPhase('closed'), 200);
    return () => clearTimeout(t);
  }, [phase]);

  // Re-sync when `value` prop changes (new item opened)
  useEffect(() => { setText(value); }, [value, open]);

  // Focus input on open
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  // Escape → discard
  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (phase === 'closed') return null;

  const animClass = phase === 'closing' ? 'anim-out' : 'anim-in';

  const handleSave = () => {
    onSave(text);
    onClose();
  };

  const handleKeyDown = (e) => {
    if (!multiline && e.key === 'Enter') {
      e.preventDefault();
      if (text.trim()) handleSave();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-bark/50" onClick={onClose} />

      {/* Panel */}
      <div className={`relative bg-surface rounded-2xl shadow-xl w-full max-w-md p-5 ${animClass}`}>
        {title && (
          <h3 className="text-base font-bold text-bark mb-3">{title}</h3>
        )}

        {multiline ? (
          <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={4}
            className="w-full border border-sand rounded-xl px-3 py-2.5 text-sm text-bark font-semibold
              resize-none focus:outline-none focus:ring-2 focus:ring-sage/40 bg-cream"
          />
        ) : (
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full border border-sand rounded-xl px-3 py-2.5 text-sm text-bark font-semibold
              focus:outline-none focus:ring-2 focus:ring-sage/40 bg-cream"
          />
        )}

        <div className="flex gap-2 mt-4 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-bark/60 hover:text-bark transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!text.trim()}
            className="px-5 py-2 text-sm font-semibold bg-sage text-white rounded-xl
              disabled:opacity-40 hover:opacity-90 transition-opacity"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
