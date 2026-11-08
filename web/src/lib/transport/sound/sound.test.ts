// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { createSoundTransport, MAX_PAYLOAD, type GgwaveCodec, type SoundIo } from './index';

// Fake ggwave: "audio" is the payload bytes copied into a Float32Array; decode reverses it.
class FakeGgwave implements GgwaveCodec {
  encoded: Uint8Array[] = [];
  private decodeImpl?: (chunk: Float32Array) => Uint8Array | null;
  constructor(decodeImpl?: (chunk: Float32Array) => Uint8Array | null) { this.decodeImpl = decodeImpl; }
  encode(bytes: Uint8Array): Float32Array {
    this.encoded.push(bytes.slice());
    return Float32Array.from(bytes);
  }
  decode(chunk: Float32Array): Uint8Array | null {
    if (this.decodeImpl) return this.decodeImpl(chunk);
    return chunk.length ? Uint8Array.from(chunk) : null;
  }
}

class FakeIo implements SoundIo {
  played: Float32Array[] = [];
  private chunks: Float32Array[];
  constructor(chunks: Float32Array[] = []) { this.chunks = chunks; }
  async play(samples: Float32Array) { this.played.push(samples); }
  async *listen() { for (const c of this.chunks) yield c; }
}

const iou = () => Uint8Array.from({ length: 125 }, (_, i) => (i * 37 + 200) & 0xff);

async function collect(it: AsyncIterable<Uint8Array>) {
  const out: Uint8Array[] = [];
  for await (const x of it) out.push(x);
  return out;
}

describe('SoundTransport', () => {
  it('sends_iou_as_one_message_under_140_bytes', async () => {
    const gg = new FakeGgwave(), io = new FakeIo();
    await createSoundTransport(gg, io).send(iou());
    expect(gg.encoded).toHaveLength(1);
    expect(gg.encoded[0]).toEqual(iou());
    expect(gg.encoded[0].length).toBeLessThan(140);
    expect(io.played).toHaveLength(1);
    await expect(createSoundTransport(gg, io).send(new Uint8Array(MAX_PAYLOAD + 1))).rejects.toThrow();
  });

  it('garbage_audio_never_yields_an_iou', async () => {
    let n = 0;
    const gg = new FakeGgwave(() => {
      n++;
      if (n === 1) throw new Error('decode failed');
      if (n === 2) return null;
      if (n === 3) return new Uint8Array(0);
      return new Uint8Array(MAX_PAYLOAD + 10); // impossible length
    });
    const noise = Array.from({ length: 6 }, () => Float32Array.from({ length: 64 }, () => Math.random() * 2 - 1));
    const got = await collect(createSoundTransport(gg, new FakeIo(noise)).receive());
    expect(got).toEqual([]);
  });

  it('receive_yields_exact_bytes_from_fake_decoder', async () => {
    const gg = new FakeGgwave();
    const io = new FakeIo([new Float32Array(0), gg.encode(iou())]);
    const got = await collect(createSoundTransport(gg, io).receive());
    expect(got).toHaveLength(1);
    expect(got[0]).toEqual(iou());
  });
});
