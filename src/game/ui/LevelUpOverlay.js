import Phaser from 'phaser';
import { SkillManager } from '../systems/SkillManager.js';

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
        this.choices = SkillManager.getRandomChoices(3);
        if (this.choices.length === 0) {
            this.active = false;
            return;
        }

        this.scene.physics.pause();

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

        // Class name — full font size + setScale for crisp rendering
        const classText = this.scene.add.text(x, y - Math.round(82 * s), skill.className, {
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

        this._elements.push(...els);
        return { els, bg, skill };
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

        // Animate chosen card: scale up + flash
        this.scene.tweens.add({
            targets: chosen.bg,
            scaleX: 1.1,
            scaleY: 1.1,
            duration: 300,
            ease: 'Back.easeOut'
        });
        chosen.bg.setStrokeStyle(3, GOLD);

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
        this.scene.time.delayedCall(600, () => {
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
