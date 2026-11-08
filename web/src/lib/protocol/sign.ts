import { CHALLENGE_LEN, IOU_LEN, SIG_LEN, SIGNED_IOU_LEN, encodeChallenge, encodeIou } from './codec';
import type { ChallengeFields, IouFields } from './types';

const ALG = { name: 'ECDSA', hash: 'SHA-256' } as const;
// Copy into a fresh ArrayBuffer-backed view: WebCrypto's types reject ArrayBufferLike.
const buf = (u: Uint8Array): Uint8Array<ArrayBuffer> => new Uint8Array(u);

const importPub = (jwk: JsonWebKey) =>
  crypto.subtle.importKey('jwk', { kty: jwk.kty, crv: jwk.crv, x: jwk.x, y: jwk.y, ext: true }, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);

async function signBytes(key: CryptoKey, raw: Uint8Array): Promise<Uint8Array> {
  const sig = new Uint8Array(await crypto.subtle.sign(ALG, key, buf(raw)));
  if (sig.length !== SIG_LEN) throw new Error(`expected 64-byte r||s, got ${sig.length}`);
  return new Uint8Array([...raw, ...sig]);
}
async function verifyBytes(pub: JsonWebKey, signed: Uint8Array, rawLen: number): Promise<boolean> {
  if (signed.length !== rawLen + SIG_LEN) return false;
  try {
    return await crypto.subtle.verify(ALG, await importPub(pub), buf(signed.slice(rawLen)), buf(signed.slice(0, rawLen)));
  } catch { return false; }
}

/** 61 IOU bytes + 64-byte raw r||s = 125 bytes. */
export const signIou = (key: CryptoKey, f: IouFields) => signBytes(key, encodeIou(f));
export const verifyIou = (pub: JsonWebKey, signed: Uint8Array) => verifyBytes(pub, signed, IOU_LEN);
/** 41 challenge bytes + signature = 105 bytes. */
export const makeChallenge = (key: CryptoKey, c: ChallengeFields) => signBytes(key, encodeChallenge(c));
export const verifyChallenge = (pub: JsonWebKey, signed: Uint8Array) => verifyBytes(pub, signed, CHALLENGE_LEN);
export { SIGNED_IOU_LEN };
