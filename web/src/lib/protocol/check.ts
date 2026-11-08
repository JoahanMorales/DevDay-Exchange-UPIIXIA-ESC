import { IOU_LEN, decodeIou, toHex } from './codec';
import { verifyIou } from './sign';
import type { CheckState, Reason } from './types';

export const CHALLENGE_TTL_S = 30;
export const MAX_DISTANCE_M = 50;

export function distanceMeters(latE6a: number, lonE6a: number, latE6b: number, lonE6b: number): number {
  const R = 6_371_000, rad = (e6: number) => (e6 / 1e6) * Math.PI / 180;
  const dLat = rad(latE6b - latE6a), dLon = rad(lonE6b - lonE6a);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(latE6a)) * Math.cos(rad(latE6b)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Offline checks in the merchant phone (IDEA §5.3 step 4). Returns 'ok' or the first failing reason. */
export async function checkIou(signed: Uint8Array, st: CheckState): Promise<'ok' | Reason> {
  if (!(await verifyIou(st.payerPubkey, signed))) return 'firma_invalida';
  const iou = decodeIou(signed.slice(0, IOU_LEN));
  if (st.revoked.has(iou.payerId)) return 'revocado';
  const nonce = toHex(iou.nonce);
  // A nonce that is not the one we issued counts as used/unknown: it can never be redeemed.
  if (st.usedNonces.has(nonce) || nonce !== toHex(st.challenge.nonce)) return 'reto_usado';
  if (st.now - st.challenge.ts > CHALLENGE_TTL_S) return 'reto_vencido';
  if (st.lastCounter !== undefined && iou.counter <= st.lastCounter) return 'contador_repetido';
  if (distanceMeters(iou.latE6, iou.lonE6, st.challenge.latE6, st.challenge.lonE6) > MAX_DISTANCE_M) return 'fuera_de_50m';
  if (iou.amountCents > st.remainingCapCents || iou.amountCents !== st.challenge.amountCents) return 'tope_excedido';
  return 'ok';
}
