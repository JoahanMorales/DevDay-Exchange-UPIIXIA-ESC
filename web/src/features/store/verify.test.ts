// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { makeChallenge, signIou } from '../../lib/protocol';
import type { AttackLog } from '../../lib/contract';
import { verifyIncoming, VIBRATE_OK } from './verify';

const MERCHANT = '01HZZZZZZZZZZZZZZZZZZZZZZZ', PAYER = '01HYYYYYYYYYYYYYYYYYYYYYYY';
const gen = () => crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);

async function setup() {
  const payer = await gen();
  const pub = await crypto.subtle.exportKey('jwk', payer.publicKey);
  const challenge = { ver: 1, merchantId: MERCHANT, nonce: new Uint8Array(8).fill(7), ts: 1000, latE6: 19_432_600, lonE6: -99_133_200, amountCents: 2500 };
  const iou = await signIou(payer.privateKey, { ver: 1, payerId: PAYER, merchantId: MERCHANT, amountCents: 2500, counter: 17, ts: 1005, nonce: challenge.nonce, latE6: challenge.latE6, lonE6: challenge.lonE6 });
  const state = { now: 1005, challenge, usedNonces: new Set<string>(), lastCounter: undefined, remainingCapCents: 50000, revoked: new Set<string>(), payerPubkey: pub };
  const vibrations: (number | number[])[] = [], attacks: AttackLog[] = [];
  const deps = { vibrate: (p: number | number[]) => { vibrations.push(p); return true; }, logAttack: async (a: AttackLog) => { attacks.push(a); } };
  return { payer, iou, state, deps, vibrations, attacks };
}

describe('store verify', () => {
  it('store_vibrates_only_after_valid_iou', async () => {
    const s = await setup();
    const r = await verifyIncoming(s.iou, s.state, s.deps);
    expect(r).toMatchObject({ ok: true, amountCents: 2500, counter: 17, payerId: PAYER });
    expect(s.vibrations).toEqual([VIBRATE_OK]);
    expect(s.attacks).toEqual([]);
  });

  it('store_shows_reason_and_does_not_vibrate_on_invalid_iou', async () => {
    const s = await setup();
    const tampered = new Uint8Array(s.iou); tampered[20] ^= 1;
    const r1 = await verifyIncoming(tampered, s.state, s.deps);
    expect(r1).toMatchObject({ ok: false, reason: 'firma_invalida' });
    expect(r1.ok ? '' : r1.message).toMatch(/firma/i);
    const r2 = await verifyIncoming(s.iou, { ...s.state, now: 1100 }, s.deps);
    expect(r2).toMatchObject({ ok: false, reason: 'reto_vencido' });
    expect(s.vibrations).toEqual([]);
    expect(s.attacks.map((a) => a.kind)).toEqual(['bad_sig', 'replay']);
    void makeChallenge;
  });
});
