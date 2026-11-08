export type Reason =
  | 'reto_vencido' | 'reto_usado' | 'firma_invalida' | 'fuera_de_50m'
  | 'contador_repetido' | 'tope_excedido' | 'revocado';

export interface IouFields {
  ver: number; payerId: string; merchantId: string; amountCents: number; counter: number; ts: number;
  nonce: Uint8Array; latE6: number; lonE6: number;
}
export interface ChallengeFields {
  ver: number; merchantId: string; nonce: Uint8Array; ts: number; latE6: number; lonE6: number; amountCents: number;
}
/** What the merchant phone knows when an IOU arrives (all local, no network). */
export interface CheckState {
  now: number;                 // seconds, Unix
  challenge: ChallengeFields;  // the challenge this merchant issued
  usedNonces: Set<string>;     // hex nonces already consumed
  lastCounter: number | undefined; // last counter seen for this payer; undefined = never seen
  remainingCapCents: number;
  revoked: Set<string>;        // payer ULIDs on the signed revocation list
  payerPubkey: JsonWebKey;     // from the payer credential
}
