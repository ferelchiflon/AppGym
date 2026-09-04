// tests/analytics.controller.test.js
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock dependencies – vi.mock is hoisted before imports
vi.mock('../src/store.js', () => ({
  Store: {
    on: vi.fn(),
    getEjerciciosDisponibles: vi.fn(() => [
      { id: 'sentadilla', nombre: 'Sentadilla' },
      { id: 'press_banca', nombre: 'Press de banca' },
    ]),
  },
}));

vi.mock('../src/charts-manager.js', () => ({
  ChartsManager: {
    renderProgresoRM: vi.fn(),
    renderVolumenPorMusculo: vi.fn(),
    renderVolumenPorSesion: vi.fn(),
    renderCorrelacionWellness: vi.fn(),
  },
}));

vi.mock('../src/wellness-correlation.js', () => ({
  WellnessCorrelation: {
    analizar: vi.fn(() => null),
  },
}));

vi.mock('../src/landmarks-volumen.js', () => ({
  VolumeLandmarks: {
    analizarSemana: vi.fn(() => ({})),
  },
}));

// Import AFTER vi.mock – Vitest hoists the mocks automatically
import { AnalyticsController } from '../src/controllers/analytics.controller.js';
import { WellnessCorrelation } from '../src/wellness-correlation.js';
import { VolumeLandmarks } from '../src/landmarks-volumen.js';

// Minimal DOM fixture for the controller
function createDomFixture() {
  const container = document.createElement('div');
  container.innerHTML = `
    <select class="chart-ejercicio-select"></select>
    <div class="landmarksContainer"></div>
    <div class="wellnessInsight"></div>
  `;
  return {
    chartEjercicioSelect: container.querySelector('.chart-ejercicio-select'),
    landmarksContainer: container.querySelector('.landmarksContainer'),
    wellnessInsight: container.querySelector('.wellnessInsight'),
  };
}

function createRutinaStub() {
  return {
    getProgresoRM: vi.fn(() => ({ data: [] })),
    getVolumenPorMusculoHistorico: vi.fn(() => ({ data: [] })),
    getVolumenPorSesion: vi.fn(() => ({ data: [] })),
    historial: [],
  };
}

function createPerfilStub() {
  return { data: { wellness: [] } };
}

