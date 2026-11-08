// Numbers on the landing come only from IDEA.md §11 (verified 7-nov-2026), each with its source.
export type Fact = { value: string; label: string; source: string; sourceName: string };

const CODI_SOURCE =
  "https://www.razon.com.mx/negocios/2025/09/30/acusan-falta-de-promocion-y-voluntad-en-impulso-de-codi/";

export const cash: Fact = {
  value: "85%",
  label: "de las compras de menos de $500 se pagan en efectivo.",
  source: "https://grupoanimal.mx/economia/ley-economia-digital-50-pagos-digitales-2027",
  sourceName: "Grupo Animal, 2026",
};

export const codiPaid: Fact = {
  value: "2.47 M",
  label: "han hecho al menos un pago",
  source: CODI_SOURCE,
  sourceName: "La Razón, sep-2025",
};

export const codiValidated: Fact = {
  value: "21.79 M",
  label: "cuentas CoDi validadas",
  source: CODI_SOURCE,
  sourceName: "La Razón, sep-2025",
};

/** Share of validated CoDi accounts that ever paid, computed from the two sourced numbers. */
export const codiPaidShare = 2.47 / 21.79;
