/**
 * src/views/progress.js
 * Vista parcial (template string) extraída de index.html.
 * NO editar inline: es mantenida por la estructura modular de vistas.
 */
export default `    <section id="tab-progress" class="tab-pane" aria-labelledby="nav-tab-progress">
        <div class="card" id="graficosCard">
            <h2>Evolución y Rendimiento</h2>

            <label for="chartEjercicioSelect">1RM estimado en el tiempo</label>
            <select id="chartEjercicioSelect"></select>
            <div class="chart-wrap">
                <canvas id="chartRM"></canvas>
            </div>

            <div class="grid-2 mt-1">
                <div>
                    <label>Volumen por grupo muscular (histórico)</label>
                    <div class="chart-wrap chart-wrap-sm">
                        <canvas id="chartVolumenMusculo"></canvas>
                    </div>
                </div>
                <div>
                    <label>Volumen por sesión (últimas 10)</label>
                    <div class="chart-wrap chart-wrap-sm">
                        <canvas id="chartVolumenSesion"></canvas>
                    </div>
                </div>
            </div>

            <label class="mt-1">Correlación wellness ↔ rendimiento</label>
            <div class="chart-wrap chart-wrap-sm">
                <canvas id="chartWellness"></canvas>
            </div>
            <div class="mt-1" id="wellnessInsight"></div>
        </div>

        <!-- LANDMARKS DE VOLUMEN (MEV / MAV / MRV) -->
        <div class="card" id="landmarksCard">
            <h2>Landmarks de Volumen Semanal (MEV / MAV / MRV)</h2>
            <p class="small-note-inline">Control científico de series efectivas (RPE ≥ 7 o RIR ≤ 3) en los últimos 7 días respecto a umbrales de adaptación.</p>
            <div id="landmarksContainer" class="mt-1"></div>
        </div>

        <!-- PROGRESO ACUMULADO -->
        <div class="card" id="progresoAcumuladoCard">
            <h2>Progreso acumulado</h2>
            <div class="stats-grid">
                <div class="stat-box"><div class="number" id="fuerzaAcumulada">0</div><div class="label">Fuerza acum.</div></div>
                <div class="stat-box"><div class="number" id="kcalAcumuladas">0</div><div class="label">Kcal acum.</div></div>
                <div class="stat-box"><div class="number" id="volumenAcumulado">0</div><div class="label">Volumen acum.</div></div>
            </div>
            <button id="resetProgresoBtn" class="danger w-100 mt-1" type="button">Reiniciar progreso acumulado</button>
        </div>
    </section>
`;
