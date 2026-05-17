import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..', '..', '..');
const tokens = readFileSync(resolve(root, 'src/styles/tokens.css'), 'utf8');
const global = readFileSync(resolve(root, 'src/styles/global.css'), 'utf8');

const haystack = tokens + '\n' + global;

describe('prefers-reduced-motion CSS rule', () => {
  it('the bundled CSS source ships an active prefers-reduced-motion block', () => {
    expect(haystack).toMatch(/@media\s*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)/);
  });

  it('the rule zeroes (≤0.001ms) animation-duration and transition-duration', () => {
    const blockMatch = haystack.match(
      /@media\s*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)\s*\{[\s\S]*?\}\s*\}/
    );
    expect(blockMatch, 'prefers-reduced-motion block must be present').not.toBeNull();
    const block = blockMatch![0];
    expect(block).toMatch(/animation-duration\s*:\s*0(?:\.\d+)?ms/);
    expect(block).toMatch(/transition-duration\s*:\s*0(?:\.\d+)?ms/);
  });
});
