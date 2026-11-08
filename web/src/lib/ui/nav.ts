/** Nav order follows the demo flow (charge, pay, attacks, relay, dashboard, assistant), not the alphabet. */
export const NAV_ORDER: string[] = ["/tienda", "/pagar", "/ataques", "/relevo", "/tablero", "/asistente"];

/** Six tabs share 360-390 px: one entry needs a short label there ("Asistente" is too wide). */
export const NAV_SHORT: Record<string, string> = { "/asistente": "Ayuda" };

/** Known routes by flow order, then unknown ones alphabetically. Returns a new array. */
export function sortNav<T extends { to: string }>(items: T[]): T[] {
  const rank = (to: string) => {
    const i = NAV_ORDER.indexOf(to);
    return i === -1 ? NAV_ORDER.length : i;
  };
  return items.slice().sort((a, b) => rank(a.to) - rank(b.to) || a.to.localeCompare(b.to));
}
