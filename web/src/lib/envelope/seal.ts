// Envelope per docs/protocolo.md: ephemeral ECDH P-256 + HKDF-SHA256 (info "sinsenal-v1") + AES-256-GCM.
import type { Envelope } from '../contract';

const te = new TextEncoder();
const EC = { name: 'ECDH', namedCurve: 'P-256' } as const;
// Fresh ArrayBuffer-backed copy: WebCrypto's types reject ArrayBufferLike views.
const buf = (u: Uint8Array): Uint8Array<ArrayBuffer> => new Uint8Array(u);
const b64 = (u: Uint8Array) => btoa(String.fromCharCode(...u));
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const hex = (u: Uint8Array) => [...u].map((b) => b.toString(16).padStart(2, '0')).join('');
const pubOnly = (j: JsonWebKey): JsonWebKey => ({ kty: j.kty, crv: j.crv, x: j.x, y: j.y, ext: true });

export const DEFAULT_TTL_S = 7 * 24 * 3600;

async function aesKey(priv: CryptoKey, pub: CryptoKey, usage: 'encrypt' | 'decrypt'): Promise<CryptoKey> {
  const shared = await crypto.subtle.deriveBits({ name: 'ECDH', public: pub }, priv, 256);
  const hk = await crypto.subtle.importKey('raw', shared, 'HKDF', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(0), info: te.encode('sinsenal-v1') },
    hk, { name: 'AES-GCM', length: 256 }, false, [usage]);
}

export interface SealOptions {
  /** Test/vector only: fixed ephemeral key and IV so the output is reproducible. */
  ephemeralPrivateJwk?: JsonWebKey;
  iv?: Uint8Array;
  now?: number;
  ttlS?: number;
}

/** Seals a 125-byte signed IOU for the server. The relay never holds a key that can open it. */
export async function sealEnvelope(serverPub: JsonWebKey, signedIou: Uint8Array, opts: SealOptions = {}): Promise<Envelope> {
  const server = await crypto.subtle.importKey('jwk', pubOnly(serverPub), EC, false, []);
  let ephPriv: CryptoKey, ephPubRaw: Uint8Array;
  if (opts.ephemeralPrivateJwk) {
    const j = opts.ephemeralPrivateJwk;
    ephPriv = await crypto.subtle.importKey('jwk', { ...j, ext: true }, EC, false, ['deriveBits']);
    const p = await crypto.subtle.importKey('jwk', pubOnly(j), EC, true, []);
    ephPubRaw = new Uint8Array(await crypto.subtle.exportKey('raw', p));
  } else {
    const kp = await crypto.subtle.generateKey(EC, true, ['deriveBits']);
    ephPriv = kp.privateKey;
    ephPubRaw = new Uint8Array(await crypto.subtle.exportKey('raw', kp.publicKey));
  }
  const iv = opts.iv ?? crypto.getRandomValues(new Uint8Array(12));
  const key = await aesKey(ephPriv, server, 'encrypt');
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: buf(iv) }, key, buf(signedIou)));
  return {
    envelope_id: hex(new Uint8Array(await crypto.subtle.digest('SHA-256', buf(signedIou)))),
    epk: b64(ephPubRaw), iv: b64(iv), ciphertext: b64(ct),
    hops: 0, created_at: opts.now ?? Math.floor(Date.now() / 1000), ttl_s: opts.ttlS ?? DEFAULT_TTL_S,
  };
}

/** Server side (and tests): opens an envelope. Throws if the key is wrong or a byte was altered. */
export async function openEnvelope(serverPrivateJwk: JsonWebKey, env: Envelope): Promise<Uint8Array> {
  const priv = await crypto.subtle.importKey('jwk', { ...serverPrivateJwk, ext: true }, EC, false, ['deriveBits']);
  const epk = unb64(env.epk);
  if (epk.length !== 65 || epk[0] !== 4) throw new Error('epk must be an uncompressed P-256 point');
  const eph = await crypto.subtle.importKey('raw', buf(epk), EC, false, []);
  const key = await aesKey(priv, eph, 'decrypt');
  return new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: buf(unb64(env.iv)) }, key, buf(unb64(env.ciphertext))));
}
