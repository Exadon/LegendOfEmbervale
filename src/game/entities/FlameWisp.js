import Phaser from 'phaser';
import { FLAME_WISP } from '../constants.js';

export class FlameWisp extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'wisp');
        scene.add.existing(this);
        scene.physics.add.existing(this, true);

        this.collected = false;
        this.magnetized = false;
        this.baseY = y;

        // Play wisp animation with golden tint
        this.play('wisp_idle');
        this.setTint(0xFFAA33);

        // Gentle floating bob
        this._bobTween = scene.tweens.add({
            targets: this,
            y: y - FLAME_WISP.BOB_RANGE,
            duration: FLAME_WISP.BOB_DURATION,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Warm glow pulse (higher min alpha to stay visible)
        this._glowTween = scene.tweens.add({
            targets: this,
            alpha: { from: 0.85, to: 1 },
            duration: 800,
            yoyo: true,
            repeat: -1
        });
    }

    magnetTo(targetX, targetY) {
        if (!this.magnetized) {
            this.magnetized = true;
            // Kill floating tweens so they don't fight with magnet movement
            if (this._bobTween) this._bobTween.destroy();
            if (this._glowTween) this._glowTween.destroy();
            this.setAlpha(1);
        }

        const angle = Phaser.Math.Angle.Between(this.x, this.y, targetX, targetY);
        this.x += Math.cos(angle) * FLAME_WISP.MAGNET_SPEED;
        this.y += Math.sin(angle) * FLAME_WISP.MAGNET_SPEED;
        this.body.reset(this.x, this.y);
    }

    collect() {
        if (this.collected) return false;
        this.collected = true;

        // Quick absorb animation: drift up, scale up and fade
        this.stop();
        this.scene.tweens.killTweensOf(this);
        this.scene.tweens.add({
            targets: this,
            scaleX: 2,
            scaleY: 2,
            alpha: 0,
            y: this.y - 22,
            duration: 250,
            ease: 'Power2',
            onComplete: () => this.destroy()
        });

        return true;
    }
}
