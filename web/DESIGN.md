# DESIGN · SinSeñal

> Written by `/uak-design-lock` (HACK-008) from the direction Victor picked by looking (2026-11-08 01:5x).
> Global changes (theme, palette, type, shell) need a human-approved `uak decision`.

## Direction
- Name: `Cempasúchil` · Intent: `a stamped corner-shop ticket: the amount is huge and VÁLIDO / RECHAZADO reads from 10 m on a projector`
- The one memorable element: `the IOU ticket: giant condensed amount, dashed perforation with side notches, and a rotated rubber Stamp (VÁLIDO green / RECHAZADO red). Everything else is calm paper and ink.`
- References: `web/public/design-lock/1-1280.png` (the direction as proposed) · `web/public/design-lock/screens/` (the three locked screens). No external product refs were given.

## Type
- Families: display `Archivo` (variable width; amounts at 72 % width, weight 850, headings at 88 %) · body `Atkinson Hyperlegible` (built for low vision). Self-hosted woff2 in `web/src/lib/ui/fonts/` so the PWA works offline.
- Scale (px, Tailwind tokens): `text-sm 14 / text-base 18 / text-lg 22 / text-xl 28 / text-2xl 44 / text-3xl 96` · `text-hero 168` only for the one amount of a screen at ≥ 768 px
- Body: `18` px · line height `1.5` · hero display `96 (phone) / 168 (wide)` px · tabular figures for numbers: yes (`.num` class, `Amount`, `Stat`)

## Space and shape
- Spacing scale (px): `4 / 8 / 12 / 16 / 24 / 32 / 48 / 64` (use 3-4 steps per screen)
- Radius family: `10 (rounded-sm, keys, stamp) / 16 (rounded-md, buttons, notes) / 20 (rounded-lg, surfaces)` · pills `rounded-full` · elevation: one level (`shadow-card` = `--shadow`), hairlines `1px var(--line)`
- Content width `1200` px (result), `1100` (flow), `1000` (list) · side panel `the result recipe's right column, 1fr of 2.25fr (~460 px)`

## Color (tokens in `web/src/index.css`; Tailwind names in brackets)
| Token | Value | Job |
|---|---|---|
| `--bg` [`bg`] | `#f4eee2` | page (warm paper) |
| `--surface` [`surface`] | `#fffdf8` | the one container level |
| `--text` / `--text-2` [`ink` / `ink-2`] | `#17140f` / `#5c5346` | body / secondary |
| `--accent` [`accent`] | `#f2a20c` | the primary action (Cobrar), the brand mark, the airplane glyph; nothing else |
| `--accent-ink` [`accent-ink`] | `#1a1206` | text on the accent |
| `--ok` / `--warn` / `--bad` | `#0b6e3a` / `#6b4e00` / `#b3261e` | data states only: valid or charged / sent and waiting / rejected |
| `--ok-ink` / `--warn-ink` / `--bad-ink` | `#ffffff` / `#ffffff` / `#ffffff` | text on each state color |
| `--ok-soft` / `--warn-soft` / `--bad-soft` | `#ddf0e3` / `#f6ead0` / `#f8e1de` | quiet state backgrounds (notes, online pill); text on them uses the strong state color |
| `--line` / `--muted` / `--muted-ink` | `#ddd3c1` / `#e6dece` / `#5c5346` | hairlines / disabled fill / disabled text |
Disabled: `a primary Button turns muted fill (#e6dece) with muted-ink text, never the accent at low opacity`
Color never carries meaning alone: every state has a `StateIcon` (check / x / clock) and a word.

## Shell (owned by the design lock task)
- `AppShell` · `NavBar` (brand mark `CellSignalSlash` on the cempasúchil tile, `pill` segmented views from `features[].label`, 6 entries at most, plus the always-on `NetworkPill` "Sin red · modo avión" / "Con red") · `PageHeader` · `PageLayout recipe="result" | "flow" | "list"`
- At 390 wide: `the views move to a fixed bottom tab bar with icons; the network pill stays top right and shortens to "Sin red"`
- Features never build a header or nav: `App.tsx` wraps every discovered route in `AppShell`. Give your route a `label` to appear in the nav.
- Money: always `formatMXN(cents)` or the `Amount` component from `lib/ui` (es-MX, two decimals). Synthetic data shows the `DemoBadge` component.

## Screens: one recipe and one hero each
| Screen | Recipe (skill `product-ui` §2) | Hero |
|---|---|---|
| Verificar (store: IOU result + rejected attacks) · locked `screens/verificar-*` | `result`: hero ticket left, evidence list right | the ticket: `Amount lg` + `Stamp` VÁLIDO/RECHAZADO |
| Cobrar sin red (store keypad) · locked `screens/cobrar-*` | `flow`: input left, keypad + CTA right (stacked on phone) | `Amount lg` in a Surface |
| Deudas (store dashboard) · locked `screens/deudas-*` | `list`: 3 `Stat`, then one `List` of `ListRow` | the "Por cobrar" / "Cobrado por CoDi" stats |
| Pagar (payer signs IOU) | `flow` (copy Cobrar) | `Amount lg` + who you pay |
| Pulsera / NFC (Doña Carmen) | `result` (copy Verificar) | `Amount lg` + remaining cap chip |
| Relevo (relay carries envelopes) | `list` (copy Deudas) | `Stat` "pagarés cifrados para entregar" + hops |
| Servidor / sync result | `list` (copy Deudas) | `Stat` received / duplicates / valid signatures |
| Landing | `landing-story` | the Verificar screen as a real screenshot |

## AI tells we refuse
- A colored side stripe on rows or cards · a card inside a card · a grid of equal boxes
- Purple-blue gradients, glass on every surface, emoji as icons, tracked-out uppercase eyebrows over every heading
- Three equal pricing or feature cards · every label in the same weight · `demo:`, `undefined` or raw IDs on screen
- Amounts typed by hand or without two decimals ("$25" in one place, "25.00 MXN" in another): only `formatMXN` / `Amount`
- Green or red alone to say valid / rejected: always icon + word + reason in plain Spanish ("Contador repetido", not `ERR_COUNTER`)
- A second accent or a dark "hacker" theme for the crypto parts: the security shows as plain stamps, not neon
