# Protocolo SinSeñal v1 (contrato HACK-003)

Fuente de verdad ejecutable: `app/schemas/protocol.py` (Python) y `app/fixtures/sinsenal/vectors.json` (vectores
compartidos con TypeScript en `web/src/lib/contract/vectors.json`). Si este documento y el código discrepan, gana el
código y se corrige el documento. Solo personas sintéticas (Lupita, Mario, Doña Carmen, Luis); ningún teléfono ni CLABE real.

## Convenciones
- Enteros **big-endian**. ULID = **16 bytes crudos** (Crockford base32 de 26 caracteres ↔ 128 bits, el primer carácter ≤ `7`).
- `lat`/`lon` = enteros **con signo de 32 bits** en grados × 1e6 (`lat_e6`, `lon_e6`).
- Firma = ECDSA P-256 / SHA-256, formato **crudo `r||s` de 64 bytes** (lo que emite WebCrypto). Python convierte a DER con
  `encode_dss_signature` solo para verificar (`rs_to_der`).
- Llaves públicas en JWK (`{kty:"EC", crv:"P-256", x, y}`, base64url). Las llaves de usuario se generan con `extractable:false`.

## Pagaré (IOU): 61 bytes + firma 64 = 125 bytes (cabe en un mensaje ggwave de 140)

| Offset | Bytes | Campo |
|---:|---:|---|
| 0 | 1 | `ver` (= 1) |
| 1 | 16 | `payer_id` |
| 17 | 16 | `merchant_id` |
| 33 | 4 | `amount_cents` (uint32) |
| 37 | 4 | `counter` (uint32, creciente por pagador) |
| 41 | 4 | `ts` (uint32, segundos Unix) |
| 45 | 8 | `nonce` (el del reto atendido) |
| 53 | 4 | `lat_e6` (int32) |
| 57 | 4 | `lon_e6` (int32) |
| **61** | **64** | `sig` = firma del pagador sobre los 61 bytes |

Un pagaré firmado = `raw(61) || sig(64)`. Clave de deduplicación: `(payer_id, counter)`; `envelope_id` = `sha256(raw||sig)` en hex.

## Reto (comercio → pagador): 41 bytes + firma 64

`ver(1) | merchant_id(16) | nonce(8) | ts(4) | lat_e6(4) | lon_e6(4) | amount_cents(4)` = 41 bytes; `merchant_sig` (64) sobre esos
41 bytes. Válido 30 s y de un solo uso. El pagador verifica la firma con la llave de la credencial del comercio.

## Credencial (la emite el servidor; verificable sin red)

`{subject_id, subject_type, pubkey_jwk, daily_cap_cents, valid_until, rep_version}` → `server_sig` = firma `r||s` (base64
estándar) del servidor sobre el **JSON canónico** de esos campos: llaves ordenadas, separadores `,` y `:` sin espacios,
UTF-8. La app lleva la llave pública del servidor (`GET /api/server-key`) embebida/cacheada.

**QR de credencial del comercio:** una credencial no cabe en un mensaje ggwave de 140 bytes, así que el pagador la guarda
antes de quedarse sin red escaneando un QR con el JSON `{"credential": {...}}` (UTF-8, ≈ 400 B). Sin red el pagador usa la
credencial cacheada; el reto solo lleva `merchant_id`.

## Sobre cifrado (comercio → servidor, viaja por relevos)

1. El comercio genera un par ECDH P-256 efímero; `epk` = punto sin comprimir de 65 bytes (`0x04||X||Y`).
2. `shared = ECDH(eph_priv, server_pub)`; `key = HKDF-SHA256(shared, salt = ninguna, info = "sinsenal-v1", L = 32)`.
3. `ciphertext = AES-256-GCM(key, iv de 12 bytes aleatorios, plaintext = raw||sig (125 B), sin AAD)` (la etiqueta GCM de 16
   bytes va al final del `ciphertext`).
4. Campos del sobre: `envelope_id`, `epk`, `iv`, `ciphertext` (base64 estándar), `hops`, `created_at`, `ttl_s` (7 días).

Los relevos no pueden leer (cifrado) ni alterar (GCM + firma interna del pagador).

## Endpoints (cuerpos en `app/schemas/models.py`)

`POST /api/payers`→`PayerCreated` · `POST /api/merchants`→`MerchantCreated` · `GET /api/server-key`→`ServerKeyResponse` ·
`POST /api/sync` `SyncRequest`→`SyncResponse{accepted, duplicates, rejected[], revocation_list}` · `GET /api/deudas?merchant_id=`→`DebtList` ·
`GET /api/deudas/{id}`→`Debt` · `GET /api/deudas/{id}/eventos` (SSE `DebtEvent`) · `POST /api/deudas/{id}/plan-b`→`PlanBResponse` ·
`GET /api/reputacion/{payer_id}`→`ReputationResponse` · `POST /webhooks/pey` (cuerpo crudo, Standard Webhooks) ·
`POST /demo/simular-pago/{deuda_id}` (solo `DEMO_MODE=1`)→`SimulatePaymentResponse` · explicación OpenAI→`ExplainResponse`.

## Vectores

`vectors.json` trae: llaves de servidor/pagador/comercio (**solo de prueba**), un reto con su firma, un pagaré con su firma
`r||s`, su sobre y su texto plano, y credenciales firmadas. Se generan con
`uv run --no-project --with pydantic --with cryptography python app/fixtures/sinsenal/gen_vectors.py`. Las firmas ECDSA son
aleatorias: el `vectors.json` versionado es el vector; regenerar solo si cambia el contrato (y avisar con `uak msg impact`).
