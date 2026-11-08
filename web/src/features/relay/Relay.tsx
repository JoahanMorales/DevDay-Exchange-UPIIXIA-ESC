import { useEffect, useState } from "react";
import QRCode from "qrcode";
import type { Envelope } from "../../lib/contract";
import {
  Button,
  DemoBadge,
  List,
  ListRow,
  PageHeader,
  PageLayout,
  SectionHeader,
  Surface,
} from "../../lib/ui";
import type { UploadResult } from "./relay";

export type UploadState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "done"; result: UploadResult };

const dayLabel = (e: Envelope, now: number) => {
  const left = Math.max(0, e.created_at + e.ttl_s - now);
  const days = Math.floor(left / 86400);
  return days >= 1 ? `vence en ${days} d` : `vence en ${Math.max(1, Math.floor(left / 3600))} h`;
};

/** Cycles one sealed envelope per second as a QR (the animated hand-off). */
function QrLoop({ payloads }: { payloads: string[] }) {
  const [i, setI] = useState(0);
  const [src, setSrc] = useState("");
  useEffect(() => {
    if (payloads.length < 2) return;
    const t = setInterval(() => setI((n) => (n + 1) % payloads.length), 1000);
    return () => clearInterval(t);
  }, [payloads.length]);
  const current = payloads[i % Math.max(1, payloads.length)];
  useEffect(() => {
    let live = true;
    QRCode.toDataURL(current, { margin: 1, width: 320, errorCorrectionLevel: "L" }).then((u) => live && setSrc(u));
    return () => { live = false; };
  }, [current]);
  return (
    <div className="flex flex-col items-center gap-3">
      {src ? (
        <img src={src} width={320} height={320} alt={`QR del pagarés cifrado ${i + 1} de ${payloads.length}`} className="rounded-md bg-white p-2" />
      ) : (
        <div className="h-80 w-80 rounded-md bg-line" aria-hidden />
      )}
      <p className="text-lg font-bold" aria-live="polite">{`Pagaré cifrado ${(i % payloads.length) + 1} de ${payloads.length}`}</p>
    </div>
  );
}

export function Relay({
  queue,
  online,
  upload,
  now,
  onUpload,
  handoffPayloads,
  scanner,
}: {
  queue: Envelope[];
  online: boolean;
  upload: UploadState;
  now: number;
  onUpload: () => void;
  /** JSON of each envelope with hops+1, ready to show as QR. */
  handoffPayloads: string[];
  scanner?: React.ReactNode;
}) {
  const [showQr, setShowQr] = useState(false);
  const n = queue.length;
  const maxHops = queue.reduce((m, e) => Math.max(m, e.hops), 0);
  return (
    <PageLayout recipe="list">
      <PageHeader title="Relevo" context="Llevas pagarés de otras personas, cifrados: no puedes leerlos ni cambiarlos" />
      <div className="mb-6 rounded-lg bg-surface px-6 py-5 shadow-card">
        <div className="text-base text-ink-2">pagarés cifrados para entregar</div>
        <div className={`display text-3xl font-black leading-none ${n ? "text-warn" : "text-ink"}`}>{n}</div>
        <p className="mt-2 text-lg font-bold" aria-live="polite">
          {n === 0 ? "No llevas pagarés" : `Llevas ${n} ${n === 1 ? "pagaré cifrado" : "pagarés cifrados"} para entregar`}
        </p>
        <p className="mt-1 text-base text-ink-2">{`Saltos del más lejano: ${maxHops}`}</p>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <Button size="lg" onClick={() => setShowQr((v) => !v)} disabled={n === 0} aria-pressed={showQr}>
          {showQr ? "Ocultar QR" : "Entregar por QR"}
        </Button>
        <Button size="lg" variant="ghost" onClick={onUpload} disabled={!online || n === 0 || upload.kind === "loading"}>
          {upload.kind === "loading" ? "Subiendo…" : "Subir al servidor"}
        </Button>
      </div>
      {!online && n > 0 && (
        <p className="mb-4 text-base text-ink-2">Sin red: entrégalos a otro celular; el primero que tenga señal los sube.</p>
      )}

      {showQr && n > 0 && (
        <Surface className="mb-6 flex justify-center p-5">
          <QrLoop payloads={handoffPayloads} />
        </Surface>
      )}

      {upload.kind === "error" && (
        <p role="alert" className="mb-4 rounded-md border border-bad p-3 text-base text-bad">
          {`No se pudo subir (${upload.message}). Tus pagarés siguen guardados; reintenta con red.`}
        </p>
      )}
      {upload.kind === "done" && (
        <p role="status" className="num mb-4 text-lg text-ok">
          {`${upload.result.accepted} recibidos · ${upload.result.duplicates} duplicados · ${upload.result.rejected.length} rechazados`}
        </p>
      )}

      <SectionHeader>En tu celular</SectionHeader>
      {n === 0 ? (
        <Surface className="p-5 text-base text-ink-2">
          Aquí aparecen los pagarés que recibas de una tienda o de otro celular. Se guardan 7 días.
        </Surface>
      ) : (
        <List>
          {queue.map((e, i) => (
            <ListRow
              key={e.envelope_id}
              tone="warn"
              title={`Pagaré cifrado #${i + 1}`}
              detail={`${e.hops} ${e.hops === 1 ? "salto" : "saltos"} · ${dayLabel(e, now)}`}
            />
          ))}
        </List>
      )}
      {scanner}
      <DemoBadge>Pagarés de prueba · personas ficticias</DemoBadge>
    </PageLayout>
  );
}
