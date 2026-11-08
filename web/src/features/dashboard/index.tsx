import { useEffect, useState } from "react";
import type { FeatureRoute } from "../../App";
import { api } from "../../lib/api";
import type { Debt, DebtList, ExplainResponse } from "../../lib/contract";
import { Dashboard, type EventStream } from "./Dashboard";
import { demoDebts, demoExplanation } from "./demo";

// Sandbox charges a test amount (Pey $0.01) while the pagaré keeps the real one.
const DEMO_CHARGE_CENTS = Number(import.meta.env.VITE_DEMO_CHARGE_CENTS ?? 1);

function openEvents(id: string): EventStream {
  const es = new EventSource(`/api/deudas/${encodeURIComponent(id)}/eventos`);
  const stream: EventStream = { onmessage: null, close: () => es.close() };
  es.onmessage = (e: MessageEvent<string>) => stream.onmessage?.({ data: e.data });
  return stream;
}

function TableroPage() {
  const merchant = new URLSearchParams(location.search).get("merchant_id") ?? "";
  const [debts, setDebts] = useState<Debt[]>(demoDebts);
  const [demo, setDemo] = useState(true);
  const [explanation, setExplanation] = useState<ExplainResponse | null>(demoExplanation);

  useEffect(() => {
    if (!merchant) return;
    api<DebtList>(`/deudas?merchant_id=${encodeURIComponent(merchant)}`)
      .then((r) => {
        setDebts(r.debts);
        setDemo(false);
      })
      .catch(() => setDemo(true));
    api<ExplainResponse>("/resumen")
      .then(setExplanation)
      .catch(() => undefined);
  }, [merchant]);

  return (
    <Dashboard
      debts={debts}
      explanation={explanation}
      demoChargeCents={DEMO_CHARGE_CENTS}
      openEvents={demo ? fakeEvents : openEvents}
      demoData={demo}
    />
  );
}

// demo_data: with no backend, each pending debt turns paid a few seconds later.
function fakeEvents(id: string): EventStream {
  const s: EventStream = { onmessage: null, close: () => clearTimeout(t) };
  const delay = 2000 + demoDebts.findIndex((d) => d.id === id) * 1200;
  const t = setTimeout(() => {
    s.onmessage?.({
      data: JSON.stringify({
        debt_id: id,
        status: "PAGADA",
        at: new Date().toISOString(),
        detail: `DEMO${id.slice(-4)}`,
      }),
    });
  }, delay);
  return s;
}

export const route: FeatureRoute = { path: "/tablero", element: <TableroPage />, label: "Tablero" };
