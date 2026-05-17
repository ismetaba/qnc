import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach } from 'vitest';
import { cleanup } from '@testing-library/react';

/**
 * Node 22+/25 ships its own minimal `localStorage` global that lacks the
 * Storage API methods (setItem/getItem/clear). It silently shadows jsdom's
 * window.localStorage. Install a small in-memory Storage shim before each
 * test so component code can rely on the standard interface.
 */
function installLocalStorageShim(): void {
  const store = new Map<string, string>();
  const storage: Storage = {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    key: (i: number) => Array.from(store.keys())[i] ?? null,
    removeItem: (k: string) => {
      store.delete(k);
    },
    setItem: (k: string, v: string) => {
      store.set(k, String(v));
    }
  };
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    writable: true,
    value: storage
  });
  if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      writable: true,
      value: storage
    });
  }
}

beforeEach(() => {
  installLocalStorageShim();
});

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  document.body.removeAttribute('data-role');
});
