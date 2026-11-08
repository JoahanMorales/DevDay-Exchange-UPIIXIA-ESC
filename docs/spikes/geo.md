# Spike GPS sin datos (HACK-007)

Pregunta (IDEA §5.3 y §5.10): ¿el celular da posición con GNSS en modo avión dentro del edificio, y con qué precisión? El pagador
rechaza si está a más de 50 m del reto del comercio.

`spikes/geo/index.html` (HTTPS o localhost): **Fijar punto aquí** en el mostrador, luego caminar y tocar **Fix** en modo avión.
Muestra lat/lon, precisión, segundos al fix y distancia al punto fijo; si falla, la última posición conocida con su antigüedad.

## Resultados (Fer lead con Yojan, dentro de la sede; por rellenar)
| Dispositivo | Navegador | Lugar | Segundos al fix | Precisión (m) | Distancia medida vs real (m) | Notas |
|---|---|---|---:|---:|---:|---|
| (pendiente) | Android Chrome | | | | | |
| (pendiente) | iPhone Safari | | | | | |

## Decisión (Fer, tras medir)
Elegir una línea: **fix ok** (precisión ≤ 25 m y fix < 30 s) · o **use last known position with visible age** (mostrar la antigüedad
de la última posición conocida en pantalla). Estado: PENDIENTE de medición humana.
