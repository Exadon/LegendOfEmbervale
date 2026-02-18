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

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }
}
