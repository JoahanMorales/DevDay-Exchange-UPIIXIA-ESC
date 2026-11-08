import {
  CHALLENGE_LEN, CHALLENGE_TTL_S, MAX_DISTANCE_M, decodeChallenge, distanceMeters, verifyChallenge,
  type ChallengeFields,
} from '../../lib/protocol';

export type PayReason = 'reto_invalido' | 'credencial_vencida' | 'reto_vencido' | 'fuera_de_50m' | 'tope_excedido';
export type PayCheck = { ok: true; challenge: ChallengeFields } | { ok: false; reason: PayReason; message: string };
export interface PayContext {
  merchantPubkey: JsonWebKey; now: number; here: { latE6: number; lonE6: number };
  remainingCapCents: number; credentialValidUntil: number;
}
const TEXT: Record<PayReason, string> = {
  reto_invalido: 'El reto no está firmado por esta tienda',
  credencial_vencida: 'Tu credencial venció: conéctate para renovarla',
  reto_vencido: 'El reto venció (30 s): pide uno nuevo',
  fuera_de_50m: 'No estás a menos de 50 m de la tienda',
  tope_excedido: 'El monto supera tu tope disponible',
};
const no = (reason: PayReason): PayCheck => ({ ok: false, reason, message: TEXT[reason] });

/** Payer side: checks before signing (credential, 30 s, ≤ 50 m, cap). */
export async function preparePayment(signed: Uint8Array, c: PayContext): Promise<PayCheck> {
  if (!(await verifyChallenge(c.merchantPubkey, signed))) return no('reto_invalido');
  const ch = decodeChallenge(signed.slice(0, CHALLENGE_LEN));
  if (c.now > c.credentialValidUntil) return no('credencial_vencida');
  if (Math.abs(c.now - ch.ts) > CHALLENGE_TTL_S) return no('reto_vencido');
  if (distanceMeters(c.here.latE6, c.here.lonE6, ch.latE6, ch.lonE6) > MAX_DISTANCE_M) return no('fuera_de_50m');
  if (ch.amountCents > c.remainingCapCents) return no('tope_excedido');
  return { ok: true, challenge: ch };
}

import { SIGNED_IOU_LEN } from '../../lib/protocol';
import type { Credential } from '../../lib/contract';

/** What rides with the 125 IOU bytes so the store can check offline: the payer credential (pubkey, cap). */
export interface PayerCard { credential: Credential; name: string; phone_tail: string }
export const packPayment = (iou: Uint8Array, card: PayerCard) =>
  new Uint8Array([...iou, ...new TextEncoder().encode(JSON.stringify(card))]);
export function unpackPayment(b: Uint8Array): { iou: Uint8Array; card: PayerCard } | null {
  if (b.length <= SIGNED_IOU_LEN) return null;
  try { return { iou: b.slice(0, SIGNED_IOU_LEN), card: JSON.parse(new TextDecoder().decode(b.slice(SIGNED_IOU_LEN))) }; }
  catch { return null; }
}

/** Device location in E6; falls back to the demo point (labeled) when GPS is unavailable. */
export const DEMO_POINT = { latE6: 19_432_608, lonE6: -99_133_209 };
export function locate(timeoutMs = 3000): Promise<{ latE6: number; lonE6: number; demo: boolean }> {
  return new Promise((resolve) => {
    const fallback = () => resolve({ ...DEMO_POINT, demo: true });
    if (!('geolocation' in navigator)) return fallback();
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ latE6: Math.round(p.coords.latitude * 1e6), lonE6: Math.round(p.coords.longitude * 1e6), demo: false }),
      fallback, { timeout: timeoutMs, maximumAge: 60_000 });
  });
}
