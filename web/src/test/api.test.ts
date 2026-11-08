import { afterEach, expect, it, vi } from "vitest";

import { api } from "../lib/api";

afterEach(() => vi.unstubAllGlobals());

it("api prefixes /api and parses json", async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ status: "ok" })));
  vi.stubGlobal("fetch", fetchMock);
  expect(await api("/health")).toEqual({ status: "ok" });
  expect(fetchMock.mock.calls[0][0]).toBe("/api/health");
});
