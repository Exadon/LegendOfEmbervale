import Phaser from 'phaser';
import { SkillManager } from '../systems/SkillManager.js';
import { CLASS_SKILL_TREES } from '../systems/ClassSkillTrees.js';
import { CLASS_DEFS } from '../systems/ClassDefs.js';
import { ALL_CLASS_IDS } from '../systems/MetaProgression.js';
import { Settings } from '../systems/Settings.js';
import { AchievementManager } from '../systems/AchievementManager.js';
import { DIFFICULTIES } from '../constants.js';
import { KeybindOverlay } from './KeybindOverlay.js';

const DIFFICULTY_ORDER = ['pilgrim', 'standard', 'torment'];

export class PauseOverlay {
    constructor(scene) {
        this.scene = scene;
        this.active = false;
        this._elements = [];
        this._keyHandler = null;
        this._soundText = null;
        this._classKeys = ALL_CLASS_IDS;
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
            const tree = CLASS_SKILL_TREES[SkillManager.selectedClassId] || [];
            const startP = this._uiXY(0, Math.round(height * 0.18));
            let yPos = startP.y;
            for (const nodeId of SkillManager.acquired) {
                const nodeDef = tree.find(n => n.id === nodeId);
                if (!nodeDef) continue;

                const colorStr = '#' + nodeDef.color.toString(16).padStart(6, '0');

                // Colored square
                const sqP = this._uiXY(width / 2 - 180, 0);
                const sq = this.scene.add.rectangle(sqP.x, yPos + 6 * s, 12 * s, 12 * s, nodeDef.color)
                    .setScrollFactor(0).setDepth(302);
                sq.setStrokeStyle(1, 0xFFFFFF);
                this._elements.push(sq);

                // Node name
                const nmP = this._uiXY(width / 2 - 164, 0);
                const name = this.scene.add.text(nmP.x, yPos, nodeDef.name, {
                    fontSize: '13px', color: '#FFFFFF', fontFamily: 'monospace'
                }).setOrigin(0, 0).setScrollFactor(0).setDepth(302).setScale(s);
                this._elements.push(name);

                // Tier label
                const clP = this._uiXY(width / 2 + 100, 0);
                const cls = this.scene.add.text(clP.x, yPos, `Tier ${nodeDef.tier + 1}`, {
                    fontSize: '11px', color: colorStr, fontFamily: 'monospace'
                }).setOrigin(0, 0).setScrollFactor(0).setDepth(302).setScale(s);
                this._elements.push(cls);

                // Description
                const desc = this.scene.add.text(nmP.x, yPos + 15 * s, nodeDef.description, {
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

        const volPct = Math.round(audio.volume * 100);
        const soundValP = this._uiXY(width / 2 + 60, Math.round(height * 0.67));
        this._soundText = this.scene.add.text(soundValP.x, soundValP.y,
            audio.muted ? 'OFF' : `ON ${volPct}%`, {
            fontSize: '13px',
            color: audio.muted ? '#FF4444' : '#44FF44',
            fontFamily: 'monospace', fontStyle: 'bold'
        }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(301).setScale(s);
        this._elements.push(this._soundText);

        // Volume hint
        const volHintP = this._uiXY(width / 2 - 140, Math.round(height * 0.67) + 14);
        const volHint = this.scene.add.text(volHintP.x, volHintP.y, '[-/+]  Volume', {
            fontSize: '11px', color: '#888888', fontFamily: 'monospace'
        }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(301).setScale(s);
        this._elements.push(volHint);

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

        // Lore Compendium
        const loreLabelP = this._uiXY(width / 2 - 140, Math.round(height * 0.75));
        const loreLabel = this.scene.add.text(loreLabelP.x, loreLabelP.y, '[J]  Lore Compendium', {
            fontSize: '13px', color: '#CCCCCC', fontFamily: 'monospace'
        }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(301).setScale(s);
        this._elements.push(loreLabel);

        // Particle density
        const densP = this._uiXY(width / 2 - 140, Math.round(height * 0.79));
        const densLabel = this.scene.add.text(densP.x, densP.y, '[D]  Particles:', {
            fontSize: '13px', color: '#CCCCCC', fontFamily: 'monospace'
        }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(301).setScale(s);
        this._elements.push(densLabel);
        const densValP = this._uiXY(width / 2 + 60, Math.round(height * 0.79));
        this._densText = this.scene.add.text(densValP.x, densValP.y,
            (Settings.data.particleDensity || 'high').toUpperCase(), {
            fontSize: '13px', color: '#FFCC00', fontFamily: 'monospace', fontStyle: 'bold'
        }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(301).setScale(s);
        this._elements.push(this._densText);

        // Difficulty preset [F]
        const diffLabelP = this._uiXY(width / 2 - 140, Math.round(height * 0.83));
        const diffLabel = this.scene.add.text(diffLabelP.x, diffLabelP.y, '[F]  Difficulty:', {
            fontSize: '13px', color: '#CCCCCC', fontFamily: 'monospace'
        }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(301).setScale(s);
        this._elements.push(diffLabel);
        const diffValP = this._uiXY(width / 2 + 60, Math.round(height * 0.83));
        this._diffText = this.scene.add.text(diffValP.x, diffValP.y,
            DIFFICULTIES[Settings.data.difficulty || 'standard'].label, {
            fontSize: '13px', color: '#FFCC00', fontFamily: 'monospace', fontStyle: 'bold'
        }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(301).setScale(s);
        this._elements.push(this._diffText);

        // Colorblind mode [O]
        const cbLabelP = this._uiXY(width / 2 - 140, Math.round(height * 0.87));
        const cbLabel = this.scene.add.text(cbLabelP.x, cbLabelP.y, '[O]  Colorblind:', {
            fontSize: '13px', color: '#CCCCCC', fontFamily: 'monospace'
        }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(301).setScale(s);
        this._elements.push(cbLabel);
        const cbValP = this._uiXY(width / 2 + 60, Math.round(height * 0.87));
        this._cbText = this.scene.add.text(cbValP.x, cbValP.y,
            Settings.data.colorblindMode ? 'ON' : 'OFF', {
            fontSize: '13px',
            color: Settings.data.colorblindMode ? '#44FF44' : '#FF4444',
            fontFamily: 'monospace', fontStyle: 'bold'
        }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(301).setScale(s);
        this._elements.push(this._cbText);

        // Key Bindings [K]
        const kbLabelP = this._uiXY(width / 2 - 140, Math.round(height * 0.91));
        const kbLabel = this.scene.add.text(kbLabelP.x, kbLabelP.y, '[K]  Key Bindings', {
            fontSize: '13px', color: '#CCCCCC', fontFamily: 'monospace'
        }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(301).setScale(s);
        this._elements.push(kbLabel);

        // Key bindings reference (read-only, compact two-column)
        const bindY = Math.round(height * 0.95);
        const bindings = [
            ['WASD / ←→', 'Move'],     ['SPACE / W/↑', 'Jump / Dbl'],
            ['SHIFT / B', 'Dash'],     ['E / X', 'Flame Burst'],
            ['Q / Y', 'Class Atk'],    ['S / RT', 'S Ability'],
            ['M / LB', 'Mine'],        ['ESC / Start', 'Pause'],
        ];
        const bColL = width / 2 - 160;
        const bColR = width / 2 + 10;
        for (let i = 0; i < bindings.length; i++) {
            const [key, action] = bindings[i];
            const bx = i % 2 === 0 ? bColL : bColR;
            const by = bindY + Math.floor(i / 2) * 11;
            const bp = this._uiXY(bx, by);
            const bt = this.scene.add.text(bp.x, bp.y, `${key.padEnd(14)} ${action}`, {
                fontSize: '10px', color: '#666666', fontFamily: 'monospace'
            }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(301).setScale(s);
            this._elements.push(bt);
        }

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
            } else if (event.key === 'l' || event.key === 'L') {
                this._forceLevelUp();
            } else if (event.key === 'g' || event.key === 'G') {
                this._openGuide();
            } else if (event.key === 'c' || event.key === 'C') {
                this._cycleClass();
            } else if (event.key === 'j' || event.key === 'J') {
                this._openLoreCompendium();
            } else if (event.key === 'd' || event.key === 'D') {
                this._toggleParticleDensity();
            } else if (event.key === 'f' || event.key === 'F') {
                this._cycleDifficulty();
            } else if (event.key === 'o' || event.key === 'O') {
                this._toggleColorblind();
            } else if (event.key === 'k' || event.key === 'K') {
                this._openKeybinds();
            } else if (event.key === '-' || event.key === '_') {
                this._adjustVolume(-0.1);
            } else if (event.key === '=' || event.key === '+') {
                this._adjustVolume(0.1);
            }
        };
        this.scene.input.keyboard.on('keydown', this._keyHandler);
    }

    _toggleSound() {
        const audio = this.scene.audio;
        audio.toggleMute();
        this._updateSoundText();
    }

    _adjustVolume(delta) {
        const audio = this.scene.audio;
        const newVol = Math.round(Math.max(0, Math.min(1, audio.volume + delta)) * 10) / 10;
        audio.setVolume(newVol);
        Settings.data.volume = newVol;
        Settings.save();
        this._updateSoundText();
    }

    _updateSoundText() {
        const audio = this.scene.audio;
        if (this._soundText) {
            const pct = Math.round(audio.volume * 100);
            this._soundText.setText(audio.muted ? 'OFF' : `ON ${pct}%`);
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

    _toggleParticleDensity() {
        const cur = Settings.data.particleDensity || 'high';
        Settings.data.particleDensity = cur === 'high' ? 'low' : 'high';
        Settings.save();
        if (this._densText) {
            this._densText.setText(Settings.data.particleDensity.toUpperCase());
        }
    }

    _openLoreCompendium() {
        this.hide();
        if (this.scene.loreCompendium) {
            this.scene.loreCompendium.show();
        }
    }

    _cycleDifficulty() {
        const cur = Settings.data.difficulty || 'standard';
        const idx = DIFFICULTY_ORDER.indexOf(cur);
        const next = DIFFICULTY_ORDER[(idx + 1) % DIFFICULTY_ORDER.length];
        Settings.data.difficulty = next;
        Settings.save();
        if (this._diffText) {
            this._diffText.setText(DIFFICULTIES[next].label);
        }
    }

    _toggleColorblind() {
        Settings.data.colorblindMode = !Settings.data.colorblindMode;
        Settings.save();
        if (this._cbText) {
            this._cbText.setText(Settings.data.colorblindMode ? 'ON' : 'OFF');
            this._cbText.setColor(Settings.data.colorblindMode ? '#44FF44' : '#FF4444');
        }
    }

    _openKeybinds() {
        if (!this._keybindOverlay) {
            this._keybindOverlay = new KeybindOverlay(this.scene);
        }
        this._keybindOverlay.show();
    }

    _cycleClass() {
        this._classIndex = (this._classIndex + 1) % this._classKeys.length;
        const classId = this._classKeys[this._classIndex];
        const classDef = CLASS_DEFS[classId];
        SkillManager.selectClass(classId);
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
        this._densText = null;
        this._diffText = null;
        this._cbText = null;
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
