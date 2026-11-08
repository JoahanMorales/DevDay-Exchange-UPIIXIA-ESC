// The voice model can only propose; nothing here changes the charge until the merchant taps (IDEA §7).
export type Proposal = { kind: "monto"; centavos: number } | { kind: "pagador"; etiqueta: string };
export type VoiceState = { amountCents: number | null; payer: string | null; pending: Proposal[] };

export const EMPTY: VoiceState = { amountCents: null, payer: null, pending: [] };
export const MAX_CENTAVOS = 1_000_000; // same cap as app/routers/voice.py

/** A Realtime function call → a proposal, or null for any tool or value outside the contract. */
export function parseToolCall(name: string, args: string): Proposal | null {
  let a: unknown;
  try {
    a = JSON.parse(args);
  } catch {
    return null;
  }
  if (typeof a !== "object" || a === null) return null;
  const o = a as Record<string, unknown>;
  if (name === "proponer_monto") {
    const c = o.centavos;
    return typeof c === "number" && Number.isInteger(c) && c > 0 && c <= MAX_CENTAVOS ? { kind: "monto", centavos: c } : null;
  }
  if (name === "proponer_pagador") {
    const e = typeof o.etiqueta === "string" ? o.etiqueta.trim().slice(0, 60) : "";
    return e ? { kind: "pagador", etiqueta: e } : null;
  }
  return null;
}

/** Shows a proposal; the newest of each kind replaces the older one. The amount and payer stay untouched. */
export function propose(state: VoiceState, p: Proposal): VoiceState {
  return { ...state, pending: [...state.pending.filter((x) => x.kind !== p.kind), p] };
}

/** The merchant's tap: only now does the proposal become the amount or the payer. */
export function confirmProposal(state: VoiceState, p: Proposal): VoiceState {
  const pending = state.pending.filter((x) => x !== p);
  return p.kind === "monto" ? { ...state, amountCents: p.centavos, pending } : { ...state, payer: p.etiqueta, pending };
}

export function discardProposal(state: VoiceState, p: Proposal): VoiceState {
  return { ...state, pending: state.pending.filter((x) => x !== p) };
}
