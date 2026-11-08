// @vitest-environment node
import { describe, expect, it } from 'vitest';
import vectors from '../contract/vectors.json';
import {
  checkIou, decodeChallenge, decodeIou, encodeChallenge, encodeIou, makeChallenge, signIou,
  verifyChallenge, verifyIou, type CheckState, type IouFields,
} from './index';

const hex = (s: string) => Uint8Array.from(s.match(/../g)!.map((h) => parseInt(h, 16)));
const toHex = (u: Uint8Array) => [...u].map((b) => b.toString(16).padStart(2, '0')).join('');
const v = vectors as any;
const vecIou = (): IouFields => decodeIou(hex(v.iou.raw_hex));
const vecSigned = () => new Uint8Array([...hex(v.iou.raw_hex), ...hex(v.iou.sig_rs_hex)]);
const state = (over: Partial<CheckState> = {}): CheckState => ({
  now: v.iou.ts + 3, challenge: decodeChallenge(hex(v.challenge.raw_hex)), usedNonces: new Set(),
  lastCounter: v.iou.counter - 1, remainingCapCents: 30000, revoked: new Set(),
  payerPubkey: v.payer.pubkey_jwk, ...over,
});

async function freshSigned(over: Partial<IouFields>) {
  const key = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  const f = { ...vecIou(), ...over };
  const pub = await crypto.subtle.exportKey('jwk', key.publicKey);
  return { signed: await signIou(key.privateKey, f), pub, f };
}

describe('protocol', () => {
  it('encodes_iou_to_61_bytes_and_signs_to_125', async () => {
    const { signed, f, pub } = await freshSigned({});
    expect(encodeIou(f)).toHaveLength(61);
    expect(toHex(encodeIou(decodeIou(encodeIou(f))))).toBe(toHex(encodeIou(f)));
    expect(signed).toHaveLength(125);
    expect(await verifyIou(pub, signed)).toBe(true);
    const bad = signed.slice(); bad[3] ^= 1;
    expect(await verifyIou(pub, bad)).toBe(false);
  });

  it('verifies_python_vector', async () => {
    expect(toHex(encodeIou(vecIou()))).toBe(v.iou.raw_hex);
    expect(await verifyIou(v.payer.pubkey_jwk, vecSigned())).toBe(true);
    const ch = new Uint8Array([...hex(v.challenge.raw_hex), ...hex(v.challenge.sig_rs_hex)]);
    expect(await verifyChallenge(v.merchant.pubkey_jwk, ch)).toBe(true);
    expect(toHex(encodeChallenge(decodeChallenge(hex(v.challenge.raw_hex))))).toBe(v.challenge.raw_hex);
    expect(await checkIou(vecSigned(), state())).toBe('ok');
  });

  it('makes_a_verifiable_challenge', async () => {
    const key = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
    const signed = await makeChallenge(key.privateKey, decodeChallenge(hex(v.challenge.raw_hex)));
    expect(signed).toHaveLength(105);
    expect(await verifyChallenge(await crypto.subtle.exportKey('jwk', key.publicKey), signed)).toBe(true);
  });

  it('rejects_reused_challenge_nonce', async () => {
    const s = state({ usedNonces: new Set([v.iou.nonce_hex]) });
    expect(await checkIou(vecSigned(), s)).toBe('reto_usado');
  });
  it('rejects_expired_challenge', async () => {
    expect(await checkIou(vecSigned(), state({ now: v.challenge.ts + 31 }))).toBe('reto_vencido');
  });
  it('rejects_counter_not_greater_than_last', async () => {
    expect(await checkIou(vecSigned(), state({ lastCounter: v.iou.counter }))).toBe('contador_repetido');
  });
  it('rejects_iou_over_50m', async () => {
    const { signed, pub } = await freshSigned({ latE6: 19_321_000 + 600 }); // ~67 m north
    expect(await checkIou(signed, state({ payerPubkey: pub }))).toBe('fuera_de_50m');
  });
  it('rejects_amount_over_remaining_cap', async () => {
    expect(await checkIou(vecSigned(), state({ remainingCapCents: v.iou.amount_cents - 1 }))).toBe('tope_excedido');
  });
  it('rejects_bad_signature_and_revoked_payer', async () => {
    const bad = vecSigned(); bad[70] ^= 1;
    expect(await checkIou(bad, state())).toBe('firma_invalida');
    expect(await checkIou(vecSigned(), state({ revoked: new Set([v.iou.payer_id]) }))).toBe('revocado');
  });
});
