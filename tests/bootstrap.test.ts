import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse as parseYaml } from 'yaml';

const root = resolve(import.meta.dirname, '..');
const read = (p: string) => readFileSync(resolve(root, p), 'utf8');

describe('T01 monorepo bootstrap', () => {
  it('root package.json is private with the required dev script', () => {
    const pkg = JSON.parse(read('package.json'));
    expect(pkg.private).toBe(true);
    expect(pkg.scripts?.dev).toBe('pnpm -r --parallel run dev');
  });

  it('pnpm-workspace.yaml lists apps/* and packages/*', () => {
    const ws = parseYaml(read('pnpm-workspace.yaml')) as { packages: string[] };
    expect(ws.packages).toEqual(expect.arrayContaining(['apps/*', 'packages/*']));
  });

  it('tsconfig.base.json is strict ESM NodeNext ES2022', () => {
    const tc = JSON.parse(read('tsconfig.base.json'));
    expect(tc.compilerOptions.strict).toBe(true);
    expect(tc.compilerOptions.module).toBe('NodeNext');
    expect(tc.compilerOptions.moduleResolution).toBe('NodeNext');
    expect(tc.compilerOptions.target).toBe('ES2022');
  });

  it('.gitignore covers node_modules and dist', () => {
    const gi = read('.gitignore');
    expect(gi).toMatch(/node_modules/);
    expect(gi).toMatch(/dist/);
  });

  it('.npmrc enables auto-install-peers', () => {
    expect(read('.npmrc')).toMatch(/auto-install-peers\s*=\s*true/);
  });
});
