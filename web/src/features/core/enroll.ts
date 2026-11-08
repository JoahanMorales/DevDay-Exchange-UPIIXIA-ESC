// Enrollment against /api/payers and /api/merchants, plus the offline caches (IDEA §5.2).
import { api } from '../../lib/api';
import type { Credential, MerchantCreated, PayerCreated, ServerKeyResponse } from '../../lib/contract';
import {
  getOrCreateKey, putEnrollment, putMerchant, putServerKey, getServerKey,
  type Db, type Enrollment, type MerchantEntry,
} from '../../lib/storage';

export type Fetcher = <T>(path: string, init?: RequestInit) => Promise<T>;
const post = (body: unknown): RequestInit => ({ method: 'POST', body: JSON.stringify(body) });

/** Backend unreachable: a local stand-in credential, always labeled demo_data (not server-signed). */
function demoCredential(role: Enrollment['role'], pubkey_jwk: Credential['pubkey_jwk']): Credential {
  return {
    subject_id: `DEMO-${role}-${crypto.randomUUID()}`, subject_type: role, pubkey_jwk,
    daily_cap_cents: 50000, valid_until: Math.floor(Date.now() / 1000) + 30 * 86400, rep_version: 0, server_sig: '',
  };
}

async function enroll(db: Db, role: Enrollment['role'], call: (jwk: Credential['pubkey_jwk']) => Promise<Credential>): Promise<Enrollment> {
  const { publicJwk } = await getOrCreateKey(db);
  let e: Enrollment;
  try {
    const credential = await call(publicJwk);
    e = { role, subject_id: credential.subject_id, credential, demo_data: false };
  } catch {
    const credential = demoCredential(role, publicJwk);
    e = { role, subject_id: credential.subject_id, credential, demo_data: true };
  }
  await putEnrollment(db, e);
  return e;
}

export const enrollPayer = (db: Db, input: { display_name: string; phone: string; backup_phone?: string | null }, fetcher: Fetcher = api) =>
  enroll(db, 'payer', async (pubkey_jwk) => (await fetcher<PayerCreated>('/payers', post({ ...input, pubkey_jwk }))).credential);

export const enrollMerchant = (db: Db, input: { name: string; lat: number; lon: number }, fetcher: Fetcher = api) =>
  enroll(db, 'merchant', async (pubkey_jwk) => (await fetcher<MerchantCreated>('/merchants', post({ ...input, pubkey_jwk }))).credential);

/** Refreshes the server public key when online; offline keeps the cached one. */
export async function cacheServerKey(db: Db, fetcher: Fetcher = api) {
  try {
    const { pubkey_jwk } = await fetcher<ServerKeyResponse>('/server-key');
    await putServerKey(db, pubkey_jwk);
  } catch { /* offline: keep the cache */ }
  return getServerKey(db);
}

/** The counter QR carries `{merchant_id, name, credential}` as JSON. */
export async function cacheMerchantFromQr(db: Db, qrText: string): Promise<MerchantEntry> {
  const m = JSON.parse(qrText) as Partial<MerchantEntry>;
  const c = m.credential;
  if (!m.merchant_id || !m.name || !c || c.subject_type !== 'merchant' || c.subject_id !== m.merchant_id) {
    throw new Error('invalid merchant QR');
  }
  const entry: MerchantEntry = { merchant_id: m.merchant_id, name: m.name, credential: c };
  await putMerchant(db, entry);
  return entry;
}
