# Spike Web NFC: resultados (HACK-005)

**Estado: sin resultados todavía.** Esta tabla la llenan Fer (lead) y Yojan en el dispositivo. El agente no la llena.

## Cómo probar

1. Sirve `spikes/webnfc/index.html` por HTTPS. Web NFC no funciona por http, salvo en `localhost`. Puede ser con GitHub Pages, un túnel o el deploy de Render.
2. Ábrelo en Chrome para Android con NFC encendido.
3. Pulsa **1 · Escribir**, acerca el tag y anota lo que diga el log.
4. Pulsa **2 · Leer**, acerca el tag y anota `serialNumber`, los bytes, los ms y si `matches write` dice `true`.
5. En un navegador sin Web NFC (iPhone, escritorio) debe aparecer el mensaje rojo de "no tiene NDEFReader".

## Resultados

| Teléfono / Chrome | Tipo de tag | Escritura ok | Lectura ok | serialNumber visto | ms escribir | ms leer | Notas |
|---|---|---|---|---|---|---|---|
|  |  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |  |

## Decisión

band = PENDIENTE: Fer elige "NFC" o "printed QR" después de la prueba.
