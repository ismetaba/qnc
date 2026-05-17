import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const read = (p: string) => readFileSync(resolve(root, p), 'utf8');

const WORKSPACES = [
  'packages/shared',
  'packages/mock-evm',
  'apps/node-eth',
  'apps/node-avax',
  'apps/node-btc',
  'apps/api',
  'apps/web'
];

describe('T11 root orchestration', () => {
  it('root package.json has dev script "pnpm -r --parallel run dev" + smoke script', () => {
    const pkg = JSON.parse(read('package.json'));
    expect(pkg.scripts?.dev).toBe('pnpm -r --parallel run dev');
    expect(typeof pkg.scripts?.smoke).toBe('string');
    expect(pkg.scripts?.smoke).toContain('smoke.mjs');
  });

  it('every workspace defines a dev script', () => {
    for (const ws of WORKSPACES) {
      const pkgPath = `${ws}/package.json`;
      expect(existsSync(resolve(root, pkgPath)), `missing ${pkgPath}`).toBe(true);
      const pkg = JSON.parse(read(pkgPath));
      expect(typeof pkg.scripts?.dev, `${ws} missing dev script`).toBe('string');
    }
  });

  it('scripts/smoke.mjs exists and is non-empty', () => {
    expect(existsSync(resolve(root, 'scripts/smoke.mjs'))).toBe(true);
    expect(read('scripts/smoke.mjs').length).toBeGreaterThan(200);
  });

  it('README.md covers the 5 spec acceptance bullets', () => {
    expect(existsSync(resolve(root, 'README.md'))).toBe(true);
    const md = read('README.md');
    // Match the canonical phrases from spec / T11
    expect(md).toMatch(/pnpm dev/);
    expect(md).toMatch(/role[- ]?switching/i);
    expect(md).toMatch(/playground/i);
    expect(md).toMatch(/metrics/i);
    expect(md).toMatch(/nodes/i);
  });

  it('all referenced ports appear in smoke script', () => {
    const smoke = read('scripts/smoke.mjs');
    for (const port of [4000, 5180, 8501, 8502, 8503]) {
      expect(smoke, `port ${port} missing`).toContain(String(port));
    }
  });
});
