export interface BtcNodeState {
  blockHeight: number;
  startedAt: number;
  uptimeS: () => number;
}

export function createBtcState(initialHeight: number): BtcNodeState {
  const startedAt = Date.now();
  return {
    blockHeight: initialHeight,
    startedAt,
    uptimeS: () => Math.floor((Date.now() - startedAt) / 1000)
  };
}
