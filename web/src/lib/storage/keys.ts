// Device signing key: P-256, private half non-extractable, kept as a CryptoKey in IndexedDB.
import type { Jwk } from '../contract';
import { getKey, putKey, type Db, type KeyRecord } from './db';

export const toJwk = (j: JsonWebKey): Jwk => ({ kty: 'EC', crv: 'P-256', x: j.x!, y: j.y! });

export async function getOrCreateKey(db: Db): Promise<KeyRecord> {
  const existing = await getKey(db);
  if (existing) return existing;
  // Generate extractable only to export the public half, then re-import the private one as non-extractable.
  const pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  const full = await crypto.subtle.exportKey('jwk', pair.privateKey);
  const privateKey = await crypto.subtle.importKey('jwk', full, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const rec: KeyRecord = { privateKey, publicJwk: toJwk(full) };
  await putKey(db, rec);
  return rec;
}
