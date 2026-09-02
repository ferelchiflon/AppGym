Modifica MÍNIMAMENTE:

- `src/app.js` → instanciar `DashboardController` y añadirlo al `AppNavigator`
- `index.html` → añadir la sección `<section id="tab-dashboard">` y el botón en `bottom-nav`
- `src/navigation/navigator.js` → añadir "dashboard" como tab válido

### B. Componentes Detallados

#### 1. DashboardHeader

- **Saludo dinámico**: "Buenos días, [Nombre]" / "Buenas tardes" / "Buenas noches" según hora local
- **Fecha formateada**: "Lunes, 31 de agosto" (en español, usando `Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })`)
- **Readiness Score**: Un círculo de progreso (SVG) con score 0-100 calculado como:
  - 40% wellness promedio últimos 3 días (sueño, estrés, DOMS, motivación) escalado a 0-100
  - 30% CMJ reciente vs. baseline (último mes)
  - 30% ACWR (si ACWR está entre 0.8-1.3 = 100pts, 1.3-1.5 = 70pts, >1.5 = 40pts, <0.8 = 60pts)
- Color del círculo: verde `#54E08A` si ≥70, amarillo `#FFD166` si 50-69, rojo `#FF7A7A` si <50
- **NO usar librerías externas** para el círculo. SVG puro con `<circle>` y `stroke-dasharray`.

#### 2. PeriodizationCard

- Mostrar el **bloque activo** actual del perfil (`perfil.bloques` o `periodizacion.bloqueActual`)
- Campos visibles:
  - Nombre del bloque (ej: "Bloque de fuerza — otoño")
  - Tipo (badge con color: Acumulación = azul, Intensificación = naranja, Realización = rojo, DUP = púrpura, Deload = gris)
  - "Semana X de Y" (calcular desde fecha de inicio del bloque)
  - Barra de progreso horizontal mostrando % completado del bloque
- Si no hay bloque activo, mostrar CTA: "Crear tu primer bloque de entrenamiento →" que navegue al tab Historial/Periodización

#### 3. git 

#### 4. NextWorkoutCard

- **La feature más importante del dashboard.** Debe ser la primera card visible tras el header.
- Lógica de sugerencia:
  1. Si hay una rutina activa no completada hoy → "Continuar rutina de hoy: [Nombre]" + lista de ejercicios pendientes
  2. Si no hay rutina pero hay bloque activo → sugerir el grupo muscular del día según el bloque (ej: "Hoy toca: Empuje (Pecho, Hombro, Tríceps)") + botón "Iniciar rutina sugerida"
  3. Si no hay bloque → "Entrenamiento libre" + botón "Crear rutina"
- **Quick-start**: Un botón grande `#C6FF3D` con texto negro "▶ Iniciar Entrenamiento" que:
  - En caso 1: navegue a tab Entrenar y auto-expanda la rutina
  - En caso 2: genere una rutina rápida con ejercicios del grupo muscular sugerido (usar `GestorRutina` para crear plantilla temporal)
  - En caso 3: navegue a tab Entrenar con lista vacía
- Mostrar **último entrenamiento** del grupo muscular sugerido: "Último: Press Banca 80kg x5 @ RPE 8 (hace 3 días)"

#### 5. VolumeLandmarks (MEV/MAV/MRV)

- Reutilizar la lógica existente de `landmarksContainer` pero en formato **visual tipo termómetro**
- Para cada grupo muscular entrenado en los últimos 7 días, mostrar una barra horizontal:
  - Zona gris (0 a MEV)
  - Zona azul (MEV a MAV) → "Zona efectiva"
  - Zona naranja (MAV a MRV) → "Zona máxima"
  - Zona roja (>MRV) → "Sobrecarga"
- El valor actual es un indicador deslizante (triángulo SVG) sobre la barra
- Mostrar solo los 4-6 grupos musculares más trabajados esta semana (para no saturar)
- Colapsable: "Ver todos los grupos musculares" para expandir

#### 6. QuickStatsRow

- Fila horizontal scrolleable (scroll-snap) con 4-5 tarjetas mini:
  1. **1RM Estimado**: El ejercicio con mejor 1RM reciente (ej: "Press Banca: 95kg") + flecha ↑↓ vs. semana pasada
  2. **Volumen Semanal**: Tonelaje total esta semana (kg levantados × reps) vs. semana anterior
  3. **Series Efectivas**: Series con RPE ≥ 7 esta semana
  4. **ACWR**: Ratio con color (verde/amarillo/rojo) + tooltip explicativo
  5. **Racha**: Días consecutivos entrenando (streak)
- Cada mini-card: fondo `var(--surface-alt)`, borde sutil, icono SVG inline (16x16), número grande, label pequeño

#### 7. RecentPRs

- Detectar PRs automáticamente del historial (comparar 1RM estimado de cada ejercicio vs. máximo histórico)
- Mostrar hasta 3 PRs recientes (últimos 14 días)
- Formato: "🎉 Nuevo PR en [Ejercicio]: [X]kg (+[Y]kg vs. anterior)"
- Si no hay PRs recientes, mostrar el PR más antiguo como motivación: "Tu mejor [Ejercicio]: [X]kg — ¿Listo para superarlo?"

#### 8. FatigueStatus

- Un banner condicional que aparece SOLO si hay señales de fatiga:
  - Wellness promedio < 2.5 últimos 3 días → "Fatiga acumulada detectada. Considera un deload o día de descanso activo."
  - ACWR > 1.5 → "Carga muy alta. Riesgo de lesión elevado. Reduce volumen un 20%."
  - CMJ último < 90% del baseline → "Potencia reducida. Tu sistema neuromuscular necesita recuperación."
- Estilo: banner con fondo `var(--danger-bg)`, borde izquierdo grueso `var(--danger-text)`, icono ⚠️
- Botón de acción: "Ajustar entrenamiento de hoy" (reduce RPE objetivo -0.5 o sugiere deload)

#### 9. WeeklyCalendarStrip

- Strip horizontal de 7 días (Lun-Dom) mostrando:
  - Día de la semana (abreviado: "Lun", "Mar"...)
  - Número del día
  - Indicador visual si hubo entrenamiento (punto verde) o no (vacío)
  - Día actual resaltado con borde `var(--accent)`
- Al hacer click en un día pasado con entrenamiento: navegar al historial filtrado por esa fecha
- Al hacer click en día futuro: mostrar tooltip con grupo muscular sugerido según bloque activo
- Scroll horizontal con `overflow-x: auto` y `scroll-snap-type: x mandatory`

### C. Reglas de Integración con Arquitectura Existente

1. **NO modificar `Store.js`, `PerfilAtleta.js`, `GestorRutina.js`, `GestorPeriodizacion.js`**

   - Solo leer de ellos mediante sus métodos públicos
   - Si necesitas un dato que no expone el modelo, crea un helper en `src/utils/dashboard-helpers.js`
2. **Patrón de controlador**

   - `DashboardController` debe seguir el mismo patrón que los existentes:

   ```js
   export class DashboardController {
     constructor({ app, el, rutina, periodizacion, perfil, timer }) {
       // ...
     }
     render() { /* Renderizar todo el dashboard */ }
     actualizarInstancias({ rutina, periodizacion, perfil }) { /* ... */ }
   }
   ```
