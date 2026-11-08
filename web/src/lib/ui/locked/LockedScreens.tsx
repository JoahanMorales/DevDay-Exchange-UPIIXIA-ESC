// The three locked screens (HACK-008). Every later screen copies the one with its recipe (web/DESIGN.md).
// Numbers come from public/design-lock/fixture.json (demo_data, IDEA §4), never typed here.
import { useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import {
  ArrowsLeftRight,
  Backspace,
  DeviceMobileSlash,
  Receipt,
  ShieldCheck,
  Storefront,
  Vibrate,
  Waveform,
} from "@phosphor-icons/react";
import fixture from "./fixture.json";
import { AppShell, PageHeader, PageLayout, type NavItem } from "../Shell";
import {
  Amount,
  Button,
  Chip,
  DemoBadge,
  Legend,
  List,
  ListRow,
  SectionHeader,
  Stamp,
  Stat,
  Surface,
  TicketTear,
  type Tone,
} from "../kit";
import { formatMXN } from "../format";

const nav: NavItem[] = [
  {
    to: "/design-lock/cobrar",
    label: "Cobrar",
    icon: <Storefront size={22} />,
  },
  {
    to: "/design-lock/verificar",
    label: "Verificar",
    icon: <ShieldCheck size={22} />,
  },
  { to: "/design-lock/deudas", label: "Deudas", icon: <Receipt size={22} /> },
  {
    to: "/design-lock/relevo",
    label: "Relevo",
    icon: <ArrowsLeftRight size={22} />,
  },
];

function Verificar() {
  const v = fixture.valid;
  return (
    <PageLayout
      recipe="result"
      aside={
        <>
          <SectionHeader>Intentos rechazados</SectionHeader>
          <List>
            {fixture.rejected.map((r) => (
              <ListRow
                key={r.reason}
                tone="bad"
                title={r.reason}
                detail={r.attack}
              />
            ))}
          </List>
          <p className="mt-3.5 flex items-center gap-2.5 rounded-md bg-bad-soft px-4 py-3.5 font-bold text-bad">
            <DeviceMobileSlash size={22} weight="bold" /> El celular de la
            tienda no vibró
          </p>
        </>
      }
    >
      <SectionHeader>
        {fixture.merchant.name} · pagaré recibido sin red
      </SectionHeader>
      <Surface className="flex flex-col justify-between md:min-h-[62vh]">
        <div className="absolute top-5 right-5 md:top-7 md:right-7">
          <Stamp tone="ok">VÁLIDO</Stamp>
        </div>
        <p className="pr-32 text-ink-2 md:pr-40">
          {v.payer} ···{v.phone_tail} firmó por
        </p>
        <div className="mt-2 mb-1.5">
          <Amount cents={v.amount_cents} size="lg" />
        </div>
        <TicketTear />
        <div className="flex flex-wrap gap-2.5">
          <Chip tone="ok">
            <Vibrate size={18} weight="bold" /> Firma verificada · vibró
          </Chip>
          <Chip>Pagaré #{v.counter}</Chip>
          <Chip>Por {v.channel}</Chip>
          <Chip>MXN</Chip>
        </div>
      </Surface>
      <DemoBadge />
    </PageLayout>
  );
}

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "00", "0", "del"];

function Cobrar() {
  const [cents, setCents] = useState(fixture.valid.amount_cents);
  const press = (k: string) =>
    setCents((c) => {
      if (k === "del") return Math.floor(c / 10);
      const next = Number(`${c}${k}`);
      return next > 99999999 ? c : next;
    });
  return (
    <PageLayout
      recipe="flow"
      aside={
        <>
          <div className="grid grid-cols-3 gap-2.5">
            {KEYS.map((k) => (
              <button
                key={k}
                onClick={() => press(k)}
                aria-label={k === "del" ? "Borrar" : k}
                className="num grid h-16 place-items-center rounded-md border border-line bg-surface text-xl active:bg-muted md:h-14"
              >
                {k === "del" ? <Backspace size={30} /> : k}
              </button>
            ))}
          </div>
          <Button size="lg" className="sticky bottom-24 mt-4 w-full shadow-card md:static" disabled={cents === 0}>
            <Waveform size={28} weight="bold" /> Cobrar sin red
          </Button>
          <p className="mt-3 text-center text-sm text-ink-2">
            El cliente acerca su celular o su pulsera.
          </p>
        </>
      }
    >
      <PageHeader
        title="Cobrar sin red"
        context={`${fixture.merchant.name} · ${fixture.merchant.place}`}
      />
      <Surface className="flex flex-col justify-center md:min-h-[46vh]">
        <p className="text-ink-2">Monto a cobrar</p>
        <div aria-live="polite" aria-label={formatMXN(cents)}>
          <Amount cents={cents} size="lg" />
        </div>
      </Surface>
      <DemoBadge />
    </PageLayout>
  );
}

const stateCopy: Record<string, { tone: Tone; label: string }> = {
  cobrado: { tone: "ok", label: "Cobrado por CoDi" },
  enviado: { tone: "warn", label: "Cobro enviado · esperando" },
  pendiente: { tone: "neutral", label: "Pendiente · sin red" },
};

function Deudas() {
  const debts = fixture.debts;
  const total = debts.reduce((s, d) => s + d.amount_cents, 0);
  const paid = debts
    .filter((d) => d.state === "cobrado")
    .reduce((s, d) => s + d.amount_cents, 0);
  return (
    <PageLayout recipe="list">
      <PageHeader title="Deudas de la tienda" context={fixture.merchant.name} />
      <div className="mb-6 grid grid-cols-3 gap-3">
        <Stat label="Pagarés" value={debts.length} />
        <Stat label="Por cobrar" value={formatMXN(total - paid)} tone="warn" />
        <Stat label="Cobrado por CoDi" value={formatMXN(paid)} tone="ok" />
      </div>
      <SectionHeader action={<Legend items={Object.values(stateCopy)} />}>
        Pagarés
      </SectionHeader>
      <List>
        {debts.map((d) => {
          const s = stateCopy[d.state];
          return (
            <ListRow
              key={d.counter + d.payer}
              tone={s.tone}
              title={`${d.payer} · #${d.counter}`}
              detail={d.trace ? `${s.label} · rastreo …${d.trace.slice(-4)}` : s.label}
              trailing={
                <span className="num text-xl">{formatMXN(d.amount_cents)}</span>
              }
            />
          );
        })}
      </List>
      <DemoBadge />
    </PageLayout>
  );
}

const screens: Record<string, () => React.JSX.Element> = {
  verificar: Verificar,
  cobrar: Cobrar,
  deudas: Deudas,
};

export function LockedScreen() {
  const { screen = "verificar" } = useParams();
  const Screen = screens[screen];
  if (!Screen) return <Navigate to="/design-lock/verificar" replace />;
  return (
    <AppShell nav={nav} online={false}>
      <Screen />
    </AppShell>
  );
}
