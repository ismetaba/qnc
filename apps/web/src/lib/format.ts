export function formatNumber(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return '–';
  return new Intl.NumberFormat('en-US').format(n);
}

export function formatPct(n: number | null | undefined, digits = 1): string {
  if (n === null || n === undefined || Number.isNaN(n)) return '–';
  return (n * 100).toFixed(digits) + '%';
}

export function formatMs(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return '–';
  if (n < 1) return n.toFixed(2) + 'ms';
  if (n < 100) return n.toFixed(1) + 'ms';
  return Math.round(n) + 'ms';
}

export function formatGB(n: number | null | undefined): string {
  if (n === null || n === undefined) return '–';
  if (n >= 1024) return (n / 1024).toFixed(2) + ' TB';
  return n + ' GB';
}

export function formatUptime(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined || seconds < 0) return '–';
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${seconds}s`;
}

export function formatRelativeTime(ts: number, now: number = Date.now()): string {
  const diff = Math.max(0, Math.floor((now - ts) / 1000));
  if (diff < 5) return 'just now';
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
