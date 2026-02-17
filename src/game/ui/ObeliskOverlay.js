import Phaser from 'phaser';
import { OBELISK } from '../constants.js';

export class ObeliskOverlay {
    constructor(scene) {
        this.scene = scene;
        this.active = false;
        this._elements = [];
        this._riddle = null;
        this._answers = [];
    }

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
        const zoom = this.scene.cameras.main.zoom;
        const s = 1 / zoom;

        // Pick a random riddle
        this._riddle = OBELISK.RIDDLES[Math.floor(Math.random() * OBELISK.RIDDLES.length)];

        // Shuffle answers
        this._answers = [this._riddle.correct, ...this._riddle.wrong];
        for (let i = this._answers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this._answers[i], this._answers[j]] = [this._answers[j], this._answers[i]];
        }

        this.scene.physics.pause();

        // Backdrop
        const bg = this.scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.8)
            .setScrollFactor(0).setDepth(300);
        this._elements.push(bg);

        // Header
        const hp = this._uiXY(width / 2, height * 0.15);
        const header = this.scene.add.text(hp.x, hp.y, 'ANCIENT OBELISK', {
            fontSize: '22px', color: '#88AAFF', fontFamily: 'monospace', fontStyle: 'bold',
        }).setOrigin(0.5).setScrollFactor(0).setDepth(301).setScale(s);
        this._elements.push(header);

        // Question
        const qp = this._uiXY(width / 2, height * 0.30);
        const question = this.scene.add.text(qp.x, qp.y, this._riddle.question, {
            fontSize: '15px', color: '#CCCCCC', fontFamily: 'monospace',
            wordWrap: { width: Math.round(500 / s) }, align: 'center',
        }).setOrigin(0.5).setScrollFactor(0).setDepth(301).setScale(s);
        this._elements.push(question);

        // Answer cards
        const cardW = Math.round(180 * s);
        const cardH = Math.round(60 * s);
        const totalW = 3 * cardW + 2 * 20 * s;
        const startX = (width - totalW * zoom) / 2 + (cardW * zoom) / 2;

        for (let i = 0; i < 3; i++) {
            const screenX = startX + i * ((cardW + 20 * s) * zoom);
            const cp = this._uiXY(screenX, height * 0.55);

            const cardBg = this.scene.add.rectangle(cp.x, cp.y, cardW, cardH, 0x1A1A3E)
                .setScrollFactor(0).setDepth(302);
            cardBg.setStrokeStyle(1, 0x4466AA);
            this._elements.push(cardBg);

            const label = this.scene.add.text(cp.x, cp.y - 6 * s, this._answers[i], {
                fontSize: '13px', color: '#FFFFFF', fontFamily: 'monospace',
                wordWrap: { width: Math.round((cardW - 16) / s) }, align: 'center',
            }).setOrigin(0.5).setScrollFactor(0).setDepth(303).setScale(s);
            this._elements.push(label);

            const prompt = this.scene.add.text(cp.x, cp.y + 18 * s, `[${i + 1}]`, {
                fontSize: '12px', color: '#FFCC00', fontFamily: 'monospace',
            }).setOrigin(0.5).setScrollFactor(0).setDepth(303).setScale(s);
            this._elements.push(prompt);

            this.scene.tweens.add({
                targets: prompt,
                alpha: { from: 1, to: 0.4 },
                duration: 800,
                yoyo: true,
                repeat: -1,
            });
        }

        // Key handler
        this._keyHandler = this.scene.input.keyboard.on('keydown', (event) => {
            if (!this.active) return;
            let idx = -1;
            if (event.keyCode === Phaser.Input.Keyboard.KeyCodes.ONE) idx = 0;
            else if (event.keyCode === Phaser.Input.Keyboard.KeyCodes.TWO) idx = 1;
            else if (event.keyCode === Phaser.Input.Keyboard.KeyCodes.THREE) idx = 2;

            if (idx >= 0 && idx < 3) {
                this._selectAnswer(idx);
            }
        });
    }

    _selectAnswer(idx) {
        if (!this.active) return;
        this.active = false;
        this.scene.input.keyboard.off('keydown', this._keyHandler);

        const chosen = this._answers[idx];
        const correct = chosen === this._riddle.correct;

        this.scene.events.emit('obeliskAnswer', correct);

        // Brief feedback then cleanup
        const { width, height } = this.scene.scale;
        const s = 1 / this.scene.cameras.main.zoom;
        const rp = this._uiXY(width / 2, height * 0.75);
        const result = this.scene.add.text(rp.x, rp.y,
            correct ? 'The Ancients approve.' : 'The obelisk falls silent.',
            {
                fontSize: '16px',
                color: correct ? '#44FF44' : '#FF4444',
                fontFamily: 'monospace',
                fontStyle: 'bold',
            }
        ).setOrigin(0.5).setScrollFactor(0).setDepth(303).setScale(s);
        this._elements.push(result);

        this.scene.time.delayedCall(1200, () => {
            this._cleanup();
            this.scene.physics.resume();
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
    }
}
