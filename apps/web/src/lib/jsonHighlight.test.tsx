import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { highlightJson } from './jsonHighlight.js';

function tokens(input: string): { kind: string; text: string }[] {
  const { container } = render(<>{highlightJson(input)}</>);
  return Array.from(container.querySelectorAll('[data-token-kind]')).map((el) => ({
    kind: el.getAttribute('data-token-kind') ?? '',
    text: el.textContent ?? ''
  }));
}

describe('highlightJson tokenizer', () => {
  it('classifies keys, strings, numbers, booleans, nulls', () => {
    const json = JSON.stringify({ name: 'ada', n: 42, ok: true, gone: null }, null, 2);
    const out = tokens(json);
    const kinds = out.map((t) => t.kind);
    expect(kinds).toContain('key');
    expect(kinds).toContain('string');
    expect(kinds).toContain('number');
    expect(kinds).toContain('boolean');
    expect(kinds).toContain('null');
    expect(kinds).toContain('punct');
  });

  it('keeps the JSON content lossless when concatenated', () => {
    const json = JSON.stringify({ a: [1, 2, 'x'] });
    const out = tokens(json).map((t) => t.text).join('');
    // Whitespace is rendered as fragments (no data-token-kind), so reconstruct via container.
    const { container } = render(<>{highlightJson(json)}</>);
    expect(container.textContent).toBe(json);
    expect(out.length).toBeLessThanOrEqual(json.length); // sanity
  });

  it('textContent preserves the original pretty-printed input verbatim (SR text flow)', () => {
    const value = { a: 1, b: 'x', c: [true, null] };
    const original = JSON.stringify(value, null, 2);
    const { container } = render(<>{highlightJson(original)}</>);
    expect(container.textContent).toBe(original);
  });
});
