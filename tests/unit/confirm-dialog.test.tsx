// ════════════════════════════════════════════════════════════════
// Unit tests — UX-MED-006 (Opt A) ConfirmDialog
// ════════════════════════════════════════════════════════════════
// Verifies:
//   1. Does not render when isOpen === false
//   2. Renders when isOpen === true (role="alertdialog")
//   3. Cancel button fires onCancel
//   4. Escape key fires onCancel (when not busy)
//   5. Confirm button disabled until requireType matches
//   6. Confirm button enabled + fires onConfirm once requireType matches
//   7. Danger variant applies red styling class
//   8. isBusy disables cancel + confirm + escape handling

import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';

afterEach(() => {
  cleanup();
});

describe('ConfirmDialog — UX-MED-006 (A)', () => {
  it('renders nothing when isOpen=false', () => {
    const { container } = render(
      <ConfirmDialog
        isOpen={false}
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
        title="Are you sure?"
        message="This cannot be undone."
      />,
    );
    expect(container.querySelector('[role="alertdialog"]')).toBeNull();
  });

  it('renders alertdialog with title + message when open', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
        title="Are you sure?"
        message="This cannot be undone."
      />,
    );
    expect(screen.getByRole('alertdialog')).toBeTruthy();
    expect(screen.getByText('Are you sure?')).toBeTruthy();
    expect(screen.getByText('This cannot be undone.')).toBeTruthy();
  });

  it('cancel button fires onCancel', () => {
    const onCancel = vi.fn();
    render(
      <ConfirmDialog
        isOpen={true}
        onCancel={onCancel}
        onConfirm={vi.fn()}
        title="T"
        message="M"
      />,
    );
    fireEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('Escape key fires onCancel when not busy', () => {
    const onCancel = vi.fn();
    render(
      <ConfirmDialog
        isOpen={true}
        onCancel={onCancel}
        onConfirm={vi.fn()}
        title="T"
        message="M"
      />,
    );
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('confirm button disabled until requireType matches', () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog
        isOpen={true}
        onCancel={vi.fn()}
        onConfirm={onConfirm}
        title="Delete?"
        message="Irreversible."
        requireType="DELETE"
        confirmLabel="Delete"
      />,
    );
    const confirmBtn = screen.getByText('Delete').closest('button')!;
    expect(confirmBtn.hasAttribute('disabled')).toBe(true);

    // Type partial — still disabled
    const input = document.querySelector(
      'input[data-confirm-type]',
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'DEL' } });
    expect(confirmBtn.hasAttribute('disabled')).toBe(true);

    // Type exact match — enables
    fireEvent.change(input, { target: { value: 'DELETE' } });
    expect(confirmBtn.hasAttribute('disabled')).toBe(false);

    fireEvent.click(confirmBtn);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('requireType is case-sensitive (delete !== DELETE)', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
        title="T"
        message="M"
        requireType="DELETE"
      />,
    );
    const confirmBtn = screen.getByText('Confirm').closest('button')!;
    const input = document.querySelector(
      'input[data-confirm-type]',
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'delete' } });
    expect(confirmBtn.hasAttribute('disabled')).toBe(true);
  });

  it('danger variant applies red styling class to confirm button', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
        title="T"
        message="M"
        variant="danger"
      />,
    );
    const confirmBtn = screen.getByText('Confirm').closest('button')!;
    expect(confirmBtn.className).toMatch(/from-red-/);
  });

  it('isBusy disables both buttons + suppresses Escape', () => {
    const onCancel = vi.fn();
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog
        isOpen={true}
        onCancel={onCancel}
        onConfirm={onConfirm}
        title="T"
        message="M"
        isBusy
      />,
    );
    const cancelBtn = screen.getByText('Cancel').closest('button')!;
    // "Working…" label replaces the original
    const confirmBtn = screen.getByText('Working…').closest('button')!;
    expect(cancelBtn.hasAttribute('disabled')).toBe(true);
    expect(confirmBtn.hasAttribute('disabled')).toBe(true);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('clicking overlay fires onCancel unless lockOverlay', () => {
    const onCancel = vi.fn();
    const { rerender } = render(
      <ConfirmDialog
        isOpen={true}
        onCancel={onCancel}
        onConfirm={vi.fn()}
        title="T"
        message="M"
      />,
    );

    // Overlay is the outer motion.div. Click it directly.
    const dialog = screen.getByRole('alertdialog');
    const overlay = dialog.parentElement as HTMLElement;
    fireEvent.click(overlay);
    expect(onCancel).toHaveBeenCalledTimes(1);

    onCancel.mockClear();
    rerender(
      <ConfirmDialog
        isOpen={true}
        onCancel={onCancel}
        onConfirm={vi.fn()}
        title="T"
        message="M"
        lockOverlay
      />,
    );
    const dialog2 = screen.getByRole('alertdialog');
    const overlay2 = dialog2.parentElement as HTMLElement;
    fireEvent.click(overlay2);
    expect(onCancel).not.toHaveBeenCalled();
  });
});
