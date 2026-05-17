# Architecture — QuickNode Clone

## High-level picture

```
                       ┌────────────────────────────────────────┐
                       │ apps/web  (Vite + React 18, :5180)     │
                       │ - Sidebar / Header / Pages             │
                       │ - RoleContext  (localStorage)          │
                       │ - useApi() polling hooks               │
                       └──────────────┬─────────────────────────┘
                                      │  /api/* (Vite proxy)
                                      ▼
                       ┌────────────────────────────────────────┐
                       │ apps/api  (Fastify 5, :4000)           │
                       │ - in-memory store                      │
                       │ - circular RpcLog (cap 2000)           │
                       │ - metrics aggregator                   │
                       │ - mock users / invoices / usage        │
                       └──────────┬─────────────┬───────────────┘
                                  │             │
                ┌─────────────────┘             └────────────────┐
                ▼                                                ▼
   ┌───────────────────┐    ┌───────────────────┐    ┌───────────────────┐
   │ apps/node-eth     │    │ apps/node-avax    │    │ apps/node-btc     │
   │ Fastify :8501     │    │ Fastify :8502     │    │ Fastify :8503     │
   │ EVM RPC handler   │    │ EVM RPC handler   │    │ Bitcoin RPC handler│
   │ tick = 12 000 ms  │    │ tick = 2 000 ms   │    │ tick = 600 000 ms │
   └───────────────────┘    └───────────────────┘    └───────────────────┘

                       ┌────────────────────────────────────────┐
                       │ packages/shared (TS types + ROLE_CAPS) │
                       └────────────────────────────────────────┘
```

## Directory layout

```
/ (repo root)
├── package.json              # private root, "scripts": { "dev": "pnpm -r --parallel run dev" }
├── pnpm-workspace.yaml       # apps/*  packages/*
├── tsconfig.base.json        # strict, ESM, NodeNext
├── .wiz/                     # this stage's outputs
└── apps/
    ├── node-eth/
    │   ├── package.json      # name: @qnc/node-eth, port 8501, tick 12000
    │   ├── tsconfig.json
    │   └── src/
    │       ├── server.ts     # Fastify boot + GET / + POST /
    │       ├── state.ts      # mutable { blockHeight, startedAt }
    │       └── chain.ts      # { chain:'eth', ticker:'ETH', chainId:'0x1' }
    ├── node-avax/            # mirrors node-eth, chainId 0xa86a, tick 2000
    │   └── src/{server.ts,state.ts,chain.ts}
    ├── node-btc/
    │   └── src/
    │       ├── server.ts
    │       ├── state.ts
    │       └── btcRpc.ts     # bitcoin-style JSON-RPC dispatcher
    ├── api/
    │   ├── package.json      # name: @qnc/api, port 4000
    │   └── src/
    │       ├── server.ts     # Fastify + cors + pino-pretty
    │       ├── store.ts      # endpoints[], rpcLog (circular), users[], invoices[]
    │       ├── metrics.ts    # percentile + by-method aggregator
    │       ├── proxy.ts      # endpoint → mock-node URL map; fetch + timing
    │       └── routes/
    │           ├── health.ts
    │           ├── users.ts
    │           ├── endpoints.ts
    │           ├── rpc.ts
    │           ├── metrics.ts
    │           ├── logs.ts
    │           ├── usage.ts
    │           ├── nodes.ts
    │           └── billing.ts
    └── web/
        ├── package.json      # name: @qnc/web, port 5180, strictPort
        ├── vite.config.ts    # proxy /api → 127.0.0.1:4000
        ├── index.html
        └── src/
            ├── main.tsx
            ├── App.tsx
            ├── styles/
            │   ├── global.css        # dark slate theme, css vars
            │   └── tokens.css        # role accents, chain colours
            ├── context/
            │   └── RoleContext.tsx   # current role + setter + localStorage
            ├── lib/
            │   ├── api.ts            # fetchJson, typed wrappers
            │   ├── usePoll.ts        # interval-based polling hook
            │   ├── format.ts         # hex → big-int → comma format
            │   └── samples.ts        # EVM vs BTC sample method chips
            ├── components/
            │   ├── Sidebar.tsx
            │   ├── Header.tsx
            │   ├── RoleSwitcher.tsx
            │   ├── StatCard.tsx
            │   ├── ChainBadge.tsx
            │   ├── RolePill.tsx
            │   ├── CopyButton.tsx
            │   ├── ProgressBar.tsx
            │   ├── BarChart.tsx
            │   ├── LiveLogTable.tsx
            │   ├── NodeCard.tsx
            │   └── Toast.tsx
            ├── pages/
            │   ├── Overview.tsx
            │   ├── Endpoints.tsx
            │   ├── Playground.tsx
            │   ├── Metrics.tsx
            │   ├── Nodes.tsx
            │   ├── Users.tsx
            │   ├── Billing.tsx
            │   └── Settings.tsx
            └── routes.tsx              # React Router config
└── packages/
    └── shared/
        ├── package.json      # name: @qnc/shared, exports ./dist/index.js
        ├── tsconfig.json
        └── src/
            ├── index.ts      # re-exports
            ├── types.ts      # Chain, Role, Endpoint, User, NodeHealth, …
            └── roles.ts      # ROLE_CAPS map
```

