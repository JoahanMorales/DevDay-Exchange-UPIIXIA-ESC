// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { NAV_ORDER, sortNav } from './nav';

const item = (to: string) => ({ to, label: to.slice(1) });

describe('nav order', () => {
  it('nav_follows_demo_flow_not_alphabet', () => {
    const alphabetical = ['/asistente', '/ataques', '/pagar', '/relevo', '/tablero', '/tienda'].map(item);
    expect(sortNav(alphabetical).map((i) => i.to)).toEqual(['/tienda', '/pagar', '/ataques', '/relevo', '/tablero', '/asistente']);
    expect(NAV_ORDER[0]).toBe('/tienda'); // the first thing a shopkeeper does is charge
    const input = alphabetical.slice();
    sortNav(input);
    expect(input.map((i) => i.to)).toEqual(['/asistente', '/ataques', '/pagar', '/relevo', '/tablero', '/tienda']); // pure
  });

  it('unknown_routes_sort_last', () => {
    const out = sortNav(['/zeta', '/tablero', '/alfa', '/tienda'].map(item)).map((i) => i.to);
    expect(out).toEqual(['/tienda', '/tablero', '/alfa', '/zeta']); // known by flow, unknown after, alphabetical among themselves
  });
});
