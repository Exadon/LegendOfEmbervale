import Phaser from 'phaser';
import { WORLD, FLAME_SHRINE } from '../constants.js';

export class ChallengeShrine extends Phaser.GameObjects.Container {
    constructor(scene, x) {
        const y = WORLD.GROUND_Y - FLAME_SHRINE.HEIGHT / 2;
        super(scene, x, y);
        scene.add.existing(this);
        scene.physics.add.existing(this, true);

        this.body.setSize(FLAME_SHRINE.WIDTH, FLAME_SHRINE.HEIGHT);
        this.setDepth(4);
        this.used = false;

        // Stone base (purple-red tinted)
        const base = scene.add.rectangle(0, 0, 48, 56, 0x6A3A6A);
        this.add(base);

        // Pulsing glow
        this.glow = scene.add.circle(0, -20, 16, 0xFF4488, 0.4);
        this.add(this.glow);

        scene.tweens.add({
            targets: this.glow,
            alpha: { from: 0.2, to: 0.6 },
            scaleX: { from: 0.9, to: 1.3 },
            scaleY: { from: 0.9, to: 1.3 },
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Label
        const label = scene.add.text(0, -42, 'CHALLENGE', {
            fontSize: '8px', color: '#FF4488', fontFamily: 'monospace',
            stroke: '#000000', strokeThickness: 2
        }).setOrigin(0.5);
        this.add(label);
    }

    activate() {
        if (this.used) return false;
        this.used = true;
        this.glow.setAlpha(0.1);
        return true;
    }
}
