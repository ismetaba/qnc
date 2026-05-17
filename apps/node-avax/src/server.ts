import { createEvmServer } from '@qnc/mock-evm';
import { AVAX_CONFIG } from './chain.js';

const node = createEvmServer(AVAX_CONFIG);

node
  .start()
  .then((addr) => {
    // eslint-disable-next-line no-console
    console.log(`[node-avax] listening on ${addr} (chain=${AVAX_CONFIG.chain}, tick=${AVAX_CONFIG.tickMs}ms)`);
  })
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error('[node-avax] failed to start', err);
    process.exit(1);
  });

const shutdown = async (signal: string) => {
  // eslint-disable-next-line no-console
  console.log(`[node-avax] received ${signal}, shutting down`);
  await node.stop();
  process.exit(0);
};
process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
