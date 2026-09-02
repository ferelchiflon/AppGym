import { describe, it, expect } from 'vitest';
import { PlateCalculator } from '../src/formulas.js';
import { CONFIG } from '../src/config.js';

describe('PlateCalculator', () => {
  // 1. Combinación óptima estándar
  it('should find the optimal standard plate combination', () => {
    // Objetivo: 100kg, Barra: 20kg. Sobran 80kg en total -> 40kg por lado.
    // Con discos estándar: [25, 20, 15, 10, 5, 2.5, 1.25, 1, 0.5]
    // 40kg por lado debería ser: 1x 25kg, 1x 15kg (25 + 15 = 40kg por lado).
    const result = PlateCalculator.calcular(100, 20);

    expect(result.alcanzable).toBe(true);
    expect(result.pesoTotal).toBe(100);
    expect(result.faltante).toBe(0);
    
    // Verificamos discos por lado de manera exacta
    expect(result.porLado).toEqual([
      { disco: 25, cantidad: 1 },
      { disco: 15, cantidad: 1 }
    ]);
  });

  // 2. Peso exacto no alcanzable
  it('should handle unachievable weights safely without infinite loops or exceptions', () => {
    // Objetivo: 100.3kg con discos por defecto (mínimo disco de 0.5kg)
    // El peso más cercano alcanzable debería ser 100.0kg (40kg por lado con 25+15)
    // porque con 0.5 por lado sumaría 101kg.
    // 100.3 - 20 = 80.3kg / 2 = 40.15kg por lado.
    // Al restar de mayor a menor:
    // 40.15 - 25 = 15.15
    // 15.15 - 15 = 0.15
    // Ya no caben más discos, por lo que quedan 0.15kg por lado.
    // Total logrado por lado = 40kg. Peso total logrado = 20 + 40 * 2 = 100kg.
    // Faltante = 100.3 - 100 = 0.3kg.
    const result = PlateCalculator.calcular(100.3, 20);

    expect(result.alcanzable).toBe(false);
    expect(result.pesoTotal).toBe(100);
    expect(result.faltante).toBe(0.3);
    expect(result.porLado).toEqual([
      { disco: 25, cantidad: 1 },
      { disco: 15, cantidad: 1 }
    ]);
  });

  // 3. Barra custom
  it('should adjust calculations correctly for a custom bar weight', () => {
    // Objetivo: 55kg, Barra: 15kg (barra olímpica de mujer).
    // Sobran 40kg -> 20kg por lado.
    // Con discos estándar: [25, 20, 15, 10, 5, 2.5, 1.25, 1, 0.5]
    // 20kg por lado debería ser: 1x 20kg.
    const result1 = PlateCalculator.calcular(55, 15);
    expect(result1.alcanzable).toBe(true);
    expect(result1.pesoTotal).toBe(55);
    expect(result1.porLado).toEqual([
      { disco: 20, cantidad: 1 }
    ]);

    // Objetivo: 30kg, Barra: 10kg (barra técnica).
    // Sobran 20kg -> 10kg por lado.
    // 10kg por lado debería ser: 1x 10kg.
    const result2 = PlateCalculator.calcular(30, 10);
    expect(result2.alcanzable).toBe(true);
    expect(result2.pesoTotal).toBe(30);
    expect(result2.porLado).toEqual([
      { disco: 10, cantidad: 1 }
    ]);
  });

  // 4. Objetivo menor o igual al peso de la barra
  it('should return empty plates when target weight is less than or equal to bar weight', () => {
    // Caso igual a la barra
    const resultEqual = PlateCalculator.calcular(20, 20);
    expect(resultEqual.alcanzable).toBe(true);
    expect(resultEqual.pesoTotal).toBe(20);
    expect(resultEqual.porLado).toEqual([]);
    expect(resultEqual.faltante).toBe(0);

    // Caso menor a la barra
    const resultLess = PlateCalculator.calcular(15, 20);
    expect(resultLess.alcanzable).toBe(false);
    expect(resultLess.pesoTotal).toBe(20);
    expect(resultLess.porLado).toEqual([]);
    expect(resultLess.faltante).toBe(0);
  });

  // 5. Discos disponibles limitados
  it('should restrict plate choices to only the provided custom subset of plates', () => {
    // Objetivo: 80kg, Barra: 20kg. Sobran 60kg -> 30kg por lado.
    // Usando solo discos de [20, 10]
    // 30kg por lado debería ser: 1x 20kg, 1x 10kg.
    const result = PlateCalculator.calcular(80, 20, [20, 10]);
    expect(result.alcanzable).toBe(true);
    expect(result.pesoTotal).toBe(80);
    expect(result.porLado).toEqual([
      { disco: 20, cantidad: 1 },
      { disco: 10, cantidad: 1 }
    ]);

    // Verificamos que si pedimos 90kg con barra de 20kg (70kg sobrante -> 35kg por lado)
    // Con [20, 10] solo puede hacer 1x 20kg, 1x 10kg (30kg por lado) = 80kg total.
    // Faltarían 10kg (5kg por lado), pero no hay disco de 5 ni 10 para completar el lado de forma exacta sin pasarse.
    const resultLimited = PlateCalculator.calcular(90, 20, [20, 10]);
    expect(resultLimited.alcanzable).toBe(false);
    expect(resultLimited.pesoTotal).toBe(80);
    expect(resultLimited.faltante).toBe(10);
    expect(resultLimited.porLado).toEqual([
      { disco: 20, cantidad: 1 },
      { disco: 10, cantidad: 1 }
    ]);
  });
});
