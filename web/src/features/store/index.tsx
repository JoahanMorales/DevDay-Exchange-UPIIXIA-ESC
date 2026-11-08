import { useEffect, useMemo, useState } from "react";
import { Backspace, DeviceMobileSlash, Storefront, Vibrate, Waveform } from "@phosphor-icons/react";
import { Amount, Button, Chip, DemoBadge, List, ListRow, PageHeader, PageLayout, SectionHeader, Stamp, Surface, TicketTear, formatMXN } from "../../lib/ui";
import type { AttackLog } from "../../lib/contract";
import { decodeIou, IOU_LEN, makeChallenge, toHex, type ChallengeFields } from "../../lib/protocol";
import { getEnrollment, getOrCreateKey, getRevocationList, getServerKey, openCoreDb, type Db, type Enrollment } from "../../lib/storage";
import { cacheServerKey, enrollMerchant } from "../core/enroll";
import { createQrTransport, encodeFrames } from "../../lib/transport/qr";
import { QrLoop, QrScanner, textQueue } from "../../lib/transport/qr/QrIo";
import { locate, unpackPayment } from "../pay/sign";
import { verifyPayment, REASON_TEXT, type VerifyResult } from "./verify";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "00", "0", "del"];
const MERCHANT_NAME = "Tienda Lupita";
type Stage = { kind: "keypad" } | { kind: "challenge"; frames: string[]; ch: ChallengeFields } | { kind: "result"; r: VerifyResult; who: string };

const kv = <T,>(db: Db, k: string) => db.get("kv", k) as Promise<T | undefined>;

async function logAttack(db: Db, a: AttackLog) {
  const all = (await kv<AttackLog[]>(db, "attacks")) ?? [];
  await db.put("kv", [a, ...all].slice(0, 50), "attacks");
}

