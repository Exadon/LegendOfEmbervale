import Phaser from 'phaser';
import { CLASS_DEFS } from '../systems/ClassDefs.js';
import { MetaProgression, ALL_CLASS_IDS } from '../systems/MetaProgression.js';
import { SkillManager } from '../systems/SkillManager.js';
import { FlameAltar } from '../systems/FlameAltar.js';
import { ModifierSelect } from '../ui/ModifierSelect.js';
import { RunModifier } from '../systems/RunModifier.js';

/**
 * ClassSelect — player picks a class before starting a run.
 * 5×2 grid for 10 classes, with keyboard navigation.
 */
export class ClassSelect extends Phaser.Scene {
    constructor() {
        super('ClassSelect');
    }

    create() {
        this.cameras.main.fadeIn(400, 0, 0, 0);
        const { width, height } = this.scale;

        this._selectedIdx = 0;
        this._panels = [];
        this._bossRushMode = !!(this.scene.settings.data && this.scene.settings.data.bossRush);

        // Background
        this.add.rectangle(0, 0, width, height, 0x0A0A1E).setOrigin(0, 0);

        // Title
        this.add.text(width / 2, 20, 'CHOOSE YOUR CLASS', {
            fontSize: '22px', color: '#FFCC00', fontFamily: 'monospace', fontStyle: 'bold'
        }).setOrigin(0.5);

        // Elixir balance
        const avail = MetaProgression.getAvailableElixir();
        this._elixirText = this.add.text(width / 2, 44, `Available Elixir: ${avail}`, {
            fontSize: '12px', color: '#88DDFF', fontFamily: 'monospace'
        }).setOrigin(0.5);

        // Build panel grid — 5 columns × 2 rows
        const cols = 5;
        const panelW = Math.min(160, Math.floor((width - 80) / cols));
        const panelH = 130;
        const gapX = 10;
        const gapY = 10;
        const totalW = cols * panelW + (cols - 1) * gapX;
        const startX = (width - totalW) / 2 + panelW / 2;
        const startY = 60 + panelH / 2;  // header takes ~60px

        for (let i = 0; i < ALL_CLASS_IDS.length; i++) {
            const classId = ALL_CLASS_IDS[i];
            const classDef = CLASS_DEFS[classId];
            const unlocked = MetaProgression.isClassUnlocked(classId);

            const col = i % cols;
            const row = Math.floor(i / cols);
            const px = startX + col * (panelW + gapX);
            const py = startY + row * (panelH + gapY);

            const panel = this._createPanel(px, py, panelW, panelH, classId, classDef, unlocked, i);
            this._panels.push(panel);
        }

        // Select first panel
        this._updateSelection();

        // Large sprite preview (below panels, above description)
        const footerY = startY + 2 * (panelH + gapY) + panelH / 2 + 16;
        this._previewSprite = null;
        this._previewY = footerY + 30;

        // Description area (below preview)
        this._descText = this.add.text(width / 2, footerY + 70, '', {
            fontSize: '12px', color: '#CCCCCC', fontFamily: 'monospace',
            wordWrap: { width: 500 }, align: 'center'
        }).setOrigin(0.5, 0);

        // Unlock cost display
        this._unlockText = this.add.text(width / 2, footerY + 90, '', {
            fontSize: '12px', color: '#FF8800', fontFamily: 'monospace'
        }).setOrigin(0.5, 0);

        // Dev mode indicator (hidden by default)
        this._devMode = false;
        this._devText = this.add.text(width - 8, 8, '', {
            fontSize: '11px', color: '#FF4444', fontFamily: 'monospace'
        }).setOrigin(1, 0);

        // Boss Rush banner
        if (this._bossRushMode) {
            this.add.text(width / 2, height - 52, 'BOSS RUSH MODE — Face all bosses sequentially', {
                fontSize: '13px', color: '#FF4444', fontFamily: 'monospace', fontStyle: 'bold'
            }).setOrigin(0.5);
        }

        // Controls hint
        this.add.text(width / 2, height - 16, '[WASD/Arrows] Navigate   [1-0] Select   [U] Unlock   [M] Masteries   [SPACE] Confirm   [B] Boss Rush   [ESC] Back', {
            fontSize: '10px', color: '#555555', fontFamily: 'monospace'
        }).setOrigin(0.5);

        this._updateDescription();

        // Keyboard input (with 100ms debounce on navigation)
        this._navDebounce = 0;
        this.input.keyboard.on('keydown', (event) => {
            const key = event.key;
            // Number keys 1-9, 0=10th
            if (key >= '1' && key <= '9') {
                const idx = parseInt(key) - 1;
                if (idx < ALL_CLASS_IDS.length) {
                    this._selectedIdx = idx;
                    this._updateSelection();
                    this._updateDescription();
                }
                return;
            }
            if (key === '0' && ALL_CLASS_IDS.length >= 10) {
                this._selectedIdx = 9;
                this._updateSelection();
                this._updateDescription();
                return;
            }
            // Dev mode toggle
            if (event.code === 'Backquote') {
                this._toggleDevMode();
                return;
            }
            const now = this.time.now;
            switch (event.code) {
                case 'ArrowLeft':
                case 'KeyA':
                    if (now - this._navDebounce < 100) break;
                    this._navDebounce = now;
                    this._selectedIdx = Math.max(0, this._selectedIdx - 1);
                    this._updateSelection();
                    this._updateDescription();
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    if (now - this._navDebounce < 100) break;
                    this._navDebounce = now;
                    this._selectedIdx = Math.min(ALL_CLASS_IDS.length - 1, this._selectedIdx + 1);
                    this._updateSelection();
                    this._updateDescription();
                    break;
                case 'ArrowUp':
                case 'KeyW':
                    if (now - this._navDebounce < 100) break;
                    this._navDebounce = now;
                    this._selectedIdx = Math.max(0, this._selectedIdx - 5);
                    this._updateSelection();
                    this._updateDescription();
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    if (now - this._navDebounce < 100) break;
                    this._navDebounce = now;
                    this._selectedIdx = Math.min(ALL_CLASS_IDS.length - 1, this._selectedIdx + 5);
                    this._updateSelection();
                    this._updateDescription();
                    break;
                case 'KeyU':
                    this._tryUnlock();
                    break;
                case 'KeyM':
                    this._openMasteries();
                    break;
                case 'KeyB':
                    this._launchBossRush();
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
        const halfH = h / 2;

        // Panel background
        const bg = this.add.rectangle(x, y, w, h, 0x1A1A2E).setStrokeStyle(2, unlocked ? colorNum : 0x444444);

        // Index number (top-left corner)
        this.add.text(x - w / 2 + 6, y - halfH + 4, `${index + 1}`, {
            fontSize: '9px', color: '#444444', fontFamily: 'monospace'
        });

        // Class name (near top of panel)
        const nameColor = unlocked ? colorStr : '#555555';
        const nameText = this.add.text(x, y - halfH + 18, classDef.className, {
            fontSize: '14px', color: nameColor, fontFamily: 'monospace', fontStyle: 'bold'
        }).setOrigin(0.5);

        // Sprite preview or lock icon (pushed down into lower half of panel)
        let spritePreview = null;
        const spriteY = y + 10;
        if (unlocked) {
            if (this.textures.exists(classDef.spriteKey)) {
                // Use same scale formula as Player.js (displaySize / fw)
                const fw = classDef.frameSize;
                const fh = classDef.frameHeight || fw;
                const displaySize = classDef.displaySize || Math.max(48, Math.round(fw * 0.75));
                const scale = displaySize / fw;
                const displayH = fh * scale;
                // Shift sprite up so character feet align consistently
                // (matches Player.js feetRatio body-offset logic)
                const feetRatio = classDef.feetRatio || ((fh - 2) / fh);
                const feetBelowCenter = (feetRatio - 0.5) * displayH;
                spritePreview = this.add.sprite(x, spriteY - feetBelowCenter, classDef.spriteKey);
                spritePreview.setScale(scale);
                if (classDef.idleAnim && this.anims.exists(classDef.idleAnim)) {
                    spritePreview.play(classDef.idleAnim);
                }
            }
        } else {
            this.add.text(x, spriteY, '\uD83D\uDD12', {
                fontSize: '28px'
            }).setOrigin(0.5);
        }

        // Bottom info: Q attack name OR cost OR progress
        const bottomY = y + halfH - 14;
        if (unlocked) {
            const nodeCount = MetaProgression.getClassNodeCount(classId);
            const progressStr = nodeCount > 0 ? `${nodeCount}/12 discovered` : '';
            const masteryRanks = MetaProgression.getTotalMasteryRanks(classId);
            const masteryStr = `${masteryRanks}/15 mastery`;
            const infoStr = classDef.attackName ? `Q: ${classDef.attackName}` : 'No Q attack';
            this.add.text(x, bottomY - 16, infoStr, {
                fontSize: '9px', color: '#AAAAAA', fontFamily: 'monospace'
            }).setOrigin(0.5);
            if (progressStr) {
                this.add.text(x, bottomY - 4, progressStr, {
                    fontSize: '9px', color: '#888800', fontFamily: 'monospace'
                }).setOrigin(0.5);
            }
            this.add.text(x, bottomY + 8, masteryStr, {
                fontSize: '9px', color: masteryRanks > 0 ? '#AA88FF' : '#555555', fontFamily: 'monospace'
            }).setOrigin(0.5);
        } else {
            const cost = MetaProgression.getUnlockCost();
            this.add.text(x, bottomY, `Cost: ${cost} Elixir`, {
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

        // Update large sprite preview
        if (this._previewSprite) {
            this._previewSprite.destroy();
            this._previewSprite = null;
        }
        const { width } = this.scale;
        if (unlocked && this.textures.exists(classDef.spriteKey)) {
            // Use same scale formula as Player.js (displaySize / fw), then 2x for preview
            const fw = classDef.frameSize;
            const fh = classDef.frameHeight || fw;
            const displaySize = classDef.displaySize || Math.max(48, Math.round(fw * 0.75));
            const scale = (displaySize / fw) * 2;
            const displayH = fh * scale;
            // Shift sprite up so character feet align consistently
            const feetRatio = classDef.feetRatio || ((fh - 2) / fh);
            const feetBelowCenter = (feetRatio - 0.5) * displayH;
            this._previewSprite = this.add.sprite(width / 2, this._previewY - feetBelowCenter, classDef.spriteKey);
            this._previewSprite.setScale(scale);
            if (classDef.idleAnim && this.anims.exists(classDef.idleAnim)) {
                this._previewSprite.play(classDef.idleAnim);
            }
        }

        if (unlocked) {
            this._descText.setText(`${classDef.className}: ${classDef.description}`);
            this._unlockText.setText('');
        } else {
            this._descText.setText(`${classDef.className}: ${classDef.description}  [LOCKED]`);
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
            this.input.keyboard.removeAllListeners();
            this.scene.restart();
        } else {
            this._unlockText.setColor('#FF0000');
            this.time.delayedCall(400, () => {
                this._updateDescription();
            });
        }
    }

    _openMasteries() {
        const panel = this._panels[this._selectedIdx];
        if (!panel) return;
        if (!MetaProgression.isClassUnlocked(panel.classId)) return;
        this.input.keyboard.removeAllListeners();
        this.scene.start('ClassMasteryScene', { classId: panel.classId });
    }

    _toggleDevMode() {
        this._devMode = !this._devMode;
        if (this._devMode) {
            // Grant 9999 elixir for testing
            FlameAltar.addElixir(9999);
            FlameAltar._save();
            this._devText.setText('DEV MODE: +9999 Elixir');
            this._elixirText.setText(`Available Elixir: ${MetaProgression.getAvailableElixir()}`);
            this._elixirText.setColor('#FF4444');
            this._updateDescription();
        } else {
            this._devText.setText('');
            this._elixirText.setColor('#88DDFF');
        }
    }

    _confirmSelection() {
        const panel = this._panels[this._selectedIdx];
        if (!panel) return;
        if (!MetaProgression.isClassUnlocked(panel.classId)) return;

        SkillManager.selectClass(panel.classId);
        this.input.keyboard.removeAllListeners();

        if (this._bossRushMode) {
            // Skip modifier, go directly to BossRush
            RunModifier.clear();
            this.cameras.main.fadeOut(600, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('BossRush');
            });
            return;
        }

        // Show modifier selection overlay
        new ModifierSelect(this, () => {
            this.cameras.main.fadeOut(600, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('Level1');
            });
        });
    }

    _launchBossRush() {
        const panel = this._panels[this._selectedIdx];
        if (!panel) return;
        if (!MetaProgression.isClassUnlocked(panel.classId)) return;

        SkillManager.selectClass(panel.classId);
        RunModifier.clear();
        this.input.keyboard.removeAllListeners();
        this.cameras.main.fadeOut(600, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('BossRush');
        });
    }
}
