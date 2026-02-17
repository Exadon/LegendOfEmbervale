import Phaser from 'phaser';
import { SkillManager } from '../systems/SkillManager.js';
import { SKILLS } from '../systems/SkillDefs.js';
import { CLASS_DEFS } from '../systems/ClassDefs.js';
import { Settings } from '../systems/Settings.js';
import { AchievementManager } from '../systems/AchievementManager.js';

export class PauseOverlay {
    constructor(scene) {
        this.scene = scene;
        this.active = false;
        this._elements = [];
        this._keyHandler = null;
        this._soundText = null;
        this._classKeys = Object.keys(CLASS_DEFS);
        this._classIndex = -1;
    }

    /** Convert desired screen position to zoom-adjusted object coords for scrollFactor(0) */
    _uiXY(sx, sy) {
        const z = this.scene.cameras.main.zoom;
        const cx = this.scene.scale.width / 2;
        const cy = this.scene.scale.height / 2;
        return { x: (sx - cx) / z + cx, y: (sy - cy) / z + cy };
    }

    toggle() {
        if (this.active) {
            this.hide();
        } else {
            this.show();
        }
    }

    show() {
        if (this.active) return;
        this.active = true;

        this.scene.physics.pause();

        const { width, height } = this.scene.scale;
        const zoom = this.scene.cameras.main.zoom;
        const s = 1 / zoom;

        // Helper to create scaled text
        const _text = (sx, sy, text, style, origin = 0.5) => {
            const p = this._uiXY(sx, sy);
            const t = this.scene.add.text(p.x, p.y, text, {
                fontFamily: 'monospace', ...style
            }).setOrigin(typeof origin === 'number' ? origin : origin[0], typeof origin === 'number' ? origin : origin[1])
                .setScrollFactor(0).setDepth(301).setScale(s);
            this._elements.push(t);
            return t;
        };

        // Helper to create section background panel
        const _panel = (sx, sy, pw, ph) => {
            const p = this._uiXY(sx, sy);
            const panel = this.scene.add.rectangle(p.x, p.y, pw * s, ph * s, 0x111122, 0.4)
                .setScrollFactor(0).setDepth(300.5);
            this._elements.push(panel);
            return panel;
        };

        // Dark backdrop
        const bg = this.scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.8)
            .setScrollFactor(0).setDepth(300);
        this._elements.push(bg);

        // "PAUSED" header
        _text(width / 2, Math.round(height * 0.07), 'PAUSED', {
            fontSize: '28px', color: '#FFCC00', fontStyle: 'bold'
        });

        // Player info line
        let infoStr = `Level ${SkillManager.level}`;
        if (SkillManager.activeClass && SkillManager.activeClass.className) {
            infoStr += `  -  ${SkillManager.activeClass.className}`;
        }
        _text(width / 2, Math.round(height * 0.11), infoStr, {
            fontSize: '16px', color: '#FFFFFF'
        });

        // Divider
        const dp = this._uiXY(width / 2, Math.round(height * 0.14));
        const divider = this.scene.add.rectangle(dp.x, dp.y, 400 * s, 1, 0x666666)
            .setScrollFactor(0).setDepth(301);
        this._elements.push(divider);

        // Skills header
        _text(width / 2, Math.round(height * 0.15), 'ACQUIRED SKILLS', {
            fontSize: '14px', color: '#AAAAAA'
        });

        // Skills section background
        const skillPanelH = SkillManager.acquired.length === 0 ? 30 : Math.min(SkillManager.acquired.length * 35 + 10, 180);
        _panel(width / 2, Math.round(height * 0.15) + skillPanelH / 2 + 10, 420, skillPanelH);

