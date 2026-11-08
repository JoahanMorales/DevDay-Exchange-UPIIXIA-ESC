import type { Transport } from '../../contract/transport';

// Animated QR: the payload is split into frames "SS1:<i>/<n>:<base64>" shown in a loop; the
// scanner keeps frames until it has all n, in any order, then yields the bytes.
const PREFIX = 'SS1';
const b64 = (u: Uint8Array) => btoa(String.fromCharCode(...u));
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

export function encodeFrames(bytes: Uint8Array, chunk = 60): string[] {
  const n = Math.max(1, Math.ceil(bytes.length / chunk));
  return Array.from({ length: n }, (_, i) => `${PREFIX}:${i}/${n}:${b64(bytes.slice(i * chunk, (i + 1) * chunk))}`);
}

function parse(frame: string): { i: number; n: number; data: Uint8Array } | null {
  const m = /^SS1:(\d+)\/(\d+):([A-Za-z0-9+/=]*)$/.exec(frame);
  if (!m) return null;
  const i = Number(m[1]), n = Number(m[2]);
  if (n < 1 || i >= n) return null;
  try { return { i, n, data: unb64(m[3]) }; } catch { return null; }
}

/** Joins a full set of frames (any order, duplicates allowed); null if incomplete. */
export function decodeFrames(frames: string[]): Uint8Array | null {
  const parts = new Map<number, Uint8Array>();
  let n = 0;
  for (const f of frames) {
    const p = parse(f);
    if (!p) continue;
    if (p.n !== n) { parts.clear(); n = p.n; }
    parts.set(p.i, p.data);
  }
  if (!n || parts.size !== n) return null;
  const out: number[] = [];
  for (let i = 0; i < n; i++) out.push(...parts.get(i)!);
  return new Uint8Array(out);
}

export interface QrIo { show(frames: string[]): void; scan(): AsyncIterable<string> }

export function createQrTransport(io: QrIo, chunk = 60): Transport {
  return {
    async send(bytes) { io.show(encodeFrames(bytes, chunk)); },
    async *receive() {
      let seen: string[] = [];
      for await (const f of io.scan()) {
        seen.push(f);
        const bytes = decodeFrames(seen);
        if (bytes) { seen = []; yield bytes; }
      }
    },
  };
}
