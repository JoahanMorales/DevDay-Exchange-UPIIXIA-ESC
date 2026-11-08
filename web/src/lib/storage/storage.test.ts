import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { getCounter, nextCounter, openCoreDb } from './db';
import { getOrCreateKey } from './keys';

let n = 0;
const fresh = () => `t-${Date.now()}-${n++}`;

describe('storage', () => {
  it('generates_non_extractable_p256_key', async () => {
    const db = await openCoreDb(fresh());
    const k = await getOrCreateKey(db);
    expect(k.privateKey.extractable).toBe(false);
    expect((k.privateKey.algorithm as EcKeyAlgorithm).namedCurve).toBe('P-256');
    expect(k.publicJwk).toMatchObject({ kty: 'EC', crv: 'P-256' });
    expect(k.publicJwk).not.toHaveProperty('d');
    await expect(crypto.subtle.exportKey('jwk', k.privateKey)).rejects.toBeTruthy();
  });

  it('persists_key_and_counter_across_reload', async () => {
    const name = fresh();
    const db1 = await openCoreDb(name);
    const k1 = await getOrCreateKey(db1);
    expect(await nextCounter(db1)).toBe(1);
    expect(await nextCounter(db1)).toBe(2);
    db1.close();
    const db2 = await openCoreDb(name);
    const k2 = await getOrCreateKey(db2);
    expect(k2.publicJwk).toEqual(k1.publicJwk);
    expect(await getCounter(db2)).toBe(2);
    expect(await nextCounter(db2)).toBe(3);
    const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, k2.privateKey, new Uint8Array([1]));
    const pub = await crypto.subtle.importKey('jwk', k1.publicJwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
    expect(await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, pub, sig, new Uint8Array([1]))).toBe(true);
  });
});

describe('revocation cache', () => {
  it('keeps_only_newest_revocation_list', async () => {
    const { getRevocationList, putRevocationList } = await import('./db');
    const db = await openCoreDb(fresh());
    const rl = (version: number) => ({ version, issued_at: version, revoked: [`P${version}`], caps: {}, server_sig: 's' });
    await putRevocationList(db, rl(2));
    await putRevocationList(db, rl(1));
    expect((await getRevocationList(db))?.version).toBe(2);
    await putRevocationList(db, rl(3));
    expect((await getRevocationList(db))?.revoked).toEqual(['P3']);
  });
});
