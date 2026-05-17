/** Parse a 3 or 6 digit hex string into [r,g,b] in 0..255. */
function parseHex(hex: string): [number, number, number] {
  let h = hex.trim().replace(/^#/, '').toLowerCase();
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (!/^[0-9a-f]{6}$/.test(h)) throw new Error(`invalid hex: ${hex}`);
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return [r, g, b];
}

/** Per-channel sRGB → linear conversion (WCAG 2.x). */
function channelToLinear(c: number): number {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

/** Relative luminance per WCAG 2.x. */
export function relativeLuminance(hex: string): number {
  const [r, g, b] = parseHex(hex);
  const R = channelToLinear(r);
  const G = channelToLinear(g);
  const B = channelToLinear(b);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

/** WCAG 2.x contrast ratio between two hex colours. Result is 1..21. */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}
