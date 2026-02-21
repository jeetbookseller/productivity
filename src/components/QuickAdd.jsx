/**
 * QuickAdd — single-line input for fast note/task creation
 */
import React, { useState, useRef } from 'react';
import { I } from './icons.jsx';

export function QuickAdd({ onAdd, placeholder = 'Add item…' }) {
  const [text, setText] = useState('');
  const inputRef = useRef(null);

  const submit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setText('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-white border border-sand rounded-xl shadow-sm">
      <input
        ref={inputRef}
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="flex-1 text-sm font-semibold text-bark placeholder-bark/40
          focus:outline-none bg-transparent"
      />
      <button
        onClick={submit}
        disabled={!text.trim()}
        className="flex items-center justify-center w-7 h-7 rounded-lg bg-sage text-white
          disabled:opacity-30 hover:opacity-90 transition-opacity flex-shrink-0"
        aria-label="Add"
      >
        <I.Plus width={14} height={14} />
      </button>
    </div>
  );
}
