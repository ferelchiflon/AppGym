/**
 * src/types/components.d.ts
 * Tipos fuertemente tipados para los componentes de UI reutilizables.
 * Consumo desde JS vía JSDoc (checkJs=false) o futuro TS.
 */

/** Props de src/components/Button.js. */
export interface ButtonProps {
  text?: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  loading?: boolean;
  icon?: HTMLElement | null;
  className?: string;
  onClick?: (event: MouseEvent) => void;
}

/** Opciones de src/toast.js (Toast.mostrar / Toast.mostrarAccion). */
export interface ToastOptions {
  mensaje: string;
  accionLabel?: string;
  onAccion?: () => void;
  tipo?: 'info' | 'success' | 'warning' | 'error' | 'danger';
  duracionMs?: number;
}

/** Config de src/components/Timer.js (wrapper de GestorTimer). */
export interface TimerConfig {
  segundos?: number;
  onTick?: (restante: number) => void;
  onFinish?: () => void;
}

/** Token del tema de gráficos Chart.js (alineado al DS lima + Oswald). */
export interface ChartThemeTokens {
  linea: string;
  grilla: string;
  texto: string;
  fuente: string;
  gradienteInicio: string;
  gradienteFin: string;
}