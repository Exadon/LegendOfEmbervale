import { AUDIO } from '../constants.js';

export class AudioManager {
    constructor() {
        this.ctx = null;
        this.shroudOsc = null;
        this.shroudGain = null;
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this._setupShroudHum();
            this.initialized = true;
        } catch (e) {
            console.warn('Web Audio not available:', e);
        }
    }

    _setupShroudHum() {
        this.shroudOsc = this.ctx.createOscillator();
        this.shroudGain = this.ctx.createGain();

        this.shroudOsc.type = 'sine';
        this.shroudOsc.frequency.value = AUDIO.SHROUD_HUM_FREQ;
        this.shroudGain.gain.value = 0;

        this.shroudOsc.connect(this.shroudGain);
        this.shroudGain.connect(this.ctx.destination);
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
        gain.connect(this.ctx.destination);
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
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.3);
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }
}
