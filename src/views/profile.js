/**
 * src/views/profile.js
 * Vista parcial (template string) extraída de index.html.
 * NO editar inline: es mantenida por la estructura modular de vistas.
 */
export default `    <section id="tab-profile" class="tab-pane" aria-labelledby="nav-tab-profile">
        <div class="grid-2">
            <!-- PERFIL -->
            <div class="card" id="perfilCard">
                <h2>Perfil del atleta</h2>
                <div class="flex-wrap">
                    <div>
                        <label for="perfilEdad">Edad</label>
                        <input type="number" id="perfilEdad" step="1" min="10" max="100" value="25" inputmode="numeric">
                    </div>
                    <div>
                        <label for="perfilGrasa">Grasa (%)</label>
                        <input type="number" id="perfilGrasa" step="0.5" min="0" max="100" placeholder="15" inputmode="decimal">
                    </div>
                    <div>
                        <label for="perfilObjetivo">Objetivo</label>
                        <select id="perfilObjetivo">
                            <option value="fuerza">Fuerza</option>
                            <option value="hipertrofia" selected>Hipertrofia</option>
                            <option value="power">Potencia</option>
                        </select>
                    </div>
                    <div>
                        <label for="perfilNivel">Nivel</label>
                        <select id="perfilNivel">
                            <option value="principiante">Principiante</option>
                            <option value="intermedio" selected>Intermedio</option>
                            <option value="avanzado">Avanzado</option>
                        </select>
                    </div>
                </div>
                <button id="guardarPerfilBtn" class="w-100" type="button">Guardar perfil</button>
            </div>

            <!-- MEDIDAS CORPORALES -->
            <div class="card" id="medidasCard">
                <h2>Medidas corporales & IMC</h2>
                <div class="medidas-grid">
                    <div><label for="pechoCm">Pecho (cm)</label><input type="number" id="pechoCm" step="0.5" min="0" inputmode="decimal"></div>
                    <div><label for="cinturaCm">Cintura (cm)</label><input type="number" id="cinturaCm" step="0.5" min="0" inputmode="decimal"></div>
                    <div><label for="caderaCm">Cadera (cm)</label><input type="number" id="caderaCm" step="0.5" min="0" inputmode="decimal"></div>
                </div>
                <div class="flex-wrap">
                    <div>
                        <label for="pesoCorporalKg">Peso corporal (kg)</label>
                        <input type="number" id="pesoCorporalKg" step="0.1" min="0" value="72.5" inputmode="decimal">
                    </div>
                    <div>
                        <label for="alturaCm">Altura (cm)</label>
                        <input type="number" id="alturaCm" step="0.5" min="0" value="175" inputmode="decimal">
                    </div>
                </div>
                <div class="row-buttons">
                    <button id="guardarMedidasBtn" type="button">Guardar medidas</button>
                    <button id="calcularIMCBtn" class="secondary" type="button">Calcular IMC</button>
                </div>
                <div class="stats-grid">
                    <div class="stat-box"><div class="number" id="imcValor">--</div><div class="label">IMC</div></div>
                    <div class="stat-box" style="grid-column: span 2;"><div class="number" id="estadoIMC" style="font-size:1rem;">--</div><div class="label">Estado</div></div>
                </div>
                <div class="small-note" id="medidasGuardadas"></div>
            </div>

            <!-- BACKUP COMPLETO -->
            <div class="card" id="backupCard">
                <h2>Backup completo</h2>
                <p class="small-note-inline">Exporta o restaura perfiles, wellness, saltos, rutinas, historial y bloques.</p>
                <div class="row-buttons">
                    <button id="exportTodoBtn" type="button">Descargar backup</button>
                    <label for="importTodoInput" class="btn-file-label secondary">Restaurar backup</label>
                    <input type="file" id="importTodoInput" accept="application/json" class="hidden">
                </div>
            </div>

            <!-- EXPORTAR HISTORIAL DE SERIES -->
            <div class="card" id="exportarSeriesCard">
                <h2>Exportar historial de series</h2>
                <p class="small-note-inline">Descarga el historial de series de este atleta en CSV (fecha, ejercicio, peso, reps, RPE/RIR, esPR) o imprímelo como PDF.</p>
                <div class="row-buttons">
                    <button id="exportarSeriesBtn" type="button">Exportar CSV</button>
                    <button id="printSeriesBtn" class="secondary" type="button">Imprimir PDF</button>
                </div>
            </div>
        </div>
    </section>
`;
