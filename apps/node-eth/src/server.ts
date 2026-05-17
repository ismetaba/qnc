import { createEvmServer } from '@qnc/mock-evm';
import { ETH_CONFIG } from './chain.js';

const node = createEvmServer(ETH_CONFIG);

node
  .start()
  .then((addr) => {
    // eslint-disable-next-line no-console
    console.log(`[node-eth] listening on ${addr} (chain=${ETH_CONFIG.chain}, tick=${ETH_CONFIG.tickMs}ms)`);
  })
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error('[node-eth] failed to start', err);
    process.exit(1);
  });

const shutdown = async (signal: string) => {
  // eslint-disable-next-line no-console
  console.log(`[node-eth] received ${signal}, shutting down`);
  await node.stop();
  process.exit(0);
};
process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
