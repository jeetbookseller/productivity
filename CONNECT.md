# Integration: Friction Journal ↔ Productivity Hub

This document is the authoritative implementation guide for connecting Friction Journal
with Productivity Hub. Both apps share one Supabase project, stay as separate PWAs,
but allow cross-app sending between PH's Capture tab (notes) and FJ's Rapid Log.

This file covers **work to be done in this repo (Productivity Hub)**.
See `friction-journal/CONNECT.md` for the parallel work in that repo.

---

## Summary

- **Single connection point**: PH Capture notes ↔ FJ Rapid Log entries. No other data crosses.
- **Sending creates a copy** — source entry stays in place; destination gets a new independent entry.
- **Sent indicator** — source note shows a `✓ Journal` badge after sending; menu item becomes disabled.
- **Tag picker** — when sending PH → FJ, user picks a tag (`note` / `event` / `mood`).
- **Deep-link toggle** — a `Personal` button in the PH header opens Friction Journal.

---

## Phase 1 — Shared Supabase (minimal PH changes)

PH already has auth and Supabase configured. The only PH changes for Phase 1 are
env-var related — making it easy for FJ to point to the same project.

### 1.1 Add `VITE_OTHER_APP_URL` to `.env.example`

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_OTHER_APP_URL=https://jeetbookseller.github.io/friction-journal/
```

In local dev `.env.local`:
```
VITE_OTHER_APP_URL=http://localhost:5174
```

No other PH code changes are needed for Phase 1. FJ will use the **same**
`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` values. Because both apps share
one Supabase project and PH's `user_data` RLS enforces `auth.uid() = user_id`,
FJ can read/write PH's `user_data` table using its own authenticated session.

---

## Phase 2 — "Send to Journal" in Capture

### 2.1 Note data model (no migration required)

PH notes are stored in Supabase `user_data` as a JSON blob:
- `key = 'notes'`
- `value = [{id, text, date, crAt, struck, ...}, ...]`

Add two optional fields to each note object (jsonb is flexible — no schema migration needed):
- `sentToFJ: boolean` — true once sent to Friction Journal
- `sentToFJAt: number` — epoch ms timestamp when it was sent

### 2.2 Create `src/lib/sendToFrictionJournal.js`

This module inserts a row directly into FJ's `rapid_logs` table using the shared
Supabase client. Both apps use the same project, so the table is accessible.

```js
import { supabase } from './supabase.js';

/**
 * Copies a PH capture note into FJ's rapid_logs table.
 * @param {object} note - The PH note object { id, text, date, crAt, struck }
 * @param {'note'|'event'|'mood'} tag - Tag chosen by the user in the picker
 * @param {string} userId - The authenticated user's UUID
 * @returns {{ success: boolean, error?: string }}
 */
export async function sendToFrictionJournal(note, tag, userId) {
  if (!supabase) return { success: false, error: 'Supabase not configured' };

  const now = Date.now();

  const { error } = await supabase
    .from('rapid_logs')
    .insert({
      uuid: crypto.randomUUID(),
      tag,
      body: note.text,
      user_id: userId,
      created_at: now,
      updated_at: now,
      deleted_at: null,
      sent_to_ph: 0,
      sent_to_ph_at: null,
    });

  if (error) return { success: false, error: error.message };
  return { success: true };
}
```

### 2.3 Create `src/components/SendToJournalPicker.jsx`

A small inline popover with three tag pill buttons. Appears anchored near the
3-dot menu button; closes on selection or outside click.

```jsx
import React, { useEffect, useRef } from 'react';

