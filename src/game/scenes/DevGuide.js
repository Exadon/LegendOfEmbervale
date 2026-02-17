import Phaser from 'phaser';
import { SKILLS, LEVEL_THRESHOLDS } from '../systems/SkillDefs.js';
import { CLASS_DEFS } from '../systems/ClassDefs.js';

const TREE_LABELS = { red: 'Combat', blue: 'Flame / Magic', green: 'Mobility / Survival', gold: 'Core' };
const TREE_ORDER = ['red', 'blue', 'green', 'gold'];

export class DevGuide extends Phaser.Scene {
    constructor() {
        super('DevGuide');
    }

    create() {
        const { width, height } = this.scale;

        // Background
        this.add.rectangle(width / 2, height / 2, width, height, 0x0A0A1A);

        // Title
        this.add.text(width / 2, 30, 'DEV GUIDE  —  Skills & Level Thresholds', {
            fontSize: '22px', color: '#FFCC00', fontFamily: 'monospace', fontStyle: 'bold'
        }).setOrigin(0.5, 0);

        // Level thresholds
        const threshStr = LEVEL_THRESHOLDS.map((t, i) => `Lv${i + 1}: ${t} elixir`).join('   ');
        this.add.text(width / 2, 62, threshStr, {
            fontSize: '13px', color: '#AAAAAA', fontFamily: 'monospace'
        }).setOrigin(0.5, 0);

        // Skill list grouped by tree
        let y = 100;
        for (const tree of TREE_ORDER) {
            const skills = SKILLS.filter(s => s.tree === tree);
            if (skills.length === 0) continue;

            const treeColor = skills[0].color;
            const colorStr = '#' + treeColor.toString(16).padStart(6, '0');

            // Tree header
            this.add.rectangle(width / 2, y + 8, width - 80, 1, treeColor, 0.4);
            this.add.text(50, y, TREE_LABELS[tree].toUpperCase(), {
                fontSize: '15px', color: colorStr, fontFamily: 'monospace', fontStyle: 'bold'
            });
            y += 26;

            for (const skill of skills) {
                const classDef = CLASS_DEFS[skill.id];
                const hasAttack = classDef && classDef.attackType;

                // Color dot
                this.add.rectangle(58, y + 7, 10, 10, skill.color).setStrokeStyle(1, 0xFFFFFF);

                // Skill name
                this.add.text(74, y, skill.name, {
                    fontSize: '14px', color: '#FFFFFF', fontFamily: 'monospace', fontStyle: 'bold'
                });

                // Class name
                this.add.text(280, y, skill.className, {
                    fontSize: '13px', color: colorStr, fontFamily: 'monospace'
                });

                // Attack info
                if (hasAttack) {
                    this.add.text(440, y, `[Q] ${classDef.attackName}  (${classDef.attackType})`, {
                        fontSize: '12px', color: '#FFCC00', fontFamily: 'monospace'
                    });
                    this.add.text(440, y + 16, `CD: ${(classDef.attackCooldown / 1000).toFixed(1)}s`, {
                        fontSize: '11px', color: '#888888', fontFamily: 'monospace'
                    });
                } else {
                    this.add.text(440, y, 'Passive (no Q attack)', {
                        fontSize: '12px', color: '#666666', fontFamily: 'monospace', fontStyle: 'italic'
                    });
                }

                // Description
                this.add.text(74, y + 18, skill.description, {
                    fontSize: '12px', color: '#999999', fontFamily: 'monospace',
                    wordWrap: { width: 340 }
                });

                y += 52;
            }
            y += 10;
        }

        // Footer
        this.add.text(width / 2, height - 30, 'Press [ESC] to return', {
            fontSize: '14px', color: '#FFCC00', fontFamily: 'monospace'
        }).setOrigin(0.5);

        // ESC to return
        this.input.keyboard.once('keydown-ESC', () => {
            this.scene.stop('DevGuide');
            this.scene.resume('Level1');
        });
    }
}
