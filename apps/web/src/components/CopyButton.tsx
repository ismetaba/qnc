import { useState } from 'react';
import { useToast } from './Toast.js';

export interface CopyButtonProps {
  value: string;
  label?: string;
  successMessage?: string;
  ariaLabel?: string;
}

async function writeClipboard(text: string): Promise<void> {
  if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    await navigator.clipboard.writeText(text);
    return;
  }
  // Fallback: textarea + execCommand for jsdom / older browsers.
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand('copy');
  } finally {
    document.body.removeChild(ta);
  }
}

export function CopyButton({
  value,
  label = 'Copy',
  successMessage = 'Copied to clipboard',
  ariaLabel
}: CopyButtonProps): JSX.Element {
  const { push } = useToast();
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      aria-label={ariaLabel ?? `copy ${value}`}
      data-testid="copy-button"
      data-copied={copied ? 'true' : 'false'}
      onClick={async () => {
        try {
          await writeClipboard(value);
          push(successMessage, 'success');
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1000);
        } catch (err) {
          push(err instanceof Error ? err.message : 'Copy failed', 'error');
        }
      }}
      className="btn-ghost copy-on-hover"
      style={{
        fontSize: 12,
        padding: '4px 10px',
        color: copied ? 'var(--green)' : undefined,
        borderColor: copied ? 'var(--green)' : undefined,
        transition: 'color 200ms, border-color 200ms, opacity 200ms'
      }}
    >
      {copied ? '✓ Copied' : label}
    </button>
  );
}
