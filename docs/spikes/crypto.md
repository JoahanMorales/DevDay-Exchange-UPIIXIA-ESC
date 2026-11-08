# Spike crypto (HACK-006)

Qué prueba: firma ECDSA P-256 con WebCrypto (llave **no extraíble**) → `r||s` de 64 bytes, y sobre ECDH P-256 + HKDF-SHA256
(info `sinsenal-v1`) + AES-256-GCM. Python (`cryptography`) verifica la firma convirtiendo `r||s` → DER y descifra el sobre.

## Resultado en Node 20 (agente)
`node spikes/crypto/sign.mjs spikes/crypto/out.json && uv run --no-project --with cryptography python spikes/crypto/verify.py spikes/crypto/out.json`
→ `signature OK`, `envelope OK` (firma de 64 B, texto plano de 125 B, `ct` de 141 B = 125 + 16 de etiqueta GCM). Salida real, exit 0.

## Celulares (Fer lead con Yojan, por rellenar)
Servir `spikes/crypto/index.html` por HTTPS (o `localhost`), abrir en el celular, tocar **Run** y copiar si dice `RESULT: PASS`.

| Dispositivo | Navegador | RESULT | sig = 64 | extraíble = false | Notas |
|---|---|---|---|---|---|
| (pendiente) | Android Chrome | | | | |
| (pendiente) | iPhone Safari | | | | |
