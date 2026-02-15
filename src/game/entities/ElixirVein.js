import Phaser from 'phaser';
import { ELIXIR, COLORS } from '../constants.js';

export class ElixirVein extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'elixir_vein');
        scene.add.existing(this);
        scene.physics.add.existing(this, true); // static body

        this.depleted = false;
        this.miningProgress = 0;

        // Glow pulse
        scene.tweens.add({
            targets: this,
            alpha: { from: 0.7, to: 1 },
            duration: 1200,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Mining progress bar (hidden initially)
        this.progressBg = scene.add.rectangle(x, y - 30, 36, 6, COLORS.BAR_BG).setDepth(10).setVisible(false);
        this.progressFill = scene.add.rectangle(x - 17, y - 30, 0, 4, COLORS.ELIXIR_CYAN).setOrigin(0, 0.5).setDepth(10).setVisible(false);
    }

    startMining() {
        if (this.depleted) return false;
        this.miningProgress = 0;
        this.progressBg.setVisible(true);
        this.progressFill.setVisible(true);
        return true;
    }

    updateMining(delta) {
        if (this.depleted) return false;
        this.miningProgress += delta / 1000;
        const pct = Math.min(this.miningProgress / ELIXIR.MINE_TIME, 1);
        this.progressFill.width = 34 * pct;

        if (this.miningProgress >= ELIXIR.MINE_TIME) {
            this.harvest();
            return true; // mining complete
        }
        return false;
    }

    stopMining() {
        this.miningProgress = 0;
        this.progressBg.setVisible(false);
        this.progressFill.setVisible(false);
        this.progressFill.width = 0;
    }

    harvest() {
        this.depleted = true;
        this.progressBg.setVisible(false);
        this.progressFill.setVisible(false);
        this.setAlpha(0.25);
        this.setTint(0x666666);
        // Stop glow tween
        this.scene.tweens.killTweensOf(this);
    }
}
