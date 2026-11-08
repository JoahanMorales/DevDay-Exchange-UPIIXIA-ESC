import { cleanup, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import { Landing } from "./Landing";

afterEach(cleanup);

const expected = [
  { value: "85%", source: "https://grupoanimal.mx/economia/ley-economia-digital-50-pagos-digitales-2027" },
  { value: "2.47 M", source: "https://www.razon.com.mx/negocios/2025/09/30/acusan-falta-de-promocion-y-voluntad-en-impulso-de-codi/" },
  { value: "21.79 M", source: "https://www.razon.com.mx/negocios/2025/09/30/acusan-falta-de-promocion-y-voluntad-en-impulso-de-codi/" },
];

describe("Landing", () => {
  it("shows_each_number_with_its_source_link", () => {
    render(<MemoryRouter><Landing /></MemoryRouter>);
    for (const { value, source } of expected) {
      const fact = screen.getByTestId(`fact-${value}`);
      expect(fact.textContent).toContain(value);
      const link = within(fact).getByRole("link");
      expect(link.getAttribute("href")).toBe(source);
    }
    for (const path of ["/tienda", "/pagar", "/tablero"]) {
      expect(screen.getAllByRole("link").some((a) => a.getAttribute("href") === path)).toBe(true);
    }
  });
});
