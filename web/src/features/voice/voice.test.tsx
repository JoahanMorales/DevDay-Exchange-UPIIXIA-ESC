import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { confirmProposal, discardProposal, EMPTY, propose, type VoiceState } from "./proposal";
import { Voice } from "./Voice";

function Harness({ online = true, initial = EMPTY }: { online?: boolean; initial?: VoiceState }) {
  const [state, setState] = useState(initial);
  return (
    <Voice
      online={online}
      state={state}
      mic="off"
      onStart={() => {}}
      onStop={() => {}}
      onConfirm={(p) => setState((s) => confirmProposal(s, p))}
      onDiscard={(p) => setState((s) => discardProposal(s, p))}
    />
  );
}

afterEach(cleanup);

describe("Voice screen", () => {
  it("shows the proposed amount only after the merchant taps Usar", () => {
    render(<Harness initial={propose(EMPTY, { kind: "monto", centavos: 2500 })} />);
    expect(screen.getByTestId("monto").textContent).not.toContain("25.00");
    fireEvent.click(screen.getByRole("button", { name: /Usar Monto/ }));
    expect(screen.getByTestId("monto").textContent).toContain("25.00");
  });

  it("offline hides the microphone and keeps the keypad", () => {
    render(<Harness online={false} />);
    expect(screen.queryByRole("button", { name: /Dictar/ })).toBeNull();
    expect(screen.getByRole("status").textContent).toMatch(/teclado/);
    expect(screen.getByRole("link", { name: /teclado/ }).getAttribute("href")).toBe("/tienda");
  });
});
