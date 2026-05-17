#!/usr/bin/env node
// Smoke-checks every port the dev fleet listens on. Used by `pnpm smoke`.
// Exits 0 on success, 1 on failure.

const TARGETS = [
  { name: 'api',        url: 'http://127.0.0.1:4000/health',  expect: (b) => b?.ok === true },
  { name: 'node-eth',   url: 'http://127.0.0.1:8501/',        expect: (b) => b?.chain === 'eth' },
  { name: 'node-avax',  url: 'http://127.0.0.1:8502/',        expect: (b) => b?.chain === 'avax' },
  { name: 'node-btc',   url: 'http://127.0.0.1:8503/',        expect: (b) => b?.chain === 'btc' },
  { name: 'web',        url: 'http://127.0.0.1:5180/',        expect: (_b, res) => res.status === 200 },
  { name: 'web-switch', url: 'http://127.0.0.1:5180/switch',  expect: (_b, res) => res.status === 200 }
];

export { TARGETS };

const TIMEOUT_MS = 60_000;
const POLL_MS = 500;

async function probe(target) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 4_000);
  try {
    const res = await fetch(target.url, { signal: ctrl.signal });
    let body = null;
    const ct = res.headers.get('content-type') ?? '';
    if (ct.includes('application/json')) {
      try { body = await res.json(); } catch { body = null; }
    } else {
      body = await res.text();
    }
    return target.expect(body, res) ? { ok: true } : { ok: false, reason: `unexpected body for ${target.name}` };
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : String(err) };
  } finally {
    clearTimeout(t);
  }
}

async function waitFor(target) {
  const deadline = Date.now() + TIMEOUT_MS;
  let last;
  while (Date.now() < deadline) {
    last = await probe(target);
    if (last.ok) return last;
    await new Promise((r) => setTimeout(r, POLL_MS));
  }
  return last ?? { ok: false, reason: 'timeout' };
}

async function main() {
  const results = await Promise.all(TARGETS.map(async (t) => ({ name: t.name, url: t.url, ...(await waitFor(t)) })));
  let allOk = true;
  for (const r of results) {
    const status = r.ok ? '✓' : '✗';
    const detail = r.ok ? '' : ` — ${r.reason}`;
    // eslint-disable-next-line no-console
    console.log(`${status} ${r.name.padEnd(10)} ${r.url}${detail}`);
    if (!r.ok) allOk = false;
  }
  process.exit(allOk ? 0 : 1);
}

// Only run probes when invoked directly as a CLI; importing the module
// (e.g. from tests/smoke-targets.test.ts) must not trigger network I/O.
import { pathToFileURL } from 'node:url';
const isEntrypoint =
  typeof process !== 'undefined' &&
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isEntrypoint) {
  main().catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  });
}
