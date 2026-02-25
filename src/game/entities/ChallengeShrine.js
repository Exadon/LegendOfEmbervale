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

        // Skullflame sprite
        this.skull = scene.add.sprite(0, 8, 'skullflame').setDisplaySize(48, 48);
        this.skull.setTint(0xFF4488);
        this.skull.play('skullflame_idle');
        this.add(this.skull);

        // Pulsing scale
        scene.tweens.add({
            targets: this.skull,
            scaleX: { from: this.skull.scaleX * 0.9, to: this.skull.scaleX * 1.1 },
            scaleY: { from: this.skull.scaleY * 0.9, to: this.skull.scaleY * 1.1 },
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Label
        const label = scene.add.text(0, -26, 'CHALLENGE', {
            fontSize: '8px', color: '#FF4488', fontFamily: 'monospace',
            stroke: '#000000', strokeThickness: 2
        }).setOrigin(0.5);
        this.add(label);
    }

    activate() {
        if (this.used) return false;
        this.used = true;
        this.scene.tweens.killTweensOf(this.skull);
        this.scene.tweens.add({ targets: this.skull, alpha: 0.3, scaleX: this.skull.scaleX, scaleY: this.skull.scaleY, duration: 300 });
        return true;
    }
}
