// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { makeChallenge } from '../../lib/protocol';
import { preparePayment } from './sign';

const MERCHANT = '01HZZZZZZZZZZZZZZZZZZZZZZZ';
const gen = () => crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);

describe('payer', () => {
  it('payer_refuses_to_sign_over_remaining_cap', async () => {
    const merchant = await gen();
    const merchantPub = await crypto.subtle.exportKey('jwk', merchant.publicKey);
    const fields = { ver: 1, merchantId: MERCHANT, nonce: new Uint8Array(8).fill(3), ts: 1000, latE6: 19_432_600, lonE6: -99_133_200, amountCents: 60000 };
    const signed = await makeChallenge(merchant.privateKey, fields);
    const here = { latE6: 19_432_650, lonE6: -99_133_200 };
    const over = await preparePayment(signed, { merchantPubkey: merchantPub, now: 1010, here, remainingCapCents: 50000, credentialValidUntil: 2000 });
    expect(over).toMatchObject({ ok: false, reason: 'tope_excedido' });
    const under = await preparePayment(signed, { merchantPubkey: merchantPub, now: 1010, here, remainingCapCents: 70000, credentialValidUntil: 2000 });
    expect(under).toMatchObject({ ok: true });
  });
});
