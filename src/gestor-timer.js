/**
 * src/gestor-timer.js
 * Timer de descanso entre series con cálculo basado en timestamps (Date.now()),
 * Web Audio API (secuencia armónica A5-E6) y respuesta háptica. Sin dependencias externas.
 */

export class GestorTimer {
    constructor() {
        this.interval = null;
        this.segundosTotales = 150;
        this.segundosRestantes = 150;
        this.finTimestamp = null;
        this.corriendo = false;
        this.onTick = null;
        this.onFinish = null;

        // Múltiples displays sincronizados (tarjeta + mini header + panel flotante)
        this._displayElement = null;
        this._displays = [];

        this._onVisibilityChange = this._onVisibilityChange.bind(this);
        if (typeof document !== 'undefined') {
            document.addEventListener('visibilitychange', this._onVisibilityChange);
        }
    }

    setTiempo(minutos, segundos) {
        this.segundosTotales = (parseInt(minutos) || 0) * 60 + (parseInt(segundos) || 0);
        this.segundosRestantes = this.segundosTotales;
        if (this.corriendo) {
            this.finTimestamp = Date.now() + this.segundosRestantes * 1000;
        }
        this._actualizarDisplay();
        return this;
    }

    iniciar() {
        if (this.corriendo) return this;
        if (this.segundosRestantes <= 0) {
            this.segundosRestantes = this.segundosTotales;
        }
        this.corriendo = true;
        this.finTimestamp = Date.now() + this.segundosRestantes * 1000;

        this._tick();
        this.interval = setInterval(() => this._tick(), 250);
        return this;
    }

    _tick() {
        if (!this.corriendo) return;
        const ahora = Date.now();
        const diffMs = this.finTimestamp - ahora;
        const restantes = Math.max(0, Math.ceil(diffMs / 1000));

        this.segundosRestantes = restantes;
        this._actualizarDisplay();
        if (this.onTick) this.onTick(this.segundosRestantes);

        if (restantes <= 0) {
            this.detener();
            GestorTimer.vibrar([200, 100, 200]);
            GestorTimer.reproducirBeep();
            if (this.onFinish) this.onFinish();
        }
    }

    _onVisibilityChange() {
        if (this.corriendo && typeof document !== 'undefined' && !document.hidden) {
            this._tick();
        }
    }

    pausar() {
        if (this.interval) clearInterval(this.interval);
        this.interval = null;
        this.corriendo = false;
        this.finTimestamp = null;
        return this;
    }

    detener() {
        if (this.interval) clearInterval(this.interval);
        this.interval = null;
        this.corriendo = false;
        this.finTimestamp = null;
        this.segundosRestantes = 0;
        this._actualizarDisplay();
        return this;
    }

    reset() {
        this.pausar();
        this.segundosRestantes = this.segundosTotales;
        this._actualizarDisplay();
        return this;
    }

    getTiempoFormateado() {
        const mins = Math.floor(this.segundosRestantes / 60);
        const segs = this.segundosRestantes % 60;
        return `${String(mins).padStart(2, '0')}:${String(segs).padStart(2, '0')}`;
    }

    _actualizarDisplay() {
        const texto = this.getTiempoFormateado();
        if (this._displayElement) this._displayElement.textContent = texto;
        if (Array.isArray(this._displays)) {
            this._displays.forEach((d) => {
                if (d) d.textContent = texto;
            });
        }
    }

    vincularDisplay(element) {
        this._displayElement = element;
        this._actualizarDisplay();
        return this;
    }

    // Sincroniza un display adicional (mini timer flotante / header)
    agregarDisplay(element) {
        if (element && Array.isArray(this._displays) && !this._displays.includes(element)) {
            this._displays.push(element);
        }
        this._actualizarDisplay();
        return this;
    }

    // Vibración háptica en dispositivos móviles compatibles
    static vibrar(patron = [200, 100, 200]) {
        try {
            if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
                navigator.vibrate(patron);
            }
        } catch { /* silencioso si el dispositivo no soporta vibración */ }
    }

    static vibrarCorto() {
        GestorTimer.vibrar(35);
    }

    static vibrarExito() {
        GestorTimer.vibrar([50, 40, 80]);
    }

    static vibrarPR() {
        GestorTimer.vibrar([100, 50, 100, 50, 200]);
    }

    static _audioCtx = null;

    /**
     * Desbloquea y pre-calienta el AudioContext durante un gesto táctil/click del usuario
     * para asegurar reproducción confiable en Safari iOS y Android Chrome.
     */
    static desbloquearAudio() {
        try {
            const AudioCtx = typeof window !== 'undefined' ? (window.AudioContext || window.webkitAudioContext) : null;
            if (!AudioCtx) return;
            if (!GestorTimer._audioCtx) {
                GestorTimer._audioCtx = new AudioCtx();
            }
            if (GestorTimer._audioCtx.state === 'suspended') {
                GestorTimer._audioCtx.resume();
            }
        } catch { /* silencioso */ }
    }

    // Doble tono armónico nítido con Web Audio API (A5: 880Hz -> E6: 1318Hz)
    static reproducirBeep() {
        try {
            GestorTimer.desbloquearAudio();
            const ctx = GestorTimer._audioCtx;
            if (!ctx) return;

            const t0 = ctx.currentTime;
            // Tono 1: A5 (880Hz)
            const osc1 = ctx.createOscillator();
            const gain1 = ctx.createGain();
            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(880, t0);
            gain1.gain.setValueAtTime(0.25, t0);
            gain1.gain.exponentialRampToValueAtTime(0.001, t0 + 0.15);
            osc1.connect(gain1);
            gain1.connect(ctx.destination);
            osc1.start(t0);
            osc1.stop(t0 + 0.15);

            // Tono 2: E6 (1318.5Hz) un poco después para efecto campana de aviso
            const t1 = t0 + 0.12;
            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.type = 'triangle';
            osc2.frequency.setValueAtTime(1318.5, t1);
            gain2.gain.setValueAtTime(0.3, t1);
            gain2.gain.exponentialRampToValueAtTime(0.001, t1 + 0.45);
            osc2.connect(gain2);
            gain2.connect(ctx.destination);
            osc2.start(t1);
            osc2.stop(t1 + 0.45);
        } catch { /* silencioso si el navegador bloquea audio autoplay */ }
    }
}