        // Skill list
        if (SkillManager.acquired.length === 0) {
            _text(width / 2, Math.round(height * 0.18), 'No skills acquired yet', {
                fontSize: '13px', color: '#666666', fontStyle: 'italic'
            });
        } else {
            const startP = this._uiXY(0, Math.round(height * 0.18));
            let yPos = startP.y;
            for (const skillId of SkillManager.acquired) {
                const skillDef = SKILLS.find(sk => sk.id === skillId);
                if (!skillDef) continue;

                const colorStr = '#' + skillDef.color.toString(16).padStart(6, '0');

                // Colored square
                const sqP = this._uiXY(width / 2 - 180, 0);
                const sq = this.scene.add.rectangle(sqP.x, yPos + 6 * s, 12 * s, 12 * s, skillDef.color)
                    .setScrollFactor(0).setDepth(302);
                sq.setStrokeStyle(1, 0xFFFFFF);
                this._elements.push(sq);

                // Skill name
                const nmP = this._uiXY(width / 2 - 164, 0);
                const name = this.scene.add.text(nmP.x, yPos, skillDef.name, {
                    fontSize: '13px', color: '#FFFFFF', fontFamily: 'monospace'
                }).setOrigin(0, 0).setScrollFactor(0).setDepth(302).setScale(s);
                this._elements.push(name);

                // Class name
                const clP = this._uiXY(width / 2 + 100, 0);
                const cls = this.scene.add.text(clP.x, yPos, skillDef.className, {
                    fontSize: '11px', color: colorStr, fontFamily: 'monospace'
                }).setOrigin(0, 0).setScrollFactor(0).setDepth(302).setScale(s);
                this._elements.push(cls);

                // Description
                const desc = this.scene.add.text(nmP.x, yPos + 15 * s, skillDef.description, {
                    fontSize: '11px', color: '#888888', fontFamily: 'monospace',
                    wordWrap: { width: 420 / s }
                }).setOrigin(0, 0).setScrollFactor(0).setDepth(302).setScale(s);
                this._elements.push(desc);

                yPos += 35 * s;
            }
        }

        // ─── Achievements section ───
        const achDivP = this._uiXY(width / 2, Math.round(height * 0.42));
        const achDivider = this.scene.add.rectangle(achDivP.x, achDivP.y, 400 * s, 1, 0x666666)
            .setScrollFactor(0).setDepth(301);
        this._elements.push(achDivider);

        const achCount = AchievementManager.getUnlockedCount();
        const achTotal = AchievementManager.getTotalCount();
        _text(width / 2, Math.round(height * 0.44), `ACHIEVEMENTS (${achCount}/${achTotal})`, {
            fontSize: '14px', color: achCount >= achTotal ? '#44FF44' : '#AAAAAA'
        });

        // Achievements section background
        _panel(width / 2, Math.round(height * 0.50), 420, 80);

        // Two-column category layout
        const categories = AchievementManager.getCategories();
        const colLeftX = width / 2 - 160;
        const colRightX = width / 2 + 40;
        const catStartY = Math.round(height * 0.46);
        const catLineH = 12;

        for (let i = 0; i < categories.length; i++) {
            const cat = categories[i];
            const { done, total } = AchievementManager.getCategoryProgress(cat);
            const icon = AchievementManager.getCategoryIcon(cat);
            const complete = done >= total;
            const col = i < 5 ? colLeftX : colRightX;
            const row = i < 5 ? i : i - 5;
            const cp = this._uiXY(col, catStartY + row * catLineH);
            const catText = this.scene.add.text(cp.x, cp.y,
                `${icon} ${cat} ${done}/${total}`, {
                fontSize: '11px',
                color: complete ? '#44FF44' : '#888888',
                fontFamily: 'monospace'
            }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(302).setScale(s);
            this._elements.push(catText);
        }

        // ─── Settings section ───
        const settDiv = this._uiXY(width / 2, Math.round(height * 0.62));
        const settDivider = this.scene.add.rectangle(settDiv.x, settDiv.y, 400 * s, 1, 0x666666)
            .setScrollFactor(0).setDepth(301);
        this._elements.push(settDivider);

        _text(width / 2, Math.round(height * 0.64), 'SETTINGS', {
            fontSize: '14px', color: '#AAAAAA'
        });

        // Settings section background
        _panel(width / 2, Math.round(height * 0.74), 420, 130);

        // Sound toggle
        const audio = this.scene.audio;
        const soundLabelP = this._uiXY(width / 2 - 140, Math.round(height * 0.67));
        const soundLabel = this.scene.add.text(soundLabelP.x, soundLabelP.y, '[M]  Sound:', {
            fontSize: '13px', color: '#CCCCCC', fontFamily: 'monospace'
        }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(301).setScale(s);
        this._elements.push(soundLabel);

        const soundValP = this._uiXY(width / 2 + 60, Math.round(height * 0.67));
        this._soundText = this.scene.add.text(soundValP.x, soundValP.y,
            audio.muted ? 'OFF' : 'ON', {
            fontSize: '13px',
            color: audio.muted ? '#FF4444' : '#44FF44',
            fontFamily: 'monospace', fontStyle: 'bold'
        }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(301).setScale(s);
        this._elements.push(this._soundText);

        // Resolution toggle
        const [rw, rh] = Settings.data.resolution;
        const resLabelP = this._uiXY(width / 2 - 140, Math.round(height * 0.71));
        const resLabel = this.scene.add.text(resLabelP.x, resLabelP.y, '[R]  Resolution:', {
            fontSize: '13px', color: '#CCCCCC', fontFamily: 'monospace'
        }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(301).setScale(s);
        this._elements.push(resLabel);

        const resValP = this._uiXY(width / 2 + 60, Math.round(height * 0.71));
        this._resText = this.scene.add.text(resValP.x, resValP.y, `${rw}x${rh}`, {
            fontSize: '13px', color: '#FFCC00', fontFamily: 'monospace', fontStyle: 'bold'
        }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(301).setScale(s);
        this._elements.push(this._resText);

        // Grid snap toggle
        const snapLabelP = this._uiXY(width / 2 - 140, Math.round(height * 0.75));
        const snapLabel = this.scene.add.text(snapLabelP.x, snapLabelP.y, '[N]  Grid Snap:', {
            fontSize: '13px', color: '#CCCCCC', fontFamily: 'monospace'
        }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(301).setScale(s);
        this._elements.push(snapLabel);

        const snapValP = this._uiXY(width / 2 + 60, Math.round(height * 0.75));
        this._snapText = this.scene.add.text(snapValP.x, snapValP.y,
            Settings.data.gridSnap ? 'ON' : 'OFF', {
            fontSize: '13px',
            color: Settings.data.gridSnap ? '#44FF44' : '#FF4444',
            fontFamily: 'monospace', fontStyle: 'bold'
        }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(301).setScale(s);
        this._elements.push(this._snapText);

        // Reset HUD positions
        const resetLabelP = this._uiXY(width / 2 - 140, Math.round(height * 0.79));
        const resetLabel = this.scene.add.text(resetLabelP.x, resetLabelP.y, '[P]  Reset HUD Positions', {
            fontSize: '13px', color: '#CCCCCC', fontFamily: 'monospace'
        }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(301).setScale(s);
        this._elements.push(resetLabel);

        // Lore Compendium
        const loreLabelP = this._uiXY(width / 2 - 140, Math.round(height * 0.83));
        const loreLabel = this.scene.add.text(loreLabelP.x, loreLabelP.y, '[J]  Lore Compendium', {
            fontSize: '13px', color: '#CCCCCC', fontFamily: 'monospace'
        }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(301).setScale(s);
        this._elements.push(loreLabel);

        // ─── Dev Options (compact) ───
        const devDiv = this._uiXY(width / 2, Math.round(height * 0.87));
        const devDivider = this.scene.add.rectangle(devDiv.x, devDiv.y, 400 * s, 1, 0x666666)
            .setScrollFactor(0).setDepth(301);
        this._elements.push(devDivider);

        const clsName = SkillManager.activeClass.className || 'Default';
        const devLine = this.scene.add.text(0, 0,
            `DEV  [L] Level Up  [G] Guide  [C] Class: ${clsName}`, {
            fontSize: '11px', color: '#FF6666', fontFamily: 'monospace'
        });
        const devHp = this._uiXY(width / 2, Math.round(height * 0.91));
        devLine.setPosition(devHp.x, devHp.y).setOrigin(0.5).setScrollFactor(0).setDepth(301).setScale(s);
        this._elements.push(devLine);
        this._devLine = devLine;

        // Resume prompt at bottom
        const pp = this._uiXY(width / 2, height - 30);
        const prompt = this.scene.add.text(pp.x, pp.y, 'Press [ESC] to resume', {
            fontSize: '14px', color: '#FFCC00', fontFamily: 'monospace'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(301).setScale(s);
        this._elements.push(prompt);

        // Pulse the prompt
        this.scene.tweens.add({
            targets: prompt,
            alpha: { from: 1, to: 0.3 },
            duration: 800,
            yoyo: true,
            repeat: -1
        });

        // Settings key handler
        this._keyHandler = (event) => {
            if (!this.active) return;
            if (event.key === 'm' || event.key === 'M') {
                this._toggleSound();
            } else if (event.key === 'r' || event.key === 'R') {
                this._toggleResolution();
            } else if (event.key === 'n' || event.key === 'N') {
                this._toggleGridSnap();
            } else if (event.key === 'p' || event.key === 'P') {
                this._resetHUDPositions();
            } else if (event.key === 'l' || event.key === 'L') {
                this._forceLevelUp();
            } else if (event.key === 'g' || event.key === 'G') {
                this._openGuide();
            } else if (event.key === 'c' || event.key === 'C') {
                this._cycleClass();
            } else if (event.key === 'j' || event.key === 'J') {
                this._openLoreCompendium();
            }
        };
        this.scene.input.keyboard.on('keydown', this._keyHandler);
    }

    _toggleSound() {
        const audio = this.scene.audio;
        audio.toggleMute();
        if (this._soundText) {
            this._soundText.setText(audio.muted ? 'OFF' : 'ON');
            this._soundText.setColor(audio.muted ? '#FF4444' : '#44FF44');
        }
    }

    _toggleResolution() {
        const [cw] = Settings.data.resolution;
        if (cw === 960) {
            Settings.data.resolution = [1280, 800];
        } else {
            Settings.data.resolution = [960, 600];
        }
        Settings.save();
        const [nw, nh] = Settings.data.resolution;
        if (this._resText) {
            this._resText.setText(`${nw}x${nh}`);
        }
        this.hide();
        this.scene.game.scale.resize(nw, nh);
        this.scene.scene.restart();
    }

    _toggleGridSnap() {
        Settings.data.gridSnap = !Settings.data.gridSnap;
        Settings.save();
        if (this._snapText) {
            this._snapText.setText(Settings.data.gridSnap ? 'ON' : 'OFF');
            this._snapText.setColor(Settings.data.gridSnap ? '#44FF44' : '#FF4444');
        }
    }

    _resetHUDPositions() {
        Settings.reset();
        if (this.scene.hud && this.scene.hud.repositionAllWindows) {
            this.scene.hud.repositionAllWindows();
        }
    }

    _openGuide() {
        this.hide();
        this.scene.scene.pause('Level1');
        this.scene.scene.launch('DevGuide');
    }

    _forceLevelUp() {
        this.hide();
        if (this.scene.levelUpOverlay && !this.scene.levelUpOverlay.active) {
            this.scene.levelUpOverlay.show();
        }
    }

    _openLoreCompendium() {
        this.hide();
        if (this.scene.loreCompendium) {
            this.scene.loreCompendium.show();
        }
    }

    _cycleClass() {
        this._classIndex = (this._classIndex + 1) % this._classKeys.length;
        const skillId = this._classKeys[this._classIndex];
        const classDef = CLASS_DEFS[skillId];
        SkillManager.activeClass = classDef;
        if (this.scene.player) {
            this.scene.player.swapClassSprite(classDef);
        }
        if (this.scene.hud && this.scene.hud.updateSkills) {
            this.scene.hud.updateSkills();
        }
        if (this._devLine) {
            const name = classDef.className || 'Default';
            this._devLine.setText(`DEV  [L] Level Up  [G] Guide  [C] Class: ${name}`);
        }
    }

    hide() {
        if (!this.active) return;

        // Remove settings key handler
        if (this._keyHandler) {
            this.scene.input.keyboard.off('keydown', this._keyHandler);
            this._keyHandler = null;
        }
        this._soundText = null;
        this._resText = null;
        this._snapText = null;
        this._devLine = null;

        // Kill tweens and destroy all elements
        for (const el of this._elements) {
            if (el && el.active) {
                this.scene.tweens.killTweensOf(el);
                el.destroy();
            }
        }
        this._elements = [];

        this.scene.physics.resume();
        this.active = false;
    }
}
