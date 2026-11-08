import type { AttackKind, AttackLog, Credential } from '../../lib/contract';
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

/** JSON with sorted keys and no spaces, UTF-8 kept (= Python json.dumps(sort_keys, separators=(",", ":"), ensure_ascii=False)). */
export function canonicalJson(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(canonicalJson).join(',')}]`;
  if (v && typeof v === 'object') {
    return `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${canonicalJson((v as Record<string, unknown>)[k])}`).join(',')}}`;
  }
  return JSON.stringify(v);
}

/** Server signature over the credential (protocolo.md §Credencial), checked offline with the cached server key. */
export async function verifyCredential(c: Credential, serverPub: JsonWebKey | undefined, now: number): Promise<boolean> {
  if (!serverPub || !c?.server_sig || c.valid_until < now) return false;
  const { subject_id, subject_type, pubkey_jwk, daily_cap_cents, valid_until, rep_version } = c;
  const body = canonicalJson({ subject_id, subject_type, pubkey_jwk, daily_cap_cents, valid_until, rep_version });
  try {
    const key = await crypto.subtle.importKey('jwk', { kty: serverPub.kty, crv: serverPub.crv, x: serverPub.x, y: serverPub.y, ext: true }, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
    const sig = Uint8Array.from(atob(c.server_sig), (ch) => ch.charCodeAt(0));
    return await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, key, sig, new TextEncoder().encode(body));
  } catch { return false; }
}

export interface PaymentCtx extends Omit<CheckState, 'payerPubkey' | 'remainingCapCents'> {
  serverPubkey: JsonWebKey | undefined;
  caps?: Record<string, number>; // from the signed revocation list
}

/** Full merchant check: the payer credential must be server-signed, current and for this payer; then checkIou. */
export async function verifyPayment(signed: Uint8Array, c: Credential, ctx: PaymentCtx, d: VerifyDeps): Promise<VerifyResult> {
  const payerId = signed.length >= IOU_LEN ? (() => { try { return decodeIou(signed.slice(0, IOU_LEN)).payerId; } catch { return ''; } })() : '';
  const credOk = c?.subject_type === 'payer' && c.subject_id === payerId && (await verifyCredential(c, ctx.serverPubkey, ctx.now));
  if (!credOk) {
    await d.logAttack({ ts: ctx.now, kind: 'bad_sig', detail: 'firma_invalida' });
    return { ok: false, reason: 'firma_invalida', message: 'Credencial del pagador no firmada por el servidor o vencida' };
  }
  const { serverPubkey: _s, caps, ...rest } = ctx;
  return verifyIncoming(signed, { ...rest, payerPubkey: c.pubkey_jwk, remainingCapCents: caps?.[payerId] ?? c.daily_cap_cents }, d);
}
