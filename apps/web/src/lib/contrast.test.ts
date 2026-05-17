import { describe, it, expect } from 'vitest';
import { contrastRatio } from './contrast.js';
import { ROLE_ACCENT_HEX, PANEL_BG_HEX } from './roleAccents.js';

describe('contrastRatio (WCAG 2.x)', () => {
  it('white on black is ~21', () => {
    expect(contrastRatio('#ffffff', '#000000')).toBeCloseTo(21, 0);
  });

  it('same colour is 1', () => {
    expect(contrastRatio(PANEL_BG_HEX, PANEL_BG_HEX)).toBeCloseTo(1, 5);
  });

  it('text colour passes AA on the panel background', () => {
    expect(contrastRatio('#e6edf7', PANEL_BG_HEX)).toBeGreaterThanOrEqual(4.5);
  });

  it('all four role accents pass AA on the panel background', () => {
    for (const [role, color] of Object.entries(ROLE_ACCENT_HEX)) {
      const ratio = contrastRatio(color, PANEL_BG_HEX);
      expect(
        ratio,
        `${role}: ${color} vs ${PANEL_BG_HEX} = ${ratio.toFixed(2)}`
      ).toBeGreaterThanOrEqual(4.5);
    }
  });
});
