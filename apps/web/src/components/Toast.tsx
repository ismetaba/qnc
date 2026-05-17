import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

export type ToastTone = 'info' | 'success' | 'error';

export interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
  ttlMs: number;
}

export interface ToastApi {
  push: (message: string, tone?: ToastTone, ttlMs?: number) => void;
}

const ToastCtx = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: ReactNode }): JSX.Element {
  const [items, setItems] = useState<ToastItem[]>([]);
  const seq = useRef(0);

  const push = useCallback((message: string, tone: ToastTone = 'info', ttlMs = 2500) => {
    const id = ++seq.current;
    setItems((prev) => [...prev, { id, message, tone, ttlMs }]);
    window.setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id));
    }, ttlMs);
  }, []);

  const api = useMemo<ToastApi>(() => ({ push }), [push]);

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <ToastHost items={items} />
    </ToastCtx.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx;
}

const TONE_BG: Record<ToastTone, string> = {
  info: 'var(--panel-2)',
  success: 'color-mix(in srgb, var(--green) 22%, var(--panel-2))',
  error: 'color-mix(in srgb, var(--red) 22%, var(--panel-2))'
};
const TONE_BORDER: Record<ToastTone, string> = {
  info: 'var(--border)',
  success: 'var(--green)',
  error: 'var(--red)'
};

function ToastHost({ items }: { items: ToastItem[] }): JSX.Element {
  return (
    <div
      data-testid="toast-host"
      role="status"
      aria-live="polite"
      aria-atomic="true"
      style={{
        position: 'fixed',
        right: 22,
        bottom: 22,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        zIndex: 1000,
        pointerEvents: 'none'
      }}
    >
      {items.map((t) => (
        <div
          key={t.id}
          data-testid="toast"
          data-tone={t.tone}
          style={{
            background: TONE_BG[t.tone],
            border: `1px solid ${TONE_BORDER[t.tone]}`,
            color: 'var(--text)',
            padding: '8px 12px',
            borderRadius: 8,
            fontSize: 13,
            minWidth: 220,
            maxWidth: 360,
            boxShadow: '0 8px 22px rgba(0,0,0,0.35)'
          }}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}

/** Standalone host for tests that don't need the provider. */
export function ToastHostBare({ items }: { items: ToastItem[] }): JSX.Element {
  return <ToastHost items={items} />;
}

/** Convenience: a useEffect-friendly auto-pushed message hook (unused for now). */
export function useToastAfter(message: string | null, tone: ToastTone = 'info'): void {
  const { push } = useToast();
  useEffect(() => {
    if (message) push(message, tone);
  }, [message, tone, push]);
}
