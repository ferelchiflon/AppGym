/**
 * src/views/history.js
 * Vista parcial (template string) extraída de index.html.
 * NO editar inline: es mantenida por la estructura modular de vistas.
 */
export default `    <section id="tab-history" class="tab-pane" aria-labelledby="nav-tab-history">
        <div class="grid-2">
            <!-- HISTORIAL -->
            <div class="card" id="historialCard">
                <h2>Historial de sesiones</h2>
                <div class="row-buttons">
                    <button id="exportHistorialBtn" class="secondary" type="button">Exportar CSV</button>
                    <button id="exportHistorialPdfBtn" class="secondary" type="button">Imprimir PDF</button>
                    <button id="clearHistorialBtn" class="danger" type="button">Borrar historial</button>
                </div>
                <div class="badge-list mt-1" id="historialContainer"></div>
            </div>

            <!-- PERIODIZACIÓN -->
            <div class="card" id="periodizacionCard">
                <h2>Periodización</h2>
                <label for="bloqueNombre">Nombre del bloque</label>
                <input type="text" id="bloqueNombre" placeholder="Bloque de fuerza — otoño">
                <div class="flex-wrap">
                    <div>
                        <label for="bloqueTipo">Tipo</label>
                        <select id="bloqueTipo">
                            <option value="acumulacion">Acumulación (Hipertrofia)</option>
                            <option value="intensificacion">Intensificación (Fuerza)</option>
                            <option value="realizacion">Realización (Peaking/1RM)</option>
                            <option value="dup">DUP (Ondulante Diaria)</option>
                            <option value="deload">Deload (Descarga)</option>
                        </select>
                    </div>
                    <div>
                        <label for="bloqueSemanas">Semanas</label>
                        <input type="number" id="bloqueSemanas" min="1" max="16" value="4" inputmode="numeric">
                    </div>
                </div>
                <button id="crearBloqueBtn" class="w-100 mt-1" type="button">Crear bloque</button>
                <div class="mt-1" id="bloqueActualInfo"></div>
                <div class="mt-1" id="bloquePrescripcionInfo"></div>
            </div>

            <!-- WELLNESS -->
            <div class="card" id="wellnessCard">
                <h2>Wellness diario</h2>
                <div class="medidas-grid">
                    <div><label for="wellnessSueno">Sueño (1-5)</label><input type="number" id="wellnessSueno" min="1" max="5" value="3" inputmode="numeric"></div>
                    <div><label for="wellnessEstres">Estrés (1-5)</label><input type="number" id="wellnessEstres" min="1" max="5" value="3" inputmode="numeric"></div>
                    <div><label for="wellnessDoms">DOMS (1-5)</label><input type="number" id="wellnessDoms" min="1" max="5" value="3" inputmode="numeric"></div>
                </div>
                <label for="wellnessMotivacion">Motivación (1-5)</label>
                <input type="number" id="wellnessMotivacion" min="1" max="5" value="3" inputmode="numeric">
                <button id="registrarWellnessBtn" class="w-100 mt-1" type="button">Registrar wellness de hoy</button>
                <div class="mt-1" id="wellnessEstado"></div>
            </div>

            <!-- SALTO CMJ -->
            <div class="card" id="saltoCard">
                <h2>Test de salto (CMJ)</h2>
                <label for="saltoAltura">Altura del salto (cm)</label>
                <input type="number" id="saltoAltura" step="0.1" min="0" placeholder="35" inputmode="decimal">
                <button id="registrarSaltoBtn" class="w-100 mt-1" type="button">Registrar salto</button>
                <div class="mt-1" id="saltosRecientes"></div>
            </div>
        </div>
    </section>
`;
