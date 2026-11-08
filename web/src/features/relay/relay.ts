// Relay queue (IDEA §5.6): store and forward sealed envelopes, then upload once with network.
import type { Envelope, SyncRequest, SyncResponse } from '../../lib/contract';
import { putRevocationList, type Db } from '../../lib/storage';

export interface RelayConfig { maxQueue: number; maxHops: number }
export const DEFAULT_RELAY: RelayConfig = { maxQueue: 50, maxHops: 3 };
const KEY = 'relay_queue';

/** TTL is inclusive (an envelope lives its full ttl_s). Hops are not signed (a relay could lie); the server dedupes by id anyway, so this only bounds spread. */
export function pruneQueue(q: Envelope[], now: number, cfg: RelayConfig): Envelope[] {
  return q.filter((e) => now <= e.created_at + e.ttl_s && e.hops <= cfg.maxHops);
}

/** Adds one envelope: dedupe by id, prune, keep the newest `maxQueue` (FIFO drops the oldest). */
export function addToQueue(q: Envelope[], e: Envelope, now: number, cfg: RelayConfig): Envelope[] {
  const next = q.some((x) => x.envelope_id === e.envelope_id) ? q : [...q, e];
  const kept = pruneQueue(next, now, cfg);
  return kept.slice(Math.max(0, kept.length - cfg.maxQueue));
}

/** The copy handed to another phone: one more hop, the original untouched. */
export const forwardCopy = (e: Envelope): Envelope => ({ ...e, hops: e.hops + 1 });

export async function loadQueue(db: Db): Promise<Envelope[]> {
  return ((await db.get('kv', KEY)) as Envelope[] | undefined) ?? [];
}
export const saveQueue = async (db: Db, q: Envelope[]): Promise<void> => { await db.put('kv', q, KEY); };

export interface UploadResult { sent: number; accepted: number; duplicates: number; rejected: SyncResponse['rejected'] }

/**
 * One POST /api/sync for everything queued. The server answers per envelope (accepted, duplicate or rejected),
 * so after a successful call nothing is kept: a rejected envelope never becomes valid. On a network error the
 * queue stays intact. The signed revocation list that comes back is stored (newest wins) to be passed on.
 */
export async function uploadQueue(db: Db, post: (r: SyncRequest) => Promise<SyncResponse>, now: number): Promise<UploadResult> {
  const queue = pruneQueue(await loadQueue(db), now, { ...DEFAULT_RELAY, maxHops: Infinity });
  if (queue.length === 0) return { sent: 0, accepted: 0, duplicates: 0, rejected: [] };
  const res = await post({ envelopes: queue });
  await saveQueue(db, []);
  await putRevocationList(db, res.revocation_list);
  return { sent: queue.length, accepted: res.accepted, duplicates: res.duplicates, rejected: res.rejected };
}
