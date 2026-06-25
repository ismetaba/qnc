# Jmetter — Custody TX Load Tester (Swiss Editorial)

A self-contained, single-file HTTP load-testing UI (open `index.html` in a
browser). **Standalone** — not wired into the qnc app; it lives here only so it
has a home in the repo. Delete the folder if you don't need it.

The interface uses the **Swiss Editorial** design direction: light "paper"
ground, ink text, a single red accent, Space Grotesk + JetBrains Mono, square
corners and hairline rules. The load engine is **real** (`fetch` against the
configured endpoint) — not the simulated preview engine from the design bundle.

## Engine reliability (carried over)

- **Requests keep firing when you switch browser tabs.** Timing is driven from a
  Web Worker (background tabs throttle `setTimeout`/`setInterval` to ~1/s) and
  the launcher is schedule-driven off the wall clock, so the target rate
  self-corrects after any stall.
- **One request's timeout no longer kills the run.** Each request has its own
  `AbortController` (still honouring the global Stop); timeouts report as
  `TIMEOUT` vs. user `ABORT`.
- `GET`/`HEAD` omit the body; numeric load-profile inputs are validated.

## UX fixes in this revision

- **Overlays no longer blur the whole screen.** The shortcuts modal and the
  history / detail drawers use a light ink scrim with **no `backdrop-filter`
  blur**.
- **Full response data.** Every response row is clickable and opens a detail
  drawer showing the complete request (method, URL, headers, body) and the full
  response body — no more truncated snippets.
- **History keeps response data.** Saved runs now store their responses (capped
  for storage), so viewing a past run repopulates the response log and each row
  still opens its full body. Runs are saved to `localStorage` with graceful
  quota handling.

## Notes

- Faithful to the Swiss direction, this revision drops the previous dark build's
  theme toggle, collapsible sidebar, resizable splitter and chart hover
  tooltips. The earlier dark-themed version remains in git history if needed.
