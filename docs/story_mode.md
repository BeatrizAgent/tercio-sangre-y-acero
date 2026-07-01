# Modo Historia

`/missions?mode=story` debe sentirse como una novela visual ligera, no como otra pantalla de gestion.

## Direccion UX

- Mantener HTML/React normal. No mover el modo historia a canvas.
- Primera impresion: escena grande, fondo visible, portraits grandes y caja de dialogo inferior.
- Las decisiones aparecen centradas en la escena, como overlay de novela visual.
- La caja inferior queda para narracion, dialogo o prompt corto. No usarla como panel de formulario pesado.
- HUD minimo: titulo de capitulo y boton `Saltar`; nada de paneles tutoriales largos.
- Capítulos y actos pueden usar rail con iconos del juego, pero no deben competir con la escena.

## Flujo Jugable

- Cap 1-3 pueden enseñar la mecanica con algo mas de friccion.
- Desde cap 4 en adelante, priorizar ritmo: leer, elegir, ver recompensa, avanzar.
- Evitar puzzles obligatorios despues del tutorial temprano.
- Si hay puzzle, debe ser breve, legible, con progreso claro y bloqueo obvio.
- Nunca dejar choices flotando fuera de la escena o mezcladas con texto de forma confusa.

## Decisiones

- Cada decision debe mostrar preview de recompensa antes de confirmar.
- Usar iconos del juego para premios y costes: XP, doblones, honor, fatiga, heridas, stats, items y equipo.
- Los botones de decision deben ser grandes, centrados y faciles de pulsar.
- Las opciones bloqueadas deben explicar en una linea por que no se pueden elegir.

## Recompensas

- Modo historia debe hacer subir al personaje de forma visible.
- Recompensas esperadas: XP, stats, honor, doblones, consumibles, armas, armadura o heridas.
- Al resolver, mostrar resumen claro: lo ganado/perdido/equipado y CTA para seguir.

## Tono

- Mantener barro, deuda, hambre, familia, disciplina y leva.
- SFW visual. Crueldad historica solo indirecta.
- Sin fantasia, sin tono heroico brillante, sin jerga moderna.

## Contrato de Mantenimiento

- No reintroducir puzzles duros o multiples en la segunda mitad del Acto 1.
- No convertir el modo historia en checklist de recursos.
- No poner explicaciones largas en pantalla si el icono/recompensa ya comunica la accion.
- Validar cambios con:

```bash
pnpm --dir web exec tsc --noEmit
pnpm --dir web test:domain
pnpm --dir web test:ux
pnpm --dir web validate
```
