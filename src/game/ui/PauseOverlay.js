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

        // Dark backdrop (centered, oversized — covers screen at any zoom)
        const bg = this.scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.8)
            .setScrollFactor(0).setDepth(300);
        this._elements.push(bg);

        // "PAUSED" header
        const hp = this._uiXY(width / 2, Math.round(height * 0.07));
        const header = this.scene.add.text(hp.x, hp.y, 'PAUSED', {
            fontSize: '28px',
            color: '#FFCC00',
            fontFamily: 'monospace',
            fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(301);
        this._elements.push(header);

        // Player info line
        let infoStr = `Level ${SkillManager.level}`;
        if (SkillManager.activeClass && SkillManager.activeClass.className) {
            infoStr += `  -  ${SkillManager.activeClass.className}`;
        }
        const ip = this._uiXY(width / 2, Math.round(height * 0.11));
        const info = this.scene.add.text(ip.x, ip.y, infoStr, {
            fontSize: '16px',
            color: '#FFFFFF',
            fontFamily: 'monospace'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(301);
        this._elements.push(info);

        // Divider
        const dp = this._uiXY(width / 2, Math.round(height * 0.14));
        const divider = this.scene.add.rectangle(dp.x, dp.y, 400, 1, 0x666666)
            .setScrollFactor(0).setDepth(301);
        this._elements.push(divider);

        // Skills header
        const shp = this._uiXY(width / 2, Math.round(height * 0.16));
        const skillsHeader = this.scene.add.text(shp.x, shp.y, 'ACQUIRED SKILLS', {
            fontSize: '14px',
            color: '#AAAAAA',
            fontFamily: 'monospace'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(301);
        this._elements.push(skillsHeader);

        // Skill list
        if (SkillManager.acquired.length === 0) {
            const nsp = this._uiXY(width / 2, Math.round(height * 0.19));
            const noSkills = this.scene.add.text(nsp.x, nsp.y, 'No skills acquired yet', {
                fontSize: '13px',
                color: '#666666',
                fontFamily: 'monospace',
                fontStyle: 'italic'
            }).setOrigin(0.5).setScrollFactor(0).setDepth(301);
            this._elements.push(noSkills);
        } else {
            const startP = this._uiXY(0, Math.round(height * 0.19));
            let yPos = startP.y;
            for (const skillId of SkillManager.acquired) {
                const skillDef = SKILLS.find(s => s.id === skillId);
                if (!skillDef) continue;

                const colorStr = '#' + skillDef.color.toString(16).padStart(6, '0');

                // Colored square
                const sqP = this._uiXY(width / 2 - 180, 0);
                const sq = this.scene.add.rectangle(sqP.x, yPos + 8, 16, 16, skillDef.color)
                    .setScrollFactor(0).setDepth(302);
                sq.setStrokeStyle(1, 0xFFFFFF);
                this._elements.push(sq);

                // Skill name
                const nmP = this._uiXY(width / 2 - 164, 0);
                const name = this.scene.add.text(nmP.x, yPos, skillDef.name, {
                    fontSize: '14px',
                    color: '#FFFFFF',
                    fontFamily: 'monospace'
                }).setOrigin(0, 0).setScrollFactor(0).setDepth(302);
                this._elements.push(name);

                // Class name
                const clP = this._uiXY(width / 2 + 100, 0);
                const cls = this.scene.add.text(clP.x, yPos, skillDef.className, {
                    fontSize: '12px',
                    color: colorStr,
                    fontFamily: 'monospace'
                }).setOrigin(0, 0).setScrollFactor(0).setDepth(302);
                this._elements.push(cls);

                // Description
                const desc = this.scene.add.text(nmP.x, yPos + 18, skillDef.description, {
                    fontSize: '12px',
                    color: '#888888',
                    fontFamily: 'monospace',
                    wordWrap: { width: 420 }
                }).setOrigin(0, 0).setScrollFactor(0).setDepth(302);
                this._elements.push(desc);

                yPos += 50;
            }
        }

        // ─── Achievements section ───
        const achDivP = this._uiXY(width / 2, Math.round(height * 0.50));
        const achDivider = this.scene.add.rectangle(achDivP.x, achDivP.y, 400, 1, 0x666666)
            .setScrollFactor(0).setDepth(301);
        this._elements.push(achDivider);

        const achCount = AchievementManager.getUnlockedCount();
        const achTotal = AchievementManager.getTotalCount();
        const achHp = this._uiXY(width / 2, Math.round(height * 0.53));
        const achHeader = this.scene.add.text(achHp.x, achHp.y, `ACHIEVEMENTS (${achCount}/${achTotal})`, {
            fontSize: '14px',
            color: achCount >= achTotal ? '#44FF44' : '#AAAAAA',
            fontFamily: 'monospace'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(301);
        this._elements.push(achHeader);

        // Two-column category layout
        const categories = AchievementManager.getCategories();
        const colLeftX = width / 2 - 160;
        const colRightX = width / 2 + 40;
        const catStartY = Math.round(height * 0.56);
        const catLineH = 18;

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
                fontSize: '12px',
                color: complete ? '#44FF44' : '#888888',
                fontFamily: 'monospace'
            }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(302);
            this._elements.push(catText);
        }

        // ─── Settings section ───
        const settDiv = this._uiXY(width / 2, Math.round(height * 0.72));
        const settDivider = this.scene.add.rectangle(settDiv.x, settDiv.y, 400, 1, 0x666666)
            .setScrollFactor(0).setDepth(301);
        this._elements.push(settDivider);

        const settHp = this._uiXY(width / 2, Math.round(height * 0.74));
        const settHeader = this.scene.add.text(settHp.x, settHp.y, 'SETTINGS', {
            fontSize: '14px',
            color: '#AAAAAA',
            fontFamily: 'monospace'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(301);
        this._elements.push(settHeader);

        // Sound toggle
        const audio = this.scene.audio;
        const soundLabelP = this._uiXY(width / 2 - 140, Math.round(height * 0.78));
        const soundLabel = this.scene.add.text(soundLabelP.x, soundLabelP.y, '[M]  Sound:', {
            fontSize: '14px',
            color: '#CCCCCC',
            fontFamily: 'monospace'
        }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(301);
        this._elements.push(soundLabel);

        const soundValP = this._uiXY(width / 2 + 60, Math.round(height * 0.78));
        this._soundText = this.scene.add.text(soundValP.x, soundValP.y,
            audio.muted ? 'OFF' : 'ON', {
            fontSize: '14px',
            color: audio.muted ? '#FF4444' : '#44FF44',
            fontFamily: 'monospace',
            fontStyle: 'bold'
        }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(301);
        this._elements.push(this._soundText);

        // Resolution toggle
        const [rw, rh] = Settings.data.resolution;
        const resLabelP = this._uiXY(width / 2 - 140, Math.round(height * 0.82));
        const resLabel = this.scene.add.text(resLabelP.x, resLabelP.y, '[R]  Resolution:', {
            fontSize: '14px', color: '#CCCCCC', fontFamily: 'monospace'
        }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(301);
        this._elements.push(resLabel);

        const resValP = this._uiXY(width / 2 + 60, Math.round(height * 0.82));
        this._resText = this.scene.add.text(resValP.x, resValP.y, `${rw}x${rh}`, {
            fontSize: '14px', color: '#FFCC00', fontFamily: 'monospace', fontStyle: 'bold'
        }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(301);
        this._elements.push(this._resText);

        // Grid snap toggle
        const snapLabelP = this._uiXY(width / 2 - 140, Math.round(height * 0.86));
        const snapLabel = this.scene.add.text(snapLabelP.x, snapLabelP.y, '[N]  Grid Snap:', {
            fontSize: '14px', color: '#CCCCCC', fontFamily: 'monospace'
        }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(301);
        this._elements.push(snapLabel);

        const snapValP = this._uiXY(width / 2 + 60, Math.round(height * 0.86));
        this._snapText = this.scene.add.text(snapValP.x, snapValP.y,
            Settings.data.gridSnap ? 'ON' : 'OFF', {
            fontSize: '14px',
            color: Settings.data.gridSnap ? '#44FF44' : '#FF4444',
            fontFamily: 'monospace', fontStyle: 'bold'
        }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(301);
        this._elements.push(this._snapText);

        // Reset HUD positions
        const resetP = this._uiXY(width / 2 - 140, Math.round(height * 0.90));
        const resetLabel = this.scene.add.text(resetP.x, resetP.y, '[P]  Reset HUD Positions', {
            fontSize: '14px', color: '#CCCCCC', fontFamily: 'monospace'
        }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(301);
        this._elements.push(resetLabel);

        // ─── Dev Options (compact) ───
        const devDiv = this._uiXY(width / 2, Math.round(height * 0.93));
        const devDivider = this.scene.add.rectangle(devDiv.x, devDiv.y, 400, 1, 0x666666)
            .setScrollFactor(0).setDepth(301);
        this._elements.push(devDivider);

        const clsName = SkillManager.activeClass.className || 'Default';
        const devHp = this._uiXY(width / 2, Math.round(height * 0.96));
        const devLine = this.scene.add.text(devHp.x, devHp.y,
            `DEV  [L] Level Up  [G] Guide  [C] Class: ${clsName}`, {
            fontSize: '12px',
            color: '#FF6666',
            fontFamily: 'monospace'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(301);
        this._elements.push(devLine);
        this._devLine = devLine;

        // Resume prompt at bottom
        const pp = this._uiXY(width / 2, height - 30);
        const prompt = this.scene.add.text(pp.x, pp.y, 'Press [ESC] to resume', {
            fontSize: '14px',
            color: '#FFCC00',
            fontFamily: 'monospace'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(301);
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
