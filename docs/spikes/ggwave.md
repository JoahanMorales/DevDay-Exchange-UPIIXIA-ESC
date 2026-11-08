# Spike ggwave · 125 bytes entre dos Android

Pregunta: ¿ggwave pasa 125 bytes entre dos teléfonos Android en el salón, de forma fiable (≥ 7/10) y en pocos segundos? Si no, el intercambio es **solo QR**.

Página: `spikes/ggwave/index.html`, un archivo sin build. Carga `ggwave@0.4.0` (WASM embebido) desde jsDelivr, con SRI comprobado contra el tarball de npm.

## Cómo funciona la página

- **Protocol:** el selector lista todos los protocolos de ggwave 0.4.0: `AUDIBLE_NORMAL/FAST/FASTEST`, `ULTRASOUND_NORMAL/FAST/FASTEST` y `DT_NORMAL/FAST/FASTEST` (los `CUSTOM_*` se ocultan). El receptor decodifica cualquier protocolo; el selector solo afecta al envío.
- **Payload:** 125 bytes de ASCII imprimible, pseudoaleatorios con semilla = número de intento (1-10). Los dos teléfonos generan el mismo payload, así el receptor marca `Match: yes` e `Intento: N` sin copiar nada. Es ASCII y no binario porque `encode` recibe un `std::string`; los bytes > 127 podrían cambiar al pasar por UTF-8. Lo que se mide es lo mismo: el tamaño y la duración.
- **Seconds:** el emisor muestra la duración del audio y el tiempo hasta que termina. El receptor muestra los segundos desde que se pulsó *Escuchar* o desde la recepción anterior.
- El micrófono se abre sin `echoCancellation`, `noiseSuppression` ni `autoGainControl`, porque esos filtros dañan la señal FSK.

## Cómo la sirve Fer por HTTPS

`getUserMedia` solo funciona en un contexto seguro (HTTPS o `localhost`). Si los teléfonos abren `http://IP-de-la-laptop`, el micrófono no se puede usar. La página muestra `Secure context: true/false`.

1. Desde la raíz del repo, en la laptop: `python3 -m http.server 8000 --directory spikes/ggwave`
2. Abrir un túnel HTTPS gratis sin cuenta, por ejemplo `cloudflared tunnel --url http://localhost:8000` (imprime una URL `https://*.trycloudflare.com`). Otra opción: `npx localtunnel --port 8000`.
3. Abrir esa URL en Chrome en los dos Android. Debe decir `Secure context: true`. Aceptar el permiso de micrófono en el receptor.
4. Volumen del emisor: multimedia al máximo y `Volume` 50 en la página (subir a 100 si no llega).

Alternativa sin internet: `adb reverse tcp:8000 tcp:8000` con un USB por teléfono, y abrir `http://localhost:8000` (también es un contexto seguro).

## Protocolo de prueba

Por cada fila: el receptor pulsa *Escuchar* y el emisor envía los intentos 1 a 10. Un intento es éxito si el receptor marca `Match: yes` con ese número de intento antes de 2× la duración del audio. Si no aparece nada, cuenta como fallo. Anotar la mediana de segundos (duración del audio en el emisor) y el ruido del salón (silencio / charla / ruido del evento).

## Línea base (sin aire)

Loopback dentro de Chromium headless (encode → decode con la misma instancia, sin altavoz ni micrófono, 48 kHz). Los 125 bytes se decodificaron bien en los 4 protocolos probados. Duración del audio: `AUDIBLE_NORMAL` 12.2 s, `AUDIBLE_FAST` 8.4 s, `AUDIBLE_FASTEST` 4.5 s, `ULTRASOUND_FAST` 8.4 s. Es el mínimo teórico por intento; no dice nada de la fiabilidad por aire.

## Resultados

PENDIENTE: los llena Fer (líder) con Yojan, en los dispositivos reales. No hay resultados inventados aquí.

| Protocol | Distancia | Ruido del salón | Éxitos / 10 | Segundos (mediana) | Teléfonos | Notas |
|---|---|---|---|---|---|---|
| AUDIBLE_NORMAL | 30 cm | PENDIENTE | PENDIENTE | PENDIENTE | PENDIENTE | |
| AUDIBLE_NORMAL | 1 m | PENDIENTE | PENDIENTE | PENDIENTE | PENDIENTE | |
| AUDIBLE_FAST | 30 cm | PENDIENTE | PENDIENTE | PENDIENTE | PENDIENTE | |
| AUDIBLE_FAST | 1 m | PENDIENTE | PENDIENTE | PENDIENTE | PENDIENTE | |
| AUDIBLE_FASTEST | 30 cm | PENDIENTE | PENDIENTE | PENDIENTE | PENDIENTE | |
| AUDIBLE_FASTEST | 1 m | PENDIENTE | PENDIENTE | PENDIENTE | PENDIENTE | |
| ULTRASOUND_NORMAL | 30 cm | PENDIENTE | PENDIENTE | PENDIENTE | PENDIENTE | |
| ULTRASOUND_NORMAL | 1 m | PENDIENTE | PENDIENTE | PENDIENTE | PENDIENTE | |
| ULTRASOUND_FAST | 30 cm | PENDIENTE | PENDIENTE | PENDIENTE | PENDIENTE | |
| ULTRASOUND_FAST | 1 m | PENDIENTE | PENDIENTE | PENDIENTE | PENDIENTE | |
| ULTRASOUND_FASTEST | 30 cm | PENDIENTE | PENDIENTE | PENDIENTE | PENDIENTE | |
| ULTRASOUND_FASTEST | 1 m | PENDIENTE | PENDIENTE | PENDIENTE | PENDIENTE | |

(Los protocolos `DT_*` son opcionales: sirven si ninguno de arriba llega a 7/10.)

## Decisión

PENDIENTE: el protocolo elegido (el más rápido con ≥ 7/10 a 1 m con ruido del evento), o **"QR only"** si ninguno llega a 7/10.
