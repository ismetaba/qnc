import { useState, type ReactElement, cloneElement } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export interface TooltipProps {
  label: string;
  children: ReactElement;
}

/**
 * Wraps a single child element. On hover/focus, renders a small slide-up
 * tooltip above the trigger. Keyboard-accessible via focus.
 */
export function Tooltip({ label, children }: TooltipProps): JSX.Element {
  const [open, setOpen] = useState(false);
  const child = cloneElement(children, {
    onMouseEnter: () => setOpen(true),
    onMouseLeave: () => setOpen(false),
    onFocus: () => setOpen(true),
    onBlur: () => setOpen(false)
  });
  return (
    <span
      data-testid="tooltip-root"
      style={{ position: 'relative', display: 'inline-block' }}
    >
      {child}
      <AnimatePresence>
        {open ? (
          <motion.span
            role="tooltip"
            data-testid="tooltip-bubble"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.14, ease: [0.22, 0.61, 0.36, 1] }}
            style={{
              position: 'absolute',
              left: '50%',
              bottom: 'calc(100% + 6px)',
              transform: 'translateX(-50%)',
              background: 'var(--panel-elevated)',
              color: 'var(--text)',
              border: '1px solid var(--border-strong)',
              padding: '4px 8px',
              borderRadius: 6,
              fontSize: 11,
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              zIndex: 30,
              boxShadow: 'var(--shadow-md)'
            }}
          >
            {label}
          </motion.span>
        ) : null}
      </AnimatePresence>
    </span>
  );
}
