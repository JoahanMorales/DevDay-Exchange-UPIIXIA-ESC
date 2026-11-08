import { signIou, type ChallengeFields, type CheckState, type IouFields } from '../../lib/protocol';
import { verifyIncoming, type VerifyDeps, type VerifyResult } from '../store/verify';

export type AttackId = 'legit' | 'replay' | 'ai_voice' | 'far_2km' | 'repeat_counter';
export interface AttackRun { id: AttackId; title: string; result: VerifyResult; at: number }

// demo_data: synthetic payer/merchant around the store; keys are generated on the fly.
const PAYER = '01JD3MPAYER000000000000000';
const MERCHANT = '01JD3MMERCHANT000000000000';
const LAT = 19_321_000, LON = -99_174_000, AMOUNT = 4500;

const ecdsa = () => crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
const nonce = () => crypto.getRandomValues(new Uint8Array(8));

/**
 * The four attacks of IDEA §4 step 3, run against the real store verifier after one legit IOU #17.
 * Every attempt answers a fresh challenge, as the store would issue one per sale.
 */
export async function runAttacks(d: VerifyDeps): Promise<AttackRun[]> {
  const payer = await ecdsa();
  const attacker = await ecdsa();
  const payerPubkey = await crypto.subtle.exportKey('jwk', payer.publicKey);
  const usedNonces = new Set<string>();
  let lastCounter: number | undefined = 16;
  const runs: AttackRun[] = [];

  async function attempt(id: AttackId, title: string, build: (ch: ChallengeFields) => Promise<Uint8Array>) {
    const now = Math.floor(Date.now() / 1000);
    const challenge: ChallengeFields = { ver: 1, merchantId: MERCHANT, nonce: nonce(), ts: now, latE6: LAT, lonE6: LON, amountCents: AMOUNT };
    const st: CheckState = { now, challenge, usedNonces, lastCounter, remainingCapCents: 30000, revoked: new Set(), payerPubkey };
    const result = await verifyIncoming(await build(challenge), st, d);
    usedNonces.add([...challenge.nonce].map((b) => b.toString(16).padStart(2, '0')).join(''));
    if (result.ok) lastCounter = result.counter;
    runs.push({ id, title, result, at: now });
  }
  const iou = (ch: ChallengeFields, over: Partial<IouFields> = {}): IouFields => ({
    ver: 1, payerId: PAYER, merchantId: MERCHANT, amountCents: AMOUNT, counter: 17, ts: ch.ts,
    nonce: ch.nonce, latE6: LAT + 5, lonE6: LON, ...over,
  });

  let recording: Uint8Array = new Uint8Array();
  await attempt('legit', 'Pagaré #17 legítimo', async (ch) => (recording = await signIou(payer.privateKey, iou(ch))));
  await attempt('replay', 'Grabación del #17 reproducida', async () => recording);
  await attempt('ai_voice', 'Audio de voz IA sin firma del pagador', (ch) => signIou(attacker.privateKey, iou(ch, { counter: 18 })));
  await attempt('far_2km', 'Pagaré firmado a 2 km', (ch) => signIou(payer.privateKey, iou(ch, { counter: 18, latE6: LAT + 18_000 })));
  await attempt('repeat_counter', 'El mismo #17 otra vez', (ch) => signIou(payer.privateKey, iou(ch, { counter: 17 })));
  return runs;
}