function StorePage() {
  const [db, setDb] = useState<Db>();
  const [me, setMe] = useState<Enrollment>();
  const [cents, setCents] = useState(2500);
  const [stage, setStage] = useState<Stage>({ kind: "keypad" });
  const [attacks, setAttacks] = useState<AttackLog[]>([]);
  const [err, setErr] = useState("");
  const [showCounter, setShowCounter] = useState(false);

  useEffect(() => {
    openCoreDb().then(async (d) => {
      setDb(d);
      cacheServerKey(d).catch(() => {}); // online: refresh the server key used to check payer credentials offline
      setMe(await getEnrollment(d, "merchant"));
      setAttacks((await kv<AttackLog[]>(d, "attacks")) ?? []);
    });
  }, []);

  const press = (k: string) => setCents((c) => (k === "del" ? Math.floor(c / 10) : Number(`${c}${k}`) > 99999999 ? c : Number(`${c}${k}`)));

  async function charge() {
    if (!db) return;
    setErr("");
    try {
      const m = me ?? (await enrollMerchant(db, { name: MERCHANT_NAME, ...(await locate().then((p) => ({ lat: p.latE6 / 1e6, lon: p.lonE6 / 1e6 }))) }));
      setMe(m);
      const { privateKey } = await getOrCreateKey(db);
      const here = await locate();
      const ch: ChallengeFields = { ver: 1, merchantId: m.subject_id, nonce: crypto.getRandomValues(new Uint8Array(8)), ts: Math.floor(Date.now() / 1000), latE6: here.latE6, lonE6: here.lonE6, amountCents: cents };
      const signed = await makeChallenge(privateKey, ch);
      setStage({ kind: "challenge", frames: encodeFrames(signed), ch });
    } catch (e) {
      setErr(`No se pudo crear el reto: ${(e as Error).message}`);
    }
  }

  const queue = useMemo(textQueue, [stage.kind === "challenge" ? stage.ch : null]);
  useEffect(() => {
    if (stage.kind !== "challenge" || !db) return;
    let live = true;
    const ch = stage.ch;
    (async () => {
      for await (const bytes of createQrTransport({ show: () => {}, scan: () => queue.iter() }).receive()) {
        if (!live) return;
        const p = unpackPayment(bytes);
        if (!p) continue;
        const payerId = decodeIou(p.iou.slice(0, IOU_LEN)).payerId;
        const used = (await kv<string[]>(db, "used_nonces")) ?? [];
        const rl = await getRevocationList(db);
        const r = await verifyPayment(p.iou, p.card.credential, {
          now: Math.floor(Date.now() / 1000), challenge: ch, usedNonces: new Set(used),
          lastCounter: await kv<number>(db, `counter:${payerId}`),
          serverPubkey: await getServerKey(db), caps: rl?.caps, revoked: new Set(rl?.revoked ?? []),
        }, { vibrate: (pat) => navigator.vibrate?.(pat) ?? false, logAttack: (a) => logAttack(db, a) });
        if (r.ok) {
          const iou = decodeIou(p.iou.slice(0, IOU_LEN));
          await db.put("kv", [...used, toHex(iou.nonce)], "used_nonces");
          await db.put("kv", iou.counter, `counter:${payerId}`);
          const ious = (await kv<string[]>(db, "ious")) ?? [];
          await db.put("kv", [...ious, toHex(p.iou)], "ious");
        }
        setAttacks((await kv<AttackLog[]>(db, "attacks")) ?? []);
        setStage({ kind: "result", r, who: `${p.card.name} ···${p.card.phone_tail}` });
        return;
      }
    })();
    return () => { live = false; };
  }, [stage, db, queue]);

  const rejected = (
    <>
      <SectionHeader>Intentos rechazados</SectionHeader>
      {attacks.length ? (
        <List>{attacks.slice(0, 6).map((a) => <ListRow key={a.ts + a.detail} tone="bad" title={REASON_TEXT[a.detail as keyof typeof REASON_TEXT] ?? a.detail} detail={a.kind} />)}</List>
      ) : <p className="text-ink-2">Ninguno todavía.</p>}
    </>
  );

  if (stage.kind === "result") {
    const { r } = stage;
    return (
      <PageLayout recipe="result" aside={<>{rejected}{!r.ok && (
        <p className="mt-3.5 flex items-center gap-2.5 rounded-md bg-bad-soft px-4 py-3.5 font-bold text-bad"><DeviceMobileSlash size={22} weight="bold" /> El celular de la tienda no vibró</p>)}</>}>
        <SectionHeader>{me ? MERCHANT_NAME : ""} · pagaré recibido sin red</SectionHeader>
        <Surface className="flex flex-col justify-between md:min-h-[52vh]">
          <div className="absolute top-5 right-5 md:top-7 md:right-7"><Stamp tone={r.ok ? "ok" : "bad"}>{r.ok ? "VÁLIDO" : "RECHAZADO"}</Stamp></div>
          {r.ok ? (
            <>
              <p className="pr-32 text-ink-2 md:pr-40">Pagaré válido · {stage.who} firmó por</p>
              <div className="mt-2 mb-1.5"><Amount cents={r.amountCents} size="lg" /></div>
              <TicketTear />
              <div className="flex flex-wrap gap-2.5">
                <Chip tone="ok"><Vibrate size={18} weight="bold" /> Firma verificada · vibró</Chip>
                <Chip>Pagaré #{r.counter}</Chip><Chip>Por QR</Chip>
              </div>
            </>
          ) : (
            <>
              <p className="pr-32 text-ink-2 md:pr-40">{stage.who}</p>
              <p role="alert" className="display mt-4 text-2xl font-extrabold text-bad">{r.message}</p>
            </>
          )}
        </Surface>
        <Button size="lg" className="mt-4 w-full" onClick={() => setStage({ kind: "keypad" })}>Nuevo cobro</Button>
      </PageLayout>
    );
  }

  if (stage.kind === "challenge") {
    return (
      <PageLayout recipe="flow" aside={<>
        <SectionHeader>2 · Escanea el pagaré del cliente</SectionHeader>
        <QrScanner onText={queue.push} />
        <Button variant="ghost" className="mt-3 w-full" onClick={() => setStage({ kind: "keypad" })}>Cancelar</Button>
      </>}>
        <PageHeader title="Cobrar sin red" context={`${MERCHANT_NAME} · ${formatMXN(stage.ch.amountCents)}`} />
        <Surface>
          <p className="mb-3 text-ink-2">1 · El cliente escanea este reto (vence en 30 s)</p>
          <QrLoop frames={stage.frames} label="Reto de cobro" />
          <div className="mt-3"><Amount cents={stage.ch.amountCents} size="md" /></div>
        </Surface>
      </PageLayout>
    );
  }

  return (
    <PageLayout recipe="flow" aside={<>
      <div className="grid grid-cols-3 gap-2.5">
        {KEYS.map((k) => (
          <button key={k} onClick={() => press(k)} aria-label={k === "del" ? "Borrar" : k}
            className="num grid h-16 place-items-center rounded-md border border-line bg-surface text-xl active:bg-muted md:h-14">
            {k === "del" ? <Backspace size={30} /> : k}
          </button>
        ))}
      </div>
      <Button size="lg" className="mt-4 w-full shadow-card" disabled={cents === 0 || !db} onClick={charge}>
        <Waveform size={28} weight="bold" /> Cobrar sin red
      </Button>
      <p className="mt-3 text-center text-sm text-ink-2">El cliente escanea el reto con su celular. Sin red.</p>
      {err && <p role="alert" className="mt-3 font-bold text-bad">{err}</p>}
      <Button variant="ghost" className="mt-2 w-full" onClick={() => setShowCounter((s) => !s)} disabled={!me}>
        <Storefront size={20} /> QR del mostrador
      </Button>
      {showCounter && me && <QrLoop frames={[JSON.stringify({ merchant_id: me.subject_id, name: MERCHANT_NAME, credential: me.credential })]} label="QR del mostrador" />}
      <div className="h-28 md:hidden" aria-hidden />
    </>}>
      <PageHeader title="Cobrar sin red" context={MERCHANT_NAME} />
      <Surface className="flex flex-col justify-center md:min-h-[46vh]">
        <p className="text-ink-2">Monto a cobrar</p>
        <div aria-live="polite" aria-label={formatMXN(cents)}><Amount cents={cents} size="lg" /></div>
      </Surface>
      <DemoBadge />
    </PageLayout>
  );
}

export const route = { path: "/tienda", label: "Cobrar", element: <StorePage /> };
