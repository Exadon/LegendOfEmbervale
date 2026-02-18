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

        // NPC sprite (random villager)
        const npcPool = ['npc_old_man', 'npc_farmer', 'npc_villager_f', 'npc_healer'];
        const spriteKey = npcPool[Math.floor(Math.random() * npcPool.length)];
        const npcSprite = scene.add.sprite(0, -20, spriteKey).setDisplaySize(28, 28);
        npcSprite.play(`${spriteKey}_idle`);
        // Campfire glow
        this.campfire = scene.add.circle(18, -6, 8, 0xFF6600, 0.6);

        this.add([npcSprite, this.campfire]);

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
        return { buff: this.buff, dialogue: this.dialogue };
    }

    fadeAway() {
        this.scene.tweens.add({
            targets: this.list,
            alpha: 0,
            duration: 1000,
            onComplete: () => {
                this.setActive(false).setVisible(false);
            }
        });
    }
}
