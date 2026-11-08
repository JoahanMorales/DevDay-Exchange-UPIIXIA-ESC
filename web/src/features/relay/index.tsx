import { useCallback, useEffect, useMemo, useState } from "react";
import type { FeatureRoute } from "../../App";
import { api } from "../../lib/api";
import type { Envelope, SyncRequest, SyncResponse } from "../../lib/contract";
import { openCoreDb, type Db } from "../../lib/storage";
import { useOnline } from "../../lib/ui";
import { Relay, type UploadState } from "./Relay";
import { Scanner } from "./Scanner";
import { addToQueue, DEFAULT_RELAY, forwardCopy, loadQueue, saveQueue, uploadQueue } from "./relay";

const isEnvelope = (x: unknown): x is Envelope => {
  const e = x as Envelope;
  return !!e && typeof e.envelope_id === "string" && /^[0-9a-f]{64}$/.test(e.envelope_id)
    && typeof e.epk === "string" && typeof e.iv === "string" && typeof e.ciphertext === "string"
    && Number.isInteger(e.hops) && Number.isInteger(e.created_at) && Number.isInteger(e.ttl_s);
};

function RelevoPage() {
  const online = useOnline();
  const [db, setDb] = useState<Db | null>(null);
  const [queue, setQueue] = useState<Envelope[]>([]);
  const [upload, setUpload] = useState<UploadState>({ kind: "idle" });
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));

  useEffect(() => {
    openCoreDb().then(async (d) => { setDb(d); setQueue(await loadQueue(d)); });
  }, []);

  const onText = useCallback(async (text: string) => {
    if (!db) return;
    try {
      const e = JSON.parse(text) as unknown;
      if (!isEnvelope(e)) return;
      const t = Math.floor(Date.now() / 1000);
      const next = addToQueue(await loadQueue(db), e, t, DEFAULT_RELAY);
      await saveQueue(db, next);
      setQueue(next);
      setNow(t);
    } catch { /* not one of ours: ignore */ }
  }, [db]);

  const onUpload = async () => {
    if (!db) return;
    setUpload({ kind: "loading" });
    try {
      const t = Math.floor(Date.now() / 1000);
      const result = await uploadQueue(db, (body: SyncRequest) => api<SyncResponse>("/sync", { method: "POST", body: JSON.stringify(body) }), t);
      setQueue(await loadQueue(db));
      setUpload({ kind: "done", result });
    } catch (e) {
      setUpload({ kind: "error", message: e instanceof Error ? e.message : "sin conexión" });
    }
  };

  const handoff = useMemo(() => queue.map((e) => JSON.stringify(forwardCopy(e))), [queue]);
  return <Relay queue={queue} online={online} upload={upload} now={now} onUpload={onUpload} handoffPayloads={handoff} scanner={<Scanner onText={onText} />} />;
}

export const route: FeatureRoute = { path: "/relevo", element: <RelevoPage />, label: "Relevo" };
