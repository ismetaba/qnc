import { describe, it, expect } from 'vitest';
import { TARGETS } from '../scripts/smoke.mjs';

describe('smoke TARGETS', () => {
  it('has 6 entries (api + 3 nodes + web + /switch)', () => {
    expect(TARGETS.length).toBe(6);
  });

  it('the new 6th entry probes /switch on the web port', () => {
    const last = TARGETS[TARGETS.length - 1] as { name: string; url: string };
    expect(last.name).toBe('web-switch');
    expect(last.url.endsWith('/switch')).toBe(true);
  });

  it('every entry has name + url + expect()', () => {
    for (const t of TARGETS as Array<{ name: string; url: string; expect: unknown }>) {
      expect(typeof t.name).toBe('string');
      expect(typeof t.url).toBe('string');
      expect(typeof t.expect).toBe('function');
    }
  });
});
