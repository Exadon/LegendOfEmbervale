import Phaser from 'phaser';
import { LORE_ENTRIES } from '../constants.js';

const STORAGE_KEY = 'elixirs-shadow-lore-collected';
const ENTRIES_PER_PAGE = 6;

export class LoreCompendium {
    constructor(scene) {
        this.scene = scene;
        this.active = false;
        this._elements = [];
        this._keyHandler = null;
        this._page = 0;
        this._totalPages = Math.ceil(LORE_ENTRIES.length / ENTRIES_PER_PAGE);
    }

    /** Convert desired screen position to zoom-adjusted object coords for scrollFactor(0) */
    _uiXY(sx, sy) {
        const z = this.scene.cameras.main.zoom;
        const cx = this.scene.scale.width / 2;
        const cy = this.scene.scale.height / 2;
        return { x: (sx - cx) / z + cx, y: (sy - cy) / z + cy };
    }

    /** Get the persistent set of collected lore indices from localStorage */
    static getCollected() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) return new Set(JSON.parse(raw));
        } catch {}
        return new Set();
    }

    /** Save a lore index to the persistent collection */
    static addCollected(index) {
        const set = LoreCompendium.getCollected();
        set.add(index);
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
        } catch {}
    }

    /** Get total count of collected lore (lifetime) */
    static getCollectedCount() {
        return LoreCompendium.getCollected().size;
    }

    show() {
        if (this.active) return;
        this.active = true;
        this._page = 0;

        this.scene.physics.pause();
        this._render();

        this._keyHandler = (event) => {
            if (!this.active) return;
            if (event.key === 'Escape') {
                this.hide();
            } else if (event.key === 'w' || event.key === 'W' || event.key === 'ArrowUp') {
                if (this._page > 0) {
                    this._page--;
                    this._clearElements();
                    this._render();
                }
            } else if (event.key === 's' || event.key === 'S' || event.key === 'ArrowDown') {
                if (this._page < this._totalPages - 1) {
                    this._page++;
                    this._clearElements();
                    this._render();
                }
            }
        };
        this.scene.input.keyboard.on('keydown', this._keyHandler);
    }

    _render() {
        const { width, height } = this.scene.scale;
        const zoom = this.scene.cameras.main.zoom;
        const s = 1 / zoom;
        const collected = LoreCompendium.getCollected();
        const total = LORE_ENTRIES.length;
        const found = collected.size;

        // Helper to create scaled text
        const _text = (sx, sy, text, style, origin = 0.5) => {
            const p = this._uiXY(sx, sy);
            const t = this.scene.add.text(p.x, p.y, text, {
                fontFamily: 'monospace', ...style
            }).setOrigin(typeof origin === 'number' ? origin : origin[0], typeof origin === 'number' ? origin : origin[1])
                .setScrollFactor(0).setDepth(311).setScale(s);
            this._elements.push(t);
            return t;
        };

        // Dark backdrop
        const bg = this.scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.85)
            .setScrollFactor(0).setDepth(310);
        this._elements.push(bg);

        // Title
        _text(width / 2, Math.round(height * 0.06), 'LORE COMPENDIUM', {
            fontSize: '24px', color: '#D4A04A', fontStyle: 'bold'
        });

        // Progress counter
        const progressColor = found >= total ? '#44FF44' : '#AAAAAA';
        _text(width / 2, Math.round(height * 0.11), `${found}/${total} scrolls found`, {
            fontSize: '13px', color: progressColor
        });

        // Divider
        const dp = this._uiXY(width / 2, Math.round(height * 0.14));
        const divider = this.scene.add.rectangle(dp.x, dp.y, 500 * s, 1, 0x666666)
            .setScrollFactor(0).setDepth(311);
        this._elements.push(divider);

        // Entries for current page
        const startIdx = this._page * ENTRIES_PER_PAGE;
        const endIdx = Math.min(startIdx + ENTRIES_PER_PAGE, total);
        let yPercent = 0.18;

        for (let i = startIdx; i < endIdx; i++) {
            const entry = LORE_ENTRIES[i];
            const isCollected = collected.has(i);
            const entryY = Math.round(height * yPercent);

            // Entry number
            _text(width / 2 - 230, entryY, `#${i + 1}`, {
                fontSize: '10px', color: '#555555'
            }, 0);

            if (isCollected) {
                // Author (gold)
                _text(width / 2 - 200, entryY, entry.author, {
                    fontSize: '12px', color: '#D4A04A', fontStyle: 'bold'
                }, 0);

                // Quote text (white, word-wrapped)
                const qp = this._uiXY(width / 2 - 200, entryY + 18);
                const quote = this.scene.add.text(qp.x, qp.y, `"${entry.text}"`, {
                    fontSize: '11px', color: '#CCCCCC', fontFamily: 'monospace',
                    wordWrap: { width: 440 / s }, lineSpacing: 2
                }).setOrigin(0, 0).setScrollFactor(0).setDepth(311).setScale(s);
                this._elements.push(quote);
            } else {
                // Author (gray)
                _text(width / 2 - 200, entryY, '???', {
                    fontSize: '12px', color: '#444444', fontStyle: 'italic'
                }, 0);

                // Placeholder
                _text(width / 2 - 200, entryY + 18, 'Undiscovered lore scroll...', {
                    fontSize: '11px', color: '#333333', fontStyle: 'italic'
                }, 0);
            }

            // Entry divider
            const edp = this._uiXY(width / 2, entryY + 50);
            const eDivider = this.scene.add.rectangle(edp.x, edp.y, 440 * s, 1, 0x333333)
                .setScrollFactor(0).setDepth(311);
            this._elements.push(eDivider);

            yPercent += 0.115;
        }

        // Page indicator
        _text(width / 2, Math.round(height * 0.89), `Page ${this._page + 1} / ${this._totalPages}`, {
            fontSize: '12px', color: '#888888'
        });

        // Navigation hints
        _text(width / 2, Math.round(height * 0.93), '[W/\u2191] Previous    [S/\u2193] Next    [ESC] Close', {
            fontSize: '12px', color: '#FFCC00'
        });

        // Pulse close hint
        const closeHint = this._elements[this._elements.length - 1];
        this.scene.tweens.add({
            targets: closeHint,
            alpha: { from: 1, to: 0.3 },
            duration: 800,
            yoyo: true,
            repeat: -1
        });
    }

    _clearElements() {
        for (const el of this._elements) {
            if (el && el.active) {
                this.scene.tweens.killTweensOf(el);
                el.destroy();
            }
        }
        this._elements = [];
    }

    hide() {
        if (!this.active) return;

        if (this._keyHandler) {
            this.scene.input.keyboard.off('keydown', this._keyHandler);
            this._keyHandler = null;
        }

        this._clearElements();
        this.scene.physics.resume();
        this.active = false;
    }
}
