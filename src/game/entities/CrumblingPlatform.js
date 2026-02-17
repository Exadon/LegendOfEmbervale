import Phaser from 'phaser';
import { CRUMBLING_PLATFORM } from '../constants.js';

export class CrumblingPlatform extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'platform');
        scene.add.existing(this);
        scene.physics.add.existing(this, true);

        this.setDepth(1);

        this.originalY = y;
        this.standTime = 0;
        this.collapsed = false;
        this.regenerating = false;
        this.regenTimer = 0;
        this.playerOnTop = false;
    }

    update(delta) {
        if (this.collapsed) {
            if (this.regenerating) {
                this.regenTimer -= delta;
                if (this.regenTimer <= 0) {
                    this._regenerate();
                }
            }
            return;
        }

        if (this.playerOnTop) {
            this.standTime += delta;
            const pct = this.standTime / CRUMBLING_PLATFORM.STAND_TIME;

            // Shake when past threshold
            if (pct >= CRUMBLING_PLATFORM.SHAKE_THRESHOLD) {
                const intensity = (pct - CRUMBLING_PLATFORM.SHAKE_THRESHOLD) / (1 - CRUMBLING_PLATFORM.SHAKE_THRESHOLD);
                const shakeX = (Math.random() - 0.5) * 4 * intensity;
                this.x = this.body.x + this.body.width / 2 + shakeX;
                this._emitDust = true;
            }

            // Collapse
            if (this.standTime >= CRUMBLING_PLATFORM.STAND_TIME) {
                this._collapse();
            }
        } else {
            // Reset stand time when player leaves
            this.standTime = Math.max(0, this.standTime - delta * 2);
        }

        this.playerOnTop = false;
    }

    setPlayerOnTop() {
        this.playerOnTop = true;
    }

    _collapse() {
        this.collapsed = true;
        this.body.enable = false;

        this.scene.tweens.add({
            targets: this,
            y: this.originalY + 400,
            alpha: 0,
            duration: 500,
            ease: 'Power2',
            onComplete: () => {
                this.setVisible(false);
                this.regenerating = true;
                this.regenTimer = CRUMBLING_PLATFORM.REGEN_TIME;
            }
        });
    }

    _regenerate() {
        this.collapsed = false;
        this.regenerating = false;
        this.standTime = 0;
        this.y = this.originalY;
        this.setAlpha(1);
        this.setVisible(true);
        this.body.enable = true;
        this.body.updateFromGameObject();
    }
}
