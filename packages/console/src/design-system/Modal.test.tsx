import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { Modal } from './Modal.js';

describe('Modal', () => {
  it('opens the dialog when open is true', () => {
    const { container } = render(
      <Modal open onClose={vi.fn()} labelledBy="title">
        <h3 id="title">제목</h3>
      </Modal>
    );
    expect(container.querySelector('dialog')).toHaveAttribute('open');
  });

  it('does not open the dialog when open is false', () => {
    const { container } = render(
      <Modal open={false} onClose={vi.fn()} labelledBy="title">
        <h3 id="title">제목</h3>
      </Modal>
    );
    expect(container.querySelector('dialog')).not.toHaveAttribute('open');
  });

  it('calls onClose when the dialog fires its native close event', () => {
    const onClose = vi.fn();
    const { container } = render(
      <Modal open onClose={onClose} labelledBy="title">
        <h3 id="title">제목</h3>
      </Modal>
    );
    (container.querySelector('dialog') as HTMLDialogElement).close();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('sets aria-labelledby to the given id', () => {
    const { container } = render(
      <Modal open onClose={vi.fn()} labelledBy="my-title">
        <h3 id="my-title">제목</h3>
      </Modal>
    );
    expect(container.querySelector('dialog')).toHaveAttribute('aria-labelledby', 'my-title');
  });
});
