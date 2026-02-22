/**
 * ConfirmDialog — confirm / info dialog with optional danger variant
 */
import React, { useState, useEffect } from 'react';

export function ConfirmDialog({
  open,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  onConfirm,
  onClose,
}) {
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

  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (phase === 'closed') return null;

  const animClass = phase === 'closing' ? 'anim-out' : 'anim-in';

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-bark/50" onClick={onClose} />

      {/* Panel */}
      <div className={`relative bg-surface rounded-2xl shadow-xl w-full max-w-sm p-5 ${animClass}`}>
        <p className="text-sm font-semibold text-bark mb-5 leading-relaxed">{message}</p>

        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-bark/60 hover:text-bark transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={handleConfirm}
            className={`px-5 py-2 text-sm font-semibold text-white rounded-xl hover:opacity-90 transition-opacity
              ${danger ? 'bg-terracotta' : 'bg-sage'}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
