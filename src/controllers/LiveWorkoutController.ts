import { EventBus } from '../modules/Eventbus.js';
import { GestorRutina } from '../gestor-rutina.js';

export class LiveWorkoutController {
  private gestorRutina: GestorRutina;
  private eventBus: EventBus;
  private unsubscribers: Array<() => void> = [];

  constructor(gestorRutina: GestorRutina, eventBus: EventBus) {
    this.gestorRutina = gestorRutina;
    this.eventBus = eventBus;
    this.render();
  }

  private render(): void {
    // Renderizar UI de workout en vivo
    // ...
  }

  agregarSerie(ejercicioId: string, peso: number, reps: number, rpe?: number): void {
    const serie = this.gestorRutina.agregarSerie(ejercicioId, {
      peso,
      reps,
      rpe: (rpe ?? null) as null,
    });
    if (serie) {
      // Emitir evento DESPUÉS de persistir
      this.eventBus.emit('serie:agregada', { ejercicioId, serie });
    }
  }

  // ... resto de métodos

  dispose(): void {
    this.unsubscribers.forEach(unsub => unsub());
    this.unsubscribers = [];
  }
}