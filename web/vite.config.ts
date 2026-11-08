import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
import { VitePWA } from "vite-plugin-pwa";

// /api goes to FastAPI in dev; in the demo FastAPI serves web/dist (one process).
// envDir: the one .env lives at the repo root (VITE_* keys too).
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "SinSeñal",
        short_name: "SinSeñal",
        start_url: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#111111",
        icons: [{ src: "icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,woff,woff2,wasm,json}"],
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api\//],
      },
    }),
  ],
  envDir: "..",
  server: { proxy: { "/api": "http://127.0.0.1:8000" } },
  test: { environment: "jsdom", include: ["src/**/*.test.{ts,tsx}"] },
});
