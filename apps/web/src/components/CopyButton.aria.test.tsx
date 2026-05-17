import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CopyButton } from './CopyButton.js';
import { ToastProvider } from './Toast.js';

describe('<CopyButton/> a11y', () => {
  it('has a non-empty aria-label by default (derived from value)', () => {
    render(
      <ToastProvider>
        <CopyButton value="/api/v1/rpc/abc" />
      </ToastProvider>
    );
    const btn = screen.getByTestId('copy-button');
    expect(btn.getAttribute('aria-label')).toBeTruthy();
    expect(btn.getAttribute('aria-label')).toContain('/api/v1/rpc/abc');
  });

  it('uses explicit aria-label when provided', () => {
    render(
      <ToastProvider>
        <CopyButton value="x" ariaLabel="Copy proxy URL for eth-prod" />
      </ToastProvider>
    );
    expect(screen.getByTestId('copy-button').getAttribute('aria-label')).toBe(
      'Copy proxy URL for eth-prod'
    );
  });
});
