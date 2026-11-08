import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Check, Clock, X } from "@phosphor-icons/react";
import { formatAmountDigits } from "./format";

type Size = "sm" | "md";
export type Tone = "ok" | "bad" | "warn" | "neutral";

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  size?: Size | "lg";
}) {
  const sizes = {
    sm: "h-10 px-4 text-sm",
    md: "h-12 px-5 text-base",
    lg: "h-16 px-6 text-lg",
  };
  const variants = {
    primary:
      "bg-accent text-accent-ink disabled:bg-muted disabled:text-muted-ink",
    secondary: "bg-ink text-surface disabled:bg-muted disabled:text-muted-ink",
    ghost:
      "bg-transparent text-ink border border-line hover:bg-surface disabled:text-muted-ink",
  };
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-md font-bold transition-transform active:scale-[0.98] disabled:cursor-not-allowed ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    />
  );
}

/** The one container level. An IOU is a Surface with a <TicketTear /> between amount and details. */
export function Surface({
  children,
  size = "md",
  className = "",
}: {
  children: ReactNode;
  size?: Size;
  className?: string;
}) {
  const pad = size === "sm" ? "p-4" : "px-5 py-6 md:px-8 md:py-7";
  return (
    <div
      className={`relative rounded-lg bg-surface shadow-card ${pad} ${className}`}
    >
      {children}
    </div>
  );
}

/** Perforation of a ticket: dashed line with a notch on each side. Only inside a md Surface. */
export function TicketTear() {
  return (
    <div
      aria-hidden
      className="relative -mx-5 my-5 border-t-2 border-dashed border-line md:-mx-8"
    >
      <span className="absolute -top-3 -left-3 size-6 rounded-full bg-bg" />
      <span className="absolute -top-3 -right-3 size-6 rounded-full bg-bg" />
    </div>
  );
}

const toneChip: Record<Tone, string> = {
  ok: "bg-ok text-ok-ink",
  bad: "bg-bad text-bad-ink",
  warn: "bg-warn text-warn-ink",
  neutral: "bg-muted text-ink",
};

export function Chip({
  tone = "neutral",
  size = "md",
  children,
}: {
  tone?: Tone;
  size?: Size;
  children: ReactNode;
}) {
  const s = size === "sm" ? "px-2.5 py-1 text-sm" : "px-3 py-1.5 text-sm";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-bold ${s} ${toneChip[tone]}`}
    >
      {children}
    </span>
  );
}

/** Status glyph: color never carries meaning alone, every state has an icon and a word next to it. */
export function StateIcon({ tone, size = "md" }: { tone: Tone; size?: Size }) {
  const box = size === "sm" ? "size-7" : "size-9";
  const px = size === "sm" ? 15 : 19;
  const Icon = tone === "ok" ? Check : tone === "bad" ? X : Clock;
  return (
    <span
      className={`${box} grid shrink-0 place-items-center rounded-full ${toneChip[tone]}`}
      aria-hidden
    >
      <Icon size={px} weight="bold" />
    </span>
  );
}

/** The memorable element: a rubber stamp on the ticket. */
export function Stamp({
  tone,
  children,
}: {
  tone: "ok" | "bad";
  children: ReactNode;
}) {
  return (
    <span
      className={`display inline-block -rotate-[8deg] rounded-sm border-4 px-3.5 pt-1.5 pb-1 text-lg leading-none font-black tracking-wide md:text-xl ${
        tone === "ok" ? "border-ok text-ok" : "border-bad text-bad"
      }`}
    >
      {children}
    </span>
  );
}

/** Giant amount: small "$", condensed tabular digits. sm = list totals, md = screen hero, lg = keypad/ticket. */
export function Amount({
  cents,
  size = "md",
}: {
  cents: number;
  size?: Size | "lg";
}) {
  const sizes = {
    sm: "text-xl",
    md: "text-2xl md:text-3xl",
    lg: "text-3xl md:text-hero",
  };
  return (
    <span className={`num block leading-[0.95] ${sizes[size]}`}>
      <span className="mr-1 align-[0.95em] text-[0.42em]">$</span>
      {formatAmountDigits(cents)}
    </span>
  );
}

export function Stat({
  label,
  value,
  tone = "neutral",
  size = "md",
}: {
  label: string;
  value: ReactNode;
  tone?: Tone;
  size?: Size;
}) {
  const color =
    tone === "ok"
      ? "text-ok"
      : tone === "bad"
        ? "text-bad"
        : tone === "warn"
          ? "text-warn"
          : "text-ink";
  return (
    <div className="rounded-lg bg-surface px-5 py-4 shadow-card">
      <div className="text-sm text-ink-2">{label}</div>
      <div
        className={`num leading-none ${size === "sm" ? "text-xl" : "text-xl md:text-2xl"} ${color}`}
      >
        {value}
      </div>
    </div>
  );
}

export function SectionHeader({
  children,
  action,
}: {
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-center gap-3">
      <h2 className="display text-lg leading-tight font-extrabold text-ink-2">
        {children}
      </h2>
      {action && <div className="ml-auto">{action}</div>}
    </div>
  );
}

export function Legend({ items }: { items: { tone: Tone; label: string }[] }) {
  return (
    <ul className="hidden flex-wrap gap-4 text-sm text-ink-2 md:flex">
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-2">
          <StateIcon tone={i.tone} size="sm" />
          {i.label}
        </li>
      ))}
    </ul>
  );
}

/** A row in a list surface: state glyph, primary line, secondary line, optional trailing value. */
export function ListRow({
  tone,
  title,
  detail,
  trailing,
}: {
  tone: Tone;
  title: ReactNode;
  detail?: ReactNode;
  trailing?: ReactNode;
}) {
  return (
    <li className="flex items-center gap-3 border-t border-line px-4 py-3.5 first:border-t-0 md:px-5">
      <StateIcon tone={tone} />
      <div className="min-w-0 flex-1">
        <div className="text-base font-bold">{title}</div>
        {detail && <div className="text-sm text-ink-2">{detail}</div>}
      </div>
      {trailing && <div className="shrink-0 text-right">{trailing}</div>}
    </li>
  );
}

export function List({ children }: { children: ReactNode }) {
  return (
    <ul className="overflow-hidden rounded-lg border border-line bg-surface">
      {children}
    </ul>
  );
}

/** The product's data badge: anything synthetic or simulated says so on screen (IDEA §10). */
export function DemoBadge({
  children = "Datos de demostración · personas ficticias",
}: {
  children?: ReactNode;
}) {
  return <p className="mt-6 text-base text-ink-2">{children}</p>;
}
