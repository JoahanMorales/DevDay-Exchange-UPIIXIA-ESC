import type { ReactElement } from "react";
import { BrowserRouter, Link, Route, Routes } from "react-router-dom";

// Each feature is web/src/features/<name>/index.tsx exporting `route = { path, element }`.
// Adding a feature = creating its folder; App.tsx never becomes a conflict point.
// The design lock task owns this file: it wraps the routes in AppShell + NavBar from lib/ui.
export type FeatureRoute = { path: string; element: ReactElement; label?: string };
type FeatureModule = { route?: FeatureRoute };

export const features: FeatureRoute[] = Object.values(
  import.meta.glob<FeatureModule>("./features/*/index.tsx", { eager: true }),
)
  .map((module) => module.route)
  .filter((route): route is FeatureRoute => route !== undefined)
  .sort((a, b) => a.path.localeCompare(b.path));

function RouteList() {
  return (
    <main className="mx-auto min-h-[100dvh] max-w-3xl px-4 py-12 font-sans">
      <h1 className="text-2xl font-semibold">SinSeñal</h1>
      <ul className="mt-6 space-y-2">
        {features.map(({ path, label }) => (
          <li key={path}>
            <Link className="underline" to={path}>
              {label ?? path}
            </Link>
          </li>
        ))}
        {features.length === 0 && <li className="text-neutral-500">No routes yet.</li>}
      </ul>
    </main>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {!features.some((f) => f.path === "/") && <Route path="/" element={<RouteList />} />}
        {features.map(({ path, element }) => (
          <Route key={path} path={path} element={element} />
        ))}
      </Routes>
    </BrowserRouter>
  );
}
