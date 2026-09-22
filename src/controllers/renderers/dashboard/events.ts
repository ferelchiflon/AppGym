/**
 * src/controllers/renderers/dashboard/events.ts
 * Wiring de eventos del Dashboard: conecta los listeners del contenedor
 * renderizado con los métodos del controlador. Extraído de
 * DashboardController._bindActions (Fase 2) para dejar el controlador delgado.
 *
 * Sin estado propio: recibe el controlador (`c`), que expone `container`,
 * `cardio`, `_quickStartModo` y los métodos de acción (`_ir`, `_marcarStar`,
 * `_guardarWellness`, `_guardarNutricion`, `_iniciarRutina`,
 * `_iniciarRutinaSugerida`, `render`). Reconstrucción idempotente: el
 * contenedor se re-renderiza completo y los listeners viejos mueren con el
 * DOM viejo.
 */
import { Toast } from "../../../toast.js";
import { ExerciseGuide } from "../../../components/exercise-guide.js";
import { CardioForm } from "../../../components/cardio-form.js";
import { GestorTimer } from "../../../gestor-timer.js";
import { WELLNESS_KEYS } from "./common.ts";
import { DashboardController } from "../../dashboard.controller";

/** Vincula todos los eventos tras renderizar. Recibe el DashboardController. */
export function bindDashboardActions(c: DashboardController): void {
  const container: HTMLElement = c.container;
  const qs = (id: string): Element | null => container.querySelector(id);

  const quick = qs("#quickStartBtn");
  if (quick) {
    quick.addEventListener("click", () => {
      // "Continuar rutina de hoy" ya está armada → solo navega.
      // Cualquier otro estado ("Iniciar mi primer entrenamiento" / "Iniciar
      // rutina sugerida") debe armar la rutina antes de navegar a Entrenar.
      if (c._quickStartModo === "continuar") c._iniciarRutina();
      else c._iniciarRutinaSugerida();
    });
  }

  const guardar = qs("#wellnessGuardarBtn");
  if (guardar) {
    guardar.addEventListener("click", () => {
      const valores: Record<string, number> = {};
      WELLNESS_KEYS.forEach((k: string) => {
        const group = container.querySelector(`.wellness-stars[data-var="${k}"]`);
        valores[k] = group ? group.querySelectorAll(".wstar.on").length : 1;
      });
      c._guardarWellness(valores);
    });
  }

  const ajFatiga = qs("#fatigaAjustarBtn");
  if (ajFatiga) ajFatiga.addEventListener("click", () => c._ir("profile", true));
  const ajWell = qs("#wellnessAjustarBtn");
  if (ajWell) ajWell.addEventListener("click", () => c._ir("profile", true));

  // Botón del estado vacío: navega al formulario de wellness (tab perfil).
  const irRegistrar = qs("#wellnessIrRegistrarBtn");
  if (irRegistrar) irRegistrar.addEventListener("click", () => c._ir("profile", true));

  // Botón "+ Registrar cardio": abre el modal para registrar una sesión.
  const cardioBtn = qs("#cardioRegistrarBtn");
  if (cardioBtn) {
    cardioBtn.addEventListener("click", () => {
      if (!c.cardio) return;
      CardioForm.abrir(c.cardio, { onGuardado: () => c.render() });
    });
  }

  container.querySelectorAll(".wstar").forEach((star: Element) =>
    star.addEventListener("click", () => c._marcarStar(star as HTMLElement))
  );

  container.querySelectorAll("#goPeriodizacionBtn").forEach((b: Element) =>
    b.addEventListener("click", () => c._ir("history", true))
  );
  const sug = qs("#sugerenciaBtn");
  if (sug) sug.addEventListener("click", () => c._iniciarRutinaSugerida());

  // Botón "Ver técnica": abre la guía del ejercicio guiado del día.
  container.querySelectorAll("#sugerenciaGuiaBtn").forEach((b: Element) => {
    b.addEventListener("click", () => {
      const id = b.getAttribute("data-ej-id");
      if (!id) return;
      if (!ExerciseGuide.abrirPorEjercicio(id)) {
        Toast.mostrar("Este ejercicio todavía no tiene guía técnica", "warning");
      }
    });
  });

  // Stepper de nutrición (+/- comidas)
  container.querySelectorAll('.stepper-chip[data-step-target="nutricionComidas"]').forEach((btn: Element) => {
    btn.addEventListener("click", (e: Event) => {
      e.preventDefault();
      const inputEl = container.querySelector("#nutricionComidas");
      if (!inputEl) return;
       const input = inputEl as HTMLInputElement;
       const stepValAttr = btn.getAttribute("data-step-val");
        const stepVal = stepValAttr ? parseFloat(stepValAttr) : 0;
      const current = parseInt(input.value, 10) || 0;
      const next = Math.max(0, Math.min(8, Math.round(current + stepVal)));
      input.value = String(next);
      input.dispatchEvent(new Event("input", { bubbles: true }));
      GestorTimer?.vibrarCorto?.();
    });
  });

  // Chips toggle de proteína y agua
  ["#nutricionProteinaBtn", "#nutricionAguaBtn"].forEach((id: string) => {
    const btn = qs(id);
    if (btn) {
      btn.addEventListener("click", () => {
        const pressed = btn.getAttribute("aria-pressed") === "true";
        btn.setAttribute("aria-pressed", String(!pressed));
        btn.classList.toggle("is-active", !pressed);
        GestorTimer?.vibrarCorto?.();
      });
    }
  });

  // Guardar nutrición
  const guardarNutricion = qs("#nutricionGuardarBtn");
  if (guardarNutricion) {
    guardarNutricion.addEventListener("click", () => {
      const inputEl = container.querySelector("#nutricionComidas");
       if (!inputEl) return;
       const input = inputEl as HTMLInputElement;
      const comidas = input ? parseInt(input.value, 10) || 0 : 0;
      const protBtn = qs("#nutricionProteinaBtn");
      const aguaBtn = qs("#nutricionAguaBtn");
      const proteina = protBtn ? protBtn.getAttribute("aria-pressed") === "true" : false;
      const agua = aguaBtn ? aguaBtn.getAttribute("aria-pressed") === "true" : false;
      c._guardarNutricion({ comidas, proteina, agua });
    });
  }
}
