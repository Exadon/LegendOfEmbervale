import Phaser from 'phaser';
import { SkillManager } from '../systems/SkillManager.js';
import { CLASS_SKILL_TREES } from '../systems/ClassSkillTrees.js';

// Base card dimensions (at zoom 1.0). Scaled down at higher zoom.
const BASE_CARD_W = 280;
const BASE_CARD_H = 340;
const GOLD = 0xFFCC00;

export class LevelUpOverlay {
    constructor(scene) {
        this.scene = scene;
        this.active = false;
        this.choices = [];
        this._elements = [];
        this._keys = null;
    }

    /** Convert desired screen position to zoom-adjusted object coords for scrollFactor(0) */
    _uiXY(sx, sy) {
        const z = this.scene.cameras.main.zoom;
        const cx = this.scene.scale.width / 2;
        const cy = this.scene.scale.height / 2;
        return { x: (sx - cx) / z + cx, y: (sy - cy) / z + cy };
    }

    show() {
        if (this.active) return;
        this.active = true;

        const { width, height } = this.scene.scale;
        this.choices = SkillManager.getAvailableNodes(3);
        if (this.choices.length === 0) {
            this.active = false;
            return;
        }

        this.scene.physics.pause();

        // Level-up fanfare
        if (this.scene.audio) this.scene.audio.playLevelUp();

        // Scale factor: shrink cards at higher zoom so they fit the viewport
        const zoom = this.scene.cameras.main.zoom;
        this._zs = 1 / zoom;   // zoom scale for card dimensions
        const cardW = Math.round(BASE_CARD_W * this._zs);
        const cardH = Math.round(BASE_CARD_H * this._zs);
        this._cardW = cardW;
        this._cardH = cardH;

        // Dark backdrop (centered, oversized — covers screen at any zoom)
        this._bg = this.scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.75)
            .setScrollFactor(0).setDepth(300);
        this._elements.push(this._bg);

        // Render text at full font size then setScale(s) — avoids blurry
        // small-px text being magnified by the camera zoom.
        const s = this._zs;

        // Header
        const hp = this._uiXY(width / 2, Math.round(height * 0.10));
        const header = this.scene.add.text(hp.x, hp.y, 'LEVEL UP!', {
            fontSize: '28px',
            color: '#FFCC00',
            fontFamily: 'monospace',
            fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(301).setScale(s);
        this._elements.push(header);

        // Subtitle
        const sp = this._uiXY(width / 2, Math.round(height * 0.155));
        const subtitle = this.scene.add.text(sp.x, sp.y, 'Choose a skill', {
            fontSize: '14px',
            color: '#AAAAAA',
            fontFamily: 'monospace'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(301).setScale(s);
        this._elements.push(subtitle);

        // Cards — distribute evenly across the screen accounting for zoom
        const numCards = this.choices.length;
        const cardScreenW = cardW * zoom;
        const totalCardsW = numCards * cardScreenW;
        const gap = (width - totalCardsW) / (numCards + 1);
        const cardCenterY = Math.round(height * 0.53);

        this._cards = [];
        for (let i = 0; i < numCards; i++) {
            const skill = this.choices[i];
            const screenX = gap + cardScreenW / 2 + i * (cardScreenW + gap);
            const cp = this._uiXY(screenX, cardCenterY);
            const card = this._createCard(cp.x, cp.y, skill, i + 1);
            this._cards.push(card);
        }

        // Register 1/2/3 keys
        this._keys = this.scene.input.keyboard.addKeys({
            one: Phaser.Input.Keyboard.KeyCodes.ONE,
            two: Phaser.Input.Keyboard.KeyCodes.TWO,
            three: Phaser.Input.Keyboard.KeyCodes.THREE,
        });

        this._keyHandler = this.scene.input.keyboard.on('keydown', (event) => {
            if (!this.active) return;
            let idx = -1;
            if (event.keyCode === Phaser.Input.Keyboard.KeyCodes.ONE) idx = 0;
            else if (event.keyCode === Phaser.Input.Keyboard.KeyCodes.TWO) idx = 1;
            else if (event.keyCode === Phaser.Input.Keyboard.KeyCodes.THREE) idx = 2;

            if (idx >= 0 && idx < this.choices.length) {
                this._selectCard(idx);
            }
        });
    }

    _createCard(x, y, skill, num) {
        const els = [];
        const colorStr = '#' + skill.color.toString(16).padStart(6, '0');
        const s = this._zs;  // zoom scale factor
        const cw = this._cardW;
        const ch = this._cardH;

        // Card background
        const bg = this.scene.add.rectangle(x, y, cw, ch, 0x1A1A2E)
            .setScrollFactor(0).setDepth(302);
        bg.setStrokeStyle(2, skill.color);
        els.push(bg);

        // Tier badge — full font size + setScale for crisp rendering
        const tierLabel = skill.tier !== undefined ? `Tier ${skill.tier + 1}` : (skill.className || '');
        const classText = this.scene.add.text(x, y - Math.round(82 * s), tierLabel, {
            fontSize: '12px',
            color: colorStr,
            fontFamily: 'monospace'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(303).setScale(s);
        els.push(classText);

        // Skill name
        const nameText = this.scene.add.text(x, y - Math.round(62 * s), skill.name, {
            fontSize: '18px',
            color: '#FFFFFF',
            fontFamily: 'monospace',
            fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(303).setScale(s);
        els.push(nameText);

        // Description — wordWrap in unscaled pixels (divided by s so it wraps correctly)
        const descText = this.scene.add.text(x, y - Math.round(10 * s), skill.description, {
            fontSize: '12px',
            color: '#CCCCCC',
            fontFamily: 'monospace',
            wordWrap: { width: Math.round((cw - 30) / s) },
            align: 'center',
            lineSpacing: 4
        }).setOrigin(0.5).setScrollFactor(0).setDepth(303).setScale(s);
        els.push(descText);

        // Synergy hint — find acquired skills that share apply keys with this node
        const _synergyHint = this._findSynergyHint(skill);
        if (_synergyHint) {
            const _shp = this.scene.add.text(x, y + Math.round(42 * s), `+ pairs with ${_synergyHint}`, {
                fontSize: '10px', color: '#66EE88', fontFamily: 'monospace', fontStyle: 'italic'
            }).setOrigin(0.5).setScrollFactor(0).setDepth(303).setScale(s);
            els.push(_shp);
        }

        // Tree indicator bar
        const bar = this.scene.add.rectangle(x, y + ch / 2 - Math.round(32 * s), cw - 30, 2, skill.color, 0.5)
            .setScrollFactor(0).setDepth(303);
        els.push(bar);

        // Key prompt
        const prompt = this.scene.add.text(x, y + ch / 2 - Math.round(16 * s), `Press [${num}]`, {
            fontSize: '14px',
            color: '#FFCC00',
            fontFamily: 'monospace'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(303).setScale(s);
        els.push(prompt);

        // Pulse the prompt
        this.scene.tweens.add({
            targets: prompt,
            alpha: { from: 1, to: 0.4 },
            duration: 800,
            yoyo: true,
            repeat: -1
        });

        // Mouse hover: scale background + white border; click to select
        bg.setInteractive({ useHandCursor: true });
        bg.on('pointerover', () => {
            if (!this.active) return;
            bg.setStrokeStyle(3, 0xFFFFFF);
            this.scene.tweens.add({ targets: bg, scaleX: 1.05, scaleY: 1.05, duration: 130, ease: 'Back.easeOut' });
        });
        bg.on('pointerout', () => {
            if (!this.active) return;
            bg.setStrokeStyle(2, skill.color);
            this.scene.tweens.add({ targets: bg, scaleX: 1, scaleY: 1, duration: 110 });
        });
        bg.on('pointerdown', () => {
            if (!this.active) return;
            const idx = this._cards ? this._cards.findIndex(c => c.bg === bg) : -1;
            if (idx >= 0) this._selectCard(idx);
        });

        this._elements.push(...els);
        return { els, bg, skill };
    }

    /** Extract the set of apply-key names a skill node touches via mock manager */
    _getNodeKeys(node) {
        const keys = new Set();
        const mock = {
            setMult: (k) => keys.add(k),
            addFlat: (k) => keys.add(k),
            setFlag: (k) => keys.add(k),
        };
        try { node.apply(mock); } catch (_e) {}
        return keys;
    }

    /** Return the name of the first acquired skill that shares keys with this node, or null */
    _findSynergyHint(skill) {
        const tree = CLASS_SKILL_TREES[SkillManager.selectedClassId];
        if (!tree || !SkillManager.acquired.length) return null;
        const thisKeys = this._getNodeKeys(skill);
        if (thisKeys.size === 0) return null;
        for (const id of SkillManager.acquired) {
            const node = tree.find(n => n.id === id);
            if (!node) continue;
            const acqKeys = this._getNodeKeys(node);
            for (const k of thisKeys) {
                if (acqKeys.has(k)) return node.name;
            }
        }
        return null;
    }

    _selectCard(idx) {
        if (!this.active) return;
        this.active = false;

        // Remove key listener
        this.scene.input.keyboard.off('keydown', this._keyHandler);

        const chosen = this._cards[idx];
        const skill = this.choices[idx];

        // Acquire the skill
        SkillManager.acquireSkill(skill.id);
        if (this.scene.audio) this.scene.audio.playSkillAcquire();

        // Tier completion toast
        const _TIER_NAMES = ['Foundation', 'Adept', 'Expert', 'Master'];
        const _tree = CLASS_SKILL_TREES[SkillManager.selectedClassId];
        if (_tree && skill.tier !== undefined) {
            const _tierNodes = _tree.filter(n => n.tier === skill.tier);
            const _acquiredInTier = SkillManager.acquired.filter(id => _tierNodes.some(n => n.id === id));
            if (_tierNodes.length > 0 && _acquiredInTier.length === _tierNodes.length) {
                const _tierName = (_TIER_NAMES[skill.tier] || `Tier ${skill.tier + 1}`).toUpperCase();
                const { width, height } = this.scene.scale;
                const _tp = this._uiXY(width / 2, Math.round(height * 0.25));
                const _tierText = this.scene.add.text(_tp.x, _tp.y,
                    `\u2605 TIER ${skill.tier + 1} COMPLETE \u2014 ${_tierName}`, {
                    fontSize: '16px', color: '#FFDD44', fontFamily: 'monospace', fontStyle: 'bold',
                    stroke: '#000000', strokeThickness: 3
                }).setOrigin(0.5).setScrollFactor(0).setDepth(360).setScale(this._zs).setAlpha(0);
                this._elements.push(_tierText);
                this.scene.tweens.add({
                    targets: _tierText,
                    alpha: 1,
                    y: _tierText.y - Math.round(8 * this._zs),
                    duration: 300,
                    ease: 'Power2',
                    onComplete: () => {
                        this.scene.time.delayedCall(1300, () => {
                            if (_tierText.active) {
                                this.scene.tweens.add({ targets: _tierText, alpha: 0, duration: 400 });
                            }
                        });
                    }
                });
            }
        }

        // Celebration: camera shake + particle burst at chosen card
        this.scene.cameras.main.shake(140, 0.003);
        if (this.scene.textures.exists('pixel')) {
            const emitter = this.scene.add.particles(chosen.bg.x, chosen.bg.y, 'pixel', {
                speed: { min: 60, max: 180 },
                angle: { min: 0, max: 360 },
                scale: { start: 2.5, end: 0 },
                alpha: { start: 1, end: 0 },
                lifespan: { min: 300, max: 600 },
                tint: [0xFFCC00, 0xFFEE44, 0xFFAA00],
                blendMode: 'ADD',
                quantity: 18,
                emitting: false,
            }).setScrollFactor(0).setDepth(350);
            emitter.explode(18);
            this.scene.time.delayedCall(700, () => { if (emitter.active) emitter.destroy(); });
        }

        // Animate chosen card: scale up + gold border + brighter fill
        chosen.bg.setFillStyle(0x2A2A4E);
        chosen.bg.setStrokeStyle(4, GOLD);
        this.scene.tweens.add({
            targets: chosen.bg,
            scaleX: 1.13,
            scaleY: 1.13,
            duration: 280,
            ease: 'Back.easeOut'
        });

        // Fade out other cards
        for (let i = 0; i < this._cards.length; i++) {
            if (i === idx) continue;
            for (const el of this._cards[i].els) {
                this.scene.tweens.add({
                    targets: el,
                    alpha: 0,
                    duration: 300
                });
            }
        }

        // After delay, clean up and resume
        this.scene.time.delayedCall(300, () => {
            this._cleanup();
            this.scene.physics.resume();
            // Notify HUD and scene
            if (this.scene.hud && this.scene.hud.updateSkills) {
                this.scene.hud.updateSkills();
            }
            this.scene.events.emit('skillAcquired', skill.id);
        });
    }

    _cleanup() {
        // Kill all tweens on our elements
        for (const el of this._elements) {
            if (el && el.active) {
                this.scene.tweens.killTweensOf(el);
                el.destroy();
            }
        }
        this._elements = [];
        this._cards = [];
        this.choices = [];
    }

    destroy() {
        this._cleanup();
    }
}
