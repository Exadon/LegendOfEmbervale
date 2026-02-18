import { GHOST_RUN } from '../constants.js';
import { CLASS_DEFS, DEFAULT_CLASS } from './ClassDefs.js';
import { SkillManager } from './SkillManager.js';

const STORAGE_KEY = 'elixirs-shadow-ghost-run';

export class GhostRun {
    constructor(scene) {
        this.scene = scene;
        this.recording = [];
        this.recordTimer = 0;

        // Load best run (handles old array format and new { classId, positions } format)
        this.bestRun = null;
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) {
                    // Old format: plain array of { x, y, flipX }
                    this.bestRun = { classId: 'adventurer', positions: parsed };
                } else {
                    this.bestRun = parsed;
                }
            }
        } catch {}

        // Create ghost sprite if we have a best run with positions
        this.ghost = null;
        this.ghostLabel = null;
        this.playbackIndex = 0;
        this.playbackTimer = 0;

        if (this.bestRun && this.bestRun.positions && this.bestRun.positions.length > 0) {
            const pos = this.bestRun.positions;
            const classDef = CLASS_DEFS[this.bestRun.classId] || DEFAULT_CLASS;

            this.ghost = scene.add.sprite(pos[0].x, pos[0].y, classDef.spriteKey);
            const fw = classDef.frameSize;
            const displaySize = classDef.displaySize || Math.max(48, Math.round(fw * 0.75));
            this.ghost.setScale(displaySize / fw);
            this.ghost.setTint(GHOST_RUN.GHOST_TINT);
            this.ghost.setAlpha(GHOST_RUN.GHOST_ALPHA);
            this.ghost.setDepth(2);
            if (classDef.idleAnim && scene.anims.exists(classDef.idleAnim)) {
                this.ghost.play(classDef.idleAnim);
            }

            this._ghostClassDef = classDef;

            this.ghostLabel = scene.add.text(
                pos[0].x, pos[0].y - 32,
                'GHOST', { fontSize: '8px', color: '#4488FF', fontFamily: 'monospace' }
            ).setOrigin(0.5).setAlpha(GHOST_RUN.GHOST_ALPHA).setDepth(2);
        }
    }

    update(delta, playerX, playerY, flipX) {
        // Record current position
        this.recordTimer += delta;
        if (this.recordTimer >= GHOST_RUN.RECORD_INTERVAL) {
            this.recordTimer -= GHOST_RUN.RECORD_INTERVAL;
            this.recording.push({ x: playerX, y: playerY, flipX });
        }

        // Playback best run ghost (interpolated)
        if (this.ghost && this.bestRun && this.bestRun.positions.length > 0) {
            const pos = this.bestRun.positions;

            this.playbackTimer += delta;
            if (this.playbackTimer >= GHOST_RUN.RECORD_INTERVAL) {
                this.playbackTimer -= GHOST_RUN.RECORD_INTERVAL;
                this.playbackIndex++;
            }

            if (this.playbackIndex < pos.length) {
                const curr = pos[this.playbackIndex];
                const next = pos[Math.min(this.playbackIndex + 1, pos.length - 1)];
                const t = this.playbackTimer / GHOST_RUN.RECORD_INTERVAL;
                const lx = curr.x + (next.x - curr.x) * t;
                const ly = curr.y + (next.y - curr.y) * t;
                this.ghost.setPosition(lx, ly);
                this.ghost.setFlipX(curr.flipX);

                // Swap between move/idle anims based on horizontal movement
                if (this._ghostClassDef) {
                    const moving = Math.abs(next.x - curr.x) > 5;
                    const moveAnim = this._ghostClassDef.moveAnim;
                    const idleAnim = this._ghostClassDef.idleAnim;
                    const currentKey = this.ghost.anims.currentAnim ? this.ghost.anims.currentAnim.key : null;
                    if (moving && moveAnim && currentKey !== moveAnim) {
                        this.ghost.play(moveAnim, true);
                    } else if (!moving && idleAnim && currentKey !== idleAnim) {
                        this.ghost.play(idleAnim, true);
                    }
                }

                if (this.ghostLabel) this.ghostLabel.setPosition(lx, ly - 32);
            } else {
                // Ghost run ended
                this.ghost.setAlpha(0);
                if (this.ghostLabel) this.ghostLabel.setAlpha(0);
            }
        }
    }

    saveIfBest() {
        const bestLen = (this.bestRun && this.bestRun.positions) ? this.bestRun.positions.length : 0;
        if (this.recording.length > bestLen) {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify({
                    classId: SkillManager.selectedClassId,
                    positions: this.recording,
                }));
            } catch {}
        }
    }
}
