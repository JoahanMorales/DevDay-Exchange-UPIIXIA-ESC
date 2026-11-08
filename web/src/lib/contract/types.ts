// Mirror of app/schemas/models.py (HACK-003). Keep in sync; fields use the same names.
export type Ulid = string;
export type Jwk = { kty: 'EC'; crv: 'P-256'; x: string; y: string; d?: string };

export type DebtStatus = 'REGISTRADA' | 'COBRO_ENVIADO' | 'PAGADA' | 'VENCIDA' | 'DUPLICADA' | 'RECHAZADA';
export type AttemptState = 'ACTIVO' | 'EXPIRADO' | 'PAGADO' | 'FALLIDO';
export type AttackKind = 'replay' | 'bad_sig' | 'distance' | 'counter' | 'cap' | 'revoked';
export type RejectReason =
  | 'bad_sig' | 'bad_credential' | 'bad_envelope' | 'expired' | 'counter_replay'
  | 'cap_exceeded' | 'revoked' | 'unknown_payer' | 'unknown_merchant' | 'malformed';

export interface Payer {
  id: Ulid; display_name: string; phone: string; pubkey_jwk: Jwk; backup_payer_id: Ulid | null;
  kind: 'phone' | 'band'; band_uid: string | null; daily_cap_cents: number; reputation_factor: number;
  created_at: string;
}
export interface Merchant {
  id: Ulid; name: string; lat: number; lon: number; pubkey_jwk: Jwk; pey_bank_account_id: string | null;
}
export interface Credential {
  subject_id: Ulid; subject_type: 'payer' | 'merchant'; pubkey_jwk: Jwk; daily_cap_cents: number;
  valid_until: number; rep_version: number; server_sig: string; // b64 r||s over canonical JSON
}
export interface Challenge {
  merchant_id: Ulid; nonce: string; ts: number; lat: number; lon: number; amount_cents: number; merchant_sig: string;
}
export interface Iou {
  ver: number; payer_id: Ulid; merchant_id: Ulid; amount_cents: number; counter: number; ts: number;
  nonce: string; lat: number; lon: number; sig: string; raw: string; // b64
}
export interface Envelope {
  envelope_id: string; epk: string; iv: string; ciphertext: string; hops: number; created_at: number; ttl_s: number;
}
export interface ChargeAttempt {
  target_phone: string; sent_at: string; expires_at: string; state: AttemptState;
  pey_transaction_id: string | null; error: string | null;
}
export interface Debt {
  id: string; iou: Iou; status: DebtStatus; charge_target: 'payer' | 'backup';
  pey_transaction_id: string | null; pey_codi_id: string | null; tracking_key: string | null;
  paid_at: string | null; attempts: ChargeAttempt[]; alerts: string[];
}
export interface RevocationList {
  version: number; issued_at: number; revoked: Ulid[]; caps: Record<string, number>; server_sig: string;
}
export interface WebhookEvent { webhook_id: string; type: string; received_at: string; payload: Record<string, unknown> }
export interface AttackLog { ts: number; kind: AttackKind; detail: string }

export interface PayerCreate {
  display_name: string; phone: string; pubkey_jwk: Jwk; backup_phone?: string | null;
  kind?: 'phone' | 'band'; band_uid?: string | null;
}
export interface PayerCreated { payer: Payer; credential: Credential }
export interface MerchantCreate { name: string; lat: number; lon: number; pubkey_jwk: Jwk; pey_bank_account_id?: string | null }
export interface MerchantCreated { merchant: Merchant; credential: Credential }
export interface ServerKeyResponse { pubkey_jwk: Jwk }
export interface SyncRequest { envelopes: Envelope[] }
export interface SyncRejected { envelope_id: string; reason: RejectReason }
export interface SyncResponse { accepted: number; duplicates: number; rejected: SyncRejected[]; revocation_list: RevocationList }
export interface DebtList { debts: Debt[] }
export interface PlanBRequest { canal: 'qr' | 'liga' }
export interface PlanBResponse { canal: 'qr' | 'liga'; payload: string }
export interface ReputationResponse { payer_id: Ulid; factor: number; daily_cap_cents: number; reasons: string[] }
export interface DebtEvent { debt_id: string; status: DebtStatus; at: string; detail: string | null }
export interface ExplainResponse { texto: string; cifras: Record<string, number | string>; fuente: 'openai' | 'plantilla' }
export interface SimulatePaymentResponse { debt_id: string; status: DebtStatus; demo_data: true }

/** Binary layout constants (docs/protocolo.md). */
export const IOU_LEN = 61;
export const SIG_LEN = 64;
export const SIGNED_IOU_LEN = 125;
export const CHALLENGE_LEN = 41;
export const HKDF_INFO = 'sinsenal-v1';
