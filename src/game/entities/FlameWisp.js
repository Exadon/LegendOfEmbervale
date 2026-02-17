import Phaser from 'phaser';
import { FLAME_WISP } from '../constants.js';

export class FlameWisp extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'pickup_frm1');
        scene.add.existing(this);
        scene.physics.add.existing(this, true);

        this.collected = false;
        this.baseY = y;

        // Play pickup animation
        this.play('pickup_anim');

        // Gentle floating bob
        scene.tweens.add({
            targets: this,
            y: y - FLAME_WISP.BOB_RANGE,
            duration: FLAME_WISP.BOB_DURATION,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Warm glow pulse
        scene.tweens.add({
            targets: this,
            alpha: { from: 0.6, to: 1 },
            duration: 800,
            yoyo: true,
            repeat: -1
        });
    }

    collect() {
        if (this.collected) return false;
        this.collected = true;

        // Quick absorb animation: scale up and fade
        this.stop();
        this.scene.tweens.killTweensOf(this);
        this.scene.tweens.add({
            targets: this,
            scaleX: 2,
            scaleY: 2,
            alpha: 0,
            duration: 250,
            ease: 'Power2',
            onComplete: () => this.destroy()
        });

        return true;
    }
}
