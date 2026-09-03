/**
 * src/views/header.js
 * Vista parcial (template string) extraída de index.html.
 * NO editar inline: es mantenida por la estructura modular de vistas.
 */
export default `    <header class="app-header">
        <button type="button" id="hamburgerBtn" class="icon-btn hamburger-btn" aria-label="Abrir menú" aria-expanded="false" aria-controls="drawer">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
        </button>
        <span class="brand" aria-hidden="true">
            <svg class="brand-logo" viewBox="0 0 24 24"><path d="M6 5v14M18 5v14M2 9v6M22 9v6M6 12h12"/></svg>
            <span class="brand-name">GYM PRO <span class="version-tag">v6.0</span></span>
        </span>
        <span id="headerTitle" class="header-title" role="status" data-i18n="nav.header.dashboard">Entrenamiento</span>
        <button type="button" id="syncStatusBtn" class="sync-status" data-estado="online" aria-label="Estado de sincronización" title="Sincronización activa">
            <span id="syncStatusDot" class="sync-status-dot" aria-hidden="true"></span>
            <span id="syncStatusLabel" class="sync-status-label">En línea</span>
        </button>
        <button type="button" id="themeHeaderBtn" class="icon-btn theme-header-btn" aria-label="Cambiar el tema de la app" aria-pressed="false" title="Modo oscuro activo">
            <span class="theme-header-icon" aria-hidden="true">🌙</span>
        </button>
        <button type="button" id="gymModeBtn" class="icon-btn theme-header-btn" aria-label="Activar Modo Gimnasio" aria-pressed="false" title="Activar Modo Gimnasio">
            <span class="theme-header-icon" aria-hidden="true">🏋️</span>
        </button>
        <button type="button" id="miniTimerBtn" class="mini-timer" aria-label="Abrir timer de descanso">
            <svg class="mini-timer-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9 2h6"/></svg>
            <span id="miniTimerDisplay" class="mini-timer-display">02:30</span>
        </button>
    </header>
`;
