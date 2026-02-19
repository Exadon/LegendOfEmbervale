import Phaser from 'phaser';
import { FLAME, ELIXIR_CORRUPTION } from '../constants.js';
import { GlobalState } from '../GlobalState.js';
import { SkillManager } from './SkillManager.js';

export class MiningSystem {
    constructor(scene) {
        this.scene = scene;
        this.currentMiningVein = null;
        this._corruptionOverlay = null;
        this._prevCorruption = 0;
    }

    update(delta) {
        const s = this.scene;
        const PROXIMITY_RANGE = 60;
        let overlappingVein = null;

        for (const vein of s.elixirVeins.getChildren()) {
            if (!vein.active || vein.depleted) continue;
            if (s.physics.overlap(s.player, vein)) {
                overlappingVein = vein;
                vein.hidePrompt();
            } else {
                const dist = Phaser.Math.Distance.Between(s.player.x, s.player.y, vein.x, vein.y);
                if (dist < PROXIMITY_RANGE) vein.showPrompt();
                else vein.hidePrompt();
            }
        }

        if (overlappingVein) {
            if (this.currentMiningVein !== overlappingVein) {
                if (this.currentMiningVein) {
                    this.currentMiningVein.stopMining();
                    s.particles.miningSparkles(0, 0, false);
                }
                this.currentMiningVein = overlappingVein;
                overlappingVein.startMining();
            }
            s.particles.miningSparkles(overlappingVein.x, overlappingVein.y - 10, true);
            const complete = overlappingVein.updateMining(delta);
            if (complete) {
                s.particles.miningSparkles(0, 0, false);
                s.runStats.elixirMined++;
                GlobalState.addElixir(1);
                s.shroud.surge();
                s.hud.popElixir();
                s.audio.playMineComplete();
                s.popups.elixirMined(overlappingVein.x, overlappingVein.y);
                s.particles.mineComplete(overlappingVein.x, overlappingVein.y);
                s.cameras.main.shake(200, 0.005);

                GlobalState.addCorruption(ELIXIR_CORRUPTION.PER_MINE);

                if (SkillManager.getFlag('mining.stunOnComplete')) {
                    const stunR = SkillManager.getValue('mining.stunRadius', 150);
                    const stunD = SkillManager.getValue('mining.stunDuration', 3000);
                    for (const enemy of s.enemyGroup.getChildren()) {
                        if (!enemy.active || !enemy.alive) continue;
                        const d = Phaser.Math.Distance.Between(overlappingVein.x, overlappingVein.y, enemy.x, enemy.y);
                        if (d < stunR) {
                            enemy.stun(stunD);
                        }
                    }
                }

                this.currentMiningVein = null;
            }
        } else {
            if (this.currentMiningVein) {
                this.currentMiningVein.stopMining();
                s.particles.miningSparkles(0, 0, false);
                this.currentMiningVein = null;
            }
        }
    }

    updateCorruption(delta) {
        const s = this.scene;
        let inCorruption = false;
        for (const pool of s.corruptionPools.getChildren()) {
            if (!pool.active) continue;
            if (s.physics.overlap(s.player, pool)) {
                inCorruption = true;
                s.particles.corruptionBubbles(pool.x, pool.y - 6, true);
            }
        }
        if (inCorruption) {
            if (!SkillManager.getFlag('corruption.immuneSlow')) {
                s.player.inCorruption = true;
            }
            GlobalState.drainFlame(FLAME.DRAIN_CORRUPTION * (delta / 1000));
        }
    }

    updateCorruptionVisuals() {
        const s = this.scene;
        const c = GlobalState.corruption;
        const prevC = this._prevCorruption || 0;

        if (c >= ELIXIR_CORRUPTION.THRESHOLD_MEDIUM && !this._corruptionOverlay) {
            const { width, height } = s.scale;
            this._corruptionOverlay = s.add.rectangle(width / 2, height / 2, width, height, 0x5500AA, 0)
                .setScrollFactor(0).setDepth(97);
        }
        if (this._corruptionOverlay) {
            if (c < ELIXIR_CORRUPTION.THRESHOLD_MEDIUM) {
                this._corruptionOverlay.setAlpha(0);
            } else if (c < ELIXIR_CORRUPTION.THRESHOLD_HIGH) {
                this._corruptionOverlay.setAlpha(0.05);
            } else {
                this._corruptionOverlay.setAlpha(0.1);
            }
        }

        if (prevC < ELIXIR_CORRUPTION.THRESHOLD_MEDIUM && c >= ELIXIR_CORRUPTION.THRESHOLD_MEDIUM) {
            s.popups.show(s.player.x, s.player.y - 60, 'CORRUPTION RISING', '#9933FF', '14px');
            s.cameras.main.shake(200, 0.004);
            s.audio.playShroudWarning();
        }
        if (prevC < ELIXIR_CORRUPTION.THRESHOLD_HIGH && c >= ELIXIR_CORRUPTION.THRESHOLD_HIGH) {
            s.popups.show(s.player.x, s.player.y - 60, 'CORRUPTION CRITICAL!', '#FF33FF', '16px');
            s.cameras.main.shake(400, 0.008);
            s.cameras.main.flash(200, 85, 0, 170);
            s.audio.playShroudWarning();
        }
        this._prevCorruption = c;

        if (s.hud.updateCorruption) {
            s.hud.updateCorruption(c);
        }
    }
}
