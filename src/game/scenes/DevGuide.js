import Phaser from 'phaser';
import { CLASS_SKILL_TREES, LEVEL_THRESHOLDS } from '../systems/ClassSkillTrees.js';
import { CLASS_DEFS } from '../systems/ClassDefs.js';
import { ALL_CLASS_IDS } from '../systems/MetaProgression.js';

export class DevGuide extends Phaser.Scene {
    constructor() {
        super('DevGuide');
    }

    create() {
        const { width, height } = this.scale;

        // Background
        this.add.rectangle(width / 2, height / 2, width, height, 0x0A0A1A);

        // Title
        this.add.text(width / 2, 30, 'Class Guide  —  Skill Trees', {
            fontSize: '22px', color: '#FFCC00', fontFamily: 'monospace', fontStyle: 'bold'
        }).setOrigin(0.5, 0);

        // Level thresholds
        const threshStr = LEVEL_THRESHOLDS.map((t, i) => `Lv${i + 1}: ${t}`).join('  ');
        this.add.text(width / 2, 62, threshStr, {
            fontSize: '11px', color: '#AAAAAA', fontFamily: 'monospace'
        }).setOrigin(0.5, 0);

        // Class tabs across the top
        this._currentClass = 0;
        this._classButtons = [];

        const tabY = 85;
        const tabW = Math.floor((width - 40) / ALL_CLASS_IDS.length);
        for (let i = 0; i < ALL_CLASS_IDS.length; i++) {
            const classId = ALL_CLASS_IDS[i];
            const classDef = CLASS_DEFS[classId];
            const colorStr = '#' + classDef.color.toString(16).padStart(6, '0');
            const tx = 20 + i * tabW + tabW / 2;

            const bg = this.add.rectangle(tx, tabY, tabW - 4, 22, 0x1A1A2E)
                .setStrokeStyle(1, classDef.color);
            const label = this.add.text(tx, tabY, `${i + 1} ${classDef.className}`, {
                fontSize: '11px', color: colorStr, fontFamily: 'monospace'
            }).setOrigin(0.5);

            this._classButtons.push({ bg, label, classId });
        }

        // Content area
        this._contentElements = [];
        this._showClassTree(ALL_CLASS_IDS[0]);

        // Number keys to switch
        this.input.keyboard.on('keydown', (event) => {
            const key = event.key;
            if (key >= '1' && key <= '7') {
                const idx = parseInt(key) - 1;
                if (idx < ALL_CLASS_IDS.length) {
                    this._currentClass = idx;
                    this._showClassTree(ALL_CLASS_IDS[idx]);
                }
            }
        });

        // Footer
        this.add.text(width / 2, height - 20, '[1-7] Switch Class   [ESC] Return', {
            fontSize: '12px', color: '#FFCC00', fontFamily: 'monospace'
        }).setOrigin(0.5);

        // ESC to return
        this.input.keyboard.on('keydown-ESC', () => {
            this.input.keyboard.removeAllListeners();
            this.scene.stop('DevGuide');
            this.scene.resume('Level1');
        });
    }

    _showClassTree(classId) {
        // Clear previous
        for (const el of this._contentElements) {
            el.destroy();
        }
        this._contentElements = [];

        const { width } = this.scale;
        const tree = CLASS_SKILL_TREES[classId];
        const classDef = CLASS_DEFS[classId];
        if (!tree || !classDef) return;

        const colorStr = '#' + classDef.color.toString(16).padStart(6, '0');

        // Highlight active tab
        for (let i = 0; i < this._classButtons.length; i++) {
            const btn = this._classButtons[i];
            btn.bg.setFillStyle(btn.classId === classId ? classDef.color : 0x1A1A2E, btn.classId === classId ? 0.2 : 1);
        }

        // Class header
        let y = 115;
        const header = this.add.text(width / 2, y, `${classDef.className} — ${classDef.description}`, {
            fontSize: '14px', color: colorStr, fontFamily: 'monospace', fontStyle: 'bold'
        }).setOrigin(0.5);
        this._contentElements.push(header);

        if (classDef.attackName) {
            y += 18;
            const atk = this.add.text(width / 2, y, `Q: ${classDef.attackName} (${classDef.attackType}) — CD: ${(classDef.attackCooldown / 1000).toFixed(1)}s`, {
                fontSize: '12px', color: '#FFCC00', fontFamily: 'monospace'
            }).setOrigin(0.5);
            this._contentElements.push(atk);
        }

        y += 24;

        // Skill tree nodes by tier
        for (let tier = 0; tier < 4; tier++) {
            const nodes = tree.filter(n => n.tier === tier);
            const tierLabel = tier === 3 ? `TIER ${tier + 1} (KEYSTONES)` : `TIER ${tier + 1}`;
            const reqText = tier === 0 ? ' — always available' : ` — requires 2 from tier ${tier}`;

            const tl = this.add.text(50, y, tierLabel + reqText, {
                fontSize: '12px', color: colorStr, fontFamily: 'monospace', fontStyle: 'bold'
            });
            this._contentElements.push(tl);
            y += 18;

            for (const node of nodes) {
                // Node name
                const nm = this.add.text(70, y, node.name, {
                    fontSize: '13px', color: '#FFFFFF', fontFamily: 'monospace'
                });
                this._contentElements.push(nm);

                // Description
                const desc = this.add.text(280, y, node.description, {
                    fontSize: '11px', color: '#999999', fontFamily: 'monospace',
                    wordWrap: { width: width - 310 }
                });
                this._contentElements.push(desc);

                y += 30;
            }
            y += 6;
        }
    }
}
