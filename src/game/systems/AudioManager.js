import { AUDIO } from '../constants.js';
import { MusicManager } from './MusicManager.js';

export class AudioManager {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.shroudOsc = null;
        this.shroudGain = null;
        this.initialized = false;
        this.muted = false;
        this._volume = 1.0;
        this._shroudWarningActive = false;
        this._shroudWarningOsc = null;
        this._shroudWarningGain = null;
        this._shroudWarningLfo = null;
    }

    init() {
        if (this.initialized) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = this._volume;
            this.masterGain.connect(this.ctx.destination);
            this._setupShroudHum();
            this.initialized = true;
        } catch (e) {
            console.warn('Web Audio not available:', e);
        }
    }

    /** All sounds route through masterGain */
    get output() {
        return this.masterGain || (this.ctx && this.ctx.destination);
    }

    get volume() {
        return this._volume;
    }

    toggleMute() {
        this.muted = !this.muted;
        if (this.masterGain) {
            this.masterGain.gain.setTargetAtTime(
                this.muted ? 0 : this._volume,
                this.ctx.currentTime, 0.05
            );
        }
        MusicManager.setMute(this.muted);
    }

    setVolume(vol) {
        this._volume = Math.max(0, Math.min(1, vol));
        if (!this.muted && this.masterGain) {
            this.masterGain.gain.setTargetAtTime(
                this._volume, this.ctx.currentTime, 0.05
            );
        }
        MusicManager.setVolume(this._volume);
    }

    _setupShroudHum() {
        this.shroudOsc = this.ctx.createOscillator();
        this.shroudGain = this.ctx.createGain();

        this.shroudOsc.type = 'sine';
        this.shroudOsc.frequency.value = AUDIO.SHROUD_HUM_FREQ;
        this.shroudGain.gain.value = 0;

        this.shroudOsc.connect(this.shroudGain);
        this.shroudGain.connect(this.output);
        this.shroudOsc.start();
    }

    setShroudIntensity(intensity) {
        if (!this.initialized || !this.shroudGain) return;
        // intensity 0-1 maps to volume 0-0.15
        const vol = Math.min(intensity, 1) * 0.15;
        this.shroudGain.gain.setTargetAtTime(vol, this.ctx.currentTime, 0.1);
    }

    playFlameCrackle() {
        if (!this.initialized) return;
        const bufferSize = this.ctx.sampleRate * AUDIO.FLAME_CRACKLE_DURATION;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.3;
        }

        const source = this.ctx.createBufferSource();
        source.buffer = buffer;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + AUDIO.FLAME_CRACKLE_DURATION);

        source.connect(gain);
        gain.connect(this.output);
        source.start();
    }

    playMineComplete() {
        if (!this.initialized) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.15);

        gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);

        osc.connect(gain);
        gain.connect(this.output);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.3);
    }

    playFlameStep() {
        if (!this.initialized) return;
        // Whoosh: quick frequency sweep
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.1);
        osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.2);

        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);

        osc.connect(gain);
        gain.connect(this.output);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.25);
    }

    playWraithHit() {
        if (!this.initialized) return;
        // Discordant screech
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(400, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.3);

        gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);

        osc.connect(gain);
        gain.connect(this.output);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.3);
    }

    playWraithBanish() {
        if (!this.initialized) return;
        // Satisfying pop + dissolve
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(500, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1500, this.ctx.currentTime + 0.15);

        gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);

        osc.connect(gain);
        gain.connect(this.output);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.2);
    }

    playWispCollect() {
        if (!this.initialized) return;
        // Warm ascending chime
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1000, this.ctx.currentTime + 0.2);

        gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);

        osc.connect(gain);
        gain.connect(this.output);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.35);
    }

    playGameOverStinger() {
        if (!this.initialized) return;
        // Descending tone — feels conclusive
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.8);

        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.0);

        osc.connect(gain);
        gain.connect(this.output);
        osc.start();
        osc.stop(this.ctx.currentTime + 1.0);
    }

    playJump() {
        if (!this.initialized) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(500, this.ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(this.output);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    }

    playLand() {
        if (!this.initialized) return;
        const bufferSize = Math.floor(this.ctx.sampleRate * 0.08);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.5;
        }
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 400;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.output);
        source.start();
    }

    playSlamImpact() {
        if (!this.initialized) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(100, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(this.output);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.3);
    }

    playFlameBurst() {
        if (!this.initialized) return;
        const bufferSize = Math.floor(this.ctx.sampleRate * 0.2);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.5;
        }
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(2000, this.ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(500, this.ctx.currentTime + 0.2);
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.output);
        source.start();
    }

    // ─── Ability Audio Dispatcher ───

    playAbility(type) {
        if (!this.initialized || this.muted) return;
        switch (type) {
            case 'smoke_bomb':       return this._playSoftPuff();
            case 'war_cry':          return this._playWarCrySound();
            case 'volley':           return this._playVolleySound();
            case 'iron_stance':      return this._playMetallicClang();
            case 'mend':             return this._playMendBells();
            case 'vanish':           return this._playVanishWhoosh();
            case 'chi_wave':         return this._playChiWaveSound();
            case 'blade_storm':      return this._playBladeStormSound();
            case 'inferno':          return this._playInfernoIgnite();
            case 'war_howl':         return this._playWarHowlSound();
            case 'mana_shield':      return this._playShieldCrystal();
            case 'eagle_eye':        return this._playTimeWarp();
            case 'fortify':          return this._playFortifyChime();
            case 'regen_pulse':      return this._playRegenPulseSound();
            case 'lethal_mark':      return this._playDarkStinger();
            case 'chi_strike':       return this._playChiStrikeSound();
            case 'parry_stance':     return this._playParryRing();
            case 'combustion_burst': return this._playCombustionBurst();
            case 'flame_burst':      return this.playFlameBurst();
        }
    }

    _playSoftPuff() {
        const dur = 0.08;
        const buf = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * dur), this.ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.4;
        const src = this.ctx.createBufferSource(); src.buffer = buf;
        const f = this.ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 1200;
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0.3, this.ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
        src.connect(f); f.connect(g); g.connect(this.output); src.start(); src.stop(this.ctx.currentTime + dur);
    }

    _playWarCrySound() {
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator(); osc.type = 'square';
        osc.frequency.setValueAtTime(80, t); osc.frequency.linearRampToValueAtTime(140, t + 0.18);
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0.35, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        osc.connect(g); g.connect(this.output); osc.start(t); osc.stop(t + 0.2);
    }

    _playVolleySound() {
        // Three rapid high clicks
        for (let i = 0; i < 3; i++) {
            const t = this.ctx.currentTime + i * 0.07;
            const osc = this.ctx.createOscillator(); osc.type = 'triangle';
            osc.frequency.setValueAtTime(900, t); osc.frequency.exponentialRampToValueAtTime(400, t + 0.06);
            const g = this.ctx.createGain();
            g.gain.setValueAtTime(0.18, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
            osc.connect(g); g.connect(this.output); osc.start(t); osc.stop(t + 0.06);
        }
    }

    _playMetallicClang() {
        const t = this.ctx.currentTime;
        // High metallic ring + low thud
        const osc1 = this.ctx.createOscillator(); osc1.type = 'sawtooth'; osc1.frequency.value = 440;
        const osc2 = this.ctx.createOscillator(); osc2.type = 'sine'; osc2.frequency.value = 60;
        const g1 = this.ctx.createGain(); const g2 = this.ctx.createGain();
        g1.gain.setValueAtTime(0.25, t); g1.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
        g2.gain.setValueAtTime(0.3, t); g2.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        osc1.connect(g1); g1.connect(this.output);
        osc2.connect(g2); g2.connect(this.output);
        osc1.start(t); osc1.stop(t + 0.35);
        osc2.start(t); osc2.stop(t + 0.15);
    }

    _playMendBells() {
        [880, 1320, 1760].forEach((freq, i) => {
            const t = this.ctx.currentTime + i * 0.06;
            const osc = this.ctx.createOscillator(); osc.type = 'sine'; osc.frequency.value = freq;
            const g = this.ctx.createGain();
            g.gain.setValueAtTime(0.2, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
            osc.connect(g); g.connect(this.output); osc.start(t); osc.stop(t + 0.4);
        });
    }

    _playVanishWhoosh() {
        const t = this.ctx.currentTime; const dur = 0.15;
        const buf = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * dur), this.ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1);
        const src = this.ctx.createBufferSource(); src.buffer = buf;
        const f = this.ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 2000; f.Q.value = 2;
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0.25, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
        src.connect(f); f.connect(g); g.connect(this.output); src.start(t); src.stop(t + dur);
    }

    _playChiWaveSound() {
        // Ascending harmonic pulse
        [440, 660, 880].forEach((freq, i) => {
            const t = this.ctx.currentTime + i * 0.04;
            const osc = this.ctx.createOscillator(); osc.type = 'sine'; osc.frequency.value = freq;
            const g = this.ctx.createGain();
            g.gain.setValueAtTime(0.15, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
            osc.connect(g); g.connect(this.output); osc.start(t); osc.stop(t + 0.25);
        });
    }

    _playBladeStormSound() {
        const t = this.ctx.currentTime; const dur = 0.3;
        const buf = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * dur), this.ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.6;
        const src = this.ctx.createBufferSource(); src.buffer = buf;
        const f = this.ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 3000;
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0.28, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
        src.connect(f); f.connect(g); g.connect(this.output); src.start(t); src.stop(t + dur);
    }

    _playInfernoIgnite() {
        const t = this.ctx.currentTime;
        // Low rumble that rises
        const osc = this.ctx.createOscillator(); osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(55, t); osc.frequency.exponentialRampToValueAtTime(200, t + 0.25);
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0.3, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
        osc.connect(g); g.connect(this.output); osc.start(t); osc.stop(t + 0.25);
    }

    _playWarHowlSound() {
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator(); osc.type = 'square';
        osc.frequency.setValueAtTime(120, t); osc.frequency.linearRampToValueAtTime(60, t + 0.3);
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0.3, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        osc.connect(g); g.connect(this.output); osc.start(t); osc.stop(t + 0.3);
    }

    _playShieldCrystal() {
        // Bright ascending crystalline tone
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator(); osc.type = 'triangle';
        osc.frequency.setValueAtTime(1200, t); osc.frequency.exponentialRampToValueAtTime(2000, t + 0.18);
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0.2, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
        osc.connect(g); g.connect(this.output); osc.start(t); osc.stop(t + 0.25);
    }

    _playTimeWarp() {
        // Descending pitch sweep — time slowing down
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator(); osc.type = 'sine';
        osc.frequency.setValueAtTime(800, t); osc.frequency.exponentialRampToValueAtTime(200, t + 0.4);
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0.18, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
        osc.connect(g); g.connect(this.output); osc.start(t); osc.stop(t + 0.4);
    }

    _playFortifyChime() {
        // Two steady low bell tones
        [220, 330].forEach((freq, i) => {
            const t = this.ctx.currentTime + i * 0.1;
            const osc = this.ctx.createOscillator(); osc.type = 'sine'; osc.frequency.value = freq;
            const g = this.ctx.createGain();
            g.gain.setValueAtTime(0.22, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
            osc.connect(g); g.connect(this.output); osc.start(t); osc.stop(t + 0.5);
        });
    }

    _playRegenPulseSound() {
        // Gentle warm pulse
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator(); osc.type = 'sine'; osc.frequency.value = 520;
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0.0, t);
        g.gain.linearRampToValueAtTime(0.18, t + 0.05);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
        osc.connect(g); g.connect(this.output); osc.start(t); osc.stop(t + 0.35);
    }

    _playDarkStinger() {
        // Short dissonant descending click
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator(); osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, t); osc.frequency.exponentialRampToValueAtTime(80, t + 0.12);
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0.3, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
        osc.connect(g); g.connect(this.output); osc.start(t); osc.stop(t + 0.12);
    }

    _playChiStrikeSound() {
        // Sharp snappy impact
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator(); osc.type = 'triangle';
        osc.frequency.setValueAtTime(700, t); osc.frequency.exponentialRampToValueAtTime(200, t + 0.1);
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0.28, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
        osc.connect(g); g.connect(this.output); osc.start(t); osc.stop(t + 0.1);
    }

    _playParryRing() {
        // Short metallic ring at mid frequency
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator(); osc.type = 'triangle'; osc.frequency.value = 660;
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0.22, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        osc.connect(g); g.connect(this.output); osc.start(t); osc.stop(t + 0.3);
    }

    _playCombustionBurst() {
        const t = this.ctx.currentTime; const dur = 0.22;
        // White noise burst filtered to a fire crackle
        const buf = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * dur), this.ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.7;
        const src = this.ctx.createBufferSource(); src.buffer = buf;
        const f = this.ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 800; f.Q.value = 0.8;
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0.3, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
        // Add a rising osc over the noise
        const osc = this.ctx.createOscillator(); osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(80, t); osc.frequency.exponentialRampToValueAtTime(300, t + dur);
        const og = this.ctx.createGain();
        og.gain.setValueAtTime(0.2, t); og.gain.exponentialRampToValueAtTime(0.001, t + dur);
        src.connect(f); f.connect(g); g.connect(this.output);
        osc.connect(og); og.connect(this.output);
        src.start(t); src.stop(t + dur);
        osc.start(t); osc.stop(t + dur);
    }

    playShrine() {
        if (!this.initialized) return;
        // Two-note chime: 440Hz → 660Hz — clearly distinct from wisp (600→1000Hz)
        [440, 660].forEach((freq, i) => {
            const t = this.ctx.currentTime + i * 0.12;
            const osc = this.ctx.createOscillator(); osc.type = 'sine'; osc.frequency.value = freq;
            const g = this.ctx.createGain();
            g.gain.setValueAtTime(0.07, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
            osc.connect(g); g.connect(this.output); osc.start(t); osc.stop(t + 0.5);
        });
    }

    playScrollRead() {
        if (!this.initialized) return;
        const t = this.ctx.currentTime;
        // Soft papery rustle: short filtered noise burst
        const dur = 0.12;
        const buf = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * dur), this.ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.4;
        const src = this.ctx.createBufferSource(); src.buffer = buf;
        const f = this.ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 2400; f.Q.value = 1.5;
        const ng = this.ctx.createGain();
        ng.gain.setValueAtTime(0.06, t); ng.gain.exponentialRampToValueAtTime(0.001, t + dur);
        src.connect(f); f.connect(ng); ng.connect(this.output); src.start(t); src.stop(t + dur);
        // Mystical descending tone: 880Hz → 440Hz
        [0, 0.1].forEach((offset, i) => {
            const osc = this.ctx.createOscillator(); osc.type = 'sine';
            const freq = i === 0 ? 880 : 440;
            osc.frequency.setValueAtTime(freq, t + offset);
            const g = this.ctx.createGain();
            g.gain.setValueAtTime(0.055, t + offset); g.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.35);
            osc.connect(g); g.connect(this.output); osc.start(t + offset); osc.stop(t + offset + 0.35);
        });
    }

    playObeliskActivate() {
        if (!this.initialized) return;
        const t = this.ctx.currentTime;
        // Deep resonant tone: descending 220Hz → 110Hz, then a high shimmer
        const osc = this.ctx.createOscillator(); osc.type = 'sine';
        osc.frequency.setValueAtTime(220, t);
        osc.frequency.exponentialRampToValueAtTime(110, t + 0.6);
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0.12, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
        osc.connect(g); g.connect(this.output); osc.start(t); osc.stop(t + 0.8);
        // Shimmer overtone at 660Hz
        const osc2 = this.ctx.createOscillator(); osc2.type = 'sine';
        osc2.frequency.setValueAtTime(660, t + 0.05);
        const g2 = this.ctx.createGain();
        g2.gain.setValueAtTime(0.045, t + 0.05); g2.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
        osc2.connect(g2); g2.connect(this.output); osc2.start(t + 0.05); osc2.stop(t + 0.55);
    }

    playBiomeEntry() {
        if (!this.initialized) return;
        // Two-note upward sting: 500Hz then 750Hz, 80ms apart, sawtooth, short decay
        [500, 750].forEach((freq, i) => {
            const t = this.ctx.currentTime + i * 0.08;
            const osc = this.ctx.createOscillator(); osc.type = 'sawtooth'; osc.frequency.value = freq;
            const g = this.ctx.createGain();
            g.gain.setValueAtTime(0.06, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
            osc.connect(g); g.connect(this.output); osc.start(t); osc.stop(t + 0.18);
        });
    }

    playLevelUp() {
        if (!this.initialized) return;
        const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
        const noteLen = 0.15;
        for (let i = 0; i < notes.length; i++) {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            const t = this.ctx.currentTime + i * noteLen;
            osc.frequency.setValueAtTime(notes[i], t);
            gain.gain.setValueAtTime(0.15, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + noteLen);
            osc.connect(gain);
            gain.connect(this.output);
            osc.start(t);
            osc.stop(t + noteLen);
        }
    }

    playAchievement() {
        if (!this.initialized) return;
        const freqs = [800, 1200];
        for (let i = 0; i < freqs.length; i++) {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            const t = this.ctx.currentTime + i * 0.08;
            osc.frequency.setValueAtTime(freqs[i], t);
            gain.gain.setValueAtTime(0.12, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
            osc.connect(gain);
            gain.connect(this.output);
            osc.start(t);
            osc.stop(t + 0.14);
        }
    }

    playAbilityReady() {
        if (!this.initialized) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, t);
        osc.frequency.exponentialRampToValueAtTime(1320, t + 0.08);
        gain.gain.setValueAtTime(0.06, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
        osc.connect(gain);
        gain.connect(this.output);
        osc.start(t);
        osc.stop(t + 0.12);
    }

    playComboMilestone() {
        if (!this.initialized) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(900, this.ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
        osc.connect(gain);
        gain.connect(this.output);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.15);
    }

    playBanishCombo(comboCount) {
        if (!this.initialized) return;
        const t = this.ctx.currentTime;

        // Triangle wave: base 500Hz + combo*80Hz, ramp to 1.5x over 0.12s
        const baseFreq = 500 + comboCount * 80;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(baseFreq, t);
        osc.frequency.linearRampToValueAtTime(baseFreq * 1.5, t + 0.12);
        gain.gain.setValueAtTime(0.12, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
        osc.connect(gain);
        gain.connect(this.output);
        osc.start(t);
        osc.stop(t + 0.18);

        // At x5+: add major chord
        if (comboCount >= 5) {
            const chordFreqs = [baseFreq, baseFreq * 1.25, baseFreq * 1.5]; // root, major 3rd, 5th
            for (const freq of chordFreqs) {
                const co = this.ctx.createOscillator();
                const cg = this.ctx.createGain();
                co.type = 'sine';
                co.frequency.setValueAtTime(freq, t);
                cg.gain.setValueAtTime(0.08, t);
                cg.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
                co.connect(cg);
                cg.connect(this.output);
                co.start(t);
                co.stop(t + 0.25);
            }
        }
    }

    playHeartbeat() {
        if (!this.initialized) return;
        const t = this.ctx.currentTime;

        // Two low-freq sine thuds at 0.15s apart (lub-dub)
        for (let i = 0; i < 2; i++) {
            const offset = i * 0.15;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(40, t + offset);
            osc.frequency.exponentialRampToValueAtTime(25, t + offset + 0.12);
            gain.gain.setValueAtTime(0.2, t + offset);
            gain.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.15);
            osc.connect(gain);
            gain.connect(this.output);
            osc.start(t + offset);
            osc.stop(t + offset + 0.15);
        }
    }

    playBossWarning() {
        if (!this.initialized) return;
        const t = this.ctx.currentTime;
        // Low ominous tone
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(80, t);
        osc.frequency.exponentialRampToValueAtTime(40, t + 1.0);
        gain.gain.setValueAtTime(0.18, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
        osc.connect(gain);
        gain.connect(this.output);
        osc.start(t);
        osc.stop(t + 1.2);
    }

    playBossDefeated() {
        if (!this.initialized) return;
        const t = this.ctx.currentTime;
        // Triumphant chord: C5, E5, G5, C6 staggered
        const notes = [523.25, 659.25, 783.99, 1046.50];
        for (let i = 0; i < notes.length; i++) {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            const nt = t + i * 0.1;
            osc.frequency.setValueAtTime(notes[i], nt);
            gain.gain.setValueAtTime(0.15, nt);
            gain.gain.exponentialRampToValueAtTime(0.001, nt + 0.4);
            osc.connect(gain);
            gain.connect(this.output);
            osc.start(nt);
            osc.stop(nt + 0.4);
        }
    }

    playShroudWarning() {
        if (!this.initialized || this._shroudWarningActive) return;
        this._shroudWarningActive = true;

        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = 60;

        const lfo = this.ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 2;

        const lfoGain = this.ctx.createGain();
        lfoGain.gain.value = 0.08;

        const mainGain = this.ctx.createGain();
        mainGain.gain.value = 0.1;

        lfo.connect(lfoGain);
        lfoGain.connect(mainGain.gain);
        osc.connect(mainGain);
        mainGain.connect(this.output);

        osc.start();
        lfo.start();

        this._shroudWarningOsc = osc;
        this._shroudWarningGain = mainGain;
        this._shroudWarningLfo = lfo;
    }

    stopShroudWarning() {
        if (!this._shroudWarningActive) return;
        this._shroudWarningActive = false;
        try {
            if (this._shroudWarningOsc) { this._shroudWarningOsc.stop(); this._shroudWarningOsc = null; }
            if (this._shroudWarningLfo) { this._shroudWarningLfo.stop(); this._shroudWarningLfo = null; }
            this._shroudWarningGain = null;
        } catch {}
    }

    /**
     * Plays a distinct hit sound based on enemy type.
     * Falls back to the generic wraith hit for unknown types.
     * @param {string} typeId - enemy.def.key or enemy.typeId
     */
    playEnemyHit(typeId) {
        if (!this.initialized) return;
        switch (typeId) {
            case 'fell_critter':
            case 'vine_spitter':
                return this._playFellHit();
            case 'vukah_warrior':
            case 'vukah_berserker':
                return this._playVukahHit();
            case 'hollow_skeleton':
            case 'corrupted_warrior':
                return this._playSkeletonHit();
            case 'frost_hulk':
                return this._playFrostHit();
            case 'pyrebat':
            case 'scavenger':
                return this._playFireHit();
            case 'shroud_wraith':
            case 'void_slime':
            case 'soul_leech':
                return this._playVoidHit();
            default:
                return this.playWraithHit();
        }
    }

    // — organic crinkle: short noise burst, highpass filtered
    _playFellHit() {
        const dur = 0.08;
        const buf = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * dur), this.ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1);
        const src = this.ctx.createBufferSource();
        src.buffer = buf;
        const flt = this.ctx.createBiquadFilter();
        flt.type = 'highpass';
        flt.frequency.value = 1800;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
        src.connect(flt); flt.connect(gain); gain.connect(this.output);
        src.start();
    }

    // — deep thud: low sine thump
    _playVukahHit() {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(180, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(60, this.ctx.currentTime + 0.18);
        gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);
        osc.connect(gain); gain.connect(this.output);
        osc.start(); osc.stop(this.ctx.currentTime + 0.18);
    }

    // — dry rattle: noise burst through bandpass
    _playSkeletonHit() {
        const dur = 0.12;
        const buf = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * dur), this.ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * 0.6;
        const src = this.ctx.createBufferSource();
        src.buffer = buf;
        const flt = this.ctx.createBiquadFilter();
        flt.type = 'bandpass';
        flt.frequency.value = 900;
        flt.Q.value = 2;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.14, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
        src.connect(flt); flt.connect(gain); gain.connect(this.output);
        src.start();
    }

    // — icy crack: high pitched descending triangle
    _playFrostHit() {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(900, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
        osc.connect(gain); gain.connect(this.output);
        osc.start(); osc.stop(this.ctx.currentTime + 0.15);
    }

    // — searing hiss: noise burst through lowpass with quick attack
    _playFireHit() {
        const dur = 0.1;
        const buf = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * dur), this.ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1);
        const src = this.ctx.createBufferSource();
        src.buffer = buf;
        const flt = this.ctx.createBiquadFilter();
        flt.type = 'lowpass';
        flt.frequency.value = 3000;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.14, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
        src.connect(flt); flt.connect(gain); gain.connect(this.output);
        src.start();
    }

    // — void pulse: square descend with slight reverb delay
    _playVoidHit() {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const delay = this.ctx.createDelay(0.2);
        delay.delayTime.value = 0.07;
        const fbGain = this.ctx.createGain();
        fbGain.gain.value = 0.3;
        osc.type = 'square';
        osc.frequency.setValueAtTime(320, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.07, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
        osc.connect(gain); gain.connect(this.output);
        gain.connect(delay); delay.connect(fbGain); fbGain.connect(delay); delay.connect(this.output);
        osc.start(); osc.stop(this.ctx.currentTime + 0.3);
    }

    // ─── Biome Ambient SFX ────────────────────────────────────────────────────

    startBiomeAmbient(biomeId) {
        this.stopBiomeAmbient();
        if (!this.initialized) return;
        this._biomeAmbientBiome = biomeId;
        this._biomeAmbientNodes = [];
        this._buildBiomeAmbient(biomeId);
    }

    stopBiomeAmbient() {
        if (!this._biomeAmbientNodes) return;
        for (const n of this._biomeAmbientNodes) {
            try { n.stop ? n.stop() : n.disconnect(); } catch {}
        }
        this._biomeAmbientNodes = null;
        this._biomeAmbientBiome = null;
        if (this._biomeAmbientDripTimer) {
            clearTimeout(this._biomeAmbientDripTimer);
            this._biomeAmbientDripTimer = null;
        }
    }

    _buildBiomeAmbient(biomeId) {
        if (!this.initialized) return;
        const vol = 0.05;
        switch (biomeId) {
            case 'springlands': {
                // Soft wind: filtered noise
                const buf = this._makeNoiseBuffer(4);
                const src = this.ctx.createBufferSource();
                src.buffer = buf; src.loop = true;
                const flt = this.ctx.createBiquadFilter();
                flt.type = 'bandpass'; flt.frequency.value = 600; flt.Q.value = 0.5;
                const gain = this.ctx.createGain();
                gain.gain.setValueAtTime(vol * 0.8, this.ctx.currentTime);
                src.connect(flt); flt.connect(gain); gain.connect(this.output);
                src.start();
                this._biomeAmbientNodes.push(src, gain);
                break;
            }
            case 'revelwood': {
                // Low forest hum + distant drips
                const osc = this.ctx.createOscillator();
                osc.type = 'sine'; osc.frequency.value = 55;
                const gain = this.ctx.createGain();
                gain.gain.setValueAtTime(vol * 0.6, this.ctx.currentTime);
                osc.connect(gain); gain.connect(this.output);
                osc.start();
                this._biomeAmbientNodes.push(osc, gain);
                this._scheduleWaterDrips(0.8, 2.5);
                break;
            }
            case 'nomad_highlands': {
                // Howling wind: higher pitched noise + tremolo LFO
                const buf = this._makeNoiseBuffer(3);
                const src = this.ctx.createBufferSource();
                src.buffer = buf; src.loop = true;
                const flt = this.ctx.createBiquadFilter();
                flt.type = 'highpass'; flt.frequency.value = 900; flt.Q.value = 0.3;
                const gain = this.ctx.createGain();
                gain.gain.setValueAtTime(vol, this.ctx.currentTime);
                const lfo = this.ctx.createOscillator();
                lfo.type = 'sine'; lfo.frequency.value = 0.3;
                const lfoGain = this.ctx.createGain();
                lfoGain.gain.value = vol * 0.4;
                lfo.connect(lfoGain); lfoGain.connect(gain.gain);
                src.connect(flt); flt.connect(gain); gain.connect(this.output);
                src.start(); lfo.start();
                this._biomeAmbientNodes.push(src, lfo, gain, lfoGain);
                break;
            }
            case 'kindlewastes': {
                // Crackling ember loop
                const osc = this.ctx.createOscillator();
                osc.type = 'sawtooth'; osc.frequency.value = 80;
                const flt = this.ctx.createBiquadFilter();
                flt.type = 'lowpass'; flt.frequency.value = 300;
                const gain = this.ctx.createGain();
                gain.gain.setValueAtTime(vol * 0.7, this.ctx.currentTime);
                osc.connect(flt); flt.connect(gain); gain.connect(this.output);
                osc.start();
                this._biomeAmbientNodes.push(osc, gain);
                break;
            }
            case 'hollow':
            case 'albaneve': {
                // Eerie drip cave
                const osc = this.ctx.createOscillator();
                osc.type = 'sine'; osc.frequency.value = 42;
                const gain = this.ctx.createGain();
                gain.gain.setValueAtTime(vol * 0.5, this.ctx.currentTime);
                osc.connect(gain); gain.connect(this.output);
                osc.start();
                this._biomeAmbientNodes.push(osc, gain);
                this._scheduleWaterDrips(1.5, 4.0);
                break;
            }
            case 'shroud_maw': {
                // Unsettling void drone: two slightly detuned sines
                const osc1 = this.ctx.createOscillator();
                const osc2 = this.ctx.createOscillator();
                osc1.type = 'sine'; osc1.frequency.value = 38;
                osc2.type = 'sine'; osc2.frequency.value = 41;
                const gain = this.ctx.createGain();
                gain.gain.setValueAtTime(vol * 0.8, this.ctx.currentTime);
                osc1.connect(gain); osc2.connect(gain); gain.connect(this.output);
                osc1.start(); osc2.start();
                this._biomeAmbientNodes.push(osc1, osc2, gain);
                break;
            }
            default: break;
        }
    }

    _scheduleWaterDrips(minInterval, maxInterval) {
        if (!this.initialized || !this._biomeAmbientNodes) return;
        const delay = minInterval + Math.random() * (maxInterval - minInterval);
        this._biomeAmbientDripTimer = setTimeout(() => {
            if (!this._biomeAmbientNodes) return;
            // Single drip: short sine ping
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(900 + Math.random() * 400, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.12);
            gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);
            osc.connect(gain); gain.connect(this.output);
            osc.start(); osc.stop(this.ctx.currentTime + 0.12);
            this._scheduleWaterDrips(minInterval, maxInterval);
        }, delay * 1000);
    }

    _makeNoiseBuffer(durationSec) {
        const len = Math.floor(this.ctx.sampleRate * durationSec);
        const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
        return buf;
    }

    /** Short ascending two-note chime — played when a skill card is selected */
    playSkillAcquire() {
        if (!this.initialized) return;
        [660, 880].forEach((freq, i) => {
            const t = this.ctx.currentTime + i * 0.07;
            const osc = this.ctx.createOscillator(); osc.type = 'sine'; osc.frequency.value = freq;
            const g = this.ctx.createGain();
            g.gain.setValueAtTime(0.18, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
            osc.connect(g); g.connect(this.output); osc.start(t); osc.stop(t + 0.22);
        });
    }

    /** Crystalline three-note arpeggio — played when a relic is acquired */
    playRelicAcquire() {
        if (!this.initialized) return;
        // C5 → G5 → C6: magical, distinct from level-up
        [523.25, 783.99, 1046.50].forEach((freq, i) => {
            const t = this.ctx.currentTime + i * 0.09;
            const osc = this.ctx.createOscillator(); osc.type = 'triangle'; osc.frequency.value = freq;
            const g = this.ctx.createGain();
            g.gain.setValueAtTime(0.15, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
            osc.connect(g); g.connect(this.output); osc.start(t); osc.stop(t + 0.35);
        });
    }

    /** Urgent upward burst — played when a challenge arena starts */
    playChallengeStart() {
        if (!this.initialized) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator(); osc.type = 'square';
        osc.frequency.setValueAtTime(200, t); osc.frequency.exponentialRampToValueAtTime(500, t + 0.18);
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0.22, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
        osc.connect(g); g.connect(this.output); osc.start(t); osc.stop(t + 0.22);
    }

    /** Short downward sting — played when a challenge is failed */
    playChallengeFailure() {
        if (!this.initialized) return;
        [400, 250, 150].forEach((freq, i) => {
            const t = this.ctx.currentTime + i * 0.08;
            const osc = this.ctx.createOscillator(); osc.type = 'square';
            osc.frequency.value = freq;
            const g = this.ctx.createGain();
            g.gain.setValueAtTime(0.2, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
            osc.connect(g); g.connect(this.output); osc.start(t); osc.stop(t + 0.1);
        });
    }

    /** Three ascending tones — played when a challenge is completed successfully */
    playChallengeSuccess() {
        if (!this.initialized) return;
        [300, 500, 750].forEach((freq, i) => {
            const t = this.ctx.currentTime + i * 0.08;
            const osc = this.ctx.createOscillator(); osc.type = 'triangle';
            osc.frequency.value = freq;
            const g = this.ctx.createGain();
            g.gain.setValueAtTime(0.18, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
            osc.connect(g); g.connect(this.output); osc.start(t); osc.stop(t + 0.14);
        });
    }

    /** Two rising tones — played when a gauntlet wave is cleared and the next is incoming */
    playGauntletWaveCleared() {
        if (!this.initialized) return;
        [350, 550].forEach((freq, i) => {
            const t = this.ctx.currentTime + i * 0.1;
            const osc = this.ctx.createOscillator(); osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, t); osc.frequency.exponentialRampToValueAtTime(freq * 1.5, t + 0.18);
            const g = this.ctx.createGain();
            g.gain.setValueAtTime(0.18, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
            osc.connect(g); g.connect(this.output); osc.start(t); osc.stop(t + 0.22);
        });
    }

    /** Single low tick — played each second in last 5s of challenge timer */
    playChallengeTimerTick() {
        if (!this.initialized) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator(); osc.type = 'triangle'; osc.frequency.value = 880;
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0.14, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
        osc.connect(g); g.connect(this.output); osc.start(t); osc.stop(t + 0.06);
    }

    /** Boss phase-change stinger: two sharp rising tones */
    playBossPhaseTransition() {
        if (!this.initialized) return;
        [300, 600].forEach((freq, i) => {
            const t = this.ctx.currentTime + i * 0.09;
            const osc = this.ctx.createOscillator(); osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, t); osc.frequency.exponentialRampToValueAtTime(freq * 1.6, t + 0.15);
            const g = this.ctx.createGain();
            g.gain.setValueAtTime(0.25, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
            osc.connect(g); g.connect(this.output); osc.start(t); osc.stop(t + 0.18);
        });
    }

    playEliteSpawn() {
        if (!this.initialized || this.muted) return;
        // Two rising sine chirps — danger warning
        [440, 660].forEach((freq, i) => {
            const t = this.ctx.currentTime + i * 0.12;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, t);
            osc.frequency.exponentialRampToValueAtTime(freq * 1.45, t + 0.13);
            gain.gain.setValueAtTime(0.11, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
            osc.connect(gain);
            gain.connect(this.output);
            osc.start(t);
            osc.stop(t + 0.16);
        });
    }

    // ─── Enemy-specific audio (S4) ───

    playVineSpitterFire() {
        if (!this.initialized) return;
        // Wet "pthww" — bandpass-filtered noise burst
        const bufferSize = Math.floor(this.ctx.sampleRate * 0.13);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.max(0, 1 - i / bufferSize);
        }
        const src = this.ctx.createBufferSource();
        src.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 700;
        filter.Q.value = 2.0;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.13);
        src.connect(filter);
        filter.connect(gain);
        gain.connect(this.output);
        src.start();
    }

    playBerserkerCharge() {
        if (!this.initialized) return;
        // Heavy low-freq impact: sawtooth sweep down
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(130, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(55, this.ctx.currentTime + 0.22);
        gain.gain.setValueAtTime(0.22, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.28);
        osc.connect(gain);
        gain.connect(this.output);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.28);
    }

    playPyrebatDive() {
        if (!this.initialized) return;
        // High-pitched descending whoosh
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1500, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(380, this.ctx.currentTime + 0.32);
        gain.gain.setValueAtTime(0.09, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(this.output);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.35);
    }

    playRelicSynergy() {
        if (!this.initialized || this.muted) return;
        // Bright shimmer: ascending triangle-wave arpeggio (3 notes)
        const notes = [523, 659, 784]; // C5, E5, G5
        notes.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.value = freq;
            const t = this.ctx.currentTime + i * 0.09;
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.18, t + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
            osc.connect(gain);
            gain.connect(this.output);
            osc.start(t);
            osc.stop(t + 0.28);
        });
    }

    playWaterSplash() {
        if (!this.initialized || this.muted) return;
        // Short water chirp: high → low freq over 120ms
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1100, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(350, this.ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);
        osc.connect(gain); gain.connect(this.output);
        osc.start(); osc.stop(this.ctx.currentTime + 0.18);
    }

    playPassiveTrigger(type) {
        if (!this.initialized || this.muted) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        // Each passive type gets a distinct short tone
        const config = {
            kill_fuel:      { type: 'sine',     freq: 440, endFreq: 520, dur: 0.12, vol: 0.09 },
            shadow_strike:  { type: 'sine',     freq: 330, endFreq: 300, dur: 0.10, vol: 0.08 },
            fleet_footed:   { type: 'sine',     freq: 880, endFreq: 1040, dur: 0.07, vol: 0.07 },
            iron_will:      { type: 'triangle', freq: 220, endFreq: 220,  dur: 0.18, vol: 0.10 },
            duelist_rhythm: { type: 'sine',     freq: 550, endFreq: 620,  dur: 0.09, vol: 0.09 },
            combustion:     { type: 'sawtooth', freq: 280, endFreq: 180,  dur: 0.13, vol: 0.07 },
        };
        const cfg = config[type] || { type: 'sine', freq: 500, endFreq: 500, dur: 0.09, vol: 0.07 };
        osc.type = cfg.type;
        osc.frequency.setValueAtTime(cfg.freq, this.ctx.currentTime);
        if (cfg.endFreq !== cfg.freq) {
            osc.frequency.exponentialRampToValueAtTime(cfg.endFreq, this.ctx.currentTime + cfg.dur);
        }
        gain.gain.setValueAtTime(cfg.vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + cfg.dur + 0.02);
        osc.connect(gain);
        gain.connect(this.output);
        osc.start();
        osc.stop(this.ctx.currentTime + cfg.dur + 0.02);
    }

    playCloseCallPing() {
        if (!this.initialized || this.muted) return;
        // Sharp staccato blip — urgent proximity warning
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(880, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(440, this.ctx.currentTime + 0.06);
        gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.10);
        osc.connect(gain);
        gain.connect(this.output);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.10);
    }

    /** Two ascending tones — signals the 3s combo window is open */
    playQPrimed() {
        if (!this.initialized || this.muted) return;
        [440, 660].forEach((freq, i) => {
            const t = this.ctx.currentTime + i * 0.1;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.07, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
            osc.connect(gain);
            gain.connect(this.output);
            osc.start(t);
            osc.stop(t + 0.18);
        });
    }

    /** Sharp impact burst — fires on primed Q activation */
    playComboFire() {
        if (!this.initialized || this.muted) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, t);
        osc.frequency.exponentialRampToValueAtTime(100, t + 0.15);
        gain.gain.setValueAtTime(0.15, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        osc.connect(gain);
        gain.connect(this.output);
        osc.start(t);
        osc.stop(t + 0.15);
    }

    /** Low ominous surge — shroud pulse incoming */
    playShroudSurge() {
        if (!this.initialized || this.muted) return;
        const t = this.ctx.currentTime;
        // Deep descending square + noise swell
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(100, t);
        osc.frequency.exponentialRampToValueAtTime(40, t + 0.4);
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.18, t + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
        osc.connect(gain); gain.connect(this.output);
        osc.start(t); osc.stop(t + 0.55);
        // High shimmer overlay
        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(600, t + 0.05);
        osc2.frequency.exponentialRampToValueAtTime(200, t + 0.4);
        gain2.gain.setValueAtTime(0.06, t + 0.05);
        gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
        osc2.connect(gain2); gain2.connect(this.output);
        osc2.start(t + 0.05); osc2.stop(t + 0.45);
    }

    /** Airy exhale — shroud pulse receding */
    playShroudRecede() {
        if (!this.initialized || this.muted) return;
        const t = this.ctx.currentTime;
        // Ascending filtered noise: breath-out feel
        const buf = this._makeNoiseBuffer(0.35);
        const src = this.ctx.createBufferSource(); src.buffer = buf;
        const flt = this.ctx.createBiquadFilter();
        flt.type = 'bandpass'; flt.frequency.value = 400; flt.Q.value = 0.6;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.12, t);
        gain.gain.linearRampToValueAtTime(0.01, t + 0.35);
        src.connect(flt); flt.connect(gain); gain.connect(this.output);
        src.start(t); src.stop(t + 0.35);
    }

    /** Rising sine stinger — plays on boss phase 3 (enraged) */
    playPhaseStinger() {
        if (!this.initialized || this.muted) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(220, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.35);
        gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(this.output);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.35);
    }

    playHurt() {
        if (!this.initialized) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.18);
        gain.gain.setValueAtTime(0.10, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);
        osc.connect(gain); gain.connect(this.output);
        osc.start(); osc.stop(this.ctx.currentTime + 0.18);
    }

    playEnemyDeath(typeId) {
        if (!this.initialized) return;
        const isHeavy = typeId && (typeId.includes('berserker') || typeId.includes('hulk') || typeId.includes('chieftain'));
        if (isHeavy) {
            [260, 180].forEach((freq, i) => {
                const t = this.ctx.currentTime + i * 0.06;
                const osc = this.ctx.createOscillator(); osc.type = 'triangle'; osc.frequency.value = freq;
                const g = this.ctx.createGain();
                g.gain.setValueAtTime(0.08, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
                osc.connect(g); g.connect(this.output); osc.start(t); osc.stop(t + 0.22);
            });
        } else {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(320, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(140, this.ctx.currentTime + 0.14);
            gain.gain.setValueAtTime(0.07, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.14);
            osc.connect(gain); gain.connect(this.output);
            osc.start(); osc.stop(this.ctx.currentTime + 0.14);
        }
    }

    playPauseOpen() {
        if (!this.initialized) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(280, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(220, this.ctx.currentTime + 0.09);
        gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.09);
        osc.connect(gain); gain.connect(this.output);
        osc.start(); osc.stop(this.ctx.currentTime + 0.09);
    }

    playPauseClose() {
        if (!this.initialized) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(220, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(280, this.ctx.currentTime + 0.09);
        gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.09);
        osc.connect(gain); gain.connect(this.output);
        osc.start(); osc.stop(this.ctx.currentTime + 0.09);
    }

    playDashReady() {
        if (!this.initialized) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.10);
        gain.gain.setValueAtTime(0.07, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.10);
        osc.connect(gain); gain.connect(this.output);
        osc.start(); osc.stop(this.ctx.currentTime + 0.10);
    }

    playWinStinger() {
        if (!this.initialized) return;
        // Ascending major arpeggio — triumphant counterpart to the descending game-over stinger
        const freqs = [330, 415, 495, 660];
        freqs.forEach((freq, i) => {
            const t = this.ctx.currentTime + i * 0.18;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, t);
            osc.frequency.exponentialRampToValueAtTime(freq * 1.01, t + 0.4);
            gain.gain.setValueAtTime(0.0, t);
            gain.gain.linearRampToValueAtTime(0.18, t + 0.04);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
            osc.connect(gain); gain.connect(this.output);
            osc.start(t); osc.stop(t + 0.55);
        });
    }

    /** Deep resonant pulse + ascending shimmer — plays when the Cinder Vessel death-save is collected */
    playCinderVesselCollect() {
        if (!this.initialized) return;
        const t = this.ctx.currentTime;
        // Low protective pulse: 130Hz sine, slow decay — conveys "you are now guarded"
        const osc1 = this.ctx.createOscillator();
        const g1 = this.ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(130, t);
        osc1.frequency.exponentialRampToValueAtTime(110, t + 0.4);
        g1.gain.setValueAtTime(0.0, t);
        g1.gain.linearRampToValueAtTime(0.16, t + 0.04);
        g1.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
        osc1.connect(g1); g1.connect(this.output);
        osc1.start(t); osc1.stop(t + 0.55);
        // Ascending shimmer: C6 → G6, triangle — the "vessel ignites"
        const osc2 = this.ctx.createOscillator();
        const g2 = this.ctx.createGain();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(1047, t + 0.08);
        osc2.frequency.exponentialRampToValueAtTime(1568, t + 0.35);
        g2.gain.setValueAtTime(0.11, t + 0.08);
        g2.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
        osc2.connect(g2); g2.connect(this.output);
        osc2.start(t + 0.08); osc2.stop(t + 0.5);
    }

    /** Soft two-note greeting — plays when the player interacts with a Survivor NPC */
    playSurvivorInteract() {
        if (!this.initialized) return;
        // Gentle major third (C5 → E5): warm and hopeful, distinct from the wisp chime
        [523.25, 659.25].forEach((freq, i) => {
            const t = this.ctx.currentTime + i * 0.12;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, t);
            gain.gain.setValueAtTime(0.0, t);
            gain.gain.linearRampToValueAtTime(0.11, t + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.30);
            osc.connect(gain);
            gain.connect(this.output);
            osc.start(t);
            osc.stop(t + 0.30);
        });
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }
}
