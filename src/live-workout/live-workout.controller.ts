import { EventBus } from '../modules/Eventbus.js';

// Interfaces/Tipos base según el modelo de datos de tu app
export interface Ejercicio {
  id: string;
  name: string;
  metValue?: number;
}

export class Serie {
  constructor(
    public ejercicio: Ejercicio,
    public peso: number,
    public reps: number,
    public rpe: number,
    public rir: number,
    public notas: string
  ) {}
}

export class LiveWorkoutController {
  private eventBus = new EventBus();
  // Tipado explícito para corregir el error TS2322 (type 'never')
  private series: Serie[] = [];

  constructor() {
    this.series = [];
  }

  public agregarSerie(
    ejercicio: Ejercicio,
    peso: number,
    reps: number,
    rpe: number,
    rir: number,
    notas: string
  ): void {
    const nuevaSerie = new Serie(ejercicio, peso, reps, rpe, rir, notas);
    this.series.push(nuevaSerie);

    // Verificación de PR
    const esPR = this.comprobarPR(nuevaSerie);
    if (esPR) {
      this.eventBus.emit('pr:detectado', { ...nuevaSerie, pr: true });
    }

    this.guardarSeries();
  }

  private comprobarPR(_serie: Serie): boolean {
    // Ejemplo simplificado: calcula si la serie actual supera registros previos
    return false; 
  }

  private guardarSeries(): void {
    // Lógica de persistencia local (IndexedDB / LocalStorage)
    localStorage.setItem('series_activas', JSON.stringify(this.series));
  }

  public obtenerSeries(): Serie[] {
    return this.series;
  }
}