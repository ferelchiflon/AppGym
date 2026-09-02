type Listener<T = any> = (payload: T) => void;

export class EventBus {
  private listeners: Map<string, Set<Listener>> = new Map();

  on<T = any>(evento: string, callback: Listener<T>): () => void {
    if (!this.listeners.has(evento)) {
      this.listeners.set(evento, new Set());
    }
    this.listeners.get(evento)!.add(callback);
    return () => {
      this.listeners.get(evento)?.delete(callback);
    };
  }

  emit<T = any>(evento: string, payload?: T): void {
    this.listeners.get(evento)?.forEach((cb) => cb(payload));
  }

  // Método para limpiar todas las suscripciones (útil para tests)
  clear(): void {
    this.listeners.clear();
  }
}

// Eventos definidos:
// - 'serie:agregada' → { ejercicioId: string, serie: Serie }
// - 'serie:eliminada' → { ejercicioId: string, serieId: string }
// - 'sesion:guardada' → { sesion: SesionHistorial }
// - 'pr:detectado' → { ejercicioId: string, record: Record }
// - 'wellness:registrado' → { entry: WellnessEntry }
// - 'perfil:actualizado' → { perfil: PerfilCompleto }
// - 'rutina:cambiada' → { rutina: string[] }