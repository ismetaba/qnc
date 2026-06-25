# Jmetter — Custody TX Load Tester (Flow Topology)

A self-contained, single-file HTTP load-testing UI (open `index.html` in a
browser). **Standalone** — not wired into the qnc app; it lives here only so it
has a home in the repo. Delete the folder if you don't need it.

The interface is the **Flow Topology** design direction: a dark, pannable /
zoomable node-graph workspace. You configure the test as connected nodes
(Target → Auth → Payload → Load Engine), press **Run Flow**, and watch request
packets stream across a live link from a **Client** node to a **Custody API**
server node — colored green / red / amber by outcome. A glass HUD shows live
KPIs, a throughput·latency sparkline, and status-code chips; nodes drag, the
canvas pans, the wheel zooms, and **FIT** re-frames everything.

The load engine is **real** (`fetch` against the configured endpoint) — not the
simulated preview engine from the design bundle. The `launched` (dispatched) vs
`sent` (completed) distinction drives the Client / Server counters, so the gap
between them is the live in-flight count.

## Engine reliability

- **Requests keep firing when you switch browser tabs.** Timing runs from a Web
  Worker (background tabs throttle `setTimeout`/`setInterval` to ~1/s) with a
  schedule-driven launcher, so the target rate self-corrects after any stall.
- **One request's timeout can't kill the run.** Each request has its own
  `AbortController` (still honoring the global Stop); timeouts report as
  `TIMEOUT` vs. user `ABORT`.
- `GET`/`HEAD` omit the body; numeric load-profile inputs are validated.

## Beyond the prototype

The base Flow Topology prototype is visualization-only. This build adds, in the
same dark-glass style:

- **Response stream dock** (bottom) — every response as it resolves; filter with
  `⌘K`; collapse via the **Stream** button or the dock header.
- **Full response data.** Click any stream row to open a detail drawer with the
  complete request (method, URL, headers, body) and the full response body.
- **Run history** (`⌘H`) — last 10 runs saved to `localStorage` **with their
  responses**, so viewing a past run repopulates the stream and each row still
  opens its full body. Pin / rerun / export-JSON / delete per run; graceful
  quota handling.
- **Overlays don't blur the whole screen** — drawers and the shortcuts modal use
  a dark scrim with no `backdrop-filter` blur (glass panels keep their localized
  blur). JWT decode under the Auth node, Copy-as-cURL, and a Probe (single
  request) button round it out.

## Keyboard

`⌘/Ctrl+↵` run · `Esc` stop / close · `⌘T` probe · `⌘K` filter stream ·
`⌘H` history · `⌘0` fit graph · `?` shortcuts.

> The earlier Swiss-Editorial build remains in git history if you want it back.
