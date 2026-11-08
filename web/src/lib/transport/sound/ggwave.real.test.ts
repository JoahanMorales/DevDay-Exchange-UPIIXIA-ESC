// @vitest-environment node
import { it, expect } from 'vitest';
import { loadGgwave } from './index';
it('real_ggwave_roundtrips_125_binary_bytes_and_rejects_noise', async () => {
  const gg = await loadGgwave(48000, 'AUDIBLE_FASTEST');
  const b = Uint8Array.from({ length: 125 }, (_, i) => (i * 37 + 200) & 0xff);
  const s = gg.encode(b);
  let got: Uint8Array | null = null;
  for (let i = 0; i < s.length && !got; i += 1024) got = gg.decode(s.slice(i, i + 1024));
  for (let k = 0; k < 20 && !got; k++) got = gg.decode(new Float32Array(1024));
  expect(got).toEqual(b);
  const noise = Float32Array.from({ length: 48000 }, () => Math.random() * 2 - 1);
  let g2: Uint8Array | null = null;
  for (let i = 0; i < noise.length; i += 1024) g2 = g2 ?? gg.decode(noise.slice(i, i + 1024));
  expect(g2).toBeNull();
}, 60000);
