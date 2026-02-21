/**
 * Phase 5 — App Shell integration tests (8 tests: T2-12 through T2-19)
 * Covers: tab routing, ThemeProv, mobile bottom nav, desktop sidebar,
 *         live timer badge in nav, About modal.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import App from './App.jsx';

// ── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  localStorage.clear();
  vi.spyOn(console, 'error').mockImplementation(() => {});

  // Suppress About modal by default so other tests aren't obstructed
  localStorage.setItem('ph_seenAbout', JSON.stringify(true));

  if (!window.matchMedia) {
    window.matchMedia = (q) => ({
      matches: false,
      media: q,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
  }
});

// ── T2 App Shell tests ────────────────────────────────────────────────────────

describe('App Shell', () => {
  it('T2-12: renders navigation with all 6 tabs', () => {
    render(<App />);
    expect(screen.getByLabelText('Go to Capture')).toBeTruthy();
    expect(screen.getByLabelText('Go to Clarify')).toBeTruthy();
    expect(screen.getByLabelText('Go to Focus')).toBeTruthy();
    expect(screen.getByLabelText('Go to Confirm')).toBeTruthy();
    expect(screen.getByLabelText('Go to Review')).toBeTruthy();
    expect(screen.getByLabelText('Go to Settings')).toBeTruthy();
  });

  it('T2-13: default tab renders Capture section', () => {
    render(<App />);
    expect(screen.getByPlaceholderText('Brain-dump anything…')).toBeTruthy();
  });

  it('T2-14: clicking a nav tab renders the corresponding section', () => {
    render(<App />);
    fireEvent.click(screen.getByLabelText('Go to Clarify'));
    expect(screen.getByText('Do First')).toBeTruthy();
    expect(screen.getByText('Schedule')).toBeTruthy();
  });

  it('T2-15: active tab button has aria-current="page"', () => {
    render(<App />);
    const captureBtn = screen.getByLabelText('Go to Capture');
    expect(captureBtn.getAttribute('aria-current')).toBe('page');
  });

  it('T2-16: clicking Focus tab renders Focus section timer', () => {
    render(<App />);
    fireEvent.click(screen.getByLabelText('Go to Focus'));
    expect(screen.getByTestId('timer-display')).toBeTruthy();
  });

  it('T2-17: live timer badge visible in nav when timer running and not on Focus tab', () => {
    localStorage.setItem('ph_focusTimerState', JSON.stringify({
      mode: 'work',
      left: 1200,
      run: true,
      endAt: Date.now() + 1_200_000,
      startAt: Date.now(),
      elapsed: 0,
    }));
    render(<App />);
    // Default tab is 'capture'; timer is running → badge should appear
    expect(screen.getByTestId('nav-timer-badge')).toBeTruthy();
  });

  it('T2-18: live timer badge not shown when on Focus tab', () => {
    localStorage.setItem('ph_focusTimerState', JSON.stringify({
      mode: 'work',
      left: 1200,
      run: true,
      endAt: Date.now() + 1_200_000,
      startAt: Date.now(),
      elapsed: 0,
    }));
    localStorage.setItem('ph_tab', JSON.stringify('focus'));
    render(<App />);
    expect(screen.queryByTestId('nav-timer-badge')).toBeNull();
  });

  it('T2-19: About modal does not appear when seenAbout is true', () => {
    // seenAbout=true is set in beforeEach
    render(<App />);
    // AboutModal version string must not be visible
    expect(screen.queryByText('v18.0-Alpha')).toBeNull();
  });

  it('T2-20: ThemeProv sets data-theme attribute on document', () => {
    localStorage.setItem('ph_theme', JSON.stringify('dark'));
    render(<App />);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('T2-21: timer badge shows formatted countdown value', () => {
    localStorage.setItem('ph_focusTimerState', JSON.stringify({
      mode: 'work',
      left: 600,
      run: true,
      endAt: Date.now() + 600_000,
      startAt: Date.now(),
      elapsed: 0,
    }));
    render(<App />);
    const badge = screen.getByTestId('nav-timer-badge');
    // Should show roughly 10:00 (may be 09:59 due to timing)
    expect(badge.textContent).toMatch(/\d{2}:\d{2}/);
  });
});
