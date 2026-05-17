import { useEffect, useMemo, useState } from 'react';
import type { Endpoint } from '@qnc/shared';
import { ROLE_CAPS } from '@qnc/shared';
import { api } from '../lib/api.js';
import { useRole } from '../context/RoleContext.js';
import { ChainBadge } from '../components/ChainBadge.js';
import { Tooltip } from '../components/Tooltip.js';
import { useToast } from '../components/Toast.js';
import { samplesFor, type SampleChip } from '../lib/samples.js';
import { formatMs } from '../lib/format.js';
import { highlightJson } from '../lib/jsonHighlight.js';

interface PlaygroundResult {
  body: unknown;
  durationMs: number;
}

function safeParseParams(text: string): { ok: true; value: unknown[] } | { ok: false; error: string } {
  const trimmed = text.trim();
  if (trimmed === '') return { ok: true, value: [] };
  try {
    const parsed = JSON.parse(trimmed);
    if (!Array.isArray(parsed)) return { ok: false, error: 'params must be a JSON array' };
    return { ok: true, value: parsed };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'invalid JSON' };
  }
}

export function PlaygroundPage(): JSX.Element {
  const { role } = useRole();
  const caps = ROLE_CAPS[role];
  const { push } = useToast();

  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [endpointId, setEndpointId] = useState<string>('');
  const [method, setMethod] = useState<string>('eth_blockNumber');
  const [paramsText, setParamsText] = useState<string>('[]');
  const [result, setResult] = useState<PlaygroundResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api.endpoints
      .list()
      .then((eps) => {
        if (cancelled) return;
        setEndpoints(eps);
        if (eps.length && !endpointId) setEndpointId(eps[0]!.id);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'failed to load endpoints');
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selected = endpoints.find((e) => e.id === endpointId);
  const chips = useMemo<SampleChip[]>(() => samplesFor(selected?.chain), [selected?.chain]);

  const applyChip = (c: SampleChip) => {
    setMethod(c.method);
    setParamsText(JSON.stringify(c.params));
  };

  const send = async () => {
    if (!endpointId) {
      push('Pick an endpoint first', 'error');
      return;
    }
    if (!method.trim()) {
      push('Method is required', 'error');
      return;
    }
    const parsed = safeParseParams(paramsText);
    if (!parsed.ok) {
      setError(parsed.error);
      push(parsed.error, 'error');
      return;
    }
    setError(null);
    setSubmitting(true);
    const start = performance.now();
    try {
      const body = await api.rpc(endpointId, {
        jsonrpc: '2.0',
        id: Date.now(),
        method: method.trim(),
        params: parsed.value
      });
      setResult({ body, durationMs: performance.now() - start });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'request failed';
      setError(message);
      push(message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page">
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="row" style={{ gap: 12, flexWrap: 'wrap' }}>
          <select
            aria-label="endpoint"
            value={endpointId}
            onChange={(e) => setEndpointId(e.target.value)}
            style={selectStyle}
          >
            {endpoints.length === 0 ? <option value="">— no endpoints —</option> : null}
            {endpoints.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
          {selected ? <ChainBadge chain={selected.chain} size="md" /> : null}
        </div>

        <div className="row" style={{ gap: 6, flexWrap: 'wrap' }} data-testid="sample-chips">
          {chips.map((c) => (
            <Tooltip
              key={c.label}
              label={
                c.params.length === 0
                  ? `${c.method}() — fills params with []`
                  : `${c.method}(${c.params.length} param${c.params.length === 1 ? '' : 's'})`
              }
            >
              <button
                type="button"
                data-testid="sample-chip"
                onClick={() => applyChip(c)}
                style={{
                  background: 'var(--panel-2)',
                  color: 'var(--text)',
                  border: '1px solid var(--border)',
                  borderRadius: 999,
                  padding: '4px 10px',
                  fontSize: 12,
                  fontFamily: 'var(--mono)'
                }}
              >
                {c.label}
              </button>
            </Tooltip>
          ))}
        </div>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span className="muted" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.6 }}>
            Method
          </span>
          <input
            aria-label="rpc method"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="mono"
            style={{ ...inputStyle }}
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span className="muted" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.6 }}>
            Params (JSON array)
          </span>
          <textarea
            aria-label="rpc params"
            value={paramsText}
            onChange={(e) => setParamsText(e.target.value)}
            rows={4}
            className="mono"
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </label>

        <div className="row" style={{ gap: 10 }}>
          {caps.nav.includes('rpc') ? (
            <button
              type="button"
              data-testid="playground-send"
              onClick={send}
              disabled={submitting}
              style={{
                background: 'var(--accent)',
                color: '#0a0d14',
                border: 'none',
                borderRadius: 6,
                padding: '8px 18px',
                fontWeight: 700
              }}
            >
              {submitting ? 'Sending…' : 'Send'}
            </button>
          ) : (
            <span className="muted">Your role cannot send RPC requests.</span>
          )}
          {result ? <span className="muted mono">{formatMs(result.durationMs)} round-trip</span> : null}
        </div>

        {error ? (
          <div data-testid="playground-error" style={{ color: 'var(--red)', fontSize: 13 }}>
            ⚠ {error}
          </div>
        ) : null}
      </div>

      <div className="card">
        <div className="muted" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 }}>
          Response
        </div>
        <pre
          data-testid="playground-response"
          className="mono"
          style={{
            margin: 0,
            background: 'var(--panel-2)',
            border: '1px solid var(--border)',
            padding: 12,
            borderRadius: 8,
            maxHeight: 360,
            overflow: 'auto',
            fontSize: 12,
            color: 'var(--text)'
          }}
        >
          {result
            ? highlightJson(JSON.stringify(result.body, null, 2))
            : '// send a request to see the response'}
        </pre>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  background: 'var(--panel-2)',
  color: 'var(--text)',
  border: '1px solid var(--border)',
  borderRadius: 6,
  padding: '8px 10px',
  width: '100%',
  fontSize: 13
};

const selectStyle: React.CSSProperties = {
  background: 'var(--panel-2)',
  color: 'var(--text)',
  border: '1px solid var(--border)',
  borderRadius: 6,
  padding: '6px 10px'
};
