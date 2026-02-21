/**
 * icons.jsx — SVG icon system
 * Usage: import { I } from './icons.jsx'; then <I.Plus className="w-4 h-4" />
 */

function Plus({ width = 18, height = 18, ...props }) {
  return (
    <svg viewBox="0 0 24 24" width={width} height={height} fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...props}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function X({ width = 18, height = 18, ...props }) {
  return (
    <svg viewBox="0 0 24 24" width={width} height={height} fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...props}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function Check({ width = 18, height = 18, ...props }) {
  return (
    <svg viewBox="0 0 24 24" width={width} height={height} fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function Dots({ width = 18, height = 18, ...props }) {
  return (
    <svg viewBox="0 0 24 24" width={width} height={height} fill="currentColor" {...props}>
      <circle cx="12" cy="5" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="12" cy="19" r="1.5" />
    </svg>
  );
}

function Trash({ width = 18, height = 18, ...props }) {
  return (
    <svg viewBox="0 0 24 24" width={width} height={height} fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  );
}

function Edit({ width = 18, height = 18, ...props }) {
  return (
    <svg viewBox="0 0 24 24" width={width} height={height} fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function Eye({ width = 18, height = 18, ...props }) {
  return (
    <svg viewBox="0 0 24 24" width={width} height={height} fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function ChevronDown({ width = 18, height = 18, ...props }) {
  return (
    <svg viewBox="0 0 24 24" width={width} height={height} fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function ChevronRight({ width = 18, height = 18, ...props }) {
  return (
    <svg viewBox="0 0 24 24" width={width} height={height} fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function ArrowRight({ width = 18, height = 18, ...props }) {
  return (
    <svg viewBox="0 0 24 24" width={width} height={height} fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

function Share({ width = 18, height = 18, ...props }) {
  return (
    <svg viewBox="0 0 24 24" width={width} height={height} fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

function Clock({ width = 18, height = 18, ...props }) {
  return (
    <svg viewBox="0 0 24 24" width={width} height={height} fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function Zap({ width = 18, height = 18, ...props }) {
  return (
    <svg viewBox="0 0 24 24" width={width} height={height} fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function Checkbox({ width = 18, height = 18, ...props }) {
  return (
    <svg viewBox="0 0 24 24" width={width} height={height} fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="3" width="18" height="18" rx="3" />
    </svg>
  );
}

function CheckboxChecked({ width = 18, height = 18, ...props }) {
  return (
    <svg viewBox="0 0 24 24" width={width} height={height} fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <polyline points="7 13 10 16 17 8" />
    </svg>
  );
}

function CheckboxMinus({ width = 18, height = 18, ...props }) {
  return (
    <svg viewBox="0 0 24 24" width={width} height={height} fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  );
}

function Link({ width = 18, height = 18, ...props }) {
  return (
    <svg viewBox="0 0 24 24" width={width} height={height} fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function Unlink({ width = 18, height = 18, ...props }) {
  return (
    <svg viewBox="0 0 24 24" width={width} height={height} fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  );
}

function QR({ width = 18, height = 18, ...props }) {
  return (
    <svg viewBox="0 0 24 24" width={width} height={height} fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="5" y="5" width="3" height="3" fill="currentColor" stroke="none" />
      <rect x="16" y="5" width="3" height="3" fill="currentColor" stroke="none" />
      <rect x="5" y="16" width="3" height="3" fill="currentColor" stroke="none" />
      <line x1="14" y1="14" x2="14" y2="17" />
      <line x1="17" y1="14" x2="17" y2="14" />
      <line x1="14" y1="20" x2="21" y2="20" />
      <line x1="21" y1="14" x2="21" y2="17" />
      <line x1="17" y1="17" x2="21" y2="17" />
    </svg>
  );
}

function Copy({ width = 18, height = 18, ...props }) {
  return (
    <svg viewBox="0 0 24 24" width={width} height={height} fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function Download({ width = 18, height = 18, ...props }) {
  return (
    <svg viewBox="0 0 24 24" width={width} height={height} fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function Upload({ width = 18, height = 18, ...props }) {
  return (
    <svg viewBox="0 0 24 24" width={width} height={height} fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function Info({ width = 18, height = 18, ...props }) {
  return (
    <svg viewBox="0 0 24 24" width={width} height={height} fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

function Strike({ width = 18, height = 18, ...props }) {
  return (
    <svg viewBox="0 0 24 24" width={width} height={height} fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...props}>
      <line x1="4" y1="12" x2="20" y2="12" />
      <path d="M7 7h10M7 17h10" />
    </svg>
  );
}

function Timer({ width = 18, height = 18, ...props }) {
  return (
    <svg viewBox="0 0 24 24" width={width} height={height} fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="13" r="8" />
      <polyline points="12 9 12 13 15 16" />
      <line x1="9" y1="2" x2="15" y2="2" />
    </svg>
  );
}

function Play({ width = 18, height = 18, ...props }) {
  return (
    <svg viewBox="0 0 24 24" width={width} height={height} fill="currentColor" {...props}>
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

function Pause({ width = 18, height = 18, ...props }) {
  return (
    <svg viewBox="0 0 24 24" width={width} height={height} fill="currentColor" {...props}>
      <rect x="6" y="4" width="4" height="16" />
      <rect x="14" y="4" width="4" height="16" />
    </svg>
  );
}

function Reset({ width = 18, height = 18, ...props }) {
  return (
    <svg viewBox="0 0 24 24" width={width} height={height} fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 .49-4.5" />
    </svg>
  );
}

export const I = {
  Plus, X, Check, Dots,
  Trash, Edit, Eye,
  ChevronDown, ChevronRight,
  ArrowRight, Share,
  Clock, Zap,
  Checkbox, CheckboxChecked, CheckboxMinus,
  Link, Unlink,
  QR, Copy, Download, Upload,
  Info, Strike,
  Timer, Play, Pause, Reset,
};
