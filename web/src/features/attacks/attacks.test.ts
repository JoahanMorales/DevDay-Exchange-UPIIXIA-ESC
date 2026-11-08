// @vitest-environment node
import { describe, expect, it } from 'vitest';
import type { AttackLog } from '../../lib/contract';
import { runAttacks, type AttackId } from './scenarios';

class FakeDeps {
  vibrations: (number | number[])[] = [];
  logs: AttackLog[] = [];
  vibrate = (p: number | number[]) => { this.vibrations.push(p); return true; };
  logAttack = async (a: AttackLog) => { this.logs.push(a); };
}
const run = async () => { const d = new FakeDeps(); return { d, runs: await runAttacks(d) }; };
const reasonOf = (runs: Awaited<ReturnType<typeof runAttacks>>, id: AttackId) => {
  const r = runs.find((x) => x.id === id)!.result;
  return r.ok ? 'ok' : r.reason;
};

describe('attacks', () => {
  it('replayed_recording_is_rejected_as_used_challenge', async () => {
    const { runs } = await run();
    expect(reasonOf(runs, 'legit')).toBe('ok');
    expect(reasonOf(runs, 'replay')).toBe('reto_usado');
  });
  it('ai_voice_audio_is_rejected_without_signature', async () => {
    expect(reasonOf((await run()).runs, 'ai_voice')).toBe('firma_invalida');
  });
  it('iou_2km_away_is_rejected', async () => {
    expect(reasonOf((await run()).runs, 'far_2km')).toBe('fuera_de_50m');
  });
  it('repeated_counter_is_rejected', async () => {
    expect(reasonOf((await run()).runs, 'repeat_counter')).toBe('contador_repetido');
  });
  it('each_rejection_is_logged_with_reason_and_no_vibration', async () => {
    const { d, runs } = await run();
    const rejected = runs.filter((r) => !r.result.ok);
    expect(rejected).toHaveLength(4);
    expect(d.logs.map((l) => l.detail)).toEqual(['reto_usado', 'firma_invalida', 'fuera_de_50m', 'contador_repetido']);
    for (const r of rejected) expect(r.result.ok === false && r.result.message.length > 0).toBe(true);
    expect(d.vibrations).toHaveLength(1); // only the legit #17
  });
});
