import Phaser from 'phaser';
import { WORLD } from '../constants.js';

export class AncientObelisk extends Phaser.GameObjects.Container {
    constructor(scene, x) {
        super(scene, x, WORLD.GROUND_Y);
        scene.add.existing(this);

        this.setDepth(4);
        this.used = false;

        // Tall stone column
        const stone = scene.add.rectangle(0, -40, 18, 70, 0x444455).setOrigin(0.5, 1);
        stone.setStrokeStyle(1, 0x666688);

        // Pointed top
        const top = scene.add.triangle(0, -75, -10, 0, 10, 0, 0, -15, 0x555566).setOrigin(0.5, 1);

        // Glowing rune symbols
        this.runes = scene.add.text(0, -50, '\u2726\u2727\u2726', {
            fontSize: '10px', color: '#88AAFF', fontFamily: 'monospace',
        }).setOrigin(0.5);

        // Glow aura
        this.glow = scene.add.circle(0, -40, 22, 0x4466AA, 0.12);

        this.add([this.glow, stone, top, this.runes]);

        // Pulsing runes
        scene.tweens.add({
            targets: this.runes,
            alpha: { from: 0.5, to: 1 },
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
        });

        // Pulsing glow
        scene.tweens.add({
            targets: this.glow,
            alpha: { from: 0.08, to: 0.2 },
            scaleX: { from: 0.9, to: 1.3 },
            scaleY: { from: 0.9, to: 1.3 },
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
        });

        // Physics body for overlap
        scene.physics.add.existing(this, true);
        this.body.setSize(30, 80);
        this.body.setOffset(-15, -80);
    }

    activate() {
        if (this.used) return false;
        this.used = true;
        this.runes.setColor('#FFFFFF');
        this.glow.setAlpha(0.4);
        return true;
    }
}
