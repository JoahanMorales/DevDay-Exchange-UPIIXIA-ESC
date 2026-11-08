import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { AirplaneTilt, CellSignalSlash, WifiHigh } from "@phosphor-icons/react";

export type NavItem = { to: string; label: string; icon?: ReactNode };

/** Brand mark: the crossed signal bars on the cempasúchil tile. */
export function BrandMark({ size = "md" }: { size?: "sm" | "md" }) {
  const box = size === "sm" ? "size-8 rounded-sm" : "size-9 rounded-sm";
  return (
    <span className="flex items-center gap-2.5">
      <span
        className={`${box} grid place-items-center bg-accent text-accent-ink`}
        aria-hidden
      >
        <CellSignalSlash size={size === "sm" ? 18 : 21} weight="bold" />
      </span>
      <span className="display text-lg leading-none font-black">SinSeñal</span>
    </span>
  );
}

/** Always-visible connectivity pill: the product's promise, so it lives in the shell. */
export function NetworkPill({
  online,
  size = "md",
}: {
  online: boolean;
  size?: "sm" | "md";
}) {
  const pad = size === "sm" ? "px-3 py-1.5 text-sm" : "px-3.5 py-2 text-sm";
  return (
    <span
      role="status"
      className={`inline-flex items-center gap-2 rounded-full font-bold ${pad} ${
        online ? "bg-ok-soft text-ok" : "bg-ink text-surface"
      }`}
    >
      {online ? (
        <WifiHigh size={18} weight="bold" />
      ) : (
        <AirplaneTilt size={18} weight="fill" className="text-accent" />
      )}
      <span>
        {online ? "Con red" : "Sin red"}
        {!online && <span className="hidden md:inline"> · modo avión</span>}
      </span>
    </span>
  );
}

function pillClass({ isActive }: { isActive: boolean }) {
  return `rounded-full px-4 py-2 text-sm font-bold transition-colors ${
    isActive ? "bg-ink text-surface" : "text-ink-2 hover:text-ink"
  }`;
}

function tabClass({ isActive }: { isActive: boolean }) {
  return `flex min-w-16 flex-col items-center gap-0.5 px-2 text-sm font-bold ${
    isActive ? "text-ink" : "text-ink-2"
  }`;
}

/** Top bar at ≥ 700 px (brand · pill views · network); at 390 the views move to a bottom tab bar. */
export function NavBar({
  items,
  online,
}: {
  items: NavItem[];
  online: boolean;
}) {
  const views = items.slice(0, 6);
  return (
    <>
      <header className="sticky top-0 z-10 border-b border-line bg-surface">
        <div className="mx-auto flex max-w-[1200px] items-center gap-6 px-4 py-3 md:px-8">
          <NavLink to="/" aria-label="SinSeñal, inicio">
            <BrandMark />
          </NavLink>
          {views.length > 0 && (
            <nav
              aria-label="Vistas"
              className="hidden rounded-full border border-line bg-bg p-1 md:flex"
            >
              {views.map((item) => (
                <NavLink key={item.to} to={item.to} className={pillClass}>
                  {item.label}
                </NavLink>
              ))}
            </nav>
          )}
          <span className="ml-auto">
            <NetworkPill online={online} />
          </span>
        </div>
      </header>
      {views.length > 0 && (
        <nav
          aria-label="Vistas"
          className="fixed inset-x-0 bottom-0 z-10 flex justify-around border-t border-line bg-surface pt-2 pb-3.5 md:hidden"
        >
          {views.map((item) => (
            <NavLink key={item.to} to={item.to} className={tabClass}>
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>
      )}
    </>
  );
}

export function AppShell({
  nav,
  online,
  children,
}: {
  nav: NavItem[];
  online: boolean;
  children: ReactNode;
}) {
  return (
    <div className="min-h-[100dvh] bg-bg pb-20 text-ink md:pb-0">
      <NavBar items={nav} online={online} />
      {children}
    </div>
  );
}

/** One heading per screen: title, optional context line, optional action on the right. */
export function PageHeader({
  title,
  context,
  action,
}: {
  title: string;
  context?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end gap-3">
      <div>
        <h1 className="display text-xl leading-tight font-extrabold md:text-xl">
          {title}
        </h1>
        {context && <p className="text-ink-2">{context}</p>}
      </div>
      {action && <div className="ml-auto">{action}</div>}
    </div>
  );
}

/**
 * One layout per recipe in web/DESIGN.md:
 * - "result": hero ticket left, evidence column right (Verificar).
 * - "flow": a single task with a big input; aside = its controls (Cobrar, Pagar).
 * - "list": summary stats on top, one list surface below (Deudas, Relevo).
 */
export function PageLayout({
  recipe,
  aside,
  children,
}: {
  recipe: "result" | "flow" | "list";
  aside?: ReactNode;
  children: ReactNode;
}) {
  if (recipe === "result") {
    return (
      <main className="mx-auto grid max-w-[1200px] gap-6 px-4 py-6 md:grid-cols-[1.25fr_1fr] md:px-8 md:py-7">
        <section>{children}</section>
        {aside && <section className="flex flex-col">{aside}</section>}
      </main>
    );
  }
  if (recipe === "flow") {
    // Phone: one column. Wide: the input on the left, the controls (keypad, CTA) on the right, all above the fold.
    return (
      <main className="mx-auto grid max-w-[560px] gap-4 px-4 py-6 md:max-w-[1100px] md:grid-cols-[1.1fr_1fr] md:gap-8 md:px-8 md:py-8">
        <section>{children}</section>
        {aside && <section>{aside}</section>}
      </main>
    );
  }
  return (
    <main className="mx-auto max-w-[1000px] px-4 py-6 md:px-8 md:py-7">
      {children}
    </main>
  );
}
