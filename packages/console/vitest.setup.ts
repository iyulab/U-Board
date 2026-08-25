import '@testing-library/jest-dom';

// jsdom doesn't implement <dialog>'s showModal()/close() (same class of gap as
// HTMLAnchorElement.prototype.click in packages/core's AuthoringView.test.tsx) — real modal
// behavior (focus trap, backdrop, Escape-to-close) is exercised by Playwright e2e instead; this
// only keeps the `open` attribute (and the native `close` event) consistent for component tests.
if (!HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
    this.setAttribute('open', '');
  };
}
if (!HTMLDialogElement.prototype.close) {
  HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
    if (!this.open) return;
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  };
}
