import { describe, it, expect } from 'vitest';
import { contrastRatio } from '../../lib/contrast.js';
import { ROLE_ACCENT_HEX } from '../../lib/roleAccents.js';

/**
 * Inline (test-local) per-channel hex lerp. Mirrors `color-mix(in srgb, A X%, B (100-X)%)`.
 * Not exported from lib/ — by design.
 */
function lerpHex(a: string, b: string, t: number): string {
  const parse = (h: string): [number, number, number] => {
    const s = h.replace(/^#/, '');
    return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
  };
  const [ar, ag, ab] = parse(a);
  const [br, bg, bb] = parse(b);
  const mix = (x: number, y: number) => Math.round(x * (1 - t) + y * t);
  const r = mix(ar, br);
  const g = mix(ag, bg);
  const bl = mix(ab, bb);
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(bl)}`;
}

// Source-of-truth hex values mirrored from apps/web/src/styles/tokens.css.
const TEXT = '#e6edf7';
const MUTED = '#8a93a6';
const PANEL_ELEVATED = '#1c2538';
const CHAIN_HEX = {
  eth: '#627eea',
  avax: '#e84142',
  btc: '#f7931a'
} as const;

const AA_NORMAL = 4.5;
const AA_LARGE = 3.0;

describe('Nodes chain-tint gradient — body & muted text contrast', () => {
  it.each(Object.entries(CHAIN_HEX) as Array<[keyof typeof CHAIN_HEX, string]>)(
    '%s: text vs effective tinted background passes AA-normal; muted passes AA-large',
    (chain, tint) => {
      // 5% tint blended onto panel-elevated — worst case at the top of the gradient.
      const bg = lerpHex(PANEL_ELEVATED, tint, 0.05);
      const textRatio = contrastRatio(TEXT, bg);
      const mutedRatio = contrastRatio(MUTED, bg);
      expect(
        textRatio,
        `${chain}: text ${TEXT} on ${bg} = ${textRatio.toFixed(2)} (need ≥${AA_NORMAL})`
      ).toBeGreaterThanOrEqual(AA_NORMAL);
      expect(
        mutedRatio,
        `${chain}: muted ${MUTED} on ${bg} = ${mutedRatio.toFixed(2)} (need ≥${AA_LARGE})`
      ).toBeGreaterThanOrEqual(AA_LARGE);
    }
  );
});

describe('/switch role cards — body & accent-stripe text contrast', () => {
  // Role cards background is `linear-gradient(180deg, --panel-elevated, --panel)` —
  // worst case for body text is panel-elevated.
  it.each(Object.entries(ROLE_ACCENT_HEX) as Array<[keyof typeof ROLE_ACCENT_HEX, string]>)(
    '%s: body text on panel-elevated passes AA-normal; role-title accent passes AA-large',
    (role, accent) => {
      const textRatio = contrastRatio(TEXT, PANEL_ELEVATED);
      const accentRatio = contrastRatio(accent, PANEL_ELEVATED);
      expect(
        textRatio,
        `${role}: text ${TEXT} on ${PANEL_ELEVATED} = ${textRatio.toFixed(2)} (need ≥${AA_NORMAL})`
      ).toBeGreaterThanOrEqual(AA_NORMAL);
      expect(
        accentRatio,
        `${role}: accent ${accent} on ${PANEL_ELEVATED} = ${accentRatio.toFixed(2)} (need ≥${AA_LARGE})`
      ).toBeGreaterThanOrEqual(AA_LARGE);
    }
  );
});
