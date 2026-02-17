import { GHOST_RUN } from '../constants.js';

const STORAGE_KEY = 'elixirs-shadow-ghost-run';

export class GhostRun {
    constructor(scene) {
        this.scene = scene;
        this.recording = [];
        this.recordTimer = 0;

        // Load best run
        this.bestRun = [];
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) this.bestRun = JSON.parse(raw);
        } catch {}

        // Create ghost sprite if we have a best run
        this.ghost = null;
        this.playbackIndex = 0;
        this.playbackTimer = 0;

        if (this.bestRun.length > 0) {
            this.ghost = scene.add.rectangle(
                this.bestRun[0].x, this.bestRun[0].y,
                28, 48, GHOST_RUN.GHOST_TINT, GHOST_RUN.GHOST_ALPHA
            ).setDepth(2);
        }
    }

    update(delta, playerX, playerY, flipX) {
        // Record current position
        this.recordTimer += delta;
        if (this.recordTimer >= GHOST_RUN.RECORD_INTERVAL) {
            this.recordTimer -= GHOST_RUN.RECORD_INTERVAL;
            this.recording.push({ x: playerX, y: playerY, flipX });
        }

        // Playback best run ghost
        if (this.ghost && this.bestRun.length > 0) {
            this.playbackTimer += delta;
            if (this.playbackTimer >= GHOST_RUN.RECORD_INTERVAL) {
                this.playbackTimer -= GHOST_RUN.RECORD_INTERVAL;
                this.playbackIndex++;
            }

            if (this.playbackIndex < this.bestRun.length) {
                const snap = this.bestRun[this.playbackIndex];
                this.ghost.setPosition(snap.x, snap.y);
            } else {
                // Ghost run ended
                this.ghost.setAlpha(0);
            }
        }
    }

    saveIfBest() {
        if (this.recording.length > this.bestRun.length) {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(this.recording));
            } catch {}
        }
    }
}
