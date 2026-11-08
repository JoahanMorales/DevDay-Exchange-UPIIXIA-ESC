/** The four beats of the idea. The 3D scene and the captions both read this, so they never drift apart. */
export type Beat = { id: string; title: string; caption: string; start: number; end: number };

export const BEATS: Beat[] = [
  { id: "firma", title: "Firma", caption: "Sin señal, Mario firma un pagaré y el celular de la tienda vibra.", start: 0, end: 3.5 },
  { id: "rechazo", title: "Se rechaza", caption: "Una grabación o una voz de IA no traen la firma: la tienda no vibra.", start: 3.5, end: 7 },
  { id: "viaje", title: "Viaja", caption: "El pagaré viaja cifrado de celular en celular hasta que alguien tiene señal.", start: 7, end: 10.5 },
  { id: "cobro", title: "Se cobra", caption: "Con señal se cobra por CoDi. En la demo, un monto de prueba de $0.01.", start: 10.5, end: 14 },
];

export const DURATION = 14;
/** Reduced motion and no-WebGL show the payoff: the last beat, almost complete. */
export const STILL_T = 13.9;

/** Beat and progress (0 to 1, never 1) at time `t` seconds. The timeline loops, negative times wrap. */
export function beatAt(t: number): { index: number; progress: number } {
  const m = ((t % DURATION) + DURATION) % DURATION;
  const index = BEATS.findIndex((b) => m >= b.start && m < b.end);
  const b = BEATS[index];
  return { index, progress: (m - b.start) / (b.end - b.start) };
}
