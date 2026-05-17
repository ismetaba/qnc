import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { useRole } from '../context/RoleContext.js';

interface Fact {
  label: string;
  value: string;
}

const STATIC_FACTS: Fact[] = [
  { label: 'Workspace name', value: 'QNC Demo' },
  { label: 'Plan', value: 'Discovery' },
  { label: 'Region', value: 'us-east-1' },
];

function readBuildSha(): string {
  const env = (import.meta as ImportMeta & { env?: Record<string, string> }).env;
  return env?.VITE_BUILD_SHA ?? 'dev';
}

export function SettingsPage(): JSX.Element {
  const [apiOk, setApiOk] = useState<boolean | null>(null);
  const [resetState, setResetState] = useState<'idle' | 'confirm' | 'busy' | 'done'>('idle');
  const { role } = useRole();

  useEffect(() => {
    let cancelled = false;
    api
      .health()
      .then((h) => { if (!cancelled) setApiOk(h.ok); })
      .catch(() => { if (!cancelled) setApiOk(false); });
    return () => { cancelled = true; };
  }, []);

  const facts: Fact[] = [
    ...STATIC_FACTS,
    { label: 'Build', value: readBuildSha() },
    {
      label: 'API health',
      value: apiOk === null ? 'checking…' : apiOk ? 'ok' : 'unreachable',
    },
    { label: 'Active role', value: role },
  ];

  const handleReset = async () => {
    setResetState('busy');
    try {
      const list = await api.endpoints.list();
      await Promise.all(list.map((e) => api.endpoints.remove(e.id).catch(() => undefined)));
      setResetState('done');
      setTimeout(() => setResetState('idle'), 2000);
    } catch {
      setResetState('idle');
    }
  };

  return (
    <div className="page">
      <header>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: -0.2 }}>Settings</h1>
        <p className="muted" style={{ margin: '4px 0 0', fontSize: 13, maxWidth: 560 }}>
          Workspace configuration, integration credentials, and demo controls. Everything is in-memory and
          resets when the API restarts.
        </p>
      </header>

      <Section title="Workspace">
        <dl
          data-testid="settings-facts"
          style={{
            display: 'grid',
            gridTemplateColumns: '180px 1fr',
            rowGap: 10,
            columnGap: 14,
            margin: 0,
          }}
        >
          {facts.map((f) => (
            <Row key={f.label} fact={f} />
          ))}
        </dl>
      </Section>

      <Section title="API access" hint="Credentials are placeholder — the demo does not authenticate requests.">
        <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', rowGap: 12, columnGap: 14 }}>
          <Label>Base URL</Label>
          <Mono>http://localhost:4000</Mono>
          <Label>Default API key</Label>
          <Mono>qnc_demo_••••••••••••</Mono>
          <Label>OpenAPI spec</Label>
          <Mono>not yet exported</Mono>
        </div>
      </Section>

      <Section title="Notifications" hint="Where alerts about node degradation or quota would be delivered.">
        <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', rowGap: 10, columnGap: 14 }}>
          <Label>Email digest</Label>
          <span style={{ fontSize: 13 }}>Weekly summary → <span className="mono muted">ops@demo.local</span></span>
          <Label>Slack webhook</Label>
          <span className="muted" style={{ fontSize: 13 }}>not connected</span>
          <Label>Pager rotation</Label>
          <span className="muted" style={{ fontSize: 13 }}>not connected</span>
        </div>
      </Section>

      <Section title="About">
        <p className="muted" style={{ margin: 0, fontSize: 13, lineHeight: 1.6 }}>
          QNC is a self-contained QuickNode-style demo: 3 mock blockchain nodes behind a wrapper API and a
          React dashboard with role-based capability gates. Everything is in-memory and resets on restart.
        </p>
      </Section>

      <div className="card" style={{ borderColor: 'color-mix(in srgb, var(--red) 40%, var(--border))' }}>
        <div className="row" style={{ alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 14, color: 'var(--red)', textTransform: 'uppercase', letterSpacing: 0.6 }}>
              Danger zone
            </h2>
            <p className="muted" style={{ margin: '6px 0 0', fontSize: 13, maxWidth: 480 }}>
              Wipes every RPC endpoint you've created in this session. Mock chain state and member records are
              untouched.
            </p>
          </div>
          {resetState === 'idle' ? (
            <button type="button" className="btn-danger" onClick={() => setResetState('confirm')}>
              Reset endpoints
            </button>
          ) : resetState === 'confirm' ? (
            <div className="row" style={{ gap: 8 }}>
              <button type="button" className="btn-ghost" onClick={() => setResetState('idle')}>Cancel</button>
              <button type="button" className="btn-danger" onClick={() => void handleReset()}>Yes, reset</button>
            </div>
          ) : resetState === 'busy' ? (
            <span className="muted" style={{ fontSize: 13 }}>Removing endpoints…</span>
          ) : (
            <span style={{ fontSize: 13, color: 'var(--green)' }}>Cleared ✓</span>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }): JSX.Element {
  return (
    <div className="card">
      <h2 style={{ marginTop: 0, marginBottom: hint ? 4 : 12, fontSize: 14, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.6 }}>
        {title}
      </h2>
      {hint ? <p className="muted" style={{ margin: '0 0 14px', fontSize: 12 }}>{hint}</p> : null}
      {children}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <span className="muted" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.6 }}>
      {children}
    </span>
  );
}

function Mono({ children }: { children: React.ReactNode }): JSX.Element {
  return <span className="mono" style={{ fontSize: 13 }}>{children}</span>;
}

function Row({ fact }: { fact: Fact }): JSX.Element {
  return (
    <>
      <dt
        className="muted"
        style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.6 }}
        data-testid="settings-fact-label"
      >
        {fact.label}
      </dt>
      <dd style={{ margin: 0, fontFamily: 'var(--mono)' }} data-testid="settings-fact-value">
        {fact.value}
      </dd>
    </>
  );
}
