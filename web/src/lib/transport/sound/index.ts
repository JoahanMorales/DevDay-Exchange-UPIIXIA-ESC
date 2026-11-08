import type { Transport } from '../../contract/transport';

// Sound transport over ggwave (FSK audio). One ggwave message per payload: a signed IOU is
// 125 bytes and ggwave carries at most 140, so it is never split. Anything the decoder cannot
// read (an error, an empty frame, an impossible length) is dropped, so a recording or a
// synthetic voice never yields bytes; the IOU signature check upstream does the rest.
// Protocol: docs/spikes/ggwave.md decides it; until the spike is filled the default is AUDIBLE_FAST.

export const MAX_PAYLOAD = 140;

/** The two ggwave calls we use, as plain bytes in and float32 samples out. */
export interface GgwaveCodec {
  encode(bytes: Uint8Array): Float32Array;
  decode(chunk: Float32Array): Uint8Array | null;
}

/** Speaker and microphone. `listen` yields float32 mono chunks at the codec's sample rate. */
export interface SoundIo {
  play(samples: Float32Array): Promise<void>;
  listen(): AsyncIterable<Float32Array>;
}

export function createSoundTransport(gg: GgwaveCodec, io: SoundIo): Transport {
  return {
    async send(bytes) {
      if (bytes.length < 1 || bytes.length > MAX_PAYLOAD) throw new Error(`sound payload must be 1..${MAX_PAYLOAD} bytes, got ${bytes.length}`);
      await io.play(gg.encode(bytes));
    },
    async *receive() {
      for await (const chunk of io.listen()) {
        let out: Uint8Array | null;
        try { out = gg.decode(chunk); } catch { continue; }
        if (!out || out.length < 1 || out.length > MAX_PAYLOAD) continue;
        yield out.slice();
      }
    },
  };
}

// ---- real ggwave (browser) ----

export type SoundProtocol =
  | 'AUDIBLE_NORMAL' | 'AUDIBLE_FAST' | 'AUDIBLE_FASTEST'
  | 'ULTRASOUND_NORMAL' | 'ULTRASOUND_FAST' | 'ULTRASOUND_FASTEST';

/* eslint-disable @typescript-eslint/no-explicit-any */
/** Loads the ggwave WASM module and wraps it as a GgwaveCodec. Copies out of WASM memory views. */
export async function loadGgwave(sampleRate: number, protocol: SoundProtocol = 'AUDIBLE_FAST', volume = 50): Promise<GgwaveCodec> {
  const mod: any = await import('ggwave');
  const factory: any = mod.default ?? mod;
  const gw: any = await factory();
  const p = gw.getDefaultParameters();
  p.sampleRateInp = sampleRate;
  p.sampleRateOut = sampleRate;
  const inst = gw.init(p);
  gw.disableLog?.();
  const proto = gw.ProtocolId[`GGWAVE_PROTOCOL_${protocol}`];
  return {
    encode(bytes) {
      const raw: Int8Array = gw.encode(inst, bytes, proto, volume);
      return new Float32Array(raw.slice().buffer);
    },
    decode(chunk) {
      const res: Int8Array | null = gw.decode(inst, new Int8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength));
      return res && res.length ? new Uint8Array(res.slice().buffer) : null;
    },
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/** Web Audio speaker + mic without echo cancellation, noise suppression or AGC (they damage FSK). */
export function createWebAudioIo(ctx: AudioContext): SoundIo {
  return {
    async play(samples) {
      const buf = ctx.createBuffer(1, samples.length, ctx.sampleRate);
      buf.getChannelData(0).set(samples);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.connect(ctx.destination);
      await new Promise<void>((done) => { src.onended = () => done(); src.start(); });
    },
    async *listen() {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
      const node = ctx.createScriptProcessor(1024, 1, 1);
      const queue: Float32Array[] = [];
      let wake: (() => void) | null = null;
      node.onaudioprocess = (e) => { queue.push(e.inputBuffer.getChannelData(0).slice()); wake?.(); };
      const mic = ctx.createMediaStreamSource(stream);
      mic.connect(node);
      node.connect(ctx.destination);
      try {
        for (;;) {
          while (queue.length) yield queue.shift()!;
          await new Promise<void>((r) => { wake = r; });
          wake = null;
        }
      } finally {
        node.disconnect(); mic.disconnect();
        stream.getTracks().forEach((t) => t.stop());
      }
    },
  };
}

/** False when the browser cannot do sound (no secure context or no mic API): the UI hides the button. */
export function soundSupported(): boolean {
  return typeof window !== 'undefined' && window.isSecureContext && !!navigator.mediaDevices?.getUserMedia && typeof AudioContext !== 'undefined';
}
