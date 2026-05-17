# Product Specification — QuickNode Clone (Mock RPC Platform)

## Summary
A self-contained, three-phase QuickNode-style developer platform that runs entirely on a developer's laptop. The system simulates a fleet of three blockchain full-nodes (Ethereum, Avalanche C-Chain, Bitcoin) behind realistic JSON-RPC endpoints, then layers a wrapper API that issues "endpoints" with proxy URLs, captures every call into a circular log, computes latency/error metrics, and exposes mock billing. A React dashboard with a top-right Role Switcher (admin / developer / billing / viewer) demonstrates how role-based capability gates change the entire app surface — sidebar nav, action buttons, and visible pages — without any real authentication. Everything is in-memory; there is no database, no auth provider, and no external blockchain dependency.

## User Stories
1. **As a developer**, I want a single `pnpm dev` from the repo root to bring up three mock chain nodes plus an API plus a web UI, so I can demo the platform offline.
2. **As an admin user**, I want to create a new endpoint pinned to a chain and immediately see a copyable proxy URL (`/api/v1/rpc/<id>`), so I can hand it to a teammate.
3. **As a developer user**, I want an RPC Playground where I can pick an endpoint, choose a sample method (e.g. `eth_blockNumber`, `getblockcount`), inspect a pretty-printed response with latency, and have that call counted in metrics within a second.
4. **As any role**, I want a Nodes page that shows live block heights ticking up for ETH (every 12s), AVAX (every 2s) and BTC (every 600s), with peers / disk / uptime / sync % / version text per node card.
5. **As a billing user**, I want a Billing page with month-to-date usage vs the 80M-included Discovery plan, an estimated overage cost at $25/M, and six mock monthly invoices — and I should *not* see Endpoints, RPC, Nodes, or Users in the sidebar.
6. **As an admin**, I want to switch into the Viewer role from the dropdown and see every action button (create / delete) disappear, then switch back and have them return — proving capabilities are driven entirely by the `ROLE_CAPS` map in shared types.
7. **As an operator**, I want a Metrics page with windowed pills (1m / 5m / 1h / 24h), p50/p95/p99 latency stat cards, and a by-method bar chart that polls every 3 seconds.

## Functional Requirements

### Phase 1 — Mock chain nodes
- pnpm monorepo at the repo root with workspaces: `apps/node-eth`, `apps/node-avax`, `apps/node-btc`, `apps/api`, `apps/web`, `packages/shared`.
- All TypeScript ESM, Fastify 5, Node 20+.
- Each mock node exposes:
  - `GET /` → status JSON `{ chain, ticker, blockHeight, uptimeS }`.
  - `POST /` → JSON-RPC 2.0 endpoint.
- Block-height auto-increment timers: ETH 12s, AVAX 2s, BTC 600s.
- Realistic-looking hex generated with `crypto.randomBytes`.
- Shared EVM JSON-RPC handler covers: `web3_clientVersion`, `net_version`, `net_listening`, `net_peerCount`, `eth_chainId`, `eth_blockNumber`, `eth_gasPrice`, `eth_maxPriorityFeePerGas`, `eth_feeHistory`, `eth_getBalance`, `eth_getBlockByNumber`, `eth_getBlockByHash`, `eth_getTransactionByHash`, `eth_getTransactionReceipt`, `eth_getLogs`, `eth_call`, `eth_estimateGas`, `eth_sendRawTransaction`. ETH `chainId = 0x1`, AVAX `chainId = 0xa86a`.
- BTC handler covers: `getblockcount`, `getbestblockhash`, `getblockchaininfo`, `getnetworkinfo`, `getmempoolinfo`, `getblockhash`, `getblock`, `getrawtransaction`, `getbalance`, `estimatesmartfee`, `getmininginfo`, `getpeerinfo`.
- Unsupported methods return JSON-RPC error code `-32601`.
- CORS headers on every response.
- Ports: ETH 8501, AVAX 8502, BTC 8503.

### Phase 2 — Wrapper API (`apps/api`, port 4000)
- In-memory store seeded with three endpoints: `eth-mainnet-prod`, `avax-cchain-prod`, `btc-mainnet-prod`. Each has `{ id (nanoid), name, chain, createdAt, token }`.
- Routes:
  - `GET  /health` → `{ ok: true }`.
  - `GET  /v1/users` → fixed 4 users (one per role).
  - `GET  /v1/endpoints`, `POST /v1/endpoints {name, chain}`, `DELETE /v1/endpoints/:id`.
  - `POST /v1/rpc/:endpointId` → forwards body to the matching mock node, records `{ ts, method, durationMs, ok, error }` into a circular `RpcLog` capped at 2000.
  - `GET  /v1/metrics?endpointId&windowMs` → `{ requestCount, errorCount, latencyP50, latencyP95, latencyP99, byMethod[] }`.
  - `GET  /v1/logs?endpointId&limit` — recent calls.
  - `GET  /v1/usage` → totals + `monthToDate { requests, included: 80_000_000, overage, estimatedCostUsd }` (Discovery plan: $49 base + $25 / M overage).
  - `GET  /v1/nodes` → pings each mock node's `GET /`, returns `NodeHealth[]` with status, blockHeight, peers, latencyMs, syncProgress, diskGB, versionText, uptimeS.
  - `GET  /v1/billing/invoices` → 6 mock monthly invoices.