## Component tree (web)

```
<App>
  <RoleProvider>            (context)
    <BrowserRouter>
      <Layout>
        <Sidebar role={role}/>           uses ROLE_CAPS[role].nav
        <main>
          <Header>
            <RoleSwitcher users role onChange/>
          </Header>
          <Routes>
            <Overview />
              ├── <StatCard/> ×4
              ├── <NodeFleetRow/>          (3× <NodeCard compact/>)
              └── <LiveLogTable/>           (polls 4s)
            <Endpoints />
              ├── <CreateEndpointForm/>     (gated canCreateEndpoint)
              └── <EndpointTable/>           rows: <ChainBadge/> <CopyButton/> <DeleteBtn/>
            <Playground />
              ├── <EndpointSelect/>
              ├── <SampleChips chain/>
              ├── <MethodInput/> <ParamsInput/>
              └── <ResponsePanel/>
            <Metrics />
              ├── <WindowPills/>
              ├── <StatCard/> ×5
              └── <BarChart byMethod/>
            <Nodes />
              └── <NodeCard/> ×3              (polls 2.5s)
            <Users />                         admin-only
              └── <UserTable/>
            <Billing />
              ├── <MonthToDateCard/>
              └── <InvoiceTable/>
            <Settings />                     admin-only
          </Routes>
        </main>
      </Layout>
      <ToastHost/>
    </BrowserRouter>
  </RoleProvider>
</App>
```

## State management

- **No Redux / Zustand** — keep it lightweight.
- **RoleContext** — single React context (`{ role, setRole, user }`). Hydrates from `localStorage['qnc.role']`, defaults to `admin`. Writes back on change. Drives `ROLE_CAPS[role]` for sidebar + capability gates.
- **usePoll(fetcher, intervalMs)** — generic hook returning `{ data, error, loading, refetch }`. Each page declares its own interval (Overview 4 s, Metrics 3 s, Nodes 2.5 s).
- **useToast()** — tiny event-emitter for the Toast host (used by `<CopyButton/>`).
- **API state** is *not* cached client-side beyond the polling tick — server is the source of truth.
- **Server state (apps/api)** — plain module-scoped objects:
  - `endpoints: Endpoint[]` (seeded ×3)
  - `rpcLog: RpcLogEntry[]` with `push()` that slices to 2000
  - `users: User[]` (frozen, ×4)
  - `invoices: InvoiceLine[]` (frozen, ×6)
  - `serverStartedAt: number` for uptime.

## Data shape (TypeScript sketch — `packages/shared/src/types.ts`)

