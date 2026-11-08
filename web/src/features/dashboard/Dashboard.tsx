import { useEffect, useState } from "react";
import type { Debt, DebtEvent, DebtStatus, ExplainResponse } from "../../lib/contract";
import {
  Button,
  DemoBadge,
  List,
  ListRow,
  PageHeader,
  PageLayout,
  SectionHeader,
  Stat,
  Surface,
  formatMXN,
  type Tone,
} from "../../lib/ui";

/** The slice of EventSource the dashboard uses; tests pass a Fake. */
export type EventStream = { onmessage: ((e: { data: string }) => void) | null; close(): void };

const statusCopy: Record<DebtStatus, { tone: Tone; label: string }> = {
  REGISTRADA: { tone: "neutral", label: "Pendiente" },
  COBRO_ENVIADO: { tone: "warn", label: "Cobro CoDi enviado" },
  PAGADA: { tone: "ok", label: "Cobrado por CoDi" },
  VENCIDA: { tone: "bad", label: "Vencido" },
  DUPLICADA: { tone: "bad", label: "Duplicado" },
  RECHAZADA: { tone: "bad", label: "Rechazado" },
};

const sourceLabel = { openai: "OpenAI", plantilla: "plantilla" } as const;

function applyEvent(debts: Debt[], ev: DebtEvent): Debt[] {
  return debts.map((d) =>
    d.id !== ev.debt_id
      ? d
      : {
          ...d,
          status: ev.status,
          paid_at: ev.status === "PAGADA" ? ev.at : d.paid_at,
          tracking_key: ev.status === "PAGADA" ? (ev.detail ?? d.tracking_key) : d.tracking_key,
        },
  );
}

export function Dashboard({
  debts: initial,
  explanation,
  demoChargeCents,
  openEvents,
  reputation = {},
  demoData = false,
}: {
  debts: Debt[];
  explanation: ExplainResponse | null;
  /** Amount actually charged in the sandbox (Pey test charge); 0 = charge the real amount. */
  demoChargeCents: number;
  openEvents: (debtId: string) => EventStream;
  reputation?: Record<string, number>;
  demoData?: boolean;
}) {
  const [debts, setDebts] = useState(initial);
  useEffect(() => setDebts(initial), [initial]);

  const openIds = initial.filter((d) => d.status !== "PAGADA").map((d) => d.id).join(",");
  useEffect(() => {
    if (!openIds) return;
    const streams = openIds.split(",").map((id) => {
      const s = openEvents(id);
      s.onmessage = (e) => {
        try {
          const ev = JSON.parse(e.data) as DebtEvent;
          setDebts((prev) => applyEvent(prev, ev));
        } catch {
          /* ignore malformed frames */
        }
      };
      return s;
    });
    return () => streams.forEach((s) => s.close());
  }, [openIds, openEvents]);

  const paid = debts.filter((d) => d.status === "PAGADA");
  const pending = debts.length - paid.length;
  const paidCents = paid.reduce((s, d) => s + d.iou.amount_cents, 0);
  const totalCents = debts.reduce((s, d) => s + d.iou.amount_cents, 0);
  const allPaid = debts.length > 0 && pending === 0;
  const [disaster, setDisaster] = useState(false);

  return (
    <PageLayout recipe="list">
      <PageHeader title="Tablero de cobros" context="Pagarés sincronizados · en vivo" />
      <p
        className={`display mb-5 text-2xl font-extrabold ${allPaid ? "text-ok" : "text-warn"}`}
        aria-live="polite"
      >
        {allPaid ? `${paid.length} cobrados por CoDi` : `${pending} pagarés pendientes`}
      </p>
      <div className="mb-6 grid grid-cols-3 gap-3">
        <Stat label="Pagarés" value={debts.length} />
        <Stat label="Por cobrar" value={formatMXN(totalCents - paidCents)} tone="warn" />
        <Stat label="Cobrado por CoDi" value={formatMXN(paidCents)} tone="ok" />
      </div>

      <SectionHeader>Pagarés</SectionHeader>
      <List>
        {debts.map((d) => {
          const s = statusCopy[d.status];
          const rep = reputation[d.iou.payer_id];
          const testAmount = demoChargeCents > 0 && d.iou.amount_cents !== demoChargeCents;
          const detail = [
            s.label,
            d.tracking_key ? `clave de rastreo ${d.tracking_key}` : null,
            rep !== undefined ? `reputación ${rep.toFixed(2)}` : null,
          ]
            .filter(Boolean)
            .join(" · ");
          return (
              <ListRow
                key={d.id}
                tone={s.tone}
                title={
                  <span data-testid={`debt-${d.id}`} data-tone={s.tone}>
                    {`Pagador …${d.iou.payer_id.slice(-6)} · #${d.iou.counter}`}
                  </span>
                }
                detail={detail}
                trailing={
                  <>
                    <span className="num block text-xl">{formatMXN(d.iou.amount_cents)}</span>
                    {testAmount && (
                      <span className="text-sm text-ink-2">
                        {`monto de prueba ${formatMXN(demoChargeCents)}`}
                      </span>
                    )}
                  </>
                }
              />
          );
        })}
      </List>

      {explanation && (
        <Surface>
          <div className="p-5">
            <SectionHeader>Qué pasó</SectionHeader>
            <p className="text-base">{explanation.texto}</p>
            <p className="mt-2 text-sm text-ink-2">{`Fuente: ${sourceLabel[explanation.fuente]}`}</p>
          </div>
        </Surface>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button variant="secondary" onClick={() => setDisaster(true)}>Desastre declarado: fondo de garantía</Button>
        <span className="text-sm text-ink-2">demo_data · simulación</span>
      </div>
      {disaster && (
        <p className="mt-3 text-base text-ink-2" role="status">
          Fondo de garantía activado (simulado, demo_data): la tienda no pierde lo vendido.
        </p>
      )}
      {demoData && <DemoBadge>demo_data · datos de demostración hasta conectar /api/deudas</DemoBadge>}
    </PageLayout>
  );
}
