// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { createQrTransport, decodeFrames, encodeFrames } from './index';

describe('qr transport', () => {
  it('qr_transport_roundtrips_the_same_125_bytes', async () => {
    const bytes = new Uint8Array(125).map((_, i) => (i * 37 + 11) & 0xff);
    const frames = encodeFrames(bytes, 40);
    expect(frames.length).toBeGreaterThan(1);
    expect(decodeFrames([...frames].reverse())).toEqual(bytes);

    let shown: string[] = [];
    const sender = createQrTransport({ show: (f) => { shown = f; }, scan: async function* () {} });
    await sender.send(bytes);
    const receiver = createQrTransport({
      show: () => {},
      scan: async function* () { for (let i = 0; i < 3; i++) yield* shown; },
    });
    const it = receiver.receive()[Symbol.asyncIterator]();
    const got = await it.next();
    expect(got.value).toEqual(bytes);
    expect(got.value.length).toBe(125);
  });
});
