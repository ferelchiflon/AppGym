import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Utils } from '../src/utils.js';

describe('Utils.clamp', () => {
  it('should return the value itself if it is within the range', () => {
    expect(Utils.clamp(5, 1, 10)).toBe(5);
    expect(Utils.clamp(0, -5, 5)).toBe(0);
  });

  it('should return the minimum value if the value is below the minimum', () => {
    expect(Utils.clamp(-2, 1, 10)).toBe(1);
    expect(Utils.clamp(-10, -5, 5)).toBe(-5);
  });

  it('should return the maximum value if the value is above the maximum', () => {
    expect(Utils.clamp(12, 1, 10)).toBe(10);
    expect(Utils.clamp(8, -5, 5)).toBe(5);
  });

  it('should return the fixed value if min === max', () => {
    expect(Utils.clamp(10, 5, 5)).toBe(5);
    expect(Utils.clamp(0, 5, 5)).toBe(5);
    expect(Utils.clamp(5, 5, 5)).toBe(5);
  });
});

describe('Utils.promedio', () => {
  it('should calculate the average of numbers in an array correctly', () => {
    expect(Utils.promedio([10, 20, 30])).toBe(20);
    expect(Utils.promedio([5, 5, 5, 5])).toBe(5);
    expect(Utils.promedio([1.5, 2.5])).toBe(2);
  });

  it('should handle empty arrays without throwing division by zero and return 0', () => {
    // Comportamiento explícito documentado: devuelve 0
    let result;
    expect(() => {
      result = Utils.promedio([]);
    }).not.toThrow();
    expect(result).toBe(0);
  });
});

describe('Utils.generarId', () => {
  it('should generate distinct IDs on consecutive calls', () => {
    const id1 = Utils.generarId();
    const id2 = Utils.generarId();
    expect(id1).not.toBe(id2);
  });

  it('should not collide over 1000 iterations', () => {
    const ids = new Set();
    for (let i = 0; i < 1000; i++) {
      const id = Utils.generarId();
      expect(ids.has(id)).toBe(false);
      ids.add(id);
    }
    expect(ids.size).toBe(1000);
  });
});

describe('Utils.fechaFormateada', () => {
  it('should format a known fixed date in es-ES locale format', () => {
    const date = new Date('2026-08-18T10:30:00');
    const formatted = Utils.fechaFormateada(date);
    
    // El formato de salida depende de la plataforma/Node.js, pero suele contener "18/08/2026" y "10:30"
    // Reemplazamos espacios duros (\u202f o \u00a0) por espacios comunes para comparar de manera robusta
    const normalized = formatted.replace(/[\s\u202f\u00a0]+/g, ' ');
    
    // Verificamos partes clave para garantizar compatibilidad con variaciones regionales o de entornos de Node.js
    expect(normalized).toContain('18/08/2026');
    expect(normalized).toContain('10:30');
  });
});

describe('Utils.fechaISO', () => {
  it('should return YYYY-MM-DD from a fixed UTC date', () => {
    const date = new Date('2026-08-18T10:30:00Z');
    expect(Utils.fechaISO(date)).toBe('2026-08-18');
  });
});

describe('Utils.redondearIncremento', () => {
  it('should round correctly with default increment of 1.25', () => {
    // Math.round(23.4 / 1.25) * 1.25 = Math.round(18.72) * 1.25 = 19 * 1.25 = 23.75
    expect(Utils.redondearIncremento(23.4)).toBe(23.75);
    
    // Math.round(24.0 / 1.25) * 1.25 = Math.round(19.2) * 1.25 = 19 * 1.25 = 23.75
    expect(Utils.redondearIncremento(24.0)).toBe(23.75);

    // Math.round(24.4 / 1.25) * 1.25 = Math.round(19.52) * 1.25 = 20 * 1.25 = 25.0
    expect(Utils.redondearIncremento(24.4)).toBe(25);
  });

  it('should round correctly with custom increment', () => {
    expect(Utils.redondearIncremento(11, 5)).toBe(10);
    expect(Utils.redondearIncremento(13, 5)).toBe(15);
  });
});

describe('Utils.debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should not call the function before the timeout is completed', () => {
    const fn = vi.fn();
    const debounced = Utils.debounce(fn, 100);

    debounced();
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(99);
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should restart the timer if called again within the timeout window', () => {
    const fn = vi.fn();
    const debounced = Utils.debounce(fn, 100);

    debounced();
    vi.advanceTimersByTime(50);
    expect(fn).not.toHaveBeenCalled();

    debounced(); // Reinicia el temporizador
    vi.advanceTimersByTime(50);
    expect(fn).not.toHaveBeenCalled(); // No se debe haber llamado todavía

    vi.advanceTimersByTime(50); // Pasan los 100ms totales de la última llamada
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should pass arguments correctly to the debounced function', () => {
    const fn = vi.fn();
    const debounced = Utils.debounce(fn, 100);

    debounced('hello', 42);
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledWith('hello', 42);
  });
});
