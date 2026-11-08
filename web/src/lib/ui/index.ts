// SinSeñal UI kit (HACK-008 design lock). Screens import from "lib/ui", never build their own nav or palette.
export {
  AppShell,
  BrandMark,
  NavBar,
  NetworkPill,
  PageHeader,
  PageLayout,
  type NavItem,
} from "./Shell";
export {
  Amount,
  Button,
  Chip,
  DemoBadge,
  EmptyState,
  Legend,
  List,
  ListRow,
  SectionHeader,
  Skeleton,
  SkeletonRows,
  Stamp,
  Stat,
  StateIcon,
  Surface,
  TicketTear,
  type Tone,
} from "./kit";
export { formatAmountDigits, formatMXN } from "./format";
export { useOnline } from "./useOnline";
