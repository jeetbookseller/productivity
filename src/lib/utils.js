/**
 * utils.js — shared utility functions and constants
 */

// ── uid ────────────────────────────────────────────────────────────────────────

export function uid() {
  return crypto.randomUUID();
}

// ── Toast notifications ────────────────────────────────────────────────────────

const TOAST_DURATION = 2800;

export function notify(msg, type = 'info') {
  if (typeof document === 'undefined') return;

  let container = document.getElementById('ph-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'ph-toast-container';
    container.style.cssText =
      'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);' +
      'z-index:9999;display:flex;flex-direction:column;align-items:center;gap:8px;pointer-events:none;';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.textContent = msg;
  const bg = type === 'error' ? '#E07A5F' : type === 'success' ? '#7CB69D' : '#3D352D';
  toast.style.cssText =
    `background:${bg};color:#fff;padding:10px 18px;border-radius:20px;` +
    'font-size:14px;font-family:Nunito,sans-serif;font-weight:600;' +
    'box-shadow:0 2px 12px rgba(0,0,0,.18);opacity:1;transition:opacity .3s;';
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 320);
  }, TOAST_DURATION);
}

// ── Browser Notification permission ───────────────────────────────────────────

export async function reqNotifyPerm() {
  if (typeof Notification === 'undefined') return 'denied';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  return Notification.requestPermission();
}

// ── Web Share with clipboard fallback ─────────────────────────────────────────

export async function shareItem(text, title = 'Productivity Hub') {
  if (navigator.share) {
    try {
      await navigator.share({ title, text });
      return true;
    } catch (e) {
      if (e.name === 'AbortError') return false;
      // Fall through to clipboard
    }
  }
  // Clipboard fallback
  try {
    await navigator.clipboard.writeText(text);
    notify('Copied to clipboard', 'success');
    return true;
  } catch {
    notify('Could not share or copy', 'error');
    return false;
  }
}

// ── File download ──────────────────────────────────────────────────────────────

export function dlFile(filename, content, mimeType = 'application/json') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

// ── Timer presets ──────────────────────────────────────────────────────────────

export const PRESETS = {
  classic: { work: 25, short: 5, long: 15, label: 'Classic' },
  long:    { work: 50, short: 10, long: 20, label: 'Long' },
  short:   { work: 15, short: 3, long: 10, label: 'Short' },
  custom:  null,
};

// ── Eisenhower quadrant metadata ───────────────────────────────────────────────

export const QUADS = {
  ui: {
    key: 'ui',
    label: 'Do First',
    sub: 'Urgent + Important',
    color: 'terracotta',
    bg: 'bg-terracotta/10',
    border: 'border-terracotta/30',
    badge: 'bg-terracotta text-white',
  },
  ni: {
    key: 'ni',
    label: 'Schedule',
    sub: 'Not Urgent + Important',
    color: 'ocean',
    bg: 'bg-ocean/10',
    border: 'border-ocean/30',
    badge: 'bg-ocean text-white',
  },
  un: {
    key: 'un',
    label: 'Delegate',
    sub: 'Urgent + Not Important',
    color: 'sand',
    bg: 'bg-sand/50',
    border: 'border-sand',
    badge: 'bg-sand text-bark',
  },
  nn: {
    key: 'nn',
    label: 'Eliminate',
    sub: 'Not Urgent + Not Important',
    color: 'lavender',
    bg: 'bg-lavender/10',
    border: 'border-lavender/30',
    badge: 'bg-lavender text-white',
  },
};

// ── Category metadata ──────────────────────────────────────────────────────────

export const CATS = {
  work:     { key: 'work',     label: 'Work',     emoji: '💼' },
  personal: { key: 'personal', label: 'Personal', emoji: '🏠' },
  health:   { key: 'health',   label: 'Health',   emoji: '💪' },
  learning: { key: 'learning', label: 'Learning', emoji: '📚' },
};
