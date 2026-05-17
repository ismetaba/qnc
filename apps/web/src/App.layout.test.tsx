import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import { App } from './App.js';

function fakeFetch() {
  return vi.fn(async () =>
    new Response('[]', { status: 200, headers: { 'content-type': 'application/json' } })
  ) as unknown as typeof fetch;
}

describe('<App/> semantic landmarks (dashboard, role pre-set)', () => {
  let original: typeof fetch;
  beforeEach(() => {
    original = globalThis.fetch;
    globalThis.fetch = fakeFetch();
    // Seed a role so App skips the /switch redirect.
    window.localStorage.setItem('qnc.role', 'admin');
    window.history.replaceState({}, '', '/');
  });
  afterEach(() => {
    globalThis.fetch = original;
  });

  it('renders exactly one <main>', () => {
    const { container } = render(<App />);
    expect(container.querySelectorAll('main').length).toBe(1);
  });

  it('sidebar is <nav aria-label="primary">', () => {
    const { container } = render(<App />);
    const nav = container.querySelector('nav');
    expect(nav).not.toBeNull();
    expect(nav!.getAttribute('aria-label')).toBe('primary');
  });

  it('header is a <header>', () => {
    const { container } = render(<App />);
    expect(container.querySelectorAll('header').length).toBe(1);
  });
});
