import { useCallback, useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Chain, Endpoint } from '@qnc/shared';
import { ROLE_CAPS } from '@qnc/shared';
import { api } from '../lib/api.js';
import { usePoll } from '../lib/usePoll.js';
import { useRole } from '../context/RoleContext.js';
import { ChainBadge } from '../components/ChainBadge.js';
import { CopyButton } from '../components/CopyButton.js';
import { EmptyState } from '../components/EmptyState.js';
import { KebabMenu } from '../components/KebabMenu.js';
import { useToast } from '../components/Toast.js';

const POLL_MS = 5_000;
const CHAINS: Chain[] = ['eth', 'avax', 'btc'];

function proxyUrl(id: string): string {
  return `/api/v1/rpc/${id}`;
}

function CreateEndpointForm({ onCreated }: { onCreated: (e: Endpoint) => void }): JSX.Element {
  const { push } = useToast();
  const [name, setName] = useState('');
  const [chain, setChain] = useState<Chain>('eth');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      push('Name is required', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const created = await api.endpoints.create({ name: name.trim(), chain });
      push(`Created ${created.name}`, 'success');
      setName('');
      onCreated(created);
    } catch (err) {
      push(err instanceof Error ? err.message : 'Create failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      data-testid="create-endpoint-form"
      onSubmit={submit}
      className="card"
      style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}
    >
      <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span className="muted" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.6 }}>
          Name
        </span>
        <input
          aria-label="endpoint name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="my-endpoint"
          className="input"
          style={{ minWidth: 220 }}
        />
      </label>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span className="muted" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.6 }}>
          Chain
        </span>
        <select
          aria-label="endpoint chain"
          value={chain}
          onChange={(e) => setChain(e.target.value as Chain)}
          className="select"
        >
          {CHAINS.map((c) => (
            <option key={c} value={c}>
              {c.toUpperCase()}
            </option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        data-testid="create-endpoint-submit"
        disabled={submitting}
        className="btn-primary"
      >
        {submitting ? 'Creating…' : 'Create endpoint'}
      </button>
    </form>
  );
}

export function EndpointsPage(): JSX.Element {
  const { role } = useRole();
  const caps = ROLE_CAPS[role];
  const { push } = useToast();
  const fetcher = useCallback(() => api.endpoints.list(), []);
  const { data, error, refetch } = usePoll(fetcher, POLL_MS);

  const onDelete = async (e: Endpoint) => {
    if (!window.confirm(`Delete endpoint "${e.name}"?`)) return;
    try {
      await api.endpoints.remove(e.id);
      push(`Deleted ${e.name}`, 'success');
      refetch();
    } catch (err) {
      push(err instanceof Error ? err.message : 'Delete failed', 'error');
    }
  };

  return (
    <div className="page">
      {caps.canCreateEndpoint ? <CreateEndpointForm onCreated={refetch} /> : null}

      {(data ?? []).length === 0 && !error ? (
        <div className="card">
          <EmptyState
            icon="⌬"
            title="No endpoints yet"
            hint={caps.canCreateEndpoint ? 'Create your first endpoint above.' : 'An admin can create one for you.'}
          />
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="data-table" data-testid="endpoints-table">
            <thead>
              <tr>
                <th>Chain</th>
                <th>Name</th>
                <th>ID</th>
                <th>Proxy URL</th>
                <th>Created</th>
                {caps.canDeleteEndpoint ? <th>Actions</th> : null}
              </tr>
            </thead>
            <tbody>
            <AnimatePresence initial={false}>
              {(data ?? []).map((e, i) => (
                <motion.tr
                  key={e.id}
                  data-testid="endpoint-row"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    transition: { delay: i * 0.03, duration: 0.18 }
                  }}
                  exit={{ opacity: 0, y: -4, transition: { duration: 0.12 } }}
                >
                  <td>
                    <ChainBadge chain={e.chain} />
                  </td>
                  <td>{e.name}</td>
                  <td>
                    <span className="mono">{e.id}</span>
                  </td>
                  <td>
                    <div className="row" style={{ gap: 8 }}>
                      <span className="mono" style={{ fontSize: 12 }}>
                        {proxyUrl(e.id)}
                      </span>
                      <CopyButton value={proxyUrl(e.id)} ariaLabel={`copy proxy URL for ${e.name}`} />
                    </div>
                  </td>
                  <td>
                    <span className="muted" style={{ fontSize: 12 }}>
                      {new Date(e.createdAt).toLocaleString()}
                    </span>
                  </td>
                  {caps.canDeleteEndpoint ? (
                    <td>
                      <KebabMenu
                        ariaLabel={`actions for ${e.name}`}
                        items={[
                          {
                            key: 'delete',
                            label: 'Delete',
                            tone: 'danger',
                            onSelect: () => void onDelete(e)
                          }
                        ]}
                      />
                    </td>
                  ) : null}
                </motion.tr>
              ))}
            </AnimatePresence>
            </tbody>
          </table>
        </div>
      )}
      {error ? <div className="muted">⚠ {error.message}</div> : null}
    </div>
  );
}

