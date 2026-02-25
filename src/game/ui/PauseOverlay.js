import Phaser from 'phaser';
import { SkillManager } from '../systems/SkillManager.js';
import { CLASS_SKILL_TREES } from '../systems/ClassSkillTrees.js';
import { Settings } from '../systems/Settings.js';
import { AchievementManager } from '../systems/AchievementManager.js';
import { DIFFICULTIES } from '../constants.js';
import { KeybindOverlay } from './KeybindOverlay.js';
import { MetaProgression } from '../systems/MetaProgression.js';
import { CLASS_MASTERIES } from '../systems/ClassMasteries.js';

const DIFFICULTY_ORDER = ['pilgrim', 'standard', 'torment'];

export class PauseOverlay {
    constructor(scene) {
        this.scene = scene;
        this.active = false;
        this._elements = [];
        this._keyHandler = null;
        this._soundText = null;
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
        this.scene.audio?.playPauseOpen?.();

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

        // Active mastery summary (only shown if any mastery ranks are purchased)
        const _classId = SkillManager.selectedClassId;
        const _masteryDefs = CLASS_MASTERIES[_classId] || [];
        const _activeMasteries = _masteryDefs
            .map(m => ({ name: m.name, rank: MetaProgression.getMasteryRank(_classId, m.id) }))
            .filter(m => m.rank > 0);
        if (_activeMasteries.length > 0) {
            const masteryStr = _activeMasteries.map(m => `${m.name} Rk.${m.rank}`).join('  ·  ');
            _text(width / 2, Math.round(height * 0.135), `\u2605 ${masteryStr}`, {
                fontSize: '10px', color: '#FFCC44'
            });
        }

        // Divider
        const dp = this._uiXY(width / 2, Math.round(height * 0.155));
        const divider = this.scene.add.rectangle(dp.x, dp.y, 400 * s, 1, 0x666666)
            .setScrollFactor(0).setDepth(301);
        this._elements.push(divider);

        // Skills header
        _text(width / 2, Math.round(height * 0.165), 'ACQUIRED SKILLS', {
            fontSize: '14px', color: '#AAAAAA'
        });

        // Skills section background
        const _displayedCount = Math.min(SkillManager.acquired.length, 8);
        const skillPanelH = SkillManager.acquired.length === 0 ? 30 : Math.min(_displayedCount * 35 + 10, 180);
        _panel(width / 2, Math.round(height * 0.165) + skillPanelH / 2 + 10, 420, skillPanelH);

        // Skill list (capped at 8 entries)
        if (SkillManager.acquired.length === 0) {
            _text(width / 2, Math.round(height * 0.195), 'No skills acquired yet', {
                fontSize: '13px', color: '#666666', fontStyle: 'italic'
            });
        } else {
            const tree = CLASS_SKILL_TREES[SkillManager.selectedClassId] || [];
            const startP = this._uiXY(0, Math.round(height * 0.195));
            let yPos = startP.y;
            const _skillsToShow = SkillManager.acquired.slice(0, 8);
            const _extraCount = SkillManager.acquired.length - 8;
            for (const nodeId of _skillsToShow) {
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
            // Overflow indicator
            if (_extraCount > 0) {
                const moreP = this._uiXY(width / 2, 0);
                const moreText = this.scene.add.text(moreP.x, yPos, `\u2026 +${_extraCount} more`, {
                    fontSize: '11px', color: '#666666', fontFamily: 'monospace'
                }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(302).setScale(s);
                this._elements.push(moreText);
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
        _panel(width / 2, Math.round(height * 0.765), 420, 150);

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
        const volHint = this.scene.add.text(volHintP.x, volHintP.y, '[-/+] Volume', {
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
        const _diffId = Settings.data.difficulty || 'standard';
        const _diffColors = { pilgrim: '#44FF44', standard: '#FFCC00', torment: '#FF4444' };
        this._diffText = this.scene.add.text(diffValP.x, diffValP.y,
            DIFFICULTIES[_diffId].label, {
            fontSize: '13px', color: _diffColors[_diffId] || '#FFCC00', fontFamily: 'monospace', fontStyle: 'bold'
        }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(301).setScale(s);
        this._elements.push(this._diffText);

        // Colorblind mode [O]
        const cbLabelP = this._uiXY(width / 2 - 140, Math.round(height * 0.845));
        const cbLabel = this.scene.add.text(cbLabelP.x, cbLabelP.y, '[O]  Colorblind:', {
            fontSize: '13px', color: '#CCCCCC', fontFamily: 'monospace'
        }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(301).setScale(s);
        this._elements.push(cbLabel);
        const cbValP = this._uiXY(width / 2 + 60, Math.round(height * 0.845));
        this._cbText = this.scene.add.text(cbValP.x, cbValP.y,
            Settings.data.colorblindMode ? 'ON' : 'OFF', {
            fontSize: '13px',
            color: Settings.data.colorblindMode ? '#44FF44' : '#FF4444',
            fontFamily: 'monospace', fontStyle: 'bold'
        }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(301).setScale(s);
        this._elements.push(this._cbText);

        // Show FPS [P]
        const fpsLabelP = this._uiXY(width / 2 - 140, Math.round(height * 0.86));
        const fpsLabel = this.scene.add.text(fpsLabelP.x, fpsLabelP.y, '[P]  Show FPS:', {
            fontSize: '13px', color: '#CCCCCC', fontFamily: 'monospace'
        }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(301).setScale(s);
        this._elements.push(fpsLabel);
        const fpsValP = this._uiXY(width / 2 + 60, Math.round(height * 0.86));
        this._fpsToggleText = this.scene.add.text(fpsValP.x, fpsValP.y,
            Settings.data.showFps ? 'ON' : 'OFF', {
            fontSize: '13px',
            color: Settings.data.showFps ? '#44FF44' : '#FF4444',
            fontFamily: 'monospace', fontStyle: 'bold'
        }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(301).setScale(s);
        this._elements.push(this._fpsToggleText);

        // Class Mastery [C]
        const cmLabelP = this._uiXY(width / 2 - 140, Math.round(height * 0.875));
        const cmLabel = this.scene.add.text(cmLabelP.x, cmLabelP.y, '[C]  Class Mastery', {
            fontSize: '13px', color: '#CCCCCC', fontFamily: 'monospace'
        }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(301).setScale(s);
        this._elements.push(cmLabel);

        // Main Menu [X]
        const mmLabelP = this._uiXY(width / 2 - 140, Math.round(height * 0.89));
        const mmLabel = this.scene.add.text(mmLabelP.x, mmLabelP.y, '[X]  Return to Main Menu', {
            fontSize: '13px', color: '#FF8855', fontFamily: 'monospace', fontStyle: 'bold'
        }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(301).setScale(s);
        this._elements.push(mmLabel);

        // Key Bindings [K]
        const kbLabelP = this._uiXY(width / 2 - 140, Math.round(height * 0.905));
        const kbLabel = this.scene.add.text(kbLabelP.x, kbLabelP.y, '[K]  Key Bindings', {
            fontSize: '13px', color: '#CCCCCC', fontFamily: 'monospace'
        }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(301).setScale(s);
        this._elements.push(kbLabel);

        // Active class ability reference (including combo hint)
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
        const _cls = SkillManager.activeClass;
        if (_cls) {
            const abilY = Math.round(height * 0.955);
            const _comboDesc = _COMBO_DESCS[_cls.id] || '';
            const abilLines = [
                `[Q] ${_cls.attackName}${_cls.attackDesc ? ': ' + _cls.attackDesc : ''}`,
                `[S] ${_cls.sAbility?.desc || _cls.sAbility?.type || '\u2014'}`,
                `[E] ${_cls.eAbility?.desc || _cls.eAbility?.type || '\u2014'}`,
                `\u2726  ${_cls.passive?.description || 'No passive'}`,
                `\u26A1 S/E\u2192Q COMBO: ${_comboDesc}`,
            ];
            const bColL = width / 2 - 180;
            for (let i = 0; i < abilLines.length; i++) {
                const isCombo = i === abilLines.length - 1;
                const ap = this._uiXY(bColL, abilY + i * 12);
                const at = this.scene.add.text(ap.x, ap.y, abilLines[i], {
                    fontSize: '10px', color: isCombo ? '#BBAA44' : '#666666', fontFamily: 'monospace',
                    wordWrap: { width: 380 / s }
                }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(301).setScale(s);
                this._elements.push(at);
            }
        }

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
            } else if (event.key === 'g' || event.key === 'G') {
                this._openGuide();
            } else if (event.key === 'j' || event.key === 'J') {
                this._openLoreCompendium();
            } else if (event.key === 'd' || event.key === 'D') {
                this._toggleParticleDensity();
            } else if (event.key === 'f' || event.key === 'F') {
                this._cycleDifficulty();
            } else if (event.key === 'o' || event.key === 'O') {
                this._toggleColorblind();
            } else if (event.key === 'p' || event.key === 'P') {
                this._toggleFps();
            } else if (event.key === 'c' || event.key === 'C') {
                this._openClassMastery();
            } else if (event.key === 'k' || event.key === 'K') {
                this._openKeybinds();
            } else if (event.key === 'x' || event.key === 'X') {
                this._returnToMainMenu();
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
            const diffColors = { pilgrim: '#44FF44', standard: '#FFCC00', torment: '#FF4444' };
            this._diffText.setText(DIFFICULTIES[next].label);
            this._diffText.setColor(diffColors[next] || '#FFCC00');
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

    _toggleFps() {
        Settings.data.showFps = !Settings.data.showFps;
        Settings.save();
        if (this._fpsToggleText) {
            this._fpsToggleText.setText(Settings.data.showFps ? 'ON' : 'OFF');
            this._fpsToggleText.setColor(Settings.data.showFps ? '#44FF44' : '#FF4444');
        }
        // Notify scene to create/destroy FPS counter
        this.scene.events.emit('toggleFps', Settings.data.showFps);
    }

    _openClassMastery() {
        this.hide();
        const classId = SkillManager.selectedClassId || (SkillManager.activeClass && SkillManager.activeClass.id) || 'adventurer';
        this.scene.scene.pause('Level1');
        this.scene.scene.launch('ClassMasteryScene', { classId, returnScene: 'Level1' });
    }

    _openKeybinds() {
        if (!this._keybindOverlay) {
            this._keybindOverlay = new KeybindOverlay(this.scene);
        }
        this._keybindOverlay.show();
    }

    _returnToMainMenu() {
        this.hide();
        this.scene.cameras.main.fadeOut(600, 0, 0, 0);
        this.scene.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.scene.stop('Level1');
            this.scene.scene.start('MainMenu');
        });
    }

    hide() {
        if (!this.active) return;
        this.scene.audio?.playPauseClose?.();

        if (this._keyHandler) {
            this.scene.input.keyboard.off('keydown', this._keyHandler);
            this._keyHandler = null;
        }
        this._soundText = null; this._resText = null; this._densText = null;
        this._diffText = null;  this._cbText = null;  this._fpsToggleText = null;

        const els = this._elements.slice();
        this._elements = [];
        this.active = false;
        this.scene.physics.resume();

        for (const el of els) {
            if (el && el.active) {
                this.scene.tweens.add({
                    targets: el, alpha: 0, duration: 180,
                    onComplete: () => { if (el.active) el.destroy(); }
                });
            }
        }
    }
}
