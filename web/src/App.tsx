import type { ReactElement } from "react";
import { BrowserRouter, Link, Outlet, Route, Routes } from "react-router-dom";
import {
  AppShell,
  PageHeader,
  PageLayout,
  useOnline,
  type NavItem,
} from "./lib/ui";
import { LockedScreen } from "./lib/ui/locked/LockedScreens";

// Each feature is web/src/features/<name>/index.tsx exporting `route = { path, element }`.
// Adding a feature = creating its folder; App.tsx never becomes a conflict point.
// The design lock task owns this file: it wraps the routes in AppShell + NavBar from lib/ui.
export type FeatureRoute = {
  path: string;
  element: ReactElement;
  label?: string;
};
type FeatureModule = { route?: FeatureRoute };

export const features: FeatureRoute[] = Object.values(
  import.meta.glob<FeatureModule>("./features/*/index.tsx", { eager: true }),
)
  .map((module) => module.route)
  .filter((route): route is FeatureRoute => route !== undefined)
  .sort((a, b) => a.path.localeCompare(b.path));

// Nav = every feature with a label (6 at most in the bar), in discovery order.
const nav: NavItem[] = features
  .filter((f): f is FeatureRoute & { label: string } => Boolean(f.label))
  .map(({ path, label }) => ({ to: path, label }));

function RouteList() {
  return (
    <PageLayout recipe="list">
      <PageHeader
        title="SinSeñal"
        context="Vende y cobra en digital aunque no haya red."
      />
      <ul className="space-y-2 text-base">
        {features.map(({ path, label }) => (
          <li key={path}>
            <Link className="font-bold underline" to={path}>
              {label ?? path}
            </Link>
          </li>
        ))}
        <li>
          <Link className="font-bold underline" to="/design-lock/verificar">
            Pantallas bloqueadas (diseño)
          </Link>
        </li>
      </ul>
    </PageLayout>
  );
}

function FeatureFrame() {
  const online = useOnline();
  return (
    <AppShell nav={nav} online={online}>
      <Outlet />
    </AppShell>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* The locked screens bring their own AppShell with the demo nav. */}
        <Route path="/design-lock/:screen?" element={<LockedScreen />} />
        <Route element={<FeatureFrame />}>
          {!features.some((f) => f.path === "/") && (
            <Route path="/" element={<RouteList />} />
          )}
          {features.map(({ path, element }) => (
            <Route key={path} path={path} element={element} />
          ))}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
