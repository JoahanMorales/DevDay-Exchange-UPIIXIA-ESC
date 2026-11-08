// @vitest-environment node
import { describe, expect, it } from 'vitest';
import vectors from '../../lib/contract/vectors.json';
import type { AttackLog, Credential } from '../../lib/contract';
import { signIou } from '../../lib/protocol';
import { canonicalJson, verifyPayment, VIBRATE_OK } from './verify';

const P = vectors.payer, SERVER_PUB = vectors.server.pubkey_jwk as JsonWebKey;
const MERCHANT = '01HZZZZZZZZZZZZZZZZZZZZZZZ';
const NOW = 1_794_000_000;
const importPriv = (j: JsonWebKey) => crypto.subtle.importKey('jwk', j, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);

async function setup(credential: Credential, key: CryptoKey) {
  const challenge = { ver: 1, merchantId: MERCHANT, nonce: new Uint8Array(8).fill(9), ts: NOW, latE6: 19_432_600, lonE6: -99_133_200, amountCents: 2500 };
  const iou = await signIou(key, { ver: 1, payerId: P.id, merchantId: MERCHANT, amountCents: 2500, counter: 1, ts: NOW, nonce: challenge.nonce, latE6: challenge.latE6, lonE6: challenge.lonE6 });
  const vib: unknown[] = [], attacks: AttackLog[] = [];
  const ctx = { now: NOW + 2, challenge, usedNonces: new Set<string>(), lastCounter: undefined, revoked: new Set<string>(), serverPubkey: SERVER_PUB };
  const deps = { vibrate: (p: number | number[]) => { vib.push(p); return true; }, logAttack: async (a: AttackLog) => { attacks.push(a); } };
  return { run: () => verifyPayment(iou, credential, ctx, deps), vib, attacks, ctx };
}

describe('store payer credential', () => {
  it('canonical_json_matches_python_sort_keys_compact', () => {
    expect(canonicalJson({ b: 1, a: { d: 'ñ', c: [2, 'x'] } })).toBe('{"a":{"c":[2,"x"],"d":"ñ"},"b":1}');
  });

  it('store_accepts_iou_with_server_signed_credential', async () => {
    const s = await setup(P.credential as Credential, await importPriv(P.private_jwk as JsonWebKey));
    expect(await s.run()).toMatchObject({ ok: true, amountCents: 2500 });
    expect(s.vib).toEqual([VIBRATE_OK]);
  });

  it('store_rejects_forged_payer_credential_without_vibrating', async () => {
    const own = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
    const pub = await crypto.subtle.exportKey('jwk', own.publicKey);
    const forged = { ...(P.credential as Credential), pubkey_jwk: { kty: 'EC' as const, crv: 'P-256' as const, x: pub.x!, y: pub.y! }, daily_cap_cents: 99_999_999 };
    const s = await setup(forged, own.privateKey);
    expect(await s.run()).toMatchObject({ ok: false, reason: 'firma_invalida' });
    const expired = await setup({ ...(P.credential as Credential) }, await importPriv(P.private_jwk as JsonWebKey));
    expect(await verifyPayment(new Uint8Array(125), P.credential as Credential, { ...expired.ctx, now: P.credential.valid_until + 1 }, { vibrate: () => { s.vib.push(1); return true; }, logAttack: async () => {} })).toMatchObject({ ok: false, reason: 'firma_invalida' });
    expect(s.vib).toEqual([]);
    expect(s.attacks.map((a) => a.kind)).toEqual(['bad_sig']);
  });
});
