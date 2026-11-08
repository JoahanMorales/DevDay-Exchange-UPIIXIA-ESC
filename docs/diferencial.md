# Diferencial frente a repos públicos (HACK-031)

Búsqueda hecha el **8-nov-2026 ~03:30** con `gh search repos` (índice público de GitHub) y lectura de las primeras líneas del README de los
candidatos más cercanos. **Es un escaneo rápido, no exhaustivo**: no vi el código, solo lo que dice cada README; los repos privados y los que aún
no están indexados no aparecen. Todo lo de abajo es lo que esos README afirman; no verifiqué que funcione.

## Búsquedas y resultado
| Búsqueda | Resultado |
|---|---|
| `pey`, `codi pey`, `devday exchange` | 7 repos relevantes (tabla 1) |
| `pey codi`, `pey.mx`, `api.pey.mx`, `ggwave payments`, `ggwave offline payment`, `codi offline pagos` | 0 resultados |
| `ggwave` (creados desde 2026-10-01) | 5 repos de "datos por sonido" sin pagos (tabla 2) |
| `offline payments` (desde 2026-11-01) | 1 relacionado: simulador UPI offline con malla (tabla 2) |

## Tabla 1 · Repos con pey/CoDi (mismo reto)
| Repo | Qué dice que hace | ¿Funciona sin red? | ¿Pagaré firmado / relevo? |
|---|---|---|---|
| https://github.com/EmpowerTours/codi-direct | Biblioteca para pagar a trabajadores por CoDi vía pey: cliente de pey (push y QR), **verificación de webhooks Standard Webhooks sobre el cuerpo crudo**, reglas de pago, validación de CLABE | No lo menciona | No |
| https://github.com/carlosgdelvalle/tienditapp (Abarpay) | Cobros verificados, ventas e inventario para la tiendita; FastAPI; dice haber hecho un cobro real de $0.01 por CoDi (`PAID`, 7-nov 15:08) | No lo menciona | No |
| https://github.com/Alexqander/pey-whatsapp-demo | Cobros por WhatsApp con Pey (y simulación), NestJS + PostgreSQL; dice haber probado un checkout CoDi con tope de $1 | No (necesita WhatsApp) | No |
| https://github.com/edgarvalenciam/agentpay-os | Comercio iniciado por IA con políticas deterministas y conciliación CoDi/pey; dice tener SQLite, auditoría y un caso real | No lo menciona | No |
| https://github.com/DonCervantes/handle-pay | ERP ligero para PyMEs; la descripción menciona Pey, pero el README habla de pagos en stablecoin sobre Stellar | No lo menciona | No |

## Tabla 2 · Repos con piezas sueltas (sin pey/CoDi)
| Repo | Qué dice que hace | Relación con SinSeñal |
|---|---|---|
| https://github.com/salvuspaul-dev/sonicspy (Tonedrop) | Datos por **sonido audible** (texto, archivos, bytes) con ggwave y compatible con gibberlink; difusión a varios celulares | Misma capa de transporte que nuestro sonido; **no es un protocolo de pagos** (no firma deudas ni cobra) |
| https://github.com/khushi101dev/UPI_OFFLINE-MESH | Simulador (Java/Spring Boot) de pagos UPI **por malla tipo Bluetooth** sin internet del emisor: el pago viaja cifrado y otro nodo con red lo sube | Misma idea de "guarda y reenvía", pero **para UPI (India) y simulado en una laptop**, no CoDi ni celulares reales |
| https://github.com/katzenpost/ggwave-rs, och1ai/gibberlink-spectrum-demo, 0xNtive/sonic-pipe | Bibliotecas/demos de ggwave | Solo transporte |

## Qué NO encontré
- **Ningún repo público** con pagaré firmado + reto de un solo uso + relevo cifrado + liquidación por CoDi con pey.
- **Ningún repo público** que pague sin red por sonido o NFC con pey/CoDi.
- IDEA §1 dice que "varios equipos propusieron pagos sin conexión por sonido (lo vimos en persona)". **No encontré esos proyectos en GitHub**: pueden no estar publicados todavía o con otro nombre. Hay que decirlo así, sin afirmar que existen ni que no.

## Lo que sí se solapa (no presumir de esto como único)
- **Webhook firmado de pey verificado sobre el cuerpo crudo** (codi-direct lo hace y lo declara). No es diferencial nuestro.
- **Cobro real de $0.01 por CoDi** (Abarpay dice haberlo hecho antes que nosotros). Es la demostración mínima del reto, no un diferencial.
- **Transporte por sonido con ggwave** (Tonedrop).
- **Guarda y reenvía para pagos offline** (UPI Offline Mesh, en simulación).

## Párrafo propuesto para IDEA §1 (solo con lo hallado)
Reemplazar la viñeta "Diferencial frente a otros equipos del reto" por:

> Entre los repos públicos del evento que usan pey/CoDi (Abarpay, pey-whatsapp-demo, codi-direct, agentpay-os) todos suponen red en el momento del cobro; no encontramos ninguno que funcione sin señal. Piezas sueltas existen (transporte por sonido con ggwave, una simulación de malla offline para UPI de India), pero ninguna junta lo que SinSeñal sí: (1) una **deuda firmada con reto de un solo uso**, no un aviso de pago; (2) un **relevo cifrado de celular en celular**; (3) **liquidación real por CoDi con pey**, webhook firmado, clave de rastreo y manejo de deudas (topes, reputación). Búsqueda rápida de GitHub el 8-nov-2026 a las 03:30; puede haber proyectos aún no publicados.

`IDEA.md` no está en los `Paths` de esta tarea: el cambio lo aplica quien tenga permiso (`uak plan --amend`) o un humano.

## Antes del pitch
Repetir las búsquedas cerca del mediodía (los repos se publican durante el día) y ajustar el párrafo. En el escenario decir "no encontramos otro que…", nunca "somos los únicos".
