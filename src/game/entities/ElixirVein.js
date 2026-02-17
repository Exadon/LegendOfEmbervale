import Phaser from 'phaser';
import { ELIXIR, COLORS } from '../constants.js';
import { SkillManager } from '../systems/SkillManager.js';

export class ElixirVein extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        // Use well sprite; origin at 0.65 Y so the blue liquid sits underground
        const hasWellSprite = scene.textures.exists('well');
        super(scene, x, y, hasWellSprite ? 'well' : 'elixir_vein');
        scene.add.existing(this);
        scene.physics.add.existing(this, true); // static body

        this._hasWellSprite = hasWellSprite;
        this.depleted = false;
        this.miningProgress = 0;

        if (hasWellSprite) {
            // Origin so tower base sits at ground level, blue shaft underground
            this.setOrigin(0.5, 0.55);
            // Body covers the above-ground tower portion for overlap detection
            this.body.setSize(50, 50);
            this.body.setOffset(8, 2);
        } else {
            // Fallback: place old texture so bottom sits at ground level
            this.setOrigin(0.5, 1.0);
            this.body.updateFromGameObject();
        }

        // Glow pulse
        scene.tweens.add({
            targets: this,
            alpha: { from: 0.7, to: 1 },
            duration: 1200,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // UI positions relative to the top of the above-ground portion
        const uiY = hasWellSprite ? y - 50 : y - 30;

        // Mining progress bar (hidden initially)
        this.progressBg = scene.add.rectangle(x, uiY, 36, 6, COLORS.BAR_BG).setDepth(10).setVisible(false);
        this.progressFill = scene.add.rectangle(x - 17, uiY, 0, 4, COLORS.ELIXIR_CYAN).setOrigin(0, 0.5).setDepth(10).setVisible(false);

        // Proximity prompt (hidden initially)
        this.prompt = scene.add.text(x, uiY - 18, 'Stand to mine', {
            fontSize: '11px',
            color: '#00FFCC',
            fontFamily: 'monospace',
            backgroundColor: '#000000AA',
            padding: { x: 4, y: 2 }
        }).setOrigin(0.5).setDepth(10).setVisible(false);

        this.promptTween = scene.tweens.add({
            targets: this.prompt,
            y: uiY - 22,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
            paused: true
        });
    }

    showPrompt() {
        if (this.depleted) return;
        this.prompt.setVisible(true);
        this.promptTween.resume();
    }

    hidePrompt() {
        this.prompt.setVisible(false);
        this.promptTween.pause();
    }

    startMining() {
        if (this.depleted) return false;
        this.miningProgress = 0;
        this.hidePrompt();
        this.progressBg.setVisible(true);
        this.progressFill.setVisible(true);
        return true;
    }

    updateMining(delta) {
        if (this.depleted) return false;
        this.miningProgress += delta / 1000;
        const mineTime = SkillManager.getValue('mining.mineTime', ELIXIR.MINE_TIME);
        const pct = Math.min(this.miningProgress / mineTime, 1);
        this.progressFill.width = 34 * pct;

        if (this.miningProgress >= mineTime) {
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
        this.hidePrompt();
        // Stop glow tween
        this.scene.tweens.killTweensOf(this);

        if (this._hasWellSprite && this.scene.textures.exists('driedwell')) {
            this.setTexture('driedwell');
            this.setAlpha(1);
        } else {
            this.setAlpha(0.25);
            this.setTint(0x666666);
        }
    }
}
