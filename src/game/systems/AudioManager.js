import { AUDIO } from '../constants.js';

export class AudioManager {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.shroudOsc = null;
        this.shroudGain = null;
        this.initialized = false;
        this.muted = false;
        this._volume = 1.0;
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
    }

    setVolume(vol) {
        this._volume = Math.max(0, Math.min(1, vol));
        if (!this.muted && this.masterGain) {
            this.masterGain.gain.setTargetAtTime(
                this._volume, this.ctx.currentTime, 0.05
            );
        }
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

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }
}
