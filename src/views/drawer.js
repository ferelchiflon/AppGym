/**
 * src/views/drawer.js
 * Vista parcial (template string) extraída de index.html.
 * NO editar inline: es mantenida por la estructura modular de vistas.
 */
export default `    <div id="drawerOverlay" class="drawer-overlay"></div>
    <aside id="drawer" class="drawer" aria-label="Menú principal" aria-hidden="true">
        <div class="drawer-head">
            <span class="drawer-brand">GYM PRO</span>
            <button type="button" id="drawerCloseBtn" class="icon-btn drawer-close" aria-label="Cerrar menú">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
        </div>

        <div class="drawer-profile">
            <label for="profileSelect">Perfil activo</label>
            <div class="drawer-profile-row">
                <select id="profileSelect" aria-label="Perfil de atleta"></select>
                <button id="nuevoPerfilBtn" class="secondary drawer-mini-btn" type="button" title="Crear perfil">+</button>
                <button id="eliminarPerfilBtn" class="danger drawer-mini-btn" type="button" title="Eliminar perfil">Elim</button>
            </div>
        </div>

        <nav class="drawer-nav">
            <div class="drawer-group">
                <div class="drawer-group-title" data-i18n="drawer.group.inicio">🏠 Inicio</div>
                <button type="button" class="drawer-item" data-nav-target="dashboard" data-i18n="drawer.item.dashboard">Dashboard</button>
            </div>

            <div class="drawer-group">
                <div class="drawer-group-title" data-i18n="drawer.group.entrenamiento">🏋️ Entrenamiento</div>
                <button type="button" class="drawer-item" data-nav-target="workout" data-i18n="drawer.item.rutina">Rutina y series</button>
                <button type="button" class="drawer-item" data-nav-target="workout" data-scroll="timerCard" data-i18n="drawer.item.timer">Timer de descanso</button>
                <button type="button" class="drawer-item" data-nav-target="workout" data-scroll="metricasSesionCard" data-i18n="drawer.item.metricas">Métricas de sesión</button>
            </div>

            <div class="drawer-group">
                <div class="drawer-group-title" data-i18n="drawer.group.progreso">📊 Progreso</div>
                <button type="button" class="drawer-item" data-nav-target="progress" data-i18n="drawer.item.progreso">Gráficos y evolución</button>
                <button type="button" class="drawer-item" data-nav-target="history" data-scroll="historialCard" data-i18n="drawer.item.historial">Historial de sesiones</button>
                <button type="button" class="drawer-item" data-nav-target="progress" data-scroll="progresoAcumuladoCard" data-i18n="drawer.item.acumulado">Progreso acumulado</button>
            </div>

            <div class="drawer-group">
                <div class="drawer-group-title" data-i18n="drawer.group.perfil">👤 Perfil y configuración</div>
                <button type="button" class="drawer-item" data-nav-target="profile" data-scroll="perfilCard" data-i18n="drawer.item.perfil">Perfil del atleta</button>
                <button type="button" class="drawer-item" data-nav-target="profile" data-scroll="medidasCard" data-i18n="drawer.item.medidas">Medidas corporales</button>
                <button type="button" class="drawer-item" data-nav-target="history" data-scroll="wellnessCard" data-i18n="drawer.item.wellness">Wellness diario</button>
                <button type="button" class="drawer-item" data-nav-target="history" data-scroll="saltoCard" data-i18n="drawer.item.salto">Test de salto (CMJ)</button>
                <button type="button" class="drawer-item" data-nav-target="history" data-scroll="periodizacionCard" data-i18n="drawer.item.periodizacion">Periodización</button>
            </div>

            <div class="drawer-group">
                <div class="drawer-group-title" data-i18n="drawer.group.apariencia">🎨 Apariencia</div>
                <button type="button" class="drawer-item theme-toggle" id="themeToggleBtn" aria-pressed="false" aria-label="Cambiar entre modo claro y modo oscuro">
                    <span class="theme-toggle-icon" aria-hidden="true">🌙</span>
                    <span class="theme-toggle-label">Modo oscuro</span>
                </button>
                <button type="button" class="drawer-item theme-toggle" id="gymModeDrawerBtn" aria-pressed="false" aria-label="Modo Gimnasio">
                    <span class="theme-toggle-icon" aria-hidden="true">🏋️</span>
                    <span class="theme-toggle-label" data-i18n="gym.etiqueta">Modo Gimnasio</span>
                </button>
                <label class="drawer-settings-label" for="langSelect" data-i18n="idioma.label">🌐 Idioma</label>
                <select id="langSelect" class="drawer-select" aria-label="Idioma / Language">
                    <option value="es">Español</option>
                    <option value="en">English</option>
                </select>
            </div>

            <div class="drawer-group">
                <div class="drawer-group-title" data-i18n="drawer.group.herramientas">⚙️ Herramientas extra</div>
                <button type="button" class="drawer-item" data-nav-target="workout" data-scroll="discosCard" data-i18n="drawer.item.discos">Calculadora de discos</button>
                <button type="button" class="drawer-item" data-nav-target="profile" data-scroll="backupCard" data-i18n="drawer.item.backup">Backup completo</button>
                <button type="button" class="drawer-item" data-nav-target="workout" data-scroll="seriesCard" data-i18n="drawer.item.warmup">Warm-up calculator</button>
            </div>
        </nav>
    </aside>
`;
