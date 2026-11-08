import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { Debt, ExplainResponse } from "../../lib/contract";
import { Dashboard, type EventStream } from "./Dashboard";

class FakeEventSource implements EventStream {
  onmessage: ((e: { data: string }) => void) | null = null;
  closed = false;
  url: string;
  constructor(url: string) {
    this.url = url;
  }
  emit(data: unknown) {
    this.onmessage?.({ data: JSON.stringify(data) });
  }
  close() {
    this.closed = true;
  }
}

function debt(id: string, amount: number, name = id): Debt {
  return {
    id,
    iou: {
      ver: 1, payer_id: `P-${name}`, merchant_id: "M1", amount_cents: amount, counter: 1,
      ts: 0, nonce: "", lat: 0, lon: 0, sig: "", raw: "",
    },
    status: "COBRO_ENVIADO", charge_target: "payer", pey_transaction_id: null,
    pey_codi_id: null, tracking_key: null, paid_at: null, attempts: [], alerts: [],
  };
}

const explanation: ExplainResponse = { texto: "Se cobraron 3 pagarés.", cifras: {}, fuente: "openai" };

function setup(debts: Debt[], extra: Partial<Parameters<typeof Dashboard>[0]> = {}) {
  const streams: FakeEventSource[] = [];
  render(
    <Dashboard
      debts={debts}
      explanation={explanation}
      demoChargeCents={1}
      openEvents={(id) => {
        const s = new FakeEventSource(`/api/deudas/${id}/eventos`);
        streams.push(s);
        return s;
      }}
      {...extra}
    />,
  );
  return streams;
}

afterEach(cleanup);

describe("Dashboard", () => {
  it("turns_debt_green_on_paid_event_with_tracking_key", () => {
    const streams = setup([debt("D1", 4500), debt("D2", 1200), debt("D3", 800)]);
    expect(screen.getByText("3 pagarés pendientes")).toBeTruthy();
    act(() => {
      for (const s of streams) {
        const id = s.url.split("/")[3];
        s.emit({ debt_id: id, status: "PAGADA", at: "2026-11-08T10:00:00Z", detail: `CLAVE-${id}` });
      }
    });
    expect(screen.getByText("3 cobrados por CoDi")).toBeTruthy();
    expect(screen.getByText(/CLAVE-D1/)).toBeTruthy();
    expect(screen.getByTestId("debt-D1").getAttribute("data-tone")).toBe("ok");
  });

  it("shows_test_amount_label_when_demo_amount_differs", () => {
    setup([debt("D1", 4500)]);
    expect(screen.getByText("monto de prueba $0.01")).toBeTruthy();
    cleanup();
    setup([debt("D2", 1)]);
    expect(screen.queryByText("monto de prueba $0.01")).toBeNull();
  });

  it("shows_explanation_source", () => {
    setup([debt("D1", 4500)]);
    expect(screen.getByText("Se cobraron 3 pagarés.")).toBeTruthy();
    expect(screen.getByText(/Fuente: OpenAI/)).toBeTruthy();
    cleanup();
    setup([debt("D1", 4500)], { explanation: { ...explanation, fuente: "plantilla" } });
    expect(screen.getByText(/Fuente: plantilla/)).toBeTruthy();
  });
});
