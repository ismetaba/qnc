import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ToastProvider } from './Toast.js';

describe('ToastHost a11y', () => {
  it('has role="status" and aria-live="polite"', () => {
    render(
      <ToastProvider>
        <div />
      </ToastProvider>
    );
    const host = screen.getByTestId('toast-host');
    expect(host.getAttribute('role')).toBe('status');
    expect(host.getAttribute('aria-live')).toBe('polite');
    expect(host.getAttribute('aria-atomic')).toBe('true');
  });
});