describe('AnalyticsController', () => {
  let el, rutina, perfil, controller;

  beforeEach(() => {
    el = createDomFixture();
    rutina = createRutinaStub();
    perfil = createPerfilStub();
    vi.clearAllMocks();
    // Restore default return values after clearAllMocks wipes them
    VolumeLandmarks.analizarSemana.mockReturnValue({});
    WellnessCorrelation.analizar.mockReturnValue(null);
    controller = new AnalyticsController({ el, rutina, perfil });
  });

  it('binds change event to renderRM', () => {
    const renderRMSpy = vi.spyOn(controller, 'renderRM');
    el.chartEjercicioSelect.dispatchEvent(new Event('change'));
    expect(renderRMSpy).toHaveBeenCalled();
  });

  it('render invokes all sub‑render methods', () => {
    const spyLandmarks = vi.spyOn(controller, 'renderLandmarks');
    const spyRM = vi.spyOn(controller, 'renderRM');
    const spyVol = vi.spyOn(controller, 'renderVolumen');
    const spyWellness = vi.spyOn(controller, 'renderWellnessCorrelacion');
    controller.render();
    expect(spyLandmarks).toHaveBeenCalled();
    expect(spyRM).toHaveBeenCalled();
    expect(spyVol).toHaveBeenCalled();
    expect(spyWellness).toHaveBeenCalled();
  });

  describe('renderLandmarks', () => {
    it('shows empty message when no groups', () => {
      VolumeLandmarks.analizarSemana.mockReturnValue({});
      controller.renderLandmarks();
      const msg = el.landmarksContainer.querySelector('.empty-message');
      expect(msg).not.toBeNull();
      expect(msg.textContent).toContain('Registra sesiones');
    });

    it('renders legend and rows when groups exist', () => {
      const fakeGroups = {};
      for (let i = 0; i < 4; i++) {
        fakeGroups[`g${i}`] = {
          nombre: `G${i}`,
          total: 10,
          efectivas: 5,
          mrv: 100,
          mavMax: 80,
          mev: 50,
          estado: 'sub_mev',
          etiqueta: 'label',
        };
      }
      VolumeLandmarks.analizarSemana.mockReturnValue(fakeGroups);
      controller.renderLandmarks();
      const rows = el.landmarksContainer.querySelectorAll('.vl-row');
      expect(rows.length).toBe(4);
      const legend = el.landmarksContainer.querySelector('.vl-legend');
      expect(legend).not.toBeNull();
    });

    it('renders toggle when many groups', () => {
      const fakeGroups = {};
      for (let i = 0; i < 8; i++) {
        fakeGroups[`g${i}`] = {
          nombre: `G${i}`,
          total: 10,
          efectivas: 5,
          mrv: 100,
          mavMax: 80,
          mev: 50,
          estado: 'sub_mev',
          etiqueta: 'label',
        };
      }
      VolumeLandmarks.analizarSemana.mockReturnValue(fakeGroups);
      controller.renderLandmarks();
      const toggle = el.landmarksContainer.querySelector('.vl-toggle');
      expect(toggle).not.toBeNull();
      const hiddenRows = el.landmarksContainer.querySelectorAll('.vl-row--hidden');
      expect(hiddenRows.length).toBeGreaterThan(0);
    });

    it('toggle button expands and collapses hidden rows', () => {
      const fakeGroups = {};
      for (let i = 0; i < 8; i++) {
        fakeGroups[`g${i}`] = {
          nombre: `G${i}`,
          total: 10,
          efectivas: 5,
          mrv: 100,
          mavMax: 80,
          mev: 50,
          estado: 'sub_mev',
          etiqueta: 'label',
        };
      }
      VolumeLandmarks.analizarSemana.mockReturnValue(fakeGroups);
      controller.renderLandmarks();
      const toggle = el.landmarksContainer.querySelector('.vl-toggle');
      // Click to expand
      toggle.click();
      expect(toggle.textContent).toContain('Ocultar');
      // Click to collapse
      toggle.click();
      expect(toggle.textContent).toContain('Ver todos');
    });
  });

  describe('renderWellnessCorrelacion', () => {
    it('displays note when analisis is null', () => {
      WellnessCorrelation.analizar.mockReturnValue(null);
      controller.renderWellnessCorrelacion();
      const note = el.wellnessInsight.querySelector('.small-note');
      expect(note).not.toBeNull();
      expect(note.textContent).toContain('Se necesitan al menos 2 sesiones');
    });

    it('displays note when insufficient data', () => {
      WellnessCorrelation.analizar.mockReturnValue({ suficienteDatos: false, cruces: 1 });
      controller.renderWellnessCorrelacion();
      const note = el.wellnessInsight.querySelector('.small-note');
      expect(note).not.toBeNull();
      expect(note.textContent).toContain('Se necesitan al menos 2 sesiones');
    });

    it('renders insight lines when data sufficient', () => {
      const mockAnalisis = {
        suficienteDatos: true,
        sueno: { diffPct: 12 },
        estres: { diffPct: -5 },
        doms: { diffPct: 0 },
        motivacion: { diffPct: null },
      };
      WellnessCorrelation.analizar.mockReturnValue(mockAnalisis);
      controller.renderWellnessCorrelacion();
      const lines = el.wellnessInsight.querySelectorAll('.insight-linea');
      expect(lines.length).toBe(3);
    });

    it('shows fallback when all diffPct are null', () => {
      const mockAnalisis = {
        suficienteDatos: true,
        sueno: { diffPct: null },
        estres: { diffPct: null },
        doms: { diffPct: null },
        motivacion: { diffPct: null },
      };
      WellnessCorrelation.analizar.mockReturnValue(mockAnalisis);
      controller.renderWellnessCorrelacion();
      const note = el.wellnessInsight.querySelector('.small-note');
      expect(note).not.toBeNull();
      expect(note.textContent).toContain('Datos insuficientes');
    });
  });

  describe('actualizarInstancias', () => {
    it('updates rutina and perfil and calls render', () => {
      const newRutina = createRutinaStub();
      const newPerfil = createPerfilStub();
      const renderSpy = vi.spyOn(controller, 'render');
      controller.actualizarInstancias({ rutina: newRutina, perfil: newPerfil });
      expect(controller.rutina).toBe(newRutina);
      expect(controller.perfil).toBe(newPerfil);
      expect(renderSpy).toHaveBeenCalled();
    });
  });

  describe('_crearFilaTermometro', () => {
    it('produces correct HTML structure', () => {
      const sample = {
        nombre: 'Pectoral',
        efectivas: 4,
        mrv: 120,
        mavMax: 90,
        mev: 60,
        estado: 'en_mav',
        etiqueta: 'En MAV',
      };
      const row = controller._crearFilaTermometro(sample);
      expect(row.classList.contains('vl-row')).toBe(true);
      expect(row.querySelector('.vl-muscle-name').textContent).toBe('Pectoral');
      expect(row.querySelector('.vl-series-count').textContent).toContain('4 series efectivas');
      expect(row.querySelector('.vl-status--en_mav')).not.toBeNull();
    });

    it('uses correct indicator color for sobre_mrv', () => {
      const sample = {
        nombre: 'Pectoral',
        efectivas: 25,
        mrv: 22,
        mavMax: 18,
        mev: 8,
        estado: 'sobre_mrv',
        etiqueta: 'Riesgo',
      };
      const row = controller._crearFilaTermometro(sample);
      expect(row.innerHTML).toContain('#FF7A7A');
    });
  });

  describe('_renderSelectorGrafico', () => {
    it('populates the select element with exercise options', () => {
      controller._renderSelectorGrafico();
      const options = el.chartEjercicioSelect.querySelectorAll('option');
      expect(options.length).toBe(2);
      expect(options[0].value).toBe('sentadilla');
      expect(options[1].textContent).toBe('Press de banca');
    });
  });
});
