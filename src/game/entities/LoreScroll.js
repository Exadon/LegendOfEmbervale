import Phaser from 'phaser';
import { LORE_SCROLL } from '../constants.js';

export class LoreScroll extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, loreEntry) {
        super(scene, x, y, 'lore_scroll');
        scene.add.existing(this);
        scene.physics.add.existing(this, true);

        this.loreEntry = loreEntry;
        this.collected = false;

        // Gentle float
        scene.tweens.add({
            targets: this,
            y: y - LORE_SCROLL.BOB_RANGE,
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Warm glow
        scene.tweens.add({
            targets: this,
            alpha: { from: 0.7, to: 1 },
            duration: 1200,
            yoyo: true,
            repeat: -1
        });
    }

    collect() {
        if (this.collected) return null;
        this.collected = true;

        this.scene.tweens.killTweensOf(this);
        this.scene.tweens.add({
            targets: this,
            scaleX: 1.8,
            scaleY: 1.8,
            alpha: 0,
            duration: 300,
            ease: 'Power2',
            onComplete: () => this.destroy()
        });

        return this.loreEntry;
    }
}
