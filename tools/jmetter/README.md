# Jmetter — Custody TX Load Tester

A self-contained, single-file HTTP load-testing UI (open `index.html` in a
browser). It is **standalone** and not wired into the qnc app — it lives here
only so it has a home in the repo. Delete the folder if you don't need it.

## Fixes applied to this copy

### Requests stop when you switch browser tabs (the main reported bug)
Browsers throttle `setTimeout`/`setInterval` to ~once per second in hidden
tabs, so the original request scheduler (a `sleep()`-based loop) collapsed to
~1 req/s the moment you switched away. Two changes fix it:

- **Web Worker timers** — timing is driven from a `Worker`, whose timers keep
  running at full speed in background tabs (falls back to normal timers if a
  worker can't be created).
- **Schedule-driven launcher** — instead of sleeping a fixed gap between
  requests, the launcher computes how many requests are *due* from the wall
  clock and fires enough to catch up (capped by the in-flight limit), so the
  target rate self-corrects after any stall.

### One timeout killed the entire run
Every request shared a single `AbortController`, so the first request to hit
its timeout aborted *all* in-flight requests and made every subsequent
`fetch` fail immediately. Each request now gets its **own** `AbortController`
(still forwarding the run-wide Stop signal), and timeouts are reported
distinctly as `TIMEOUT` vs. user `ABORT`.

### Other correctness / UX fixes
- `GET`/`HEAD` no longer send a body (which `fetch` rejects); `Content-Type`
  is omitted for bodyless methods, and "Copy as cURL" drops `-d` accordingly.
- Load-profile inputs are validated (total ≥ 1, rate > 0, concurrency ≥ 1,
  timeout ≥ 1) instead of silently running nothing on a blank/0 field.
- History cards are now clickable to view a run (they already looked clickable).
- Stack-safe min/max so very large sample sets don't overflow the call stack.
