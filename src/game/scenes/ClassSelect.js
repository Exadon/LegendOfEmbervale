import Phaser from 'phaser';
import { CLASS_DEFS } from '../systems/ClassDefs.js';
import { MetaProgression, ALL_CLASS_IDS } from '../systems/MetaProgression.js';
import { CLASS_MASTERIES } from '../systems/ClassMasteries.js';
import { CLASS_SKILL_TREES } from '../systems/ClassSkillTrees.js';
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
        this._dailyMode = !!(this.scene.settings.data && this.scene.settings.data.daily);
        this._suggestedClass = (this.scene.settings.data && this.scene.settings.data.suggestedClass) || null;

        // If daily mode, pre-select the suggested class
        if (this._dailyMode && this._suggestedClass) {
            const suggestedIdx = ALL_CLASS_IDS.indexOf(this._suggestedClass);
            if (suggestedIdx >= 0) this._selectedIdx = suggestedIdx;
        }

        // Background
        this.add.rectangle(0, 0, width, height, 0x0A0A1E).setOrigin(0, 0);

        // Title
        this.add.text(width / 2, 20, 'CHOOSE YOUR CLASS', {
            fontSize: '22px', color: '#FFCC00', fontFamily: 'monospace', fontStyle: 'bold'
        }).setOrigin(0.5);

        // Daily mode banner
        if (this._dailyMode) {
            this.add.text(width / 2, 44, '⚡ DAILY RUN', {
                fontSize: '14px', color: '#FFDD00', fontFamily: 'monospace', fontStyle: 'bold',
                shadow: { offsetX: 0, offsetY: 0, color: '#FF8800', blur: 8, fill: true },
            }).setOrigin(0.5);
        }

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

        // Passive description
        this._passiveText = this.add.text(width / 2, footerY + 88, '', {
            fontSize: '11px', color: '#AAFFAA', fontFamily: 'monospace',
            wordWrap: { width: 500 }, align: 'center'
        }).setOrigin(0.5, 0);

        // Unlock cost display
        this._unlockText = this.add.text(width / 2, footerY + 106, '', {
            fontSize: '12px', color: '#FF8800', fontFamily: 'monospace'
        }).setOrigin(0.5, 0);

        // Mastery preview (shows first 3 mastery names for selected class)
        this._masteryPreviewText = this.add.text(width / 2, footerY + 122, '', {
            fontSize: '10px', color: '#7788AA', fontFamily: 'monospace',
            wordWrap: { width: 520 }, align: 'center'
        }).setOrigin(0.5, 0);

        // W2: Tier-0 skill synergy preview
        this._synergyText = this.add.text(width / 2, footerY + 136, '', {
            fontSize: '10px', color: '#88AAFF', fontFamily: 'monospace',
            wordWrap: { width: 520 }, align: 'center'
        }).setOrigin(0.5, 0);

        // Combo hint (S/E → Q enhanced Q description)
        this._comboText = this.add.text(width / 2, footerY + 152, '', {
            fontSize: '10px', color: '#BBAA44', fontFamily: 'monospace',
            wordWrap: { width: 520 }, align: 'center'
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

        // Prestige button
        const canPrestige = MetaProgression.canPrestige();
        const prestigeLevel = MetaProgression.prestigeCount;
        const prestigeStars = prestigeLevel > 0 ? '  ' + '★'.repeat(prestigeLevel) : '';
        const prestigeColor = canPrestige ? '#FFD700' : '#444444';
        const prestigeLabel = canPrestige
            ? `[P] PRESTIGE${prestigeStars}`
            : `PRESTIGE (requires 100 lifetime elixir)${prestigeStars}`;
        this._prestigeText = this.add.text(width / 2, height - 36, prestigeLabel, {
            fontSize: '12px', color: prestigeColor, fontFamily: 'monospace',
            fontStyle: canPrestige ? 'bold' : ''
        }).setOrigin(0.5);

        // Controls hint
        this.add.text(width / 2, height - 16, '[WASD/Arrows] Navigate   [1-0] Select   [U] Unlock   [M] Masteries   [SPACE] Confirm   [B] Boss Rush   [P] Prestige   [ESC] Back', {
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
                    this._playNavSound();
                    this._updateSelection();
                    this._updateDescription();
                }
                return;
            }
            if (key === '0' && ALL_CLASS_IDS.length >= 10) {
                this._selectedIdx = 9;
                this._playNavSound();
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
                    this._playNavSound();
                    this._updateSelection();
                    this._updateDescription();
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    if (now - this._navDebounce < 100) break;
                    this._navDebounce = now;
                    this._selectedIdx = Math.min(ALL_CLASS_IDS.length - 1, this._selectedIdx + 1);
                    this._playNavSound();
                    this._updateSelection();
                    this._updateDescription();
                    break;
                case 'ArrowUp':
                case 'KeyW':
                    if (now - this._navDebounce < 100) break;
                    this._navDebounce = now;
                    this._selectedIdx = Math.max(0, this._selectedIdx - 5);
                    this._playNavSound();
                    this._updateSelection();
                    this._updateDescription();
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    if (now - this._navDebounce < 100) break;
                    this._navDebounce = now;
                    this._selectedIdx = Math.min(ALL_CLASS_IDS.length - 1, this._selectedIdx + 5);
                    this._playNavSound();
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
                case 'KeyP':
                    this._tryPrestige();
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
            const avail = MetaProgression.getAvailableElixir();
            const pct = Math.min(avail / Math.max(cost, 1), 1);
            const filled = Math.round(pct * 8);
            const bar = '\u2588'.repeat(filled) + '\u2591'.repeat(8 - filled);
            const barColor = avail >= cost ? '#44FF44' : '#FF8800';
            this.add.text(x, bottomY - 14, `[${bar}] ${Math.round(pct * 100)}%`, {
                fontSize: '9px', color: barColor, fontFamily: 'monospace'
            }).setOrigin(0.5);
            this.add.text(x, bottomY, `Cost: ${cost} Elixir`, {
                fontSize: '10px', color: '#FF8800', fontFamily: 'monospace'
            }).setOrigin(0.5);
        }

        // Selection glow rectangle (invisible initially)
        const glow = this.add.rectangle(x, y, w + 6, h + 6)
            .setStrokeStyle(3, colorNum).setFillStyle(colorNum, 0.08).setVisible(false);

        // Mouse support: hover selects, click confirms (or selects if not yet selected)
        bg.setInteractive({ useHandCursor: true });
        bg.on('pointerover', () => {
            if (this._selectedIdx !== index) {
                this._selectedIdx = index;
                this._playNavSound();
                this._updateSelection();
                this._updateDescription();
            }
        });
        bg.on('pointerdown', () => {
            if (this._selectedIdx === index) {
                this._confirmSelection();
            } else {
                this._selectedIdx = index;
                this._playNavSound();
                this._updateSelection();
                this._updateDescription();
            }
        });

        return { bg, glow, classId, classDef, unlocked, nameText, spritePreview, colorNum };
    }

    _updateSelection() {
        for (let i = 0; i < this._panels.length; i++) {
            const p = this._panels[i];
            const glow = p.glow;
            if (i === this._selectedIdx) {
                if (!glow.visible) {
                    glow.setVisible(true).setAlpha(0);
                    this.tweens.add({ targets: glow, alpha: 1, duration: 150 });
                }
            } else {
                if (glow.visible) {
                    this.tweens.add({
                        targets: glow, alpha: 0, duration: 100,
                        onComplete: () => { if (glow.active) glow.setVisible(false); }
                    });
                }
            }
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
        // Phase J 1G: passive description
        const passiveDesc = classDef.passive?.description;
        if (passiveDesc && this._passiveText) {
            this._passiveText.setText(`PASSIVE: ${passiveDesc}`);
        } else if (this._passiveText) {
            this._passiveText.setText('');
        }

        // U2: mastery preview
        if (this._masteryPreviewText) {
            const masteries = CLASS_MASTERIES[panel.classId];
            if (masteries && masteries.length > 0) {
                const names = masteries.slice(0, 3).map(m => `\u25C6 ${m.name}`).join('  ');
                this._masteryPreviewText.setText(`MASTERIES: ${names}`);
            } else {
                this._masteryPreviewText.setText('');
            }
        }

        // W2: tier-0 skill synergy preview
        if (this._synergyText) {
            const tree = CLASS_SKILL_TREES[panel.classId];
            if (unlocked && tree) {
                const tier0Names = tree.filter(n => n.tier === 0).map(n => n.name).join('  ·  ');
                this._synergyText.setText(tier0Names ? `FOUNDATION: ${tier0Names}` : '');
            } else {
                this._synergyText.setText('');
            }
        }

        // Combo hint: what enhanced Q does when primed by S or E
        if (this._comboText) {
            const _COMBO_DESCS = {
                adventurer: 'AoE banish all in 140px',
                barbarian:  'Charge 350px + 15 Flame/kill',
                wizard:     'AoE 360px radius + 5 Flame per banish',
                ranger:     '3 arrows pierce all enemies',
                tank:       'Knockback 200px, 3s stun',
                healer:     '+50 Flame + drain stopped 3s',
                assassin:   'Blink 220px + 10 Flame/kill',
                monk:       'Knockback 200px + Chi Wave',
                duelist:    '3-hit: adds 100px blade sweep',
                pyromancer: 'Triple fireball spread (\xB115\xB0)',
            };
            const desc = _COMBO_DESCS[panel.classId];
            this._comboText.setText(desc ? `\u26A1 COMBO (S/E\u2192Q): ${desc}` : '');
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
        if (!['localhost', '127.0.0.1'].includes(window.location.hostname)) return;
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

        this.tweens.killTweensOf(this._panels[this._selectedIdx].glow);
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
        const _isDaily = this._dailyMode;
        new ModifierSelect(this, () => {
            this.cameras.main.fadeOut(600, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('Level1', { daily: _isDaily });
            });
        });
    }

    _playNavSound() {
        try {
            if (!this._navCtx) {
                this._navCtx = new (window.AudioContext || window.webkitAudioContext)();
            }
            const ctx = this._navCtx;
            const o = ctx.createOscillator(); const g = ctx.createGain();
            o.connect(g); g.connect(ctx.destination);
            o.frequency.value = 440; g.gain.value = 0.04;
            o.start(); o.stop(ctx.currentTime + 0.05);
        } catch (e) {}
    }

    _tryPrestige() {
        if (!MetaProgression.canPrestige()) {
            if (this._prestigeText) {
                this._prestigeText.setColor('#FF4444');
                this.time.delayedCall(500, () => {
                    if (this._prestigeText && this._prestigeText.active) {
                        this._prestigeText.setColor('#444444');
                    }
                });
            }
            return;
        }

        // Confirm popup
        const { width, height } = this.scale;
        const confirmBg = this.add.rectangle(width / 2, height / 2, 460, 100, 0x000000, 0.9)
            .setStrokeStyle(2, 0xFFD700).setDepth(500);
        const confirmText = this.add.text(width / 2, height / 2 - 18,
            'PRESTIGE: Reset class unlocks, keep elixir.\n[Y] Confirm   [N] Cancel', {
            fontSize: '13px', color: '#FFD700', fontFamily: 'monospace', align: 'center'
        }).setOrigin(0.5).setDepth(501);

        const cleanup = () => {
            confirmBg.destroy();
            confirmText.destroy();
            this.input.keyboard.off('keydown', confirmHandler);
        };
        const confirmHandler = (e) => {
            if (e.key === 'y' || e.key === 'Y') {
                cleanup();
                const success = MetaProgression.prestige();
                if (success) {
                    this.input.keyboard.removeAllListeners();
                    this.scene.restart();
                }
            } else if (e.key === 'n' || e.key === 'N' || e.key === 'Escape') {
                cleanup();
            }
        };
        this.input.keyboard.on('keydown', confirmHandler);
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
