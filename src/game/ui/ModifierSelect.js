import { RUN_MODIFIERS } from '../constants.js';
import { RunModifier } from '../systems/RunModifier.js';

/**
 * ModifierSelect — shown in ClassSelect after class confirmation.
 * Displays 3 random modifier cards; player picks one or skips.
 */
export class ModifierSelect {
    /**
     * @param {Phaser.Scene} scene
     * @param {Function} onSelected — called with no args after pick/skip
     */
    constructor(scene, onSelected) {
        this.scene = scene;
        this._onSelected = onSelected;
        this._elements = [];

        const { width, height } = scene.scale;

        // Pick 3 modifiers: at least 1 from each tier
        this._choices = this._pickModifiers();

        // Dark backdrop
        const bg = scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.88)
            .setScrollFactor(0).setDepth(400);
        this._elements.push(bg);

        // Title
        const title = scene.add.text(width / 2, 30, 'CHOOSE A RUN MODIFIER', {
            fontSize: '20px', color: '#FFCC00', fontFamily: 'monospace', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(401);
        this._elements.push(title);

        const subtitle = scene.add.text(width / 2, 54, 'Pick one challenge for bonus lifetime elixir on completion — or skip for no modifier.', {
            fontSize: '11px', color: '#888888', fontFamily: 'monospace'
        }).setOrigin(0.5).setDepth(401);
        this._elements.push(subtitle);

        // Cards
        const cardW = 200;
        const cardH = 170;
        const gapX = 20;
        const totalW = 3 * cardW + 2 * gapX;
        const startX = (width - totalW) / 2 + cardW / 2;
        const cardY = height / 2 + 10;

        for (let i = 0; i < this._choices.length; i++) {
            const mod = this._choices[i];
            const cx = startX + i * (cardW + gapX);
            this._createCard(cx, cardY, cardW, cardH, mod, i + 1);
        }

        // Skip hint
        const skipHint = scene.add.text(width / 2, cardY + cardH / 2 + 30,
            '[SPACE] or [ESC] to skip — no modifier', {
            fontSize: '11px', color: '#666666', fontFamily: 'monospace'
        }).setOrigin(0.5).setDepth(401);
        this._elements.push(skipHint);

        // Key bindings
        const handler = (event) => {
            if (event.key === '1') { this._select(0); scene.input.keyboard.off('keydown', handler); }
            else if (event.key === '2') { this._select(1); scene.input.keyboard.off('keydown', handler); }
            else if (event.key === '3') { this._select(2); scene.input.keyboard.off('keydown', handler); }
            else if (event.code === 'Space' || event.code === 'Escape') {
                this._skip();
                scene.input.keyboard.off('keydown', handler);
            }
        };
        scene.input.keyboard.on('keydown', handler);
        this._handler = handler;
    }

    _pickModifiers() {
        // Ensure at least one from each tier
        const hard   = RUN_MODIFIERS.filter(m => m.tier === 'hard');
        const medium = RUN_MODIFIERS.filter(m => m.tier === 'medium');
        const easy   = RUN_MODIFIERS.filter(m => m.tier === 'easy');

        const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
        const h = pick(hard);
        const m = pick(medium);
        const e = pick(easy);

        // Shuffle order
        const choices = [h, m, e];
        for (let i = choices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [choices[i], choices[j]] = [choices[j], choices[i]];
        }
        return choices;
    }

    _createCard(cx, cy, w, h, mod, keyNum) {
        const scene = this.scene;
        const tierColors = { hard: 0xFF4444, medium: 0xFFAA00, easy: 0x44FF44 };
        const tierStrs   = { hard: '#FF4444', medium: '#FFAA00', easy: '#44FF44' };
        const borderColor = tierColors[mod.tier] || 0x888888;
        const tierStr     = tierStrs[mod.tier]   || '#888888';

        // Card bg
        const bg = scene.add.rectangle(cx, cy, w, h, 0x111122)
            .setStrokeStyle(2, borderColor).setDepth(402);
        this._elements.push(bg);

        // Key label
        const keyLabel = scene.add.text(cx, cy - h / 2 + 12, `[${keyNum}]`, {
            fontSize: '13px', color: '#FFCC00', fontFamily: 'monospace', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(403);
        this._elements.push(keyLabel);

        // Icon
        const icon = scene.add.text(cx, cy - h / 2 + 38, mod.icon, {
            fontSize: '26px'
        }).setOrigin(0.5).setDepth(403);
        this._elements.push(icon);

        // Tier badge
        const tierBadge = scene.add.text(cx, cy - h / 2 + 68, mod.tier.toUpperCase(), {
            fontSize: '9px', color: tierStr, fontFamily: 'monospace', fontStyle: 'bold',
            backgroundColor: '#00000066', padding: { x: 4, y: 2 }
        }).setOrigin(0.5).setDepth(403);
        this._elements.push(tierBadge);

        // Name
        const name = scene.add.text(cx, cy - h / 2 + 86, mod.name, {
            fontSize: '14px', color: '#FFFFFF', fontFamily: 'monospace', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(403);
        this._elements.push(name);

        // Desc
        const desc = scene.add.text(cx, cy - h / 2 + 106, mod.desc, {
            fontSize: '11px', color: '#AAAAAA', fontFamily: 'monospace',
            wordWrap: { width: w - 16 }, align: 'center'
        }).setOrigin(0.5, 0).setDepth(403);
        this._elements.push(desc);

        // Reward
        const reward = scene.add.text(cx, cy + h / 2 - 16, `+${mod.reward} elixir on clear`, {
            fontSize: '10px', color: '#00FFCC', fontFamily: 'monospace'
        }).setOrigin(0.5).setDepth(403);
        this._elements.push(reward);
    }

    _select(index) {
        const mod = this._choices[index];
        RunModifier.set(mod);
        this._dismiss();
        this._onSelected();
    }

    _skip() {
        RunModifier.clear();
        this._dismiss();
        this._onSelected();
    }

    _dismiss() {
        for (const el of this._elements) {
            if (el && el.active) el.destroy();
        }
        this._elements = [];
    }
}
