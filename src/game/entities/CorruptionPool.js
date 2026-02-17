import Phaser from 'phaser';
import { CORRUPTION } from '../constants.js';

export class CorruptionPool extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        // Place on top of ground surface
        super(scene, x, y - CORRUPTION.HEIGHT / 2, 'corruption_pool');
        scene.add.existing(this);
        scene.physics.add.existing(this, true);

        this.setDepth(1);

        // Bubbling surface animation
        scene.tweens.add({
            targets: this,
            scaleY: { from: 0.9, to: 1.1 },
            duration: 1600,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Faint purple glow pulse
        scene.tweens.add({
            targets: this,
            alpha: { from: 0.7, to: 1 },
            duration: 2000,
            yoyo: true,
            repeat: -1
        });
    }
}
