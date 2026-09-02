import { describe, it, expect } from 'vitest';
import { FormulasRM, PlateCalculator } from '../src/formulas.js';

// Tests for FormulasRM
describe('FormulasRM', () => {
  it('epley calculates correctly', () => {
    const result = FormulasRM.epley(100, 5);
    expect(result).toBeCloseTo(116.66666666666667);
  });

  it('brzycki calculates correctly for reps <= 10', () => {
    const result = FormulasRM.brzycki(100, 5);
    // brzycki formula: peso * (36 / (37 - reps)) when reps <= 10
    // 100 * (36 / (37 - 5)) = 100 * (36 / 32) = 112.5
    expect(result).toBeCloseTo(112.5);
  });

  it('brzycki falls back to epley for reps > 10', () => {
    const result1 = FormulasRM.brzycki(100, 12);
    const result2 = FormulasRM.epley(100, 12);
    expect(result1).toBeCloseTo(result2);
  });

  it('lombardi calculates correctly', () => {
    const result = FormulasRM.lombardi(100, 5);
    // lombardi: peso * reps^0.10
    // 100 * Math.pow(5, 0.10) ≈ 117.46
    expect(result).toBeCloseTo(117.46, 2);
    expect(result).toBeGreaterThan(100);
  });

  it('calcularTodos returns all formulas and an average', () => {
    const result = FormulasRM.calcularTodos(100, 5);
    expect(result).toHaveProperty('epley');
    expect(result).toHaveProperty('brzycki');
    expect(result).toHaveProperty('lombardi');
    expect(result).toHaveProperty('promedio');
    // average should be roughly the mean of epley and brzycki
    const avg = (result.epley + result.brzycki + result.lombardi) / 3;
    expect(result.promedio).toBeCloseTo(avg, 5);
  });
});

// Tests for PlateCalculator
describe('PlateCalculator', () => {
  it('calcula desglose de discos para peso objetivo', () => {
    const result = PlateCalculator.calcular(150, 20, [10, 5, 2.5]);
    expect(result.alcanzable).toBe(true);
    expect(result.porLado).toHaveLength(2); // expects some plates on each side
    expect(result.faltante).toBe(0);
  });

  it('devuelve false cuando el peso objetivo es menor que la barra', () => {
    const result = PlateCalculator.calcular(15, 20);
    expect(result.alcanzable).toBe(false);
    expect(result.faltante).toBe(0);
    expect(result.porLado).toEqual([]);
  });
});