import Phaser from 'phaser';
import { WORLD, CRAFTSPERSON } from '../constants.js';

export class Craftsperson extends Phaser.GameObjects.Container {
    constructor(scene, x) {
        super(scene, x, WORLD.GROUND_Y);
        scene.add.existing(this);

        this.setDepth(4);
        this.rescued = false;
        this.failed = false;
        this.rescueActive = false;

        // Pick random type
        this.craftType = CRAFTSPERSON.TYPES[Math.floor(Math.random() * CRAFTSPERSON.TYPES.length)];

        // Cage bars (gray)
        const cageW = 32;
        const cageH = 40;
        for (let i = -12; i <= 12; i += 8) {
            const bar = scene.add.rectangle(i, -cageH / 2, 2, cageH, 0x888888);
            this.add(bar);
        }
        // Top/bottom bar
        this.add(scene.add.rectangle(0, -cageH, cageW, 2, 0x888888));
        this.add(scene.add.rectangle(0, 0, cageW, 2, 0x888888));

        // NPC sprite inside cage
        const spriteMap = { blacksmith: 'npc_blacksmith', alchemist: 'npc_alchemist', hunter: 'npc_hunter', bard: 'npc_bard' };
        const spriteKey = spriteMap[this.craftType.id] || 'npc_blacksmith';
        const npcSprite = scene.add.sprite(0, -20, spriteKey).setDisplaySize(28, 28);
        npcSprite.play(`${spriteKey}_idle`);
        this.add(npcSprite);

        // Name label
        this.nameLabel = scene.add.text(0, -50, this.craftType.name, {
            fontSize: '9px', color: '#FFCC00', fontFamily: 'monospace',
            stroke: '#000000', strokeThickness: 2,
        }).setOrigin(0.5).setVisible(false);
        this.add(this.nameLabel);

        // Rescue prompt
        this.rescueLabel = scene.add.text(0, -38, '[F] Rescue', {
            fontSize: '9px', color: '#44FF88', fontFamily: 'monospace',
            stroke: '#000000', strokeThickness: 2,
        }).setOrigin(0.5).setVisible(false);
        this.add(this.rescueLabel);

        // Physics body for overlap
        scene.physics.add.existing(this, true);
        this.body.setSize(CRAFTSPERSON.RESCUE_RADIUS * 2, 60);
        this.body.setOffset(-CRAFTSPERSON.RESCUE_RADIUS, -60);
    }

    showPrompt() {
        if (!this.rescued && !this.failed && !this.rescueActive) {
            this.nameLabel.setVisible(true);
            this.rescueLabel.setVisible(true);
        }
    }

    hidePrompt() {
        this.nameLabel.setVisible(false);
        this.rescueLabel.setVisible(false);
    }
}
