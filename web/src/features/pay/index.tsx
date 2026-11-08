import { useEffect, useMemo, useState } from "react";
import { CheckCircle, PenNib } from "@phosphor-icons/react";
import { Amount, Button, DemoBadge, PageHeader, PageLayout, SectionHeader, Surface, formatMXN } from "../../lib/ui";
import { CHALLENGE_LEN, decodeChallenge, signIou, type ChallengeFields } from "../../lib/protocol";
import { getEnrollment, getMerchant, getOrCreateKey, nextCounter, openCoreDb, type Db, type Enrollment, type MerchantEntry } from "../../lib/storage";
import { cacheMerchantFromQr, enrollPayer } from "../core/enroll";
import { createQrTransport, encodeFrames } from "../../lib/transport/qr";
import { QrLoop, QrScanner, textQueue } from "../../lib/transport/qr/QrIo";
import { locate, packPayment, preparePayment } from "./sign";

type Stage =
  | { kind: "scan" }
  | { kind: "confirm"; ch: ChallengeFields; merchant: MerchantEntry; here: { latE6: number; lonE6: number } }
  | { kind: "done"; frames: string[]; cents: number; merchant: string };

const today = () => new Date().toISOString().slice(0, 10);
const spentKey = () => `spent:${today()}`;

function PayPage() {
  const [db, setDb] = useState<Db>();
  const [me, setMe] = useState<Enrollment>();
  const [stage, setStage] = useState<Stage>({ kind: "scan" });
  const [msg, setMsg] = useState("");
  useEffect(() => { openCoreDb().then(async (d) => { setDb(d); setMe(await getEnrollment(d, "payer")); }); }, []);

  const queue = useMemo(textQueue, [stage.kind]);
  useEffect(() => {
    if (stage.kind !== "scan" || !db || !me) return;
    let live = true;
    (async () => {
      const scan = async function* () {
        for await (const t of queue.iter()) {
          if (t.startsWith("{")) {
            try { const m = await cacheMerchantFromQr(db, t); setMsg(`Tienda guardada: ${m.name}. Ahora escanea el reto.`); }
            catch { setMsg("QR de tienda inválido"); }
          } else yield t;
        }
      };
      for await (const signed of createQrTransport({ show: () => {}, scan }).receive()) {
        if (!live || signed.length < CHALLENGE_LEN) continue;
        const merchant = await getMerchant(db, decodeChallenge(signed.slice(0, CHALLENGE_LEN)).merchantId);
        if (!merchant) { setMsg("Tienda desconocida: escanea primero su QR del mostrador."); continue; }
        const here = await locate();
        const spent = ((await db.get("kv", spentKey())) as number | undefined) ?? 0;
        const r = await preparePayment(signed, {
          merchantPubkey: merchant.credential.pubkey_jwk, now: Math.floor(Date.now() / 1000), here,
          remainingCapCents: me.credential.daily_cap_cents - spent, credentialValidUntil: me.credential.valid_until,
        });
        if (!r.ok) { setMsg(r.message); continue; }
        setMsg("");
        setStage({ kind: "confirm", ch: r.challenge, merchant, here });
        return;
      }
    })();
    return () => { live = false; };
  }, [stage.kind, db, me, queue]);

  async function sign() {
    if (stage.kind !== "confirm" || !db || !me) return;
    const { ch, merchant, here } = stage;
    if (Math.floor(Date.now() / 1000) - ch.ts > 30) { setMsg("El reto venció (30 s): pide uno nuevo"); setStage({ kind: "scan" }); return; }
    const { privateKey } = await getOrCreateKey(db);
    const iou = await signIou(privateKey, {
      ver: 1, payerId: me.subject_id, merchantId: ch.merchantId, amountCents: ch.amountCents,
      counter: await nextCounter(db), ts: Math.floor(Date.now() / 1000), nonce: ch.nonce, latE6: here.latE6, lonE6: here.lonE6,
    });
    const spent = ((await db.get("kv", spentKey())) as number | undefined) ?? 0;
    await db.put("kv", spent + ch.amountCents, spentKey());
    const name = (await db.get("kv", "payer_name")) as string | undefined;
    const tail = ((await db.get("kv", "payer_phone")) as string | undefined)?.slice(-4) ?? "····";
    const bytes = packPayment(iou, { credential: me.credential, name: name ?? "Cliente", phone_tail: tail });
    let frames: string[] = [];
    await createQrTransport({ show: (f) => { frames = f; }, scan: async function* () {} }, 90).send(bytes);
    setStage({ kind: "done", frames: frames.length ? frames : encodeFrames(bytes, 90), cents: ch.amountCents, merchant: merchant.name });
  }

  async function activate() {
    if (!db) return;
    const display_name = "Mario", phone = "5512344321"; // demo_data: the payer of IDEA §4
    await db.put("kv", display_name, "payer_name");
    await db.put("kv", phone, "payer_phone");
    try { setMe(await enrollPayer(db, { display_name, phone })); } catch (e) { setMsg((e as Error).message); }
  }

  if (!me) {
    return (
      <PageLayout recipe="flow" aside={<Button size="lg" className="w-full" onClick={activate} disabled={!db}>Activar este celular</Button>}>
        <PageHeader title="Pagar sin red" context="Primero activa tu llave en este celular (con red)" />
        {msg && <p role="alert" className="font-bold text-bad">{msg}</p>}
      </PageLayout>
    );
  }

  if (stage.kind === "confirm") {
    return (
      <PageLayout recipe="flow" aside={<>
        <Button size="lg" className="w-full" onClick={sign}><PenNib size={26} weight="bold" /> Firmar pagaré</Button>
        <Button variant="ghost" className="mt-2 w-full" onClick={() => setStage({ kind: "scan" })}>Cancelar</Button>
        {msg && <p role="alert" className="mt-3 font-bold text-bad">{msg}</p>}
      </>}>
        <PageHeader title="Confirmar pago" context={`a ${stage.merchant.name}`} />
        <Surface className="flex flex-col justify-center md:min-h-[46vh]">
          <p className="text-ink-2">Vas a firmar un pagaré por</p>
          <div aria-label={formatMXN(stage.ch.amountCents)}><Amount cents={stage.ch.amountCents} size="lg" /></div>
          <p className="mt-2 text-lg font-bold">a {stage.merchant.name}</p>
        </Surface>
        {me.demo_data && <DemoBadge />}
      </PageLayout>
    );
  }

  if (stage.kind === "done") {
    return (
      <PageLayout recipe="flow" aside={<>
        <SectionHeader>Muestra este código a la tienda</SectionHeader>
        <QrLoop frames={stage.frames} label="Pagaré firmado" />
        <Button variant="ghost" className="mt-3 w-full" onClick={() => setStage({ kind: "scan" })}>Listo</Button>
      </>}>
        <PageHeader title="Pagaré firmado" context="sin red" />
        <Surface className="flex flex-col justify-center md:min-h-[46vh]">
          <p className="flex items-center gap-2 font-bold text-ok"><CheckCircle size={24} weight="bold" /> Firmaste un pagaré por</p>
          <Amount cents={stage.cents} size="lg" />
          <p className="mt-2 text-lg font-bold">a {stage.merchant}</p>
        </Surface>
      </PageLayout>
    );
  }

  return (
    <PageLayout recipe="flow" aside={<>
      <SectionHeader>Escanea el reto de la tienda</SectionHeader>
      <QrScanner onText={queue.push} />
      {msg && <p role="status" className="mt-3 font-bold">{msg}</p>}
    </>}>
      <PageHeader title="Pagar sin red" context="Acerca tu cámara al código de la tienda" />
      <Surface className="flex flex-col justify-center md:min-h-[46vh]">
        <p className="text-ink-2">Tope disponible hoy</p>
        <Amount cents={me.credential.daily_cap_cents} size="lg" />
      </Surface>
      {me.demo_data && <DemoBadge />}
    </PageLayout>
  );
}

export const route = { path: "/pagar", label: "Pagar", element: <PayPage /> };
