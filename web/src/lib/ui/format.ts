// Money is always cents in data and "$25.00" on screen (es-MX, two decimals). Never format by hand.
const mxn = new Intl.NumberFormat("es-MX", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatMXN(cents: number): string {
  return `$${mxn.format(cents / 100)}`;
}

/** Digits only, for the big amount display where the "$" is drawn smaller. */
export function formatAmountDigits(cents: number): string {
  return mxn.format(cents / 100);
}
