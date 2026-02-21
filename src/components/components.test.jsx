/**
 * T2 — Shared UI component tests (11 tests)
 * Covers: ContextMenu, EditModal, ConfirmDialog, BulkActionBar
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ContextMenu } from './ContextMenu.jsx';
import { EditModal } from './EditModal.jsx';
import { ConfirmDialog } from './ConfirmDialog.jsx';
import { BulkActionBar } from './BulkActionBar.jsx';

// ── ContextMenu ───────────────────────────────────────────────────────────────

describe('ContextMenu', () => {
  const items = [
    { label: 'Edit', action: vi.fn() },
    { label: 'Delete', action: vi.fn(), danger: true },
  ];

  it('T2-1: renders menu items when open', () => {
    render(<ContextMenu open items={items} onClose={vi.fn()} />);
    expect(screen.getByText('Edit')).toBeTruthy();
    expect(screen.getByText('Delete')).toBeTruthy();
  });

  it('T2-2: fires item action callback on click and calls onClose', () => {
    const onClose = vi.fn();
    const action = vi.fn();
    render(
      <ContextMenu
        open
        items={[{ label: 'Do it', action }]}
        onClose={onClose}
      />
    );
    fireEvent.click(screen.getByText('Do it'));
    expect(action).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('T2-3: calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn();
    render(<ContextMenu open items={items} onClose={onClose} />);
    const backdrop = document.querySelector('[data-testid="cm-backdrop"]');
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

// ── EditModal ─────────────────────────────────────────────────────────────────

describe('EditModal', () => {
  it('T2-4: renders with the initial value in the input', () => {
    render(
      <EditModal open value="hello" onSave={vi.fn()} onClose={vi.fn()} />
    );
    expect(screen.getByDisplayValue('hello')).toBeTruthy();
  });

  it('T2-5: calls onSave with new text on Save button click', () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    render(<EditModal open value="old" onSave={onSave} onClose={onClose} />);
    const input = screen.getByDisplayValue('old');
    fireEvent.change(input, { target: { value: 'new text' } });
    fireEvent.click(screen.getByText('Save'));
    expect(onSave).toHaveBeenCalledWith('new text');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('T2-6: calls onClose without saving on Cancel click', () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    render(<EditModal open value="original" onSave={onSave} onClose={onClose} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(onSave).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

// ── ConfirmDialog ─────────────────────────────────────────────────────────────

describe('ConfirmDialog', () => {
  it('T2-7: renders the message prop text', () => {
    render(
      <ConfirmDialog
        open
        message="Are you sure?"
        onConfirm={vi.fn()}
        onClose={vi.fn()}
      />
    );
    expect(screen.getByText('Are you sure?')).toBeTruthy();
  });

  it('T2-8: danger variant applies danger class to confirm button', () => {
    render(
      <ConfirmDialog
        open
        danger
        message="Delete this?"
        onConfirm={vi.fn()}
        onClose={vi.fn()}
      />
    );
    const confirmBtn = screen.getByText('Confirm');
    expect(confirmBtn.className).toMatch(/terracotta/);
  });

  it('T2-9: Cancel button calls onClose', () => {
    const onClose = vi.fn();
    render(
      <ConfirmDialog
        open
        message="Are you sure?"
        onConfirm={vi.fn()}
        onClose={onClose}
      />
    );
    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

// ── BulkActionBar ─────────────────────────────────────────────────────────────

describe('BulkActionBar', () => {
  it('T2-10: displays the count in the label', () => {
    render(
      <BulkActionBar
        count={3}
        actions={[]}
        onClearSelect={vi.fn()}
      />
    );
    expect(screen.getByText(/3 selected/i)).toBeTruthy();
  });

  it('T2-11: fires action onClick when an action button is clicked', () => {
    const onClick = vi.fn();
    render(
      <BulkActionBar
        count={2}
        actions={[{ label: 'Delete All', onClick }]}
        onClearSelect={vi.fn()}
      />
    );
    fireEvent.click(screen.getByText('Delete All'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
