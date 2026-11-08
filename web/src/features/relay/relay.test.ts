// @vitest-environment node
import 'fake-indexeddb/auto';
import { describe, expect, it, vi } from 'vitest';
import type { Envelope, SyncResponse } from '../../lib/contract';
import { getRevocationList, openCoreDb } from '../../lib/storage';
import { addToQueue, DEFAULT_RELAY, forwardCopy, loadQueue, pruneQueue, saveQueue, uploadQueue } from './relay';

const env = (id: string, over: Partial<Envelope> = {}): Envelope => ({
  envelope_id: id.padEnd(64, '0'), epk: 'e', iv: 'i', ciphertext: 'c', hops: 0, created_at: 1000, ttl_s: 7 * 24 * 3600, ...over,
});
const rl = (version: number) => ({ version, issued_at: 5, revoked: ['X'], caps: {}, server_sig: 's' });

describe('relay queue', () => {
  it('drops_envelopes_past_ttl_or_max_hops', () => {
    const now = 1000 + 7 * 24 * 3600;
    const q = [env('a'), env('b', { created_at: 999 }), env('c', { hops: DEFAULT_RELAY.maxHops }), env('d', { hops: DEFAULT_RELAY.maxHops + 1 })];
    const kept = pruneQueue(q, now, DEFAULT_RELAY).map((e) => e.envelope_id[0]);
    expect(kept).toEqual(['a', 'c']); // b is past TTL, d exceeded max hops
    // FIFO cap: the oldest goes first; a duplicate id is not added twice.
    let queue: Envelope[] = [];
    for (let i = 0; i < 4; i++) queue = addToQueue(queue, env(String(i)), 1000, { maxQueue: 3, maxHops: 3 });
    expect(queue.map((e) => e.envelope_id[0])).toEqual(['1', '2', '3']);
    expect(addToQueue(queue, env('3'), 1000, { maxQueue: 3, maxHops: 3 })).toHaveLength(3);
    // Handing off adds one hop and never mutates the original.
    const orig = env('z');
    expect(forwardCopy(orig).hops).toBe(1);
    expect(orig.hops).toBe(0);
  });

  it('uploads_once_and_reports_duplicates', async () => {
    const db = await openCoreDb(`relay-${Math.random()}`);
    await saveQueue(db, [env('a'), env('b')]);
    expect(await loadQueue(db)).toHaveLength(2);
    const post = vi.fn(async (): Promise<SyncResponse> => ({ accepted: 1, duplicates: 1, rejected: [], revocation_list: rl(3) }));
    const r1 = await uploadQueue(db, post, 1000);
    expect(post).toHaveBeenCalledTimes(1);
    expect(r1).toMatchObject({ accepted: 1, duplicates: 1, rejected: [], sent: 2 });
    expect(await loadQueue(db)).toHaveLength(0);
    expect((await getRevocationList(db))?.version).toBe(3);
    // Nothing left: the second upload does not call the server.
    const r2 = await uploadQueue(db, post, 1000);
    expect(post).toHaveBeenCalledTimes(1);
    expect(r2.sent).toBe(0);
    // A network failure keeps the queue for the next try.
    await saveQueue(db, [env('c')]);
    await expect(uploadQueue(db, async () => { throw new Error('offline'); }, 1000)).rejects.toThrow('offline');
    expect(await loadQueue(db)).toHaveLength(1);
  });
});
