// @vitest-environment node
import { describe, expect, it } from 'vitest';
import vectors from '../contract/vectors.json';
import { openEnvelope, sealEnvelope } from './seal';

const v = vectors as any;
const hex = (s: string) => Uint8Array.from(s.match(/../g)!.map((h) => parseInt(h, 16)));
const signedIou = () => hex(v.envelope.plaintext_hex);

describe('envelope', () => {
  it('envelope_matches_python_vector', async () => {
    // 1. TS opens the Python envelope with the server private key.
    const e = v.envelope;
    const env = { envelope_id: e.envelope_id, epk: e.epk_b64, iv: e.iv_b64, ciphertext: e.ciphertext_b64, hops: 0, created_at: 1, ttl_s: 604800 };
    expect(await openEnvelope(v.server.private_jwk, env)).toEqual(signedIou());
    // 2. TS sealing with the same ephemeral key and IV reproduces Python byte for byte.
    const sealed = await sealEnvelope(v.server.pubkey_jwk, signedIou(), {
      ephemeralPrivateJwk: e.ephemeral_private_jwk, iv: hex('000102030405060708090a0b'), now: 1,
    });
    expect(sealed.epk).toBe(e.epk_b64);
    expect(sealed.iv).toBe(e.iv_b64);
    expect(sealed.ciphertext).toBe(e.ciphertext_b64);
    expect(sealed.envelope_id).toBe(e.envelope_id);
    expect(sealed.hops).toBe(0);
    expect(sealed.ttl_s).toBe(7 * 24 * 3600);
  });

  it('relay_cannot_read_or_alter_envelope', async () => {
    const env = await sealEnvelope(v.server.pubkey_jwk, signedIou(), { now: 1 });
    // The plaintext is not visible in the ciphertext.
    const ct = Uint8Array.from(atob(env.ciphertext), (c) => c.charCodeAt(0));
    expect(ct).toHaveLength(125 + 16);
    expect(Buffer.from(ct).includes(Buffer.from(signedIou().slice(1, 17)))).toBe(false);
    // A relay (any key but the server's) cannot open it.
    await expect(openEnvelope(v.payer.private_jwk, env)).rejects.toBeTruthy();
    // Flipping one bit in transit makes the server reject it (GCM tag).
    ct[10] ^= 1;
    const tampered = { ...env, ciphertext: btoa(String.fromCharCode(...ct)) };
    await expect(openEnvelope(v.server.private_jwk, tampered)).rejects.toBeTruthy();
    // The untampered one still opens.
    expect(await openEnvelope(v.server.private_jwk, env)).toEqual(signedIou());
  });
});
