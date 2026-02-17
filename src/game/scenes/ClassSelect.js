import Phaser from 'phaser';
import { CLASS_DEFS } from '../systems/ClassDefs.js';
import { MetaProgression, ALL_CLASS_IDS } from '../systems/MetaProgression.js';
import { SkillManager } from '../systems/SkillManager.js';

/**
 * ClassSelect — player picks a class before starting a run.
 * 3×2 grid + 1 centered at bottom for the 7th class, with keyboard navigation.
 */
export class ClassSelect extends Phaser.Scene {
    constructor() {
        super('ClassSelect');
    }

    create() {
        const { width, height } = this.scale;

        this._selectedIdx = 0;
        this._panels = [];

        // Background
        this.add.rectangle(0, 0, width, height, 0x0A0A1E).setOrigin(0, 0);

        // Title
        this.add.text(width / 2, 30, 'CHOOSE YOUR CLASS', {
            fontSize: '24px', color: '#FFCC00', fontFamily: 'monospace', fontStyle: 'bold'
        }).setOrigin(0.5);

        // Elixir balance
        const avail = MetaProgression.getAvailableElixir();
        this._elixirText = this.add.text(width / 2, 56, `Available Elixir: ${avail}`, {
            fontSize: '13px', color: '#88DDFF', fontFamily: 'monospace'
        }).setOrigin(0.5);

        // Build panel grid — 3 columns × 2 rows + 1 centered
        const cols = 3;
        const panelW = 200;
        const panelH = 180;
        const gapX = 20;
        const gapY = 16;
        const totalW = cols * panelW + (cols - 1) * gapX;
        const startX = (width - totalW) / 2 + panelW / 2;
        const startY = 90;

        for (let i = 0; i < ALL_CLASS_IDS.length; i++) {
            const classId = ALL_CLASS_IDS[i];
            const classDef = CLASS_DEFS[classId];
            const unlocked = MetaProgression.isClassUnlocked(classId);

            let col, row;
            if (i < 6) {
                col = i % cols;
                row = Math.floor(i / cols);
            } else {
                // 7th class centered below
                col = 1;
                row = 2;
            }
            const px = startX + col * (panelW + gapX);
            const py = startY + row * (panelH + gapY);

            const panel = this._createPanel(px, py, panelW, panelH, classId, classDef, unlocked, i);
            this._panels.push(panel);
        }

        // Select first panel
        this._updateSelection();

        // Description area
        this._descText = this.add.text(width / 2, height - 80, '', {
            fontSize: '12px', color: '#CCCCCC', fontFamily: 'monospace',
            wordWrap: { width: 500 }, align: 'center'
        }).setOrigin(0.5);

        // Controls hint
        this.add.text(width / 2, height - 40, '[1-7] Select   [U] Unlock   [SPACE] Confirm   [ESC] Back', {
            fontSize: '12px', color: '#666666', fontFamily: 'monospace'
        }).setOrigin(0.5);

        // Unlock cost display
        this._unlockText = this.add.text(width / 2, height - 56, '', {
            fontSize: '12px', color: '#FF8800', fontFamily: 'monospace'
        }).setOrigin(0.5);

        this._updateDescription();

        // Keyboard input
        this.input.keyboard.on('keydown', (event) => {
            const key = event.key;
            // Number keys 1-7
            if (key >= '1' && key <= '7') {
                const idx = parseInt(key) - 1;
                if (idx < ALL_CLASS_IDS.length) {
                    this._selectedIdx = idx;
                    this._updateSelection();
                    this._updateDescription();
                }
                return;
            }
            switch (event.code) {
                case 'ArrowLeft':
                    this._selectedIdx = Math.max(0, this._selectedIdx - 1);
                    this._updateSelection();
                    this._updateDescription();
                    break;
                case 'ArrowRight':
                    this._selectedIdx = Math.min(ALL_CLASS_IDS.length - 1, this._selectedIdx + 1);
                    this._updateSelection();
                    this._updateDescription();
                    break;
                case 'ArrowUp':
                    this._selectedIdx = Math.max(0, this._selectedIdx - 3);
                    this._updateSelection();
                    this._updateDescription();
                    break;
                case 'ArrowDown':
                    this._selectedIdx = Math.min(ALL_CLASS_IDS.length - 1, this._selectedIdx + 3);
                    this._updateSelection();
                    this._updateDescription();
                    break;
                case 'KeyU':
                    this._tryUnlock();
                    break;
                case 'Space':
                    this._confirmSelection();
                    break;
                case 'Escape':
                    this.input.keyboard.removeAllListeners();
                    this.scene.start('MainMenu');
                    break;
            }
        });
    }

    _createPanel(x, y, w, h, classId, classDef, unlocked, index) {
        const colorNum = classDef.color;
        const colorStr = '#' + colorNum.toString(16).padStart(6, '0');

        // Panel background
        const bg = this.add.rectangle(x, y, w, h, 0x1A1A2E).setStrokeStyle(2, unlocked ? colorNum : 0x444444);

        // Index number
        this.add.text(x - w / 2 + 8, y - h / 2 + 6, `${index + 1}`, {
            fontSize: '10px', color: '#555555', fontFamily: 'monospace'
        });

        // Class name
        const nameColor = unlocked ? colorStr : '#555555';
        const nameText = this.add.text(x, y - h / 2 + 24, classDef.className, {
            fontSize: '16px', color: nameColor, fontFamily: 'monospace', fontStyle: 'bold'
        }).setOrigin(0.5);

        // Sprite preview or lock icon
        let spritePreview = null;
        if (unlocked) {
            // Show animated sprite preview
            if (this.textures.exists(classDef.spriteKey)) {
                spritePreview = this.add.sprite(x, y + 10, classDef.spriteKey);
                const displaySize = classDef.displaySize || Math.max(48, Math.round(classDef.frameSize * 0.75));
                const scale = Math.min(64 / classDef.frameSize, 64 / (classDef.frameHeight || classDef.frameSize));
                spritePreview.setScale(scale);
                if (classDef.idleAnim && this.anims.exists(classDef.idleAnim)) {
                    spritePreview.play(classDef.idleAnim);
                }
            }
        } else {
            // Lock icon
            this.add.text(x, y + 10, '\uD83D\uDD12', {
                fontSize: '32px'
            }).setOrigin(0.5);
        }

        // Q attack name (if unlocked and has one)
        let attackText = null;
        if (unlocked && classDef.attackName) {
            attackText = this.add.text(x, y + h / 2 - 22, `Q: ${classDef.attackName}`, {
                fontSize: '10px', color: '#AAAAAA', fontFamily: 'monospace'
            }).setOrigin(0.5);
        } else if (!unlocked) {
            const cost = MetaProgression.getUnlockCost();
            this.add.text(x, y + h / 2 - 22, `Cost: ${cost} Elixir`, {
                fontSize: '10px', color: '#FF8800', fontFamily: 'monospace'
            }).setOrigin(0.5);
        }

        // Selection glow rectangle (invisible initially)
        const glow = this.add.rectangle(x, y, w + 6, h + 6)
            .setStrokeStyle(3, colorNum).setFillStyle(colorNum, 0.08).setVisible(false);

        return { bg, glow, classId, classDef, unlocked, nameText, spritePreview, colorNum };
    }

    _updateSelection() {
        for (let i = 0; i < this._panels.length; i++) {
            const p = this._panels[i];
            p.glow.setVisible(i === this._selectedIdx);
        }
    }

    _updateDescription() {
        const panel = this._panels[this._selectedIdx];
        if (!panel) return;
        const classDef = panel.classDef;
        const unlocked = MetaProgression.isClassUnlocked(panel.classId);

        if (unlocked) {
            this._descText.setText(`${classDef.className}: ${classDef.description}`);
            this._unlockText.setText('');
        } else {
            this._descText.setText(`${classDef.className}: ${classDef.description}\n[LOCKED]`);
            const cost = MetaProgression.getUnlockCost();
            const avail = MetaProgression.getAvailableElixir();
            const canAfford = avail >= cost;
            this._unlockText.setText(`Press [U] to unlock (${cost} Elixir)${canAfford ? '' : ' — Not enough elixir!'}`);
            this._unlockText.setColor(canAfford ? '#FF8800' : '#FF4444');
        }
    }

    _tryUnlock() {
        const panel = this._panels[this._selectedIdx];
        if (!panel) return;
        if (MetaProgression.isClassUnlocked(panel.classId)) return;

        const success = MetaProgression.unlockClass(panel.classId);
        if (success) {
            // Refresh the entire scene to rebuild panels
            this.input.keyboard.removeAllListeners();
            this.scene.restart();
        } else {
            // Flash the unlock text red
            this._unlockText.setColor('#FF0000');
            this.time.delayedCall(400, () => {
                this._updateDescription();
            });
        }
    }

    _confirmSelection() {
        const panel = this._panels[this._selectedIdx];
        if (!panel) return;
        if (!MetaProgression.isClassUnlocked(panel.classId)) return;

        // Set the class in SkillManager
        SkillManager.selectClass(panel.classId);

        this.input.keyboard.removeAllListeners();
        this.cameras.main.fadeOut(600, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('Level1');
        });
    }
}
