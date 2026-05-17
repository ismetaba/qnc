import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export interface KebabMenuItem {
  key: string;
  label: string;
  tone?: 'default' | 'danger';
  onSelect: () => void;
}

export interface KebabMenuProps {
  items: KebabMenuItem[];
  ariaLabel?: string;
}

/** Tiny ⋯ kebab menu: button toggles a small AnimatePresence-wrapped dropdown. */
export function KebabMenu({ items, ariaLabel = 'row actions' }: KebabMenuProps): JSX.Element {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  return (
    <div
      ref={rootRef}
      data-testid="kebab-menu"
      style={{ position: 'relative', display: 'inline-block' }}
    >
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        data-testid="kebab-trigger"
        onClick={() => setOpen((v) => !v)}
        className="btn-ghost"
        style={{
          width: 28,
          height: 28,
          padding: 0,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 18,
          lineHeight: 1
        }}
      >
        ⋯
      </button>
      <AnimatePresence>
        {open ? (
          <motion.div
            role="menu"
            data-testid="kebab-menu-list"
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.12 }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              right: 0,
              minWidth: 140,
              background: 'var(--panel-elevated)',
              border: '1px solid var(--border-strong)',
              borderRadius: 8,
              padding: 4,
              boxShadow: 'var(--shadow-lg)',
              zIndex: 20
            }}
          >
            {items.map((item) => (
              <button
                key={item.key}
                type="button"
                role="menuitem"
                data-testid="kebab-item"
                data-tone={item.tone ?? 'default'}
                onClick={() => {
                  setOpen(false);
                  item.onSelect();
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: 6,
                  padding: '7px 10px',
                  fontSize: 13,
                  color: item.tone === 'danger' ? 'var(--red)' : 'var(--text)',
                  cursor: 'pointer',
                  transition: 'background 150ms'
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background =
                    item.tone === 'danger'
                      ? 'color-mix(in srgb, var(--red) 14%, transparent)'
                      : 'var(--panel-2)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                }}
              >
                {item.label}
              </button>
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export function renderChildren(children: ReactNode): ReactNode {
  return children;
}
