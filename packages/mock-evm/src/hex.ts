import { randomBytes } from 'node:crypto';

/** Random hex bytes prefixed with 0x. */
export function randomHex(byteLen: number): string {
  return '0x' + randomBytes(byteLen).toString('hex');
}

/** Encode a non-negative integer as a 0x-prefixed hex string with no leading zeros (except 0x0). */
export function toHex(n: number | bigint): string {
  const v = typeof n === 'bigint' ? n : BigInt(Math.max(0, Math.trunc(n)));
  return '0x' + v.toString(16);
}

/** Random uint as hex within a deterministic-ish range. */
export function randomHexInt(maxExclusive: number): string {
  return toHex(Math.floor(Math.random() * maxExclusive));
}

export function nowIsoSeconds(): number {
  return Math.floor(Date.now() / 1000);
}