- Uses `@fastify/cors` and `pino-pretty`.

### Phase 3 — Web frontend (`apps/web`, Vite + React 18, port 5180, strictPort)
- Plain CSS (NO Tailwind — explicit user override of the default tech stack).
- Vite proxies `/api` → `http://127.0.0.1:4000`.
- Imports types from `packages/shared`.
- Top-right Role Switcher dropdown over the 4 mock users; selection persists to `localStorage`. No login screen.
- Sidebar renders only `ROLE_CAPS[role].nav`.
- Pages:
  - **Overview** — 4 stat cards (total requests, avg latency, error rate, healthy chains) + node fleet row + live request log; polls 4s.
  - **Endpoints** — table (chain badge, name, id, copyable proxy URL `/api/v1/rpc/<id>`, created date). Create form gated by `canCreateEndpoint`. Delete gated by `canDeleteEndpoint`.
  - **RPC Playground** — endpoint dropdown, method input, params input (JSON array), send → `POST /api/v1/rpc/:id`. Pretty-printed response + latency. EVM sample chips vs BTC sample chips.
  - **Metrics** — endpoint dropdown + window pills (1m/5m/1h/24h). Stat cards (requests, errors, p50, p95, p99) + by-method bar chart. Polls 3s.
  - **Nodes** — large card per chain: big block number, peers, latency, disk, uptime, sync %, version text, sync progress bar. Polls 2.5s.
  - **Users** — read-only table (avatar, name, email, role pill, capabilities blurb). Admin-only.
  - **Billing** — month-to-date card + progress bar + 6 invoices.
  - **Settings** — read-only workspace facts. Admin-only.
- React Router for multi-page routing.

### Shared package (`packages/shared`)
Exports types: `Chain`, `Role` (`'admin' | 'developer' | 'billing' | 'viewer'`), `Endpoint`, `User`, `NodeHealth`, `MetricSnapshot`, `RpcLogEntry`, `UsageSummary`, `InvoiceLine`, plus a `ROLE_CAPS` map: `Record<Role, { nav: string[]; canCreateEndpoint; canDeleteEndpoint; canManageUsers; canViewBilling; canEditSettings }>`.

### Wizard's-choice features (3–5 sensible additions)
1. **Copy-on-click toast** on every proxy URL / hash / id with monospaced font.
2. **Latency sparkline** in the Overview live-log row (last 30 calls per endpoint).
3. **Sample method chips** in the Playground — chain-aware presets autofill method+params.
4. **Healthy-chain pulse dot** on the sidebar Nodes nav (green if all 3 healthy, amber if 1 lagging, red if any down).
5. **Role-tinted accent colour** that retints buttons/links/badges as the role switches (admin blue, developer green, billing amber, viewer grey).

## Non-Functional Requirements
- **Performance**: All polling ≤ 4s; mock RPC round-trip target < 25 ms p95 on localhost; Vite HMR < 500 ms.
- **A11y**: Semantic landmarks (`<nav>`, `<main>`, `<header>`), keyboard-focus rings on interactive elements, ARIA labels on icon-only buttons, role pills must meet WCAG AA contrast against panel `#161c28`.
- **Reliability**: Circular `RpcLog` cap of 2000 prevents unbounded memory; mock nodes catch and return `-32601` for unknown methods; API surfaces RPC errors instead of 500-ing.
- **DX**: One command (`pnpm dev` at repo root) starts all 5 services in parallel; TypeScript strict mode; ESM-only.
- **Theme**: dark slate (`#0a0d14` bg, `#161c28` panels), chain badges in canonical colours (ETH `#627eea`, AVAX `#e84142`, BTC `#f7931a`), mono font for hashes/ids.
- **Visual style**: "Operator console" — dense data tables, glowing accent dots, subtle panel borders, no gradients.

## Out of Scope (v1)
- Real authentication / OAuth / sessions / JWTs.
- Persistent storage (Postgres, SQLite, Redis) — everything is in-memory and resets on restart.
- Real blockchain integration (no real Ethereum / Avalanche / Bitcoin RPC).
- Real billing / Stripe integration — invoices are static mock data.
- Real WebSocket / `eth_subscribe` — JSON-RPC over HTTP only.
- Multi-tenant workspaces, teams, invites, audit log.
- Tailwind CSS (explicitly excluded by the brief in favour of plain CSS).
- Mobile / responsive layouts below 1024 px — desktop dashboard only.
- E2E browser tests (Playwright); only Vitest unit / component tests in v1.
