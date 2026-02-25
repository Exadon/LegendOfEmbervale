import Phaser from 'phaser';
import { FLAME_SHRINE } from '../constants.js';

export class FlameShrine extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'bonfire_frm1');
        scene.add.existing(this);
        scene.physics.add.existing(this, true);

        this.used = false;
        this.setDepth(2);

        // Play bonfire animation
        this.play('bonfire_anim');

        // Flame flicker
        scene.tweens.add({
            targets: this,
            alpha: { from: 0.8, to: 1 },
            duration: 600,
            yoyo: true,
            repeat: -1
        });
    }

    activate() {
        if (this.used) return false;
        this.used = true;

        // Stop animation and dim shrine after use
        this.stop();
        this.scene.tweens.killTweensOf(this);
        this.scene.tweens.add({
            targets: this,
            alpha: 0.3,
            duration: 800,
            onComplete: () => { if (this.active) this.setTint(0x555555); }
        });

        return true;
    }
}
