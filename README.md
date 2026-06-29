# Tercio: Sangre y Acero

**Tercio: Sangre y Acero** es un RPG de gestión histórica para navegador ambientado en la dura vida militar de los tercios españoles durante la época moderna temprana. El jugador encarna a un **bisono** (recluta novato) que debe sobrevivir al hambre, la fatiga, las heridas, el retraso en las pagas y las batallas para ganarse el honor y ascender de rango.

---

## ⚔️ Dirección de Diseño

- **Enfoque Web-First:** La interfaz principal del juego está construida enteramente en web moderna (Next.js, React y Tailwind CSS) en el directorio `/web`.
- **RPG de Gestión:** El bucle de juego gira en torno a la preparación del soldado (barracones, entrenamiento, inventario, equipo, armería, hospital y reportes) en lugar de la exploración libre.
- **Resolución de Misiones:** Combate resuelto mediante un motor de simulación con informes detallados del transcurso del combate.
- **Canvas Visual de Soporte:** Utilización de canvas (PIXI.js) para dar dinamismo visual al combate, duelos, avatares de personajes y mapas decorativos, sin comprometer la accesibilidad web general.
- **Tono Realista y Sólido:** Sin elementos fantásticos. Enfoque centrado en la crudeza histórica: barro, pólvora, lluvia, acero, deudas de honor y disciplina de hierro.

---

## 🚀 Características Clave Implementadas

1. **🗺️ Sistema de Misiones Basado en Mapa Interactivo:**
   - Mapa visual estructurado en nodos (ciudades, fortalezas, caminos, emboscadas y escaramuzas).
   - Rutas interconectadas que reflejan el avance militar en la región.
   - Selección táctica de misiones directamente sobre los nodos con visualización de dificultad, duración y posibles recompensas.

2. **🎒 Inventario y Equipo Drag-and-Drop:**
   - Mecánica fluida de arrastrar y soltar (Drag and Drop) para equipar y desequipar equipo de manera interactiva.
   - Espacios dedicados para cabeza (morrión), torso (coraza), jubón, botas, guantes, y armas principales (pica, espada, arcabuz).
   - Estadísticas dinámicas que se recalculan en tiempo real al equipar o desequipar objetos.

3. **🎬 Canvas de Resolución de Combate (PIXI.js):**
   - Animaciones bidimensionales y efectos visuales detallados que escenifican los combates.
   - Efectos sonoros integrados (choque de espadas, disparos de arcabuz, lluvia ambiental).
   - Secuencias de turnos y estados visuales (lluvia, barro, humo de pólvora) con lluvia de monedas y medallas de botín al finalizar la simulación.
   - Transición detallada entre la fase de combate y la lectura del reporte narrativo final.

4. **💬 Explicaciones mediante Tooltips Estilo Histórico:**
   - La interfaz se mantiene limpia eliminando textos explicativos redundantes.
   - Hover tooltips estilizados con bordes finos y estética medieval informan al jugador sobre el impacto de cada estadística (vigor, pica, disciplina, etc.) y los efectos de las heridas.

---

## 🛠️ Stack Tecnológico

- **Frontend:** Next.js (App Router), React, TypeScript, Tailwind CSS.
- **Animaciones & Gráficos:** PIXI.js, Pixi Viewport, GSAP y Motion.
- **Base de Datos & ORM:** PostgreSQL y Prisma ORM (con soporte para seeds JSON y base de datos relacional local).
- **Audio:** Howler.js / Pixi Sound.
- **Gestión de Paquetes:** `pnpm`.

---

## 📦 Banco de Assets (GPT-ASSETS)

`GPT-ASSETS` es la base canónica de imágenes y retratos del proyecto. Las imágenes se generan mediante IA (manteniendo la coherencia artística) y se indexan en un archivo JSON principal para que puedan consumirse de manera óptima por la aplicación Next.js.

### Mapa de Carpetas y Recursos

| Carpeta | Uso Principal |
| :--- | :--- |
| `GPT-ASSETS/CG/cg_events/` | Escenarios y fondos para misiones y eventos importantes (barracones, armería, hospital, caminos). |
| `GPT-ASSETS/CG/portraits/` | Retratos de personajes no jugadores (sargento, cirujano, armero, vivandera, capellán). |
| `GPT-ASSETS/CG/sprites_events/` | Recursos gráficos de soporte para eventos de interfaz. |
| `GPT-ASSETS/prota/` | Retratos y poses del protagonista (Diego de Arce). |
| `GPT-ASSETS/enemigos/` | Enemigos clasificados por facción (chusma, franceses, protestantes, turcos, etc.). |
| `GPT-ASSETS/armas/` | Iconos transparentes de espadas, picas, arcabuces y dagas. |
| `GPT-ASSETS/armadura/` | Morriones, corazas, jubones, calzas y botas militares. |
| `GPT-ASSETS/icons-ui/` | Iconos de interfaz (monedas, honor, fatiga, heridas, marcos y texturas). |

### Flujo de Sincronización de Assets

Cuando se añaden o modifican assets en `GPT-ASSETS`, se debe ejecutar el siguiente flujo para procesar las imágenes e indexarlas en la web:

```bash
# 1. Procesar y optimizar nuevos assets en la carpeta canónica
python scripts/process_gpt_assets.py --commit

# 2. Reconstruir el banco de assets general en JSON
python scripts/build_asset_bank.py

# 3. Sincronizar los archivos JSON y las imágenes con la carpeta pública de la web
node web/scripts/sync-data.mjs

# 4. Iniciar el entorno de desarrollo web
pnpm -C web dev
```

---

## 🏃 Configuración del Entorno Web

Para arrancar el cliente del juego en modo desarrollo:

```bash
cd web
pnpm install
pnpm prisma:generate
pnpm dev
```

El servidor local estará disponible en `http://localhost:3000/barracks`.

### Inicialización de la Base de Datos (Opcional):

```bash
pnpm db:push
pnpm db:seed
```

---

## 🧪 Pruebas y Validación

El proyecto cuenta con scripts automáticos para asegurar que los cambios no rompan el flujo de juego o la indexación de assets:

```bash
# Validar la integridad del banco de assets
python tests/validate_asset_bank.py

# Validar los archivos JSON del juego y dependencias
node tests/validate_tercio_refocus.js

# Validar el bucle de juego web MVP (acciones principales de soldado)
cd web
pnpm validate
pnpm build

# Ejecutar smoke E2E real contra localhost:3000
pnpm test:e2e
```

---

## 🛡️ Licencia y Propiedad del Código

Este repositorio está protegido. Todos los assets contenidos en `GPT-ASSETS` y el código del motor de combate son de uso interno para el desarrollo de **Tercio: Sangre y Acero**.
