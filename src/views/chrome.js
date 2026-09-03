/**
 * src/views/chrome.js
 * Vista parcial (template string) extraída de index.html.
 * NO editar inline: es mantenida por la estructura modular de vistas.
 */
export default `<div id="floatingTimer" class="floating-timer" role="region" aria-label="Timer de descanso">
    <span id="floatingTimerDisplay" class="floating-timer-display">02:30</span>
    <div class="floating-timer-actions">
        <button type="button" id="floatPlayBtn" class="float-btn float-play" aria-label="Iniciar o pausar timer">▶</button>
        <button type="button" id="floatResetBtn" class="float-btn" aria-label="Reiniciar timer">⟲</button>
    </div>
</div>

<!-- ================= BOTTOM NAVIGATION BAR ================= -->
<nav class="bottom-nav" aria-label="Navegación principal">
    <div class="bottom-nav-inner">
        <button type="button" class="nav-tab active" data-tab="dashboard" id="nav-tab-dashboard">
            <svg viewBox="0 0 24 24">
                <path d="M3 13h8V3H3zM13 21h8V11h-8zM3 21h8v-6H3zM13 3v6h8V3z"/>
            </svg>
            <span data-i18n="nav.tab.dashboard">Inicio</span>
        </button>
        <button type="button" class="nav-tab" data-tab="workout" id="nav-tab-workout">
            <svg viewBox="0 0 24 24">
                <path d="M6 5v14M18 5v14M2 9v6M22 9v6M6 12h12"/>
            </svg>
            <span data-i18n="nav.tab.workout">Entrenar</span>
        </button>
        <button type="button" class="nav-tab" data-tab="history" id="nav-tab-history">
            <svg viewBox="0 0 24 24">
                <path d="M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/>
                <path d="M16 2v4M8 2v4M3 10h18"/>
            </svg>
            <span data-i18n="nav.tab.history">Historial</span>
        </button>
        <button type="button" class="nav-tab" data-tab="progress" id="nav-tab-progress">
            <svg viewBox="0 0 24 24">
                <path d="M3 3v18h18"/>
                <path d="m19 9-5 5-4-4-3 3"/>
            </svg>
            <span data-i18n="nav.tab.progress">Progreso</span>
        </button>
        <button type="button" class="nav-tab" data-tab="profile" id="nav-tab-profile">
            <svg viewBox="0 0 24 24">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
            </svg>
            <span data-i18n="nav.tab.profile">Atleta</span>
        </button>
    </div>
</nav>

<div id="toastContainer" class="toast-container"></div>
`;
