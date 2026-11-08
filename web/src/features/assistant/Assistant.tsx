import { useState } from "react";
import { Button, Chip, DemoBadge, PageHeader, PageLayout, SectionHeader, Surface } from "../../lib/ui";
import { sourceLabel, toolLabel, type AssistantAnswer } from "./ask";

export type AskState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "done"; question: string; answer: AssistantAnswer };

const SUGGESTIONS = ["¿Quién me debe?", "¿Por qué se rechazó el último pagaré?", "Recordatorio para el primer deudor"];

export function Assistant({
  online,
  state,
  onAsk,
  merchantName,
}: {
  online: boolean;
  state: AskState;
  onAsk: (question: string) => void;
  merchantName?: string;
}) {
  const [q, setQ] = useState("");
  const busy = state.kind === "loading";
  const submit = (text: string) => {
    if (online && !busy && text.trim()) onAsk(text);
  };

  const aside = (
    <Surface size="sm">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(q);
        }}
      >
        <label htmlFor="pregunta" className="mb-2 block text-base font-bold">
          Tu pregunta
        </label>
        <textarea
          id="pregunta"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          rows={3}
          maxLength={500}
          disabled={!online}
          placeholder="Ej. ¿Quién me debe?"
          className="mb-3 w-full rounded-md border border-line bg-bg p-3 text-lg"
        />
        <Button size="lg" type="submit" disabled={!online || busy || !q.trim()} className="w-full">
          {busy ? "Consultando…" : "Preguntar"}
        </Button>
      </form>
      {!online && (
        <p role="status" className="mt-3 text-base text-ink-2">
          El asistente solo funciona con red. Sin señal sigues cobrando con pagarés firmados.
        </p>
      )}
      <div className="mt-5">
        <SectionHeader>Prueba con</SectionHeader>
      </div>
      <div className="flex flex-col gap-2">
        {SUGGESTIONS.map((s) => (
          <Button
            key={s}
            variant="ghost"
            disabled={!online || busy}
            onClick={() => {
              setQ(s);
              submit(s);
            }}
          >
            {s}
          </Button>
        ))}
      </div>
    </Surface>
  );

  return (
    <PageLayout recipe="result" aside={aside}>
      <PageHeader title="Asistente" context={merchantName ? `Para ${merchantName} · solo consulta` : "Solo consulta: no cobra ni cambia nada"} />
      <Surface className="md:min-h-80">
        <div aria-live="polite">
          {state.kind === "idle" && (
            <p className="text-lg text-ink-2">Pregúntame quién te debe, por qué se rechazó un pagaré o pídeme un recordatorio. Respondo con tus registros.</p>
          )}
          {state.kind === "loading" && <p className="text-lg text-ink-2">Consultando tus registros…</p>}
          {state.kind === "error" && (
            <p role="alert" className="text-lg text-bad">
              {`No pude responder: ${state.message} Tus pagarés y cobros no se ven afectados.`}
            </p>
          )}
          {state.kind === "done" && (
            <>
              <p className="mb-3 text-base text-ink-2">{state.question}</p>
              <p className="text-2xl font-bold" data-testid="respuesta">
                {state.answer.texto}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Chip tone={state.answer.fuente === "openai" ? "ok" : "neutral"}>{sourceLabel(state.answer.fuente)}</Chip>
                {state.answer.herramientas.map((h) => (
                  <Chip key={h} size="sm">{`Consultó: ${toolLabel[h] ?? h}`}</Chip>
                ))}
              </div>
            </>
          )}
        </div>
      </Surface>
      <DemoBadge>Registros de prueba · personas ficticias</DemoBadge>
    </PageLayout>
  );
}
