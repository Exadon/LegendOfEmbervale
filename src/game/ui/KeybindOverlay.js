import { Settings } from '../systems/Settings.js';
import { DEFAULT_KEYBINDS } from '../systems/InputManager.js';

const ACTION_LABELS = {
    left: 'Move Left', right: 'Move Right', up: 'Move Up', down: 'Move Down / Slam',
    jump: 'Jump', dash: 'Flame Step', flameBurst: 'Flame Burst', classAttack: 'Class Attack',
    mine: 'Mine', lore: 'Lore Compendium', pause: 'Pause', interact: 'Interact',
    sAbility: 'S Ability',
};

const ACTIONS = Object.keys(ACTION_LABELS);

export class KeybindOverlay {
    constructor(scene) {
        this.scene = scene;
        this.active = false;
        this._elements = [];
        this._selectedIdx = 0;
        this._listening = false;
        this._listenerKey = null;
    }

    show() {
        if (this.active) return;
        this.active = true;
        this._selectedIdx = 0;
        this._listening = false;
        this._render();
        this._bindKeys();
    }

    hide() {
        if (!this.active) return;
        this.active = false;
        this._cleanup();
    }

    _render() {
        for (const el of this._elements) { if (el && el.active) el.destroy(); }
        this._elements = [];

        const s = this.scene;
        const { width, height } = s.scale;
        const keybinds = { ...DEFAULT_KEYBINDS, ...(Settings.data.keybinds || {}) };

        // Backdrop
        const bg = s.add.rectangle(width / 2, height / 2, width * 0.7, height * 0.85, 0x0A0A1E, 0.95)
            .setScrollFactor(0).setDepth(400).setStrokeStyle(2, 0x4488AA);
        this._elements.push(bg);

        // Title
        const title = s.add.text(width / 2, height * 0.1, 'KEY BINDINGS', {
            fontSize: '18px', color: '#FFCC00', fontFamily: 'monospace', fontStyle: 'bold',
        }).setOrigin(0.5).setScrollFactor(0).setDepth(401);
        this._elements.push(title);

        const hint = s.add.text(width / 2, height * 0.88,
            '[↑↓] Navigate   [ENTER] Rebind   [R] Reset All   [ESC] Close', {
            fontSize: '10px', color: '#666666', fontFamily: 'monospace',
        }).setOrigin(0.5).setScrollFactor(0).setDepth(401);
        this._elements.push(hint);

        const startY = height * 0.18;
        const rowH = (height * 0.65) / ACTIONS.length;

        ACTIONS.forEach((action, i) => {
            const isSelected = i === this._selectedIdx;
            const isListening = isSelected && this._listening;
            const curKey = keybinds[action] || DEFAULT_KEYBINDS[action] || '?';
            const label = ACTION_LABELS[action] || action;

            const rowBg = s.add.rectangle(width / 2, startY + i * rowH, width * 0.6, rowH - 2,
                isSelected ? 0x225588 : 0x111122, isSelected ? 0.7 : 0.4)
                .setScrollFactor(0).setDepth(401).setOrigin(0.5);
            this._elements.push(rowBg);

            const actionText = s.add.text(width / 2 - width * 0.22, startY + i * rowH, label, {
                fontSize: '12px', color: isSelected ? '#FFFFFF' : '#AAAAAA', fontFamily: 'monospace',
            }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(402);
            this._elements.push(actionText);

            const keyText = s.add.text(width / 2 + width * 0.14, startY + i * rowH,
                isListening ? '>>> PRESS KEY <<<' : curKey, {
                fontSize: '12px',
                color: isListening ? '#FF6600' : (isSelected ? '#FFCC00' : '#88CCFF'),
                fontFamily: 'monospace',
            }).setOrigin(1, 0.5).setScrollFactor(0).setDepth(402);
            this._elements.push(keyText);
        });
    }

    _bindKeys() {
        if (this._listenerKey) {
            this.scene.input.keyboard.off('keydown', this._listenerKey);
        }
        this._listenerKey = (evt) => this._handleKey(evt);
        this.scene.input.keyboard.on('keydown', this._listenerKey);
    }

    _handleKey(evt) {
        if (!this.active) return;

        if (this._listening) {
            // Record the new binding
            const newCode = evt.key.toUpperCase() === ' ' ? 'SPACE' : evt.code.replace('Key', '').replace('Arrow', '').replace('Digit', '');
            const action = ACTIONS[this._selectedIdx];
            if (!Settings.data.keybinds) Settings.data.keybinds = {};
            Settings.data.keybinds[action] = newCode;
            Settings.save();
            if (this.scene.inputManager) this.scene.inputManager.refreshKeys();
            this._listening = false;
            this._render();
            return;
        }

        switch (evt.code) {
            case 'ArrowUp': case 'KeyW':
                this._selectedIdx = Math.max(0, this._selectedIdx - 1);
                this._render();
                break;
            case 'ArrowDown': case 'KeyS':
                this._selectedIdx = Math.min(ACTIONS.length - 1, this._selectedIdx + 1);
                this._render();
                break;
            case 'Enter':
                this._listening = true;
                this._render();
                break;
            case 'KeyR':
                Settings.data.keybinds = {};
                Settings.save();
                if (this.scene.inputManager) this.scene.inputManager.refreshKeys();
                this._render();
                break;
            case 'Escape':
                this.hide();
                break;
        }
    }

    _cleanup() {
        if (this._listenerKey) {
            this.scene.input.keyboard.off('keydown', this._listenerKey);
            this._listenerKey = null;
        }
        for (const el of this._elements) { if (el && el.active) el.destroy(); }
        this._elements = [];
    }
}
