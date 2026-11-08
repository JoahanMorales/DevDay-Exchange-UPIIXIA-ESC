# Imprimibles del demo

| Archivo | Qué es |
|---|---|
| `si-no-vibro.svg` | Letrero A4 "Si tu celular no vibró, no te pagaron" (imprimir directo desde el navegador). |
| `make_print.py` | Llama a `POST /demo/reset` y genera `counter-qr.png` (credencial del comercio, para el mostrador) y `band-qr.png` (respaldo impreso de la pulsera de Doña Carmen). |

Los QR **no se suben a git**: cada reset crea llaves nuevas y la credencial vence a las 24 h.
Regenerarlos e imprimirlos después del último reset previo a la demo:

```bash
uv run --no-project --with httpx --with "qrcode[pil]" python docs/print/make_print.py https://sinsenal-9lb5.onrender.com
```

Requiere `DEMO_MODE=1` en el servidor. Datos 100 % sintéticos (teléfonos `55000000xx`).