const TAG_OPTIONS = [
  { value: 'note',  label: 'Note',  color: 'bg-ocean/10 text-ocean   hover:bg-ocean/20'  },
  { value: 'event', label: 'Event', color: 'bg-sage/10  text-sage    hover:bg-sage/20'   },
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
```

### 2.4 Add `stampNote` to `src/hooks/useAppData.js`

Locate the notes CRUD section of `useAppData.js`. Add a `stampNote` function
that merges arbitrary fields onto a note by id without triggering a full replace:

```js
// Inside the useAppData hook, alongside addNote/editNote/deleteNote:
const stampNote = useCallback((id, fields) => {
  setNotes((prev) =>
    prev.map((n) => (n.id === id ? { ...n, ...fields } : n))
  );
}, [setNotes]);

// Expose through context value and AppDataContext:
// stampNote,
```

Also destructure `stampNote` in the context value object and in `useAppDataContext`.

### 2.5 Modify `src/sections/Capture.jsx`

**New imports at the top:**
```jsx
import { sendToFrictionJournal } from '../lib/sendToFrictionJournal.js';
import { SendToJournalPicker } from '../components/SendToJournalPicker.jsx';
import { useAuthContext } from '../components/AuthProvider.jsx';
```

**New state inside `Capture()` component:**
```jsx
const { session } = useAuthContext();
const [pickerOpen,   setPickerOpen]   = useState(false);
const [pickerNote,   setPickerNote]   = useState(null);
const [pickerAnchor, setPickerAnchor] = useState(null);
const [sendingId,    setSendingId]    = useState(null);
```

**New destructure from `useAppDataContext()`:**
```jsx
const { ..., stampNote } = useAppDataContext();
```

**New menu item** — insert into the `menuItems` array after `Copy text`,
before `Strikethrough`:
```jsx
{
  label: menuNote?.sentToFJ ? '✓ Sent to Journal' : 'Send to Journal',
  icon: <I.ExternalLink width={15} height={15} />,
  disabled: !!menuNote?.sentToFJ,
  action: () => {
    setPickerNote(menuNote);
    setPickerAnchor(menuAnchor);   // reuse the menu's anchor rect
    setPickerOpen(true);
    closeMenu();
  },
},
```

**Tag selection handler:**
```jsx
const handleSendToJournal = async (tag) => {
  setPickerOpen(false);
  if (!pickerNote || !session) return;
  setSendingId(pickerNote.id);

  const result = await sendToFrictionJournal(pickerNote, tag, session.user.id);

  if (result.success) {
    stampNote(pickerNote.id, { sentToFJ: true, sentToFJAt: Date.now() });
  } else {
    // Surface the error. Use whatever toast/alert pattern exists in the app.
    // Example: window.alert(`Could not send: ${result.error}`);
  }

  setSendingId(null);
  setPickerNote(null);
  setPickerAnchor(null);
};
```

**Add picker to the render output** (place just before the closing `</div>` of the
outer container, alongside ContextMenu and ConfirmDialog):
```jsx
<SendToJournalPicker
  open={pickerOpen}
  anchorRect={pickerAnchor}
  onSelect={handleSendToJournal}
  onClose={() => { setPickerOpen(false); setPickerNote(null); }}
/>
```

**Add `✓ Journal` badge to `NoteRow`** — inside the `NoteRow` component, between
the text area and the 3-dot button:
```jsx
{note.sentToFJ && !bulkMode && (
  <span className="flex-shrink-0 text-xs font-medium text-sage/70">✓ Journal</span>
)}
```

### 2.6 Add icons to `src/components/icons.jsx`

```jsx
ExternalLink: (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
),

BookOpen: (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
    <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" />
    <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
  </svg>
),
```

---

## Phase 3 — Deep-link toggle

### 3.1 Add "Personal" button to the header in `src/App.jsx`

Locate the header/navigation bar in `App.jsx`. Add a link on the right side
(alongside the existing theme toggle and settings icon):

```jsx
const otherAppUrl =
  import.meta.env.VITE_OTHER_APP_URL ||
  'https://jeetbookseller.github.io/friction-journal/';

// In JSX:
<a
  href={otherAppUrl}
  className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-bark/50
             hover:text-bark/80 transition-colors rounded-lg hover:bg-cream"
  aria-label="Open Friction Journal"
>
  <I.BookOpen width={14} height={14} />
  <span>Personal</span>
</a>
```

Open in the **same tab** (`href`, no `target="_blank"`) — both are PWAs and browser
history handles back-navigation correctly. Feels like one continuous app.

---

## Files changed in this repo

| File | Change |
|------|--------|
| `.env.example` | Add `VITE_OTHER_APP_URL` |
| `src/lib/sendToFrictionJournal.js` | New — inserts into FJ's `rapid_logs` |
| `src/components/SendToJournalPicker.jsx` | New — tag picker popover |
| `src/hooks/useAppData.js` | Add `stampNote` function + context exposure |
| `src/sections/Capture.jsx` | Add send logic, picker state, menu item, badge |
| `src/components/icons.jsx` | Add `ExternalLink`, `BookOpen` icons |
| `src/App.jsx` | Add `Personal` deep-link button to header |

---

## Testing checklist

- [ ] `npm test` — all 45 existing tests still pass
- [ ] Sign in; open Capture; add a note; open 3-dot menu → `Send to Journal` item visible and enabled
- [ ] Click `Send to Journal` → `SendToJournalPicker` appears with Note / Event / Mood pills
- [ ] Select `Event` → note shows `✓ Journal` badge; menu item now reads `✓ Sent to Journal` (disabled)
- [ ] Open Friction Journal → entry appears in Rapid Log with `event` tag and correct body text
- [ ] Clicking `Send to Journal` on an already-sent note does nothing (disabled)
- [ ] Sending fails gracefully (e.g. revoke Supabase key temporarily) → error surfaced, badge NOT applied
- [ ] `Personal` header button navigates to FJ URL
- [ ] All existing Capture functionality unaffected: bulk select, strike, promote to Clarify, delete
- [ ] `npm test` — all tests still pass after changes
