/**
 * src/utils/backup-reminder.ts
 * Recordatorio periódico de backup (toast con acción "Exportar backup ahora").
 *  - Caso 1: nunca hizo backup y pasaron 14+ días desde el primer registro
 *    (proxy: fecha más vieja del historial de todos los perfiles).
 *  - Caso 2: el último backup es más viejo que 30 días.
 * Extraído de dashboard.controller.js (Fase 2): el controlador sólo decide
 * CUÁNDO consultarlo (en su constructor) y la política vive con el resto de utils.
 */
import { Store } from "../store.js";
import { Toast } from "../toast.js";
import { Utils } from "../utils.ts";
import type { AppStoreData, PerfilAtletaData, SesionEntrenamiento } from "../types/gym.d.ts";

/** Fecha del registro más viejo del historial de todos los perfiles (proxy de "primer uso"). */
function fechaPrimerRegistro(): Date | null {
  const data: AppStoreData = Store.cargar();
  const perfiles = data.profiles || {};
  const historial: SesionEntrenamiento[] = Object.values(perfiles).flatMap((p: PerfilAtletaData) => p.historial || []);
  const fechas: Date[] = historial
    .filter((f: SesionEntrenamiento) => f && f.fecha)
    .map((f: SesionEntrenamiento) => new Date(f.fecha));
  if (fechas.length === 0) return null;
  return new Date(Math.min(...fechas.map(d => d.getTime())));
}

/** Exporta el backup completo (JSON) y avisa con un toast. */
function exportarBackupAhora(): void {
  const json = Store.exportarTodo();
  Utils.descargarArchivo("gympro_backup_completo.json", json);
  Toast.mostrar("Backup descargado con éxito", "success");
}

/** Muestra el toast de recordatorio de backup si corresponde (un toast por invocación). */
export function verificarYMostrarRecordatorioBackup(): void {
  // Caso 1: Nunca hizo backup Y ya pasaron 14 días desde el primer uso
  // (proxy: fecha más vieja del historial).
  const nuncaHizoBackup = Store.getUltimoBackup() === null;
  const primerUso = fechaPrimerRegistro();
  const catorceDiasMs = 14 * 24 * 60 * 60 * 1000;

  if (nuncaHizoBackup && primerUso && Date.now() - primerUso.getTime() > catorceDiasMs) {
    Toast.mostrarAccion({
      mensaje: "Hacé un backup de tus datos para no perderlos",
      accionLabel: "Exportar backup ahora",
      tipo: "info",
      onAccion: exportarBackupAhora,
      duracionMs: 0,
    });
    return;
  }

  // Caso 2: Ya hizo backup alguna vez pero pasaron más de 30 días desde el último.
  const ultimoBackup = Store.getUltimoBackup();
  const treintaDiasMs = 30 * 24 * 60 * 60 * 1000;

  if (ultimoBackup && Date.now() - Number(ultimoBackup) > treintaDiasMs) {
    Toast.mostrarAccion({
      mensaje: "Hace más de 30 días que no haces backup. Exportar backup ahora para tener una copia segura.",
      accionLabel: "Exportar backup ahora",
      tipo: "warning",
      onAccion: exportarBackupAhora,
      duracionMs: 0,
    });
  }
}
