import Phaser from 'phaser';
import { WORLD, SURVIVOR } from '../constants.js';

export class Survivor extends Phaser.GameObjects.Container {
    constructor(scene, x) {
        super(scene, x, WORLD.GROUND_Y);
        scene.add.existing(this);

        this.setDepth(4);
        this.interacted = false;

        // Pick random buff and dialogue
        this.buff = SURVIVOR.BUFFS[Math.floor(Math.random() * SURVIVOR.BUFFS.length)];
        this.dialogue = SURVIVOR.DIALOGUES[Math.floor(Math.random() * SURVIVOR.DIALOGUES.length)];

        // Body
        const body = scene.add.rectangle(0, -24, 12, 28, 0xBBAA88).setOrigin(0.5, 1);
        // Head
        const head = scene.add.circle(0, -34, 6, 0xDDCCAA);
        // Campfire glow
        this.campfire = scene.add.circle(18, -6, 8, 0xFF6600, 0.6);

        this.add([body, head, this.campfire]);

        // Flicker campfire
        scene.tweens.add({
            targets: this.campfire,
            alpha: { from: 0.4, to: 0.8 },
            scaleX: { from: 0.8, to: 1.2 },
            scaleY: { from: 0.8, to: 1.2 },
            duration: 300,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Interaction prompt
        this.prompt = scene.add.text(0, -54, '[F] Talk', {
            fontSize: '10px', color: '#FFCC00', fontFamily: 'monospace',
            stroke: '#000000', strokeThickness: 2
        }).setOrigin(0.5).setVisible(false);
        this.add(this.prompt);
    }

    showPrompt() {
        if (!this.interacted) this.prompt.setVisible(true);
    }

    hidePrompt() {
        this.prompt.setVisible(false);
    }

    interact() {
        if (this.interacted) return null;
        this.interacted = true;
        this.prompt.setVisible(false);
        this.campfire.setAlpha(0.2);
        return { buff: this.buff, dialogue: this.dialogue };
    }
}
