import type { FeatureRoute } from "../../App";
import { Landing } from "./Landing";

// The front page: no label, so it stays out of the nav bar (the brand mark leads here).
export const route: FeatureRoute = { path: "/", element: <Landing /> };
