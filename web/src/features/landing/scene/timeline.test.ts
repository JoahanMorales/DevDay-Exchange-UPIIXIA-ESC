// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { BEATS, DURATION, STILL_T, beatAt } from './timeline';

describe('scene timeline', () => {
  it('timeline_covers_the_whole_loop_in_four_beats', () => {
    expect(BEATS).toHaveLength(4);
    expect(BEATS[0].start).toBe(0);
    for (let i = 1; i < BEATS.length; i++) expect(BEATS[i].start).toBe(BEATS[i - 1].end); // no gaps, no overlaps
    expect(BEATS[3].end).toBe(DURATION);
    expect(DURATION).toBe(14);
    expect(beatAt(0).index).toBe(0);
    expect(beatAt(BEATS[1].start).index).toBe(1);
    expect(beatAt(BEATS[2].start + 0.01).index).toBe(2);
    expect(beatAt(DURATION - 0.01).index).toBe(3);
    expect(beatAt(DURATION).index).toBe(0); // wraps: it is a loop
    expect(beatAt(-0.5).index).toBe(3);
    for (const t of [0, 1.2, 3.49, 6.9, 10.2, 13.99, 27.3]) {
      const { progress } = beatAt(t);
      expect(progress).toBeGreaterThanOrEqual(0);
      expect(progress).toBeLessThan(1);
    }
    for (const b of BEATS) expect(b.caption.length).toBeGreaterThan(10);
  });

  it('reduced_motion_shows_the_last_beat', () => {
    const { index, progress } = beatAt(STILL_T);
    expect(index).toBe(3); // the payoff: charged through CoDi
    expect(progress).toBeGreaterThan(0.9);
    expect(BEATS[3].caption).toMatch(/CoDi/);
    expect(BEATS[3].caption).toMatch(/prueba/); // the $0.01 is labeled as a test amount
  });
});
