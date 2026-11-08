import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import type { Credential } from '../../lib/contract';
import { getEnrollment, getMerchant, getServerKey, openCoreDb } from '../../lib/storage';
import { cacheMerchantFromQr, cacheServerKey, enrollPayer, type Fetcher } from './enroll';

let n = 0;
const fresh = () => openCoreDb(`e-${Date.now()}-${n++}`);
const cred = (id: string, type: 'payer' | 'merchant'): Credential => ({
  subject_id: id, subject_type: type, pubkey_jwk: { kty: 'EC', crv: 'P-256', x: 'x', y: 'y' },
  daily_cap_cents: 50000, valid_until: 2_000_000_000, rep_version: 1, server_sig: 'c2ln',
});

describe('core enrollment', () => {
  it('enrolls_payer_and_caches_credential', async () => {
    const db = await fresh();
    const calls: { path: string; body: Record<string, unknown> }[] = [];
    const fetcher: Fetcher = async <T,>(path: string, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body));
      calls.push({ path, body });
      return { payer: { id: 'P1' }, credential: { ...cred('P1', 'payer'), pubkey_jwk: body.pubkey_jwk } } as T;
    };
    const e = await enrollPayer(db, { display_name: 'Ana', phone: '5512345678' }, fetcher);
    expect(calls[0].path).toBe('/payers');
    expect(calls[0].body.pubkey_jwk).toMatchObject({ kty: 'EC', crv: 'P-256' });
    expect(calls[0].body.pubkey_jwk).not.toHaveProperty('d');
    expect(e).toMatchObject({ role: 'payer', subject_id: 'P1', demo_data: false });
    expect(await getEnrollment(db, 'payer')).toEqual(e);
  });

  it('enrolls_payer_with_demo_data_when_offline', async () => {
    const db = await fresh();
    const fetcher: Fetcher = async () => { throw new Error('offline'); };
    const e = await enrollPayer(db, { display_name: 'Ana', phone: '5512345678' }, fetcher);
    expect(e.demo_data).toBe(true);
    expect(e.subject_id).not.toBe('');
    expect((await getEnrollment(db, 'payer'))?.demo_data).toBe(true);
  });

  it('caches_server_key_and_merchant_credential_for_offline', async () => {
    const db = await fresh();
    const jwk = { kty: 'EC', crv: 'P-256', x: 'sx', y: 'sy' } as const;
    const fetcher: Fetcher = async <T,>(path: string) => { expect(path).toBe('/server-key'); return { pubkey_jwk: jwk } as T; };
    await cacheServerKey(db, fetcher);
    expect(await getServerKey(db)).toEqual(jwk);
    // Offline afterwards: the cached key stays.
    await cacheServerKey(db, async () => { throw new Error('offline'); });
    expect(await getServerKey(db)).toEqual(jwk);

    const qr = JSON.stringify({ merchant_id: 'M1', name: 'Tacos Don Pepe', credential: cred('M1', 'merchant') });
    const m = await cacheMerchantFromQr(db, qr);
    expect(m.merchant_id).toBe('M1');
    expect(await getMerchant(db, 'M1')).toEqual(m);
    await expect(cacheMerchantFromQr(db, '{"merchant_id":"M2"}')).rejects.toThrow();
  });
});
