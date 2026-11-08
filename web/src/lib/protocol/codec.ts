import type { ChallengeFields, IouFields } from './types';

export const IOU_LEN = 61, SIG_LEN = 64, SIGNED_IOU_LEN = 125, CHALLENGE_LEN = 41;
const B32 = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

export function ulidToBytes(ulid: string): Uint8Array {
  if (!/^[0-7][0-9A-HJKMNP-TV-Z]{25}$/i.test(ulid)) throw new Error(`invalid ULID: ${ulid}`);
  let n = 0n;
  for (const c of ulid.toUpperCase()) n = n * 32n + BigInt(B32.indexOf(c));
  const out = new Uint8Array(16);
  for (let i = 15; i >= 0; i--) { out[i] = Number(n & 0xffn); n >>= 8n; }
  return out;
}
export function bytesToUlid(b: Uint8Array): string {
  let n = 0n;
  for (const x of b) n = (n << 8n) | BigInt(x);
  let s = '';
  for (let i = 0; i < 26; i++) { s = B32[Number(n & 31n)] + s; n >>= 5n; }
  return s;
}
export const toHex = (u: Uint8Array) => [...u].map((b) => b.toString(16).padStart(2, '0')).join('');

export function encodeIou(f: IouFields): Uint8Array {
  if (f.nonce.length !== 8) throw new Error('nonce must be 8 bytes');
  const out = new Uint8Array(IOU_LEN), dv = new DataView(out.buffer);
  out[0] = f.ver;
  out.set(ulidToBytes(f.payerId), 1);
  out.set(ulidToBytes(f.merchantId), 17);
  dv.setUint32(33, f.amountCents); dv.setUint32(37, f.counter); dv.setUint32(41, f.ts);
  out.set(f.nonce, 45);
  dv.setInt32(53, f.latE6); dv.setInt32(57, f.lonE6);
  return out;
}
export function decodeIou(b: Uint8Array): IouFields {
  if (b.length !== IOU_LEN) throw new Error(`IOU must be ${IOU_LEN} bytes, got ${b.length}`);
  const dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
  return {
    ver: b[0], payerId: bytesToUlid(b.slice(1, 17)), merchantId: bytesToUlid(b.slice(17, 33)),
    amountCents: dv.getUint32(33), counter: dv.getUint32(37), ts: dv.getUint32(41),
    nonce: b.slice(45, 53), latE6: dv.getInt32(53), lonE6: dv.getInt32(57),
  };
}
export function encodeChallenge(c: ChallengeFields): Uint8Array {
  if (c.nonce.length !== 8) throw new Error('nonce must be 8 bytes');
  const out = new Uint8Array(CHALLENGE_LEN), dv = new DataView(out.buffer);
  out[0] = c.ver; out.set(ulidToBytes(c.merchantId), 1); out.set(c.nonce, 17);
  dv.setUint32(25, c.ts); dv.setInt32(29, c.latE6); dv.setInt32(33, c.lonE6); dv.setUint32(37, c.amountCents);
  return out;
}
export function decodeChallenge(b: Uint8Array): ChallengeFields {
  if (b.length !== CHALLENGE_LEN) throw new Error(`challenge must be ${CHALLENGE_LEN} bytes, got ${b.length}`);
  const dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
  return {
    ver: b[0], merchantId: bytesToUlid(b.slice(1, 17)), nonce: b.slice(17, 25), ts: dv.getUint32(25),
    latE6: dv.getInt32(29), lonE6: dv.getInt32(33), amountCents: dv.getUint32(37),
  };
}
