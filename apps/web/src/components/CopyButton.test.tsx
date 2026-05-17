import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { CopyButton } from './CopyButton.js';
import { ToastProvider } from './Toast.js';

const writeText = vi.fn(async () => undefined);

afterEach(() => {
  writeText.mockClear();
});

// Install a clipboard shim once at module load — jsdom's `navigator` descriptor
// is non-configurable in some setups, so we patch the prototype's clipboard
// getter via Object.defineProperty on the Navigator prototype.
Object.defineProperty(window.navigator, 'clipboard', {
  configurable: true,
  value: { writeText }
});

describe('<CopyButton/>', () => {
  it('writes to clipboard and surfaces a success toast', async () => {
    render(
      <ToastProvider>
        <CopyButton value="/api/v1/rpc/abc" />
      </ToastProvider>
    );
    fireEvent.click(screen.getByTestId('copy-button'));
    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith('/api/v1/rpc/abc');
    });
    await waitFor(() => {
      expect(screen.getByTestId('toast').textContent).toMatch(/Copied/i);
    });
  });
});
