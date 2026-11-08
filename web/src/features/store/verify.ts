import type { AttackKind, AttackLog } from '../../lib/contract';
import { IOU_LEN, checkIou, decodeIou, type CheckState, type Reason } from '../../lib/protocol';

export const VIBRATE_OK = [80, 40, 80];
export interface VerifyDeps { vibrate(p: number | number[]): boolean; logAttack(a: AttackLog): Promise<void> }
export type VerifyResult =
  | { ok: true; amountCents: number; counter: number; payerId: string }
  | { ok: false; reason: Reason; message: string };

export const REASON_TEXT: Record<Reason, string> = {
  firma_invalida: 'Firma inválida: el pagaré fue alterado o no es de este pagador',
  reto_vencido: 'Reto vencido: pasaron más de 30 s',
  reto_usado: 'Reto ya usado: posible copia (replay)',
  fuera_de_50m: 'Fuera de 50 m de la tienda',
  contador_repetido: 'Contador repetido: pagaré duplicado',
  tope_excedido: 'Excede el tope del pagador o no coincide el monto',
  revocado: 'Pagador revocado',
};
const KIND: Record<Reason, AttackKind> = {
  firma_invalida: 'bad_sig', reto_vencido: 'replay', reto_usado: 'replay', fuera_de_50m: 'distance',
  contador_repetido: 'counter', tope_excedido: 'cap', revocado: 'revoked',
};

/** Merchant side: run the offline checks; vibrate only on a valid IOU, log every rejection. */
export async function verifyIncoming(signed: Uint8Array, st: CheckState, d: VerifyDeps): Promise<VerifyResult> {
  const r = await checkIou(signed, st);
  if (r === 'ok') {
    const iou = decodeIou(signed.slice(0, IOU_LEN));
    d.vibrate(VIBRATE_OK);
    return { ok: true, amountCents: iou.amountCents, counter: iou.counter, payerId: iou.payerId };
  }
  await d.logAttack({ ts: st.now, kind: KIND[r], detail: r });
  return { ok: false, reason: r, message: REASON_TEXT[r] };
}