```ts
export type Chain = 'eth' | 'avax' | 'btc';
export type Role  = 'admin' | 'developer' | 'billing' | 'viewer';

export interface Endpoint {
  id: string;          // nanoid
  name: string;
  chain: Chain;
  createdAt: string;   // ISO
  token: string;       // mock bearer (display-only)
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl?: string;
}

export interface NodeHealth {
  chain: Chain;
  status: 'healthy' | 'lagging' | 'down';
  blockHeight: number;
  peers: number;
  latencyMs: number;
  syncProgress: number;   // 0..1
  diskGB: number;
  versionText: string;    // e.g. "geth/v1.13.14-stable"
  uptimeS: number;
}

export interface RpcLogEntry {
  ts: number;             // ms epoch
  endpointId: string;
  chain: Chain;
  method: string;
  durationMs: number;
  ok: boolean;
  error?: string;
}

export interface MetricSnapshot {
  endpointId: string;
  windowMs: number;
  requestCount: number;
  errorCount: number;
  latencyP50: number;
  latencyP95: number;
  latencyP99: number;
  byMethod: Array<{ method: string; count: number; errors: number }>;
}

export interface UsageSummary {
  totalRequests: number;
  errorRate: number;
  byChain: Record<Chain, number>;
  monthToDate: {
    requests: number;
    included: 80_000_000;
    overage: number;
    estimatedCostUsd: number;   // $49 base + $25/M overage
  };
}

export interface InvoiceLine {
  id: string;
  periodStart: string;
  periodEnd: string;
  requests: number;
  amountUsd: number;
  status: 'paid' | 'open' | 'past_due';
}

// roles.ts
export const ROLE_CAPS: Record<Role, {
  nav: Array<'overview'|'endpoints'|'rpc'|'metrics'|'nodes'|'users'|'billing'|'settings'>;
  canCreateEndpoint: boolean;
  canDeleteEndpoint: boolean;
  canManageUsers:    boolean;
  canViewBilling:    boolean;
  canEditSettings:   boolean;
}> = {
  admin:     { nav: ['overview','endpoints','rpc','metrics','nodes','users','billing','settings'],
               canCreateEndpoint:true, canDeleteEndpoint:true, canManageUsers:true,
               canViewBilling:true, canEditSettings:true },
  developer: { nav: ['overview','endpoints','rpc','metrics','nodes'],
               canCreateEndpoint:true, canDeleteEndpoint:false, canManageUsers:false,
               canViewBilling:false, canEditSettings:false },
  billing:   { nav: ['overview','billing'],
               canCreateEndpoint:false, canDeleteEndpoint:false, canManageUsers:false,
               canViewBilling:true, canEditSettings:false },
  viewer:    { nav: ['overview','metrics','nodes'],
               canCreateEndpoint:false, canDeleteEndpoint:false, canManageUsers:false,
               canViewBilling:false, canEditSettings:false },
};
```

## Mock-node ↔ API mapping

```ts
// apps/api/src/proxy.ts
const NODE_URL: Record<Chain, string> = {
  eth:  'http://127.0.0.1:8501',
  avax: 'http://127.0.0.1:8502',
  btc:  'http://127.0.0.1:8503',
};
```

`POST /v1/rpc/:endpointId` looks up endpoint → chain → URL, `fetch()` with body forward, measures `performance.now()` deltas, then `rpcLog.push({...})`.

## Metrics computation

- Filter `rpcLog` by `endpointId` and `ts >= now - windowMs`.
- Sort `durationMs` array; pick percentiles by index `Math.floor(n * p)`.
- Group by `method` for `byMethod[]`.

## Theme tokens (`tokens.css`)

```css
:root {
  --bg:        #0a0d14;
  --panel:     #161c28;
  --border:    #232b3d;
  --text:      #e6edf7;
  --muted:     #8a93a6;
  --eth:       #627eea;
  --avax:      #e84142;
  --btc:       #f7931a;
  --accent:    var(--accent-admin);
  --accent-admin:     #4f8eff;
  --accent-developer: #25c08a;
  --accent-billing:   #f59e3a;
  --accent-viewer:    #8a93a6;
  --mono: ui-monospace, "JetBrains Mono", Menlo, monospace;
}
[data-role="developer"] { --accent: var(--accent-developer); }
[data-role="billing"]   { --accent: var(--accent-billing); }
[data-role="viewer"]    { --accent: var(--accent-viewer); }
```

## Testing strategy (Vitest)

- `packages/shared` — type-level + ROLE_CAPS shape tests.
- `apps/node-eth` — POST `/` returns hex `eth_blockNumber`; unknown method returns code `-32601`; tick increments.
- `apps/api` — endpoints CRUD, percentile maths on a fixed log fixture, proxy uses correct chain URL (mocked `fetch`).
- `apps/web` — `RoleSwitcher` updates context + localStorage; `<Sidebar/>` renders only the nav for the active role; `<CopyButton/>` writes to clipboard and emits toast.

## Build / run

- Root `package.json` script: `"dev": "pnpm -r --parallel run dev"`.
- Each workspace `dev` uses `tsx watch src/server.ts` (nodes/api) or `vite` (web).
- `packages/shared` uses `tsc -w` and is consumed via `workspace:*`.
