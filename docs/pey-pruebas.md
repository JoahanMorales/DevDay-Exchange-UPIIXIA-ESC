# Pruebas con pey ($0.01 MXN) — para Fer

No hay sandbox: la prueba es real, con **$0.01**. Solo un humano la corre; el agente nunca.

## Cómo correrla

```bash
export PEY_API_KEY=...   # del portal de pey; nunca lo pegues en el chat ni lo subas a git
uv run --no-project --with httpx python spikes/pey/probe.py --phone 55XXXXXXXX
```

El script envía `POST /codi/pn` (amount 0.01, expiration 360, concepto ≤ 40 caracteres) y consulta
`GET /transaction/{id}` cada 4 s hasta `PAID` o hasta que expire; imprime los segundos transcurridos.
Aprueba el push en tu app bancaria cuando llegue. Repite con cada banco que tengas.

## Resultados (Fer llena esta tabla)

| Banco | ¿Llegó el push? (sí/no) | Segundos hasta PAID | Nombre del comercio mostrado | Largo máx. de concepto visto |
|---|---|---|---|---|
|  |  |  |  |  |
|  |  |  |  |  |
|  |  |  |  |  |

Para el largo máximo: prueba con `--concept` de 20, 30 y 40 caracteres y anota hasta dónde se ve completo.

## Exportar un webhook real

1. Tras un pago de prueba, abre el portal de pey → **Webhook Logs**.
2. Busca el evento `codi.pn.payment_received` y copia el cuerpo JSON.
3. Quita datos personales (`metadata.clabe`, `metadata.description`, nombres, teléfono); conserva la estructura y `trackingKey` de ejemplo.
4. Guárdalo en `app/fixtures/sinsenal/webhook_pn_real.json`.
