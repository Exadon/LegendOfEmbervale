import Phaser from 'phaser';

const BASE_CARD_W = 240;
const BASE_CARD_H = 200;

export class RelicOverlay {
    constructor(scene, relicManager) {
        this.scene = scene;
        this.relicManager = relicManager;
        this.active = false;
        this.choices = [];
        this._elements = [];
        this._keyHandler = null;
    }

    _uiXY(sx, sy) {
        const z = this.scene.cameras.main.zoom;
        const cx = this.scene.scale.width / 2;
        const cy = this.scene.scale.height / 2;
        return { x: (sx - cx) / z + cx, y: (sy - cy) / z + cy };
    }

    show() {
        if (this.active) return;
        this.choices = this.relicManager.getAvailableChoices(2);
        if (this.choices.length === 0) return;

        this.active = true;
        this.scene.physics.pause();

        const { width, height } = this.scene.scale;
        const zoom = this.scene.cameras.main.zoom;
        const s = 1 / zoom;
        const cardW = Math.round(BASE_CARD_W * s);
        const cardH = Math.round(BASE_CARD_H * s);

        // Dark backdrop
        const bg = this.scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.75)
            .setScrollFactor(0).setDepth(300);
        this._elements.push(bg);

        // Header
        const hp = this._uiXY(width / 2, Math.round(height * 0.12));
        const header = this.scene.add.text(hp.x, hp.y, 'RELIC FOUND', {
            fontSize: '24px', color: '#FFCC00', fontFamily: 'monospace', fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(301).setScale(s);
        this._elements.push(header);

        const sp = this._uiXY(width / 2, Math.round(height * 0.17));
        const subtitle = this.scene.add.text(sp.x, sp.y, 'Choose a relic', {
            fontSize: '13px', color: '#AAAAAA', fontFamily: 'monospace'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(301).setScale(s);
        this._elements.push(subtitle);

        // Cards
        const numCards = this.choices.length;
        const cardScreenW = cardW * zoom;
        const totalCardsW = numCards * cardScreenW;
        const gap = (width - totalCardsW) / (numCards + 1);
        const cardCenterY = Math.round(height * 0.52);

        for (let i = 0; i < numCards; i++) {
            const relic = this.choices[i];
            const screenX = gap + cardScreenW / 2 + i * (cardScreenW + gap);
            const cp = this._uiXY(screenX, cardCenterY);
            this._createCard(cp.x, cp.y, relic, i + 1, s, cardW, cardH);
        }

        // Register 1/2 keys
        this._keyHandler = (event) => {
            if (!this.active) return;
            let idx = -1;
            if (event.keyCode === Phaser.Input.Keyboard.KeyCodes.ONE) idx = 0;
            else if (event.keyCode === Phaser.Input.Keyboard.KeyCodes.TWO) idx = 1;
            if (idx >= 0 && idx < this.choices.length) {
                this._select(idx);
            }
        };
        this.scene.input.keyboard.on('keydown', this._keyHandler);
    }

    _createCard(x, y, relic, num, s, cw, ch) {
        const colorStr = '#' + relic.color.toString(16).padStart(6, '0');

        const bg = this.scene.add.rectangle(x, y, cw, ch, 0x1A1A2E)
            .setScrollFactor(0).setDepth(302);
        bg.setStrokeStyle(2, relic.color);
        this._elements.push(bg);

        // Icon
        const icon = this.scene.add.text(x, y - Math.round(60 * s), relic.icon, {
            fontSize: '24px', fontFamily: 'monospace'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(303).setScale(s);
        this._elements.push(icon);

        // Name
        const name = this.scene.add.text(x, y - Math.round(35 * s), relic.name, {
            fontSize: '16px', color: colorStr, fontFamily: 'monospace', fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(303).setScale(s);
        this._elements.push(name);

        // Description (benefit)
        const desc = this.scene.add.text(x, y - Math.round(5 * s), relic.desc, {
            fontSize: '12px', color: '#FFFFFF', fontFamily: 'monospace',
            wordWrap: { width: Math.round((cw - 20) / s) }, align: 'center'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(303).setScale(s);
        this._elements.push(desc);

        // Drawback
        const drawback = this.scene.add.text(x, y + Math.round(25 * s), relic.drawback, {
            fontSize: '11px', color: '#FF4444', fontFamily: 'monospace',
            wordWrap: { width: Math.round((cw - 20) / s) }, align: 'center'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(303).setScale(s);
        this._elements.push(drawback);

        // Key prompt
        const prompt = this.scene.add.text(x, y + ch / 2 - Math.round(16 * s), `Press [${num}]`, {
            fontSize: '14px', color: '#FFCC00', fontFamily: 'monospace'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(303).setScale(s);
        this._elements.push(prompt);

        this.scene.tweens.add({
            targets: prompt,
            alpha: { from: 1, to: 0.4 },
            duration: 800,
            yoyo: true,
            repeat: -1
        });
    }

    _select(idx) {
        if (!this.active) return;
        this.active = false;

        this.scene.input.keyboard.off('keydown', this._keyHandler);

        const relic = this.choices[idx];
        this.relicManager.acquire(relic);

        // Cleanup and resume after brief delay
        this.scene.time.delayedCall(300, () => {
            this._cleanup();
            this.scene.physics.resume();
            this.scene.events.emit('relicAcquired', relic);
        });
    }

    _cleanup() {
        for (const el of this._elements) {
            if (el && el.active) {
                this.scene.tweens.killTweensOf(el);
                el.destroy();
            }
        }
        this._elements = [];
        this.choices = [];
    }

    destroy() {
        this._cleanup();
    }
}
