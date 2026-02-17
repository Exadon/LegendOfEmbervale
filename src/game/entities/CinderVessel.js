import Phaser from 'phaser';
import { WORLD } from '../constants.js';

export class CinderVessel extends Phaser.GameObjects.Container {
    constructor(scene, x) {
        super(scene, x, WORLD.GROUND_Y);
        scene.add.existing(this);

        this.setDepth(4);
        this.collected = false;

        // Golden urn body
        const urn = scene.add.rectangle(0, -16, 16, 24, 0xD4A04A).setOrigin(0.5, 1);
        urn.setStrokeStyle(1, 0xFFCC00);

        // Flame on top
        this.flame = scene.add.circle(0, -28, 6, 0xFF8833, 0.9);

        // Glow
        this.glow = scene.add.circle(0, -20, 20, 0xFFCC00, 0.15);

        this.add([this.glow, urn, this.flame]);

        // Pulsing glow
        scene.tweens.add({
            targets: this.glow,
            alpha: { from: 0.1, to: 0.3 },
            scaleX: { from: 0.9, to: 1.2 },
            scaleY: { from: 0.9, to: 1.2 },
            duration: 1200,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
        });

        // Flame flicker
        scene.tweens.add({
            targets: this.flame,
            alpha: { from: 0.7, to: 1 },
            scaleX: { from: 0.8, to: 1.3 },
            scaleY: { from: 0.8, to: 1.3 },
            duration: 400,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
        });

        // Physics body for overlap
        scene.physics.add.existing(this, true);
        this.body.setSize(24, 32);
        this.body.setOffset(-12, -32);
    }

    collect() {
        if (this.collected) return false;
        this.collected = true;
        this.scene.tweens.add({
            targets: this,
            alpha: 0,
            scaleX: 1.5,
            scaleY: 1.5,
            duration: 400,
            onComplete: () => this.destroy(),
        });
        return true;
    }
}
