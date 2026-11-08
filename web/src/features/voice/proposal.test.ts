import { describe, expect, it } from "vitest";
import { confirmProposal, EMPTY, parseToolCall, propose } from "./proposal";

describe("voice proposals", () => {
  it("proposed_amount_needs_a_tap_to_apply", () => {
    const p = parseToolCall("proponer_monto", JSON.stringify({ centavos: 2500 }));
    expect(p).toEqual({ kind: "monto", centavos: 2500 });
    const proposed = propose(EMPTY, p!);
    expect(proposed.amountCents).toBeNull();
    expect(proposed.pending).toEqual([p]);
    const applied = confirmProposal(proposed, p!);
    expect(applied.amountCents).toBe(2500);
    expect(applied.pending).toEqual([]);
  });

  it("payer proposal also waits for the tap", () => {
    const p = parseToolCall("proponer_pagador", JSON.stringify({ etiqueta: " Don Mario " }))!;
    expect(p).toEqual({ kind: "pagador", etiqueta: "Don Mario" });
    const s = propose(EMPTY, p);
    expect(s.payer).toBeNull();
    expect(confirmProposal(s, p).payer).toBe("Don Mario");
  });

  it("rejects unknown tools and bad amounts", () => {
    expect(parseToolCall("cobrar", JSON.stringify({ centavos: 100 }))).toBeNull();
    expect(parseToolCall("proponer_monto", JSON.stringify({ centavos: 12.5 }))).toBeNull();
    expect(parseToolCall("proponer_monto", JSON.stringify({ centavos: 0 }))).toBeNull();
    expect(parseToolCall("proponer_monto", JSON.stringify({ centavos: 100_000_000 }))).toBeNull();
    expect(parseToolCall("proponer_monto", "no es json")).toBeNull();
    expect(parseToolCall("proponer_pagador", JSON.stringify({ etiqueta: "" }))).toBeNull();
  });

  it("a newer proposal of the same kind replaces the pending one", () => {
    const a = parseToolCall("proponer_monto", '{"centavos":100}')!;
    const b = parseToolCall("proponer_monto", '{"centavos":200}')!;
    expect(propose(propose(EMPTY, a), b).pending).toEqual([b]);
  });
});
