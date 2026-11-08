// Offline device store (IDEA §5.2): signing key, counter, credentials, server key, revocation list.
import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Credential, Jwk, RevocationList } from '../contract';

export interface KeyRecord { privateKey: CryptoKey; publicJwk: Jwk }
export interface MerchantEntry { merchant_id: string; name: string; credential: Credential }
export interface Enrollment { role: 'payer' | 'merchant'; subject_id: string; credential: Credential; demo_data: boolean }

interface CoreDb extends DBSchema {
  kv: { key: string; value: unknown };
  merchants: { key: string; value: MerchantEntry };
}

export const DB_NAME = 'sinsenal-core';
export type Db = IDBPDatabase<CoreDb>;

export function openCoreDb(name = DB_NAME): Promise<Db> {
  return openDB<CoreDb>(name, 1, {
    upgrade(db) {
      db.createObjectStore('kv');
      db.createObjectStore('merchants', { keyPath: 'merchant_id' });
    },
  });
}

const get = async <T>(db: Db, k: string) => (await db.get('kv', k)) as T | undefined;

export const getKey = (db: Db) => get<KeyRecord>(db, 'key');
export const putKey = (db: Db, rec: KeyRecord) => db.put('kv', rec, 'key');

/** Monotonic: returns the next counter and persists it in one transaction. */
export async function nextCounter(db: Db): Promise<number> {
  const tx = db.transaction('kv', 'readwrite');
  const n = ((await tx.store.get('counter')) as number | undefined ?? 0) + 1;
  await tx.store.put(n, 'counter');
  await tx.done;
  return n;
}
export const getCounter = async (db: Db) => (await get<number>(db, 'counter')) ?? 0;

export const getEnrollment = (db: Db, role: Enrollment['role']) => get<Enrollment>(db, `enrollment:${role}`);
export const putEnrollment = (db: Db, e: Enrollment) => db.put('kv', e, `enrollment:${e.role}`);

export const getServerKey = (db: Db) => get<Jwk>(db, 'server_key');
export const putServerKey = (db: Db, jwk: Jwk) => db.put('kv', jwk, 'server_key');

export const getRevocationList = (db: Db) => get<RevocationList>(db, 'revocation_list');
/** Keeps only the newest version. */
export async function putRevocationList(db: Db, rl: RevocationList): Promise<void> {
  const cur = await getRevocationList(db);
  if (!cur || rl.version > cur.version) await db.put('kv', rl, 'revocation_list');
}

export const getMerchant = (db: Db, id: string) => db.get('merchants', id);
export const putMerchant = (db: Db, m: MerchantEntry) => db.put('merchants', m);
