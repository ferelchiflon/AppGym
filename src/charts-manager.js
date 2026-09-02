/**
 * src/charts-manager.js
 * Renderizado de gráficos con Chart.js (cargado bajo demanda vía import dinámico).
 * Code-splitting: este módulo y chart.js se cargan solo cuando se hace scroll
 * hasta la sección "Progreso" (ver app.js → _cargarModuloCharts).
 */

let _ChartPromise = null;

/**
 * Carga lazy modular de Chart.js con tree-shaking para reducir tamaño de bundle.
 */
function _loadChart() {
    if (!_ChartPromise) {
        _ChartPromise = import('chart.js').then((mod) => {
            const {
                Chart,
                LineController,
                BarController,
                CategoryScale,
                LinearScale,
                PointElement,
                LineElement,
                BarElement,
                Tooltip,
                Legend,
                Filler
            } = mod;
            Chart.register(
                LineController,
                BarController,
                CategoryScale,
                LinearScale,
                PointElement,
                LineElement,
                BarElement,
                Tooltip,
                Legend,
                Filler
            );
            return Chart;
        });
    }
    return _ChartPromise;
}

export const ChartsManager = {
    _charts: {},
    _Chart: null,

    _colores: {
        linea: '#C6FF3D',
        grilla: 'rgba(255, 255, 255, 0.07)',
        texto: 'rgba(154, 164, 189, 0.92)',
        barras: ['#C6FF3D', '#7DB7FF', '#54E08A', '#FFCB52', '#FF7A7A', '#3b8ea5'],
    },

    _destruir(id) {
        if (this._charts[id]) {
            this._charts[id].destroy();
            delete this._charts[id];
        }
    },

    /**
     * Asegura que Chart.js esté cargado. Devuelve la clase Chart o null si falla.
     */
    async _getChart() {
        try {
            if (!this._Chart) {
                this._Chart = await _loadChart();
            }
            return this._Chart;
        } catch (e) {
            console.error('No se pudo cargar Chart.js', e);
            return null;
        }
    },

    async renderProgresoRM(canvasId, datosProgreso, nombreEjercicio) {
        this._destruir(canvasId);
        const ctx = document.getElementById(canvasId);
        const Chart = await this._getChart();
        if (!ctx || !Chart) return;

        if (!datosProgreso || datosProgreso.length === 0) {
            this._renderVacio(ctx, 'Sin sesiones guardadas todavía para este ejercicio');
            return;
        }
        this._ocultarVacio(ctx);

        this._charts[canvasId] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: datosProgreso.map(d => d.fechaISO),
                datasets: [{
                    label: `1RM estimado — ${nombreEjercicio}`,
                    data: datosProgreso.map(d => Math.round(d.rm * 10) / 10),
                    borderColor: this._colores.linea,
                    backgroundColor: 'rgba(17,17,17,0.06)',
                    borderWidth: 2,
                    tension: 0.25,
                    fill: true,
                    pointRadius: 3,
                    pointBackgroundColor: this._colores.linea,
                }],
            },
            options: this._opcionesBase('kg'),
        });
    },

    async renderVolumenPorMusculo(canvasId, volumenPorMusculo) {
        this._destruir(canvasId);
        const ctx = document.getElementById(canvasId);
        const Chart = await this._getChart();
        if (!ctx || !Chart) return;

        const entradas = Object.entries(volumenPorMusculo || {});
        if (entradas.length === 0) {
            this._renderVacio(ctx, 'Todavía no hay volumen registrado por grupo muscular');
            return;
        }
        this._ocultarVacio(ctx);

        this._charts[canvasId] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: entradas.map(([m]) => m),
                datasets: [{
                    label: 'Volumen (kg)',
                    data: entradas.map(([, v]) => Math.round(v)),
                    backgroundColor: this._colores.barras,
                    borderRadius: 4,
                    maxBarThickness: 42,
                }],
            },
            options: this._opcionesBase('kg', false),
        });
    },

    async renderVolumenPorSesion(canvasId, sesiones) {
        this._destruir(canvasId);
        const ctx = document.getElementById(canvasId);
        const Chart = await this._getChart();
        if (!ctx || !Chart) return;

        if (!sesiones || sesiones.length === 0) {
            this._renderVacio(ctx, 'Guardá tu primera sesión para ver la evolución de volumen');
            return;
        }
        this._ocultarVacio(ctx);

        this._charts[canvasId] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: sesiones.map(s => s.fechaISO),
                datasets: [{
                    label: 'Volumen semanal (kg)',
                    data: sesiones.map(s => Math.round(s.volumen)),
                    backgroundColor: 'rgba(125, 183, 255, 0.45)',
                    borderColor: '#7DB7FF',
                    borderRadius: 4,
                    maxBarThickness: 32,
                }],
            },
            options: this._opcionesBase('kg', false),
        });
    },

    async renderCorrelacionWellness(canvasId, analisis) {
        this._destruir(canvasId);
        const ctx = document.getElementById(canvasId);
        const Chart = await this._getChart();
        if (!ctx || !Chart) return;

        if (!analisis || !analisis.suficienteDatos) {
            this._renderVacio(ctx, 'Registrá wellness y sesiones el mismo día para ver la correlación (mínimo 2 cruces)');
            return;
        }
        this._ocultarVacio(ctx);

        const metricas = ['sueno', 'estres', 'doms', 'motivacion'];
        const labels = ['Sueño', 'Estrés', 'DOMS', 'Motivación'];
        const bajos = metricas.map(m => analisis[m].avgBajos !== null ? Math.round(analisis[m].avgBajos) : 0);
        const altos = metricas.map(m => analisis[m].avgAltos !== null ? Math.round(analisis[m].avgAltos) : 0);

        this._charts[canvasId] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [
                    { label: 'Score bajo (≤2/5)', data: bajos, backgroundColor: '#FDEBEC', borderColor: '#9F2F2D', borderWidth: 1, borderRadius: 4 },
                    { label: 'Score alto (≥4/5)', data: altos, backgroundColor: '#EDF3EC', borderColor: '#346538', borderWidth: 1, borderRadius: 4 },
                ],
            },
            options: this._opcionesBase('kg de volumen prom.', false),
        });
    },

    async renderGraficoACWR(canvasId, acwrData) {
        const Chart = await this._getChart();
        if (!Chart) return;

        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        this._destruir(canvasId);

        if (!acwrData || !acwrData.serieHistorica || acwrData.serieHistorica.length === 0) {
            this._renderVacio(canvas, 'Sin suficientes datos de carga interna para graficar ACWR.');
            return;
        }
        this._ocultarVacio(canvas);

        const ctx = canvas.getContext('2d');
        const labels = acwrData.serieHistorica.map(d => d.fecha);
        const cargas = acwrData.serieHistorica.map(d => d.cargaDia);
        const aguda = acwrData.serieHistorica.map(d => d.cargaAguda);
        const cronica = acwrData.serieHistorica.map(d => d.cargaCronica);

        this._charts[canvasId] = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Carga Diaria (sRPE UA)',
                        type: 'bar',
                        data: cargas,
                        backgroundColor: 'rgba(125, 183, 255, 0.28)',
                        borderColor: '#7DB7FF',
                        borderWidth: 1,
                        borderRadius: 3,
                        yAxisID: 'y',
                    },
                    {
                        label: 'Carga Aguda 7d',
                        type: 'line',
                        data: aguda,
                        borderColor: '#FFCB52',
                        backgroundColor: 'rgba(255, 203, 82, 0.12)',
                        borderWidth: 2,
                        tension: 0.3,
                        yAxisID: 'y',
                    },
                    {
                        label: 'Carga Crónica 28d',
                        type: 'line',
                        data: cronica,
                        borderColor: '#54E08A',
                        backgroundColor: 'rgba(84, 224, 138, 0.1)',
                        borderWidth: 2,
                        borderDash: [5, 5],
                        tension: 0.3,
                        yAxisID: 'y',
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: true, labels: { color: this._colores.texto, font: { size: 10 } } },
                    tooltip: { padding: 8, backgroundColor: '#20283B' },
                },
                scales: {
                    x: { grid: { color: this._colores.grilla }, ticks: { color: this._colores.texto, font: { size: 9 } } },
                    y: { grid: { color: this._colores.grilla }, ticks: { color: this._colores.texto, font: { size: 9 } }, title: { display: true, text: 'Carga sRPE (UA)', color: this._colores.texto, font: { size: 9 } } }
                }
            }
        });
    },

    _opcionesBase(unidadY, mostrarLeyenda = true) {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: mostrarLeyenda, labels: { color: this._colores.texto, font: { size: 11 } } },
                tooltip: { padding: 10, backgroundColor: '#20283B' },
            },
            scales: {
                x: { grid: { color: this._colores.grilla }, ticks: { color: this._colores.texto, font: { size: 10 } } },
                y: { grid: { color: this._colores.grilla }, ticks: { color: this._colores.texto, font: { size: 10 } }, title: { display: true, text: unidadY, color: this._colores.texto, font: { size: 10 } } },
            },
        };
    },

    _renderVacio(canvasEl, mensaje) {
        const parent = canvasEl.parentElement;
        let placeholder = parent.querySelector('.chart-empty');
        if (!placeholder) {
            placeholder = document.createElement('div');
            placeholder.className = 'chart-empty empty-message';
            parent.appendChild(placeholder);
        }
        placeholder.textContent = mensaje;
        canvasEl.style.display = 'none';
        placeholder.style.display = 'block';
    },

    _ocultarVacio(canvasEl) {
        const parent = canvasEl.parentElement;
        const placeholder = parent.querySelector('.chart-empty');
        if (placeholder) placeholder.style.display = 'none';
        canvasEl.style.display = 'block';
    },
};
