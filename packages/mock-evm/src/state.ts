export interface NodeState {
  blockHeight: number;
  startedAt: number;
  uptimeS: () => number;
}

export function createState(initialHeight: number): NodeState {
  const startedAt = Date.now();
  const state: NodeState = {
    blockHeight: initialHeight,
    startedAt,
    uptimeS: () => Math.floor((Date.now() - startedAt) / 1000)
  };
  return state;
}
