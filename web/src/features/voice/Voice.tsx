import { Amount, Button, Chip, DemoBadge, PageHeader, PageLayout, SectionHeader, Surface, formatMXN } from "../../lib/ui";
import type { Proposal, VoiceState } from "./proposal";

export type MicState = "off" | "starting" | "listening" | "error";

const label = (p: Proposal) => (p.kind === "monto" ? `Monto: ${formatMXN(p.centavos)}` : `Paga: ${p.etiqueta}`);

export function Voice({
  online,
  state,
  mic,
  error,
  onStart,
  onStop,
  onConfirm,
  onDiscard,
}: {
  online: boolean;
  state: VoiceState;
  mic: MicState;
  error?: string;
  onStart: () => void;
  onStop: () => void;
  onConfirm: (p: Proposal) => void;
  onDiscard: (p: Proposal) => void;
}) {
  const ready = state.amountCents !== null;
  const cobrar = `/tienda${ready ? `?monto=${state.amountCents}` : ""}`;

  const aside = (
    <Surface size="sm">
      {online ? (
        <>
          {mic === "listening" ? (
            <Button size="lg" variant="secondary" className="w-full" onClick={onStop}>
              Dejar de escuchar
            </Button>
          ) : (
            <Button size="lg" className="w-full" disabled={mic === "starting"} onClick={onStart}>
              {mic === "starting" ? "Conectando…" : "Dictar el cobro"}
            </Button>
          )}
          <p className="mt-2 text-base text-ink-2">Di por ejemplo: «Don Mario, veinticinco pesos». Yo solo lo propongo; tú lo confirmas.</p>
          {error && (
            <p role="alert" className="mt-2 text-base text-bad">
              {error}
            </p>
          )}
        </>
      ) : (
        <p role="status" className="text-lg">
          La voz solo funciona con red. Sin señal usa el teclado: el cobro sigue igual.
        </p>
      )}
      <div className="mt-5">
        <SectionHeader>Propuestas</SectionHeader>
      </div>
      {state.pending.length === 0 ? (
        <p className="text-base text-ink-2">Aquí aparece lo que entendí, para que lo confirmes.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {state.pending.map((p) => (
            <li key={p.kind} className="flex items-center gap-2 rounded-md border border-line p-3">
              <span className="flex-1 text-lg font-bold">{label(p)}</span>
              <Button size="sm" onClick={() => onConfirm(p)} aria-label={`Usar ${label(p)}`}>
                Usar
              </Button>
              <Button size="sm" variant="ghost" onClick={() => onDiscard(p)} aria-label={`Descartar ${label(p)}`}>
                No
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Surface>
  );

  return (
    <PageLayout recipe="flow" aside={aside}>
      <PageHeader title="Cobrar por voz" context="La IA propone, tú confirmas · no cobra ni firma nada" />
      <Surface>
        <p className="mb-2 text-base text-ink-2">Monto confirmado</p>
        <div data-testid="monto">{ready ? <Amount cents={state.amountCents!} size="lg" /> : <span className="num text-3xl text-muted-ink">$ —</span>}</div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Chip tone={state.payer ? "ok" : "neutral"}>{state.payer ? `Paga: ${state.payer}` : "Sin pagador todavía"}</Chip>
        </div>
        <a
          href={cobrar}
          className="mt-6 inline-flex h-16 w-full items-center justify-center rounded-md bg-ink px-6 text-lg font-bold text-surface"
        >
          {ready ? "Seguir en el teclado con este monto" : "Ir al teclado"}
        </a>
      </Surface>
      <DemoBadge>Demo · personas ficticias</DemoBadge>
    </PageLayout>
  );
}
