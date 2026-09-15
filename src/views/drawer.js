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
                <div class="drawer-group-title">
                    <svg class="drawer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                    <span data-i18n="drawer.group.inicio">Inicio</span>
                </div>
                <button type="button" class="drawer-item" data-nav-target="dashboard" data-i18n="drawer.item.dashboard">Dashboard</button>
            </div>

            <div class="drawer-group">
                <div class="drawer-group-title" data-i18n="drawer.group.entrenamiento">Entrenamiento</div>
                <button type="button" class="drawer-item" data-nav-target="workout" data-i18n="drawer.item.rutina">Rutina y series</button>
                <button type="button" class="drawer-item" data-nav-target="workout" data-scroll="timerCard" data-i18n="drawer.item.timer">Timer de descanso</button>
                <button type="button" class="drawer-item" data-nav-target="workout" data-scroll="metricasSesionCard" data-i18n="drawer.item.metricas">Métricas de sesión</button>
            </div>

            <div class="drawer-group">
                <div class="drawer-group-title">
                    <svg class="drawer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
                    <span data-i18n="drawer.group.progreso">Progreso</span>
                </div>
                <button type="button" class="drawer-item" data-nav-target="progress" data-i18n="drawer.item.progreso">Gráficos y evolución</button>
                <button type="button" class="drawer-item" data-nav-target="history" data-scroll="historialCard" data-i18n="drawer.item.historial">Historial de sesiones</button>
                <button type="button" class="drawer-item" data-nav-target="progress" data-scroll="progresoAcumuladoCard" data-i18n="drawer.item.acumulado">Progreso acumulado</button>
            </div>

            <div class="drawer-group">
                <div class="drawer-group-title">
                    <svg class="drawer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    <span data-i18n="drawer.group.perfil">Perfil y configuración</span>
                </div>
                <button type="button" class="drawer-item" data-nav-target="profile" data-scroll="perfilCard" data-i18n="drawer.item.perfil">Perfil del atleta</button>
                <button type="button" class="drawer-item" data-nav-target="profile" data-scroll="medidasCard" data-i18n="drawer.item.medidas">Medidas corporales</button>
                <button type="button" class="drawer-item" data-nav-target="history" data-scroll="wellnessCard" data-i18n="drawer.item.wellness">Wellness diario</button>
                <button type="button" class="drawer-item" data-nav-target="history" data-scroll="saltoCard" data-i18n="drawer.item.salto">Test de salto (CMJ)</button>
                <button type="button" class="drawer-item" data-nav-target="history" data-scroll="periodizacionCard" data-i18n="drawer.item.periodizacion">Periodización</button>
            </div>

            <div class="drawer-group">
                <div class="drawer-group-title">
                    <svg class="drawer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.289-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>
                    <span data-i18n="drawer.group.apariencia">Apariencia</span>
                </div>
                <button type="button" class="drawer-item theme-toggle" id="themeToggleBtn" aria-pressed="false" aria-label="Cambiar entre modo claro y modo oscuro">
                    <span class="theme-toggle-icon" aria-hidden="true">🌙</span>
                    <span class="theme-toggle-label">Modo oscuro</span>
                </button>
                <button type="button" class="drawer-item theme-toggle" id="gymModeDrawerBtn" aria-pressed="false" aria-label="Modo Gimnasio">
                    <span class="theme-toggle-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h16M4 8.5v7M6.5 8.5v7M17.5 8.5v7M20 8.5v7"/></svg></span>
                    <span class="theme-toggle-label" data-i18n="gym.etiqueta">Modo Gimnasio</span>
                </button>
                <label class="drawer-settings-label" for="langSelect">
                    <svg class="drawer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/><path d="M2 12h20"/></svg>
                    <span data-i18n="idioma.label">Idioma</span>
                </label>
                <select id="langSelect" class="drawer-select" aria-label="Idioma / Language">
                    <option value="es">Español</option>
                    <option value="en">English</option>
                </select>
            </div>

            <div class="drawer-group">
                <div class="drawer-group-title">
                    <svg class="drawer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                    <span data-i18n="drawer.group.herramientas">Herramientas extra</span>
                </div>
                <button type="button" class="drawer-item" data-nav-target="workout" data-scroll="discosCard" data-i18n="drawer.item.discos">Calculadora de discos</button>
                <button type="button" class="drawer-item" data-nav-target="profile" data-scroll="backupCard" data-i18n="drawer.item.backup">Backup completo</button>
                <button type="button" class="drawer-item" data-nav-target="workout" data-scroll="seriesCard" data-i18n="drawer.item.warmup">Warm-up calculator</button>
            </div>
        </nav>
    </aside>
`;
