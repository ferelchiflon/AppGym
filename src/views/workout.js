/**
 * src/views/workout.js
 * Vista parcial (template string) extraída de index.html.
 * NO editar inline: es mantenida por la estructura modular de vistas.
 */
export default `    <section id="tab-workout" class="tab-pane" aria-labelledby="nav-tab-workout">
        <div class="grid-2">
            <!-- RUTINA -->
            <div class="card" id="rutinaCard">
                <h2><span data-i18n="workout.titulo.rutina">Rutina de hoy</span> <span class="count-tag" id="ejerciciosCount">0</span></h2>

                <div class="flex-wrap">
                    <div>
                        <label for="filtroMusculoSelect">Grupo Muscular</label>
                        <select id="filtroMusculoSelect" aria-label="Filtrar por grupo muscular"></select>
                    </div>
                    <div>
                        <label for="filtroPatronSelect">Patrón Biomecánico</label>
                        <select id="filtroPatronSelect" aria-label="Filtrar por patrón de movimiento"></select>
                    </div>
                    <div style="grid-column: 1 / -1; width: 100%;">
                        <label for="ejercicioSelect">Ejercicio (+90 disponibles)</label>
                        <input type="search" id="ejercicioBusqueda" placeholder="🔎 Buscar por nombre o músculo (ej. press, pecho, espalda…)" autocomplete="off" aria-label="Buscar ejercicio por nombre o músculo">
                        <div class="exercise-picker-row">
                            <select id="ejercicioSelect" aria-label="Seleccionar ejercicio"></select>
                            <button id="guiaBtn" class="secondary guide-trigger" type="button" aria-label="Ver guía del ejercicio seleccionado">Guía</button>
                        </div>
                        <p class="small-note" id="ejercicioCountNote"></p>
                    </div>
                </div>

                <div class="row-buttons">
                    <button id="agregarEjercicioBtn" type="button">Agregar a rutina</button>
                    <button id="crearEjercicioBtn" class="secondary" type="button">+ Crear ejercicio</button>
                    <button id="guardarPlantillaBtn" class="secondary" type="button">Guardar como plantilla</button>
                    <button id="resetRutinaBtn" class="danger" type="button">Reiniciar</button>
                </div>

                <div class="badge-list mt-1" id="rutinaContainer"></div>

                <h3 class="plantillas-titulo">Plantillas guardadas</h3>
                <div class="badge-list mt-1" id="plantillasContainer"></div>

                <h3 class="plantillas-titulo">Plantillas predefinidas</h3>
                <div class="plantillas-predefinidas mt-1" id="plantillasPredefinidasContainer"></div>
            </div>

            <!-- REGISTRO DE SERIES -->
            <div class="card" id="seriesCard">
                <h2 data-i18n="workout.titulo.series">Registro de series</h2>

                <div id="serieForm" class="hidden">
                    <div class="flex-wrap">
                        <div class="input-stepper-wrap">
                            <label for="seriePeso">Peso (kg)</label>
                            <input type="number" id="seriePeso" step="0.5" min="0" placeholder="60" inputmode="decimal">
                            <div class="stepper-chips" role="group" aria-label="Ajuste rápido de peso">
                                <button type="button" class="stepper-chip" data-step-target="seriePeso" data-step-val="1.25">+1.25</button>
                                <button type="button" class="stepper-chip" data-step-target="seriePeso" data-step-val="2.5">+2.5</button>
                                <button type="button" class="stepper-chip" data-step-target="seriePeso" data-step-val="5">+5</button>
                                <button type="button" class="stepper-chip" data-step-target="seriePeso" data-step-val="-2.5">-2.5</button>
                            </div>
                        </div>
                        <div class="input-stepper-wrap">
                            <label for="serieReps">Reps</label>
                            <input type="number" id="serieReps" step="1" min="0" placeholder="8" inputmode="numeric">
                            <div class="stepper-chips" role="group" aria-label="Ajuste rápido de repeticiones">
                                <button type="button" class="stepper-chip" data-step-target="serieReps" data-step-val="1">+1</button>
                                <button type="button" class="stepper-chip" data-step-target="serieReps" data-step-val="-1">-1</button>
                            </div>
                        </div>
                        <div>
                            <label for="serieRPE">RPE</label>
                            <input type="number" id="serieRPE" step="0.5" min="1" max="10" placeholder="8" inputmode="decimal">
                        </div>
                        <div>
                            <label for="serieRIR">RIR</label>
                            <input type="number" id="serieRIR" step="0.5" min="0" max="10" placeholder="2" inputmode="decimal">
                        </div>
                    </div>
                    <label for="serieNotas">Notas</label>
                    <textarea id="serieNotas" rows="2" placeholder="Sensaciones, técnica, etc."></textarea>

                    <div class="row-buttons">
                        <button id="addSerieBtn" type="button">Agregar serie</button>
                        <button id="limpiarSeriesBtn" class="secondary" type="button">Limpiar series</button>
                    </div>
                    <button id="guardarSesionBtn" class="success w-100" type="button">Guardar sesión completa</button>

                    <div class="badge-list mt-1" id="seriesContainer"></div>

                    <div id="autoregSugerencia"></div>

                    <div class="stats-grid">
                        <div class="stat-box"><div class="number" id="rmEpley">--</div><div class="label">RM Epley</div></div>
                        <div class="stat-box"><div class="number" id="rmBrzycki">--</div><div class="label">RM Brzycki</div></div>
                        <div class="stat-box"><div class="number" id="rmLombardi">--</div><div class="label">RM Lombardi</div></div>
                        <div class="stat-box"><div class="number" id="rmPromedio">--</div><div class="label">RM Promedio</div></div>
                    </div>
                    <div id="rpePorcentajeDisplay" class="small-note-inline mt-1"></div>

                    <label for="rpeObjetivoInput">RPE objetivo (autorregulación)</label>
                    <input type="number" id="rpeObjetivoInput" step="0.5" min="1" max="10" value="8" inputmode="decimal">

                    <button id="calcularWarmUpBtn" class="secondary w-100 mt-1" type="button">Calcular calentamiento</button>
                    <div id="warmUpContainer" class="mt-1"></div>
                </div>
                <div id="serieFormEmpty" class="empty-message"></div>
            </div>

            <!-- CALCULADORA DE DISCOS -->
            <div class="card" id="discosCard">
                <h2>Calculadora de discos</h2>
                <div class="flex-wrap">
                    <div>
                        <label for="discoPesoObjetivo">Peso objetivo (kg)</label>
                        <input type="number" id="discoPesoObjetivo" step="0.5" min="0" placeholder="100" inputmode="decimal">
                    </div>
                    <div>
                        <label for="discoPesoBarra">Peso de la barra (kg)</label>
                        <input type="number" id="discoPesoBarra" step="0.5" min="0" placeholder="20" inputmode="decimal">
                    </div>
                </div>
                <button id="calcularDiscosBtn" class="w-100" type="button">Calcular discos</button>
                <div id="discosResultado" class="mt-1"></div>
            </div>

            <!-- TIMER DE DESCANSO -->
            <div class="card" id="timerCard">
                <h2 data-i18n="workout.titulo.timer">Timer de descanso</h2>
                <div class="timer-display" id="timerDisplay">02:30</div>
                <div class="flex-wrap">
                    <div>
                        <label for="timerMinutes">Min</label>
                        <input type="number" id="timerMinutes" min="0" max="30" value="2" inputmode="numeric">
                    </div>
                    <div>
                        <label for="timerSeconds">Seg</label>
                        <input type="number" id="timerSeconds" min="0" max="59" value="30" inputmode="numeric">
                    </div>
                </div>
                <button id="setTimerBtn" class="secondary w-100" type="button">Fijar tiempo</button>
                <div class="row-buttons">
                    <button id="startTimerBtn" class="success" type="button">Iniciar</button>
                    <button id="pauseTimerBtn" class="secondary" type="button">Pausar</button>
                    <button id="resetTimerBtn" class="danger" type="button">Reset</button>
                </div>
            </div>

            <!-- MÉTRICAS DE SESIÓN -->
            <div class="card" id="metricasSesionCard">
                <h2>Métricas de sesión</h2>
                <div class="flex-wrap">
                    <div>
                        <label for="pesoKg">Tu peso (kg)</label>
                        <input type="number" id="pesoKg" step="0.5" min="0" value="72.5" inputmode="decimal">
                    </div>
                    <div>
                        <label for="tiempoMin">Duración (min)</label>
                        <input type="number" id="tiempoMin" step="1" min="0" value="30" inputmode="numeric">
                    </div>
                </div>
                <button id="calcularMetricasBtn" class="w-100" type="button">Calcular y acumular</button>

                <div class="stats-grid">
                    <div class="stat-box"><div class="number" id="kcalDisplay">0</div><div class="label">Kcal sesión</div></div>
                    <div class="stat-box"><div class="number" id="fuerzaDisplay">0</div><div class="label">Índice fuerza</div></div>
                    <div class="stat-box"><div class="number" id="volumenTotalDisplay">0</div><div class="label">Volumen ejerc. actual</div></div>
                </div>
            </div>
        </div>
    </section>
`;
