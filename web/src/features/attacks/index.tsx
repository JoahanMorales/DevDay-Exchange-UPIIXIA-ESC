import { useState } from "react";
import type { FeatureRoute } from "../../App";
import type { AttackLog } from "../../lib/contract";
import {
  Button,
  DemoBadge,
  EmptyState,
  List,
  ListRow,
  PageHeader,
  PageLayout,
  SectionHeader,
  SkeletonRows,
  Stamp,
  Stat,
} from "../../lib/ui";
import { runAttacks, type AttackRun } from "./scenarios";

const time = (s: number) =>
  new Date(s * 1000).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

function AtaquesPage() {
  const [runs, setRuns] = useState<AttackRun[]>([]);
  const [busy, setBusy] = useState(false);
  const rejected = runs.filter((r) => !r.result.ok).length;

  async function start() {
    setBusy(true);
    const log: AttackLog[] = [];
    try {
      setRuns(
        await runAttacks({
          vibrate: (p) => navigator.vibrate?.(p) ?? false,
          logAttack: async (a) => void log.push(a),
        }),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageLayout recipe="list">
      <PageHeader
        title="Ataques en vivo"
        context="Cuatro intentos de fraude contra el verificador de la tienda, sin red."
        action={
          <Button onClick={start} disabled={busy}>
            {runs.length ? "Repetir ataques" : "Lanzar ataques"}
          </Button>
        }
      />
      <div className="mb-6 grid grid-cols-2 gap-4">
        <Stat label="Rechazados" value={rejected} tone="bad" />
        <Stat label="Aceptados" value={runs.length - rejected} tone="ok" />
      </div>
      <SectionHeader action={rejected === 4 ? <Stamp tone="bad">4 RECHAZADOS</Stamp> : undefined}>
        Registro de ataques
      </SectionHeader>
      {runs.length === 0 && busy && <SkeletonRows rows={5} label="Lanzando los ataques" />}
      {runs.length === 0 && !busy && (
        <EmptyState
          title="Todavía no hay ataques"
          action={
            <Button variant="ghost" onClick={start}>
              Lanzar ataques
            </Button>
          }
        >
          Aquí verás una grabación, una voz de IA, un pagaré a 2 km y un duplicado intentando cobrar, y por qué la tienda los rechaza.
        </EmptyState>
      )}
      {runs.length > 0 && (
        <List>
          {runs.map((r) => (
            <ListRow
              key={r.id}
              tone={r.result.ok ? "ok" : "bad"}
              title={r.title}
              detail={r.result.ok ? "Válido · la tienda vibra" : `${r.result.message} · sin vibración`}
              trailing={<span className="num text-sm text-ink-2">{time(r.at)}</span>}
            />
          ))}
        </List>
      )}
      <DemoBadge />
    </PageLayout>
  );
}

export const route: FeatureRoute = { path: "/ataques", element: <AtaquesPage />, label: "Ataques" };
