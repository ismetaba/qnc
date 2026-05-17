# QNC — QuickNode Clone

A self-contained, three-phase QuickNode-style developer platform that runs entirely on a developer's
laptop. Three mock blockchain full-nodes (ETH / AVAX / BTC) sit behind realistic JSON-RPC endpoints;
a wrapper API issues "endpoints" with proxy URLs, captures every call into a circular log, computes
latency / error metrics, and exposes mock billing. A React dashboard with a Role Switcher
(admin / developer / billing / viewer) demonstrates how role-based capability gates change the entire
app surface.

Everything is in-memory. No DB, no auth provider, no real chains.

## Prereqs
- Node 20+ (we test on 20 / 22 / 25)
- pnpm 10 (`corepack enable` then `corepack prepare pnpm@10 --activate`)

## Install
```sh
pnpm install
```

## One-command dev
```sh
pnpm dev
```
Brings all 5 services up in parallel:

| Service     | Port | URL                    |
|-------------|------|------------------------|
| node-eth    | 8501 | http://localhost:8501  |
| node-avax   | 8502 | http://localhost:8502  |
| node-btc    | 8503 | http://localhost:8503  |
| api         | 4000 | http://localhost:4000  |
| web         | 5180 | http://localhost:5180  |

Once they're up, in another terminal:
```sh
pnpm smoke   # probes every port, exits non-zero if anything's down
```

## First run
On first load with no `qnc.role` in `localStorage`, the app redirects to `/switch`
for role selection. Pick one of the four roles (admin / developer / billing / viewer);
your selection persists in `localStorage` under the key `qnc.role`, and you land on
the dashboard. To re-trigger the picker on a return visit, run
`localStorage.removeItem('qnc.role')` in the browser console (or clear site data) and
reload — or just navigate to `/switch` from the header's "Switch role" link.

## Tests
```sh
pnpm -r test     # vitest in every workspace
pnpm test        # root + recursive
```

## Acceptance checklist (from the brief)
1. **`pnpm dev` brings up all 5 services in parallel.** Confirmed by `pnpm smoke`.
2. **Role switching hides/shows expected sidebar items.** Switching to *billing* reduces the sidebar
   to `Overview` + `Billing`; switching back to *admin* restores all 8 nav items. Covered by
   `apps/web/src/components/Sidebar.routerAcceptance.test.tsx`.
3. **Playground `eth_blockNumber` matches mock-node curl within a tick.** Verified live: a direct
   `curl http://localhost:8501` and a Playground call against `eth-mainnet-prod` return the same
   hex block number.
4. **Metrics shows non-zero counts after a few RPC calls.** Send a couple of requests via the
   Playground; the Metrics page shows `requests`, `errors`, `p50/p95/p99`, and a by-method bar
   chart within the polling interval.
5. **Nodes page shows live block heights ticking up.** ETH ticks every 12 s, AVAX every 2 s,
   BTC every 600 s.

## Repo layout
```
.
├── apps/
│   ├── node-eth/    Fastify EVM mock node, port 8501
│   ├── node-avax/   Fastify EVM mock node, port 8502
│   ├── node-btc/    Fastify Bitcoin-style mock node, port 8503
│   ├── api/         Fastify wrapper API, port 4000
│   └── web/         Vite + React 18 dashboard, port 5180
├── packages/
│   ├── shared/      @qnc/shared types + ROLE_CAPS
│   └── mock-evm/    Reusable EVM JSON-RPC handler shared by node-eth + node-avax
├── scripts/
│   └── smoke.mjs    `pnpm smoke` — probes every dev port
└── .wiz/            Spec, architecture, tasks, test-plans, qc-reports
```

## Wizard's-choice extras (spec §"Wizard's-choice features")
1. Copy-on-click toast on every proxy URL via `<CopyButton/>` + `<ToastProvider/>`.
2. Per-endpoint latency sparkline (last 30 calls) on the Overview page.
3. Sample method chips in the Playground — chain-aware (EVM vs BTC).
4. Healthy-chain pulse dot on the sidebar `Nodes` nav (green / amber / red).
5. Role-tinted accent colour that retints buttons / links / badges as the role switches.

## Out of scope (v1)
- Real authentication / OAuth / sessions.
- Persistent storage — everything resets on restart.
- Real blockchain integration — JSON-RPC mocks only.
- WebSocket / `eth_subscribe` — HTTP only.
- Mobile / responsive layouts below 1024 px.
- Tailwind CSS (explicitly excluded by the brief in favour of plain CSS).
