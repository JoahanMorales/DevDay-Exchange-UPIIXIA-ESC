import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import { cash, codiPaid, codiPaidShare, codiValidated, type Fact } from "./facts";
import ataques from "./shots/ataques.jpg";
import cobrar from "./shots/cobrar.jpg";
import pagar from "./shots/pagar.jpg";
import tablero from "./shots/tablero.jpg";

const actionBase =
  "inline-flex items-center justify-center gap-2 rounded-md font-bold transition-transform active:scale-[0.98] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ink";

function ActionLink({ to, children, quiet = false }: { to: string; children: ReactNode; quiet?: boolean }) {
  return (
    <Link
      to={to}
      className={`${actionBase} ${quiet ? "h-12 border border-line px-5 text-base text-ink hover:bg-surface" : "h-14 bg-accent px-6 text-lg text-accent-ink"}`}
    >
      {children}
    </Link>
  );
}

function SourceLink({ fact }: { fact: Fact }) {
  return (
    <a className="text-sm text-ink-2 underline underline-offset-2" href={fact.source} target="_blank" rel="noreferrer">
      Fuente: {fact.sourceName}
    </a>
  );
}

function Shot({ src, alt, w, h }: { src: string; alt: string; w: number; h: number }) {
  return (
    <img
      src={src}
      alt={alt}
      width={w}
      height={h}
      loading="lazy"
      decoding="async"
      className="h-auto w-full rounded-lg border border-line shadow-card"
    />
  );
}

const steps = [
  {
    to: "/tienda",
    go: "Abrir la tienda",
    title: "Lupita teclea $25.00 y toca Cobrar sin red",
    body: "La tienda emite un reto de un solo uso por sonido o QR. No necesita señal ni terminal.",
    shot: { src: cobrar, alt: "Pantalla Cobrar sin red de Tienda Lupita con $25.00 y el teclado", w: 2120, h: 1000 },
  },
  {
    to: "/pagar",
    go: "Abrir el celular del cliente",
    title: "Mario firma un pagaré con su celular en modo avión",
    body: "Su llave vive sólo en su celular. Una grabación o una voz de IA no traen esa firma, por eso la tienda las rechaza.",
    shot: { src: pagar, alt: "Pantalla Pagar sin red: activa tu llave para pagar sin red", w: 1090, h: 1110 },
  },
  {
    to: "/tablero",
    go: "Ver el tablero",
    title: "Vuelve la red y el pagaré se cobra por CoDi",
    body: "El cobro llega a la app bancaria del cliente y la tienda ve la clave de rastreo. En la demo se cobra un monto de prueba de $0.01.",
    shot: { src: tablero, alt: "Tablero con tres pagarés cobrados por CoDi, cada uno con su clave de rastreo", w: 1872, h: 618 },
  },
];

export function Landing() {
  const reduce = useReducedMotion();
  return (
    <main className="mx-auto max-w-[1200px] px-4 md:px-8">
      {/* Hero: the claim on the left, the wow (four attacks rejected, a real capture of /ataques) on the right. */}
      <section className="grid items-center gap-5 pt-5 pb-10 md:grid-cols-[4fr_7fr] md:gap-10 md:pt-8 md:pb-16">
        <div>
          {/* design-lint: ok · the hero sits between the 44 and 96 steps so the wow stays above the fold at 1280×720 */}
          <h1 className="display text-2xl leading-[0.98] font-black md:text-[64px]"> {/* design-lint: ok · see above */}
            Cobra en digital aunque no haya señal.
          </h1>
          <p className="mt-4 max-w-[34ch] text-base text-ink-2 md:text-lg">
            SinSeñal convierte cada venta sin red en un pagaré firmado que nadie puede fingir, y lo cobra por CoDi
            cuando vuelve la señal.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <ActionLink to="/tienda">Cobrar sin red</ActionLink>
            <ActionLink to="/ataques" quiet>
              Ver los ataques en vivo
            </ActionLink>
          </div>
        </div>
        <motion.figure
          initial={reduce ? false : { opacity: 0, y: 24, rotate: -1.5 }}
          animate={{ opacity: 1, y: 0, rotate: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <img
            src={ataques}
            alt="Registro de ataques: el pagaré legítimo es válido; la grabación, la voz de IA, el pagaré a 2 km y el duplicado salen rechazados"
            width={1920}
            height={984}
            fetchPriority="high"
            className="h-auto w-full rounded-lg border border-line shadow-card"
          />
          <figcaption className="mt-3 text-base text-ink-2">
            Una grabación, una voz de IA, un pagaré a 2 km y un duplicado. La tienda no vibró con ninguno.
          </figcaption>
        </motion.figure>
      </section>

      {/* The pain: two sourced numbers. */}
      <section className="border-t border-line py-10 md:py-16">
        <h2 className="display max-w-[24ch] text-xl font-extrabold md:text-2xl">
          El pago digital falla justo cuando más se necesita, y cuando funciona, nadie le cree.
        </h2>
        <div className="mt-8 grid gap-10 md:grid-cols-[1fr_1.3fr] md:gap-16">
          <div data-testid={`fact-${cash.value}`}>
            <p className="display num text-3xl font-black text-ink md:text-hero">{cash.value}</p>
            <p className="mt-2 max-w-[28ch] text-lg">{cash.label}</p>
            <p className="mt-1">
              <SourceLink fact={cash} />
            </p>
          </div>
          <div className="self-end">
            <p className="text-lg">De todas las cuentas CoDi que ya están validadas, casi ninguna se usa para pagar.</p>
            <div
              className="mt-5 h-4 overflow-hidden rounded-full bg-muted"
              role="img"
              aria-label={`${codiPaid.value} de ${codiValidated.value} cuentas`}
            >
              <div className="h-full rounded-full bg-ink" style={{ width: `${(codiPaidShare * 100).toFixed(1)}%` }} />
            </div>
            <div className="mt-4 flex flex-wrap justify-between gap-6">
              <div data-testid={`fact-${codiPaid.value}`}>
                <p className="display num text-2xl font-black">{codiPaid.value}</p>
                <p className="text-base">{codiPaid.label}</p>
                <SourceLink fact={codiPaid} />
              </div>
              <div data-testid={`fact-${codiValidated.value}`} className="md:text-right">
                <p className="display num text-2xl font-black text-ink-2">{codiValidated.value}</p>
                <p className="text-base">{codiValidated.label}</p>
                <SourceLink fact={codiValidated} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works: three real screens, alternating sides. */}
      <section className="border-t border-line py-10 md:py-16">
        <h2 className="display text-xl font-extrabold md:text-2xl">Así se paga sin señal</h2>
        <ol className="mt-8 space-y-12 md:space-y-16">
          {steps.map((s, i) => (
            <li key={s.to} className="grid items-center gap-5 md:grid-cols-2 md:gap-12">
              <div className={i % 2 ? "md:order-2" : ""}>
                <p className="display num text-2xl font-black text-accent" aria-hidden="true">
                  {i + 1}
                </p>
                <h3 className="display mt-1 text-lg font-extrabold md:text-xl">{s.title}</h3>
                <p className="mt-2 max-w-[44ch] text-base text-ink-2">{s.body}</p>
                <Link className="mt-3 inline-block font-bold underline underline-offset-4" to={s.to}>
                  {s.go}
                </Link>
              </div>
              <Shot {...s.shot} />
            </li>
          ))}
        </ol>
      </section>

      {/* The ask, again. */}
      <section className="border-t border-line py-10 md:py-14">
        <h2 className="display max-w-[22ch] text-xl font-extrabold md:text-2xl">
          Prueba con dos celulares: uno cobra, el otro en modo avión paga.
        </h2>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <ActionLink to="/tienda">Cobrar sin red</ActionLink>
          <ActionLink to="/pagar" quiet>
            Pagar sin red
          </ActionLink>
          <ActionLink to="/tablero" quiet>
            Ver el tablero
          </ActionLink>
        </div>
        <p className="mt-8 text-sm text-ink-2">
          Capturas de la app con datos de demostración y personas ficticias. Cifras verificadas el 7 de noviembre de
          2026. Cobros por CoDi con la API de pey.
        </p>
      </section>
    </main>
  );
}
