import Phaser from 'phaser';
import { CLASS_DEFS } from '../systems/ClassDefs.js';
import { CLASS_MASTERIES, MASTERY_RANK_COSTS } from '../systems/ClassMasteries.js';
import { MetaProgression } from '../systems/MetaProgression.js';

const MAX_RANK = MASTERY_RANK_COSTS.length; // 3

/**
 * ClassMasteryScene — persistent class-specific upgrades purchasable outside of gameplay.
 * Launched from ClassSelect via [M] key.
 */
export class ClassMasteryScene extends Phaser.Scene {
    constructor() {
        super('ClassMasteryScene');
    }

    init(data) {
        this._classId = data.classId || 'adventurer';
    }

    create() {
        const { width, height } = this.scale;
        const classDef = CLASS_DEFS[this._classId];
        const masteries = CLASS_MASTERIES[this._classId];
        if (!classDef || !masteries) {
            this.scene.start('ClassSelect');
            return;
        }

        this._selectedIdx = 0;
        this._masteries = masteries;
        this._rows = [];

        const colorNum = classDef.color;
        const colorStr = '#' + colorNum.toString(16).padStart(6, '0');

        // Background
        this.add.rectangle(0, 0, width, height, 0x0A0A1E).setOrigin(0, 0);

        // Title
        this.add.text(width / 2, 18, `${classDef.className.toUpperCase()} MASTERIES`, {
            fontSize: '20px', color: colorStr, fontFamily: 'monospace', fontStyle: 'bold'
        }).setOrigin(0.5);

        // Elixir display
        this._elixirText = this.add.text(width / 2, 40, '', {
            fontSize: '12px', color: '#88DDFF', fontFamily: 'monospace'
        }).setOrigin(0.5);

        // Total mastery ranks
        this._totalText = this.add.text(width / 2, 54, '', {
            fontSize: '11px', color: '#888800', fontFamily: 'monospace'
        }).setOrigin(0.5);

        // Build mastery rows
        const startY = 78;
        const rowH = 82;
        const rowW = Math.min(600, width - 40);
        const leftX = (width - rowW) / 2;

        for (let i = 0; i < masteries.length; i++) {
            const mastery = masteries[i];
            const y = startY + i * rowH;

            // Selection highlight
            const highlight = this.add.rectangle(width / 2, y + rowH / 2 - 4, rowW + 8, rowH - 4, colorNum, 0.08)
                .setStrokeStyle(2, colorNum).setVisible(false);

            // Index number
            this.add.text(leftX, y + 2, `${i + 1}.`, {
                fontSize: '13px', color: '#666666', fontFamily: 'monospace'
            });

            // Name
            const nameText = this.add.text(leftX + 24, y + 2, mastery.name, {
                fontSize: '13px', color: '#FFFFFF', fontFamily: 'monospace', fontStyle: 'bold'
            });

            // Stars (rank display)
            const starsText = this.add.text(leftX + 24 + 180, y + 2, '', {
                fontSize: '13px', color: '#FFCC00', fontFamily: 'monospace'
            });

            // Description
            const descText = this.add.text(leftX + 24, y + 20, mastery.description, {
                fontSize: '10px', color: '#888888', fontFamily: 'monospace'
            });

            // Current effect
            const effectText = this.add.text(leftX + 24, y + 36, '', {
                fontSize: '11px', color: '#AADDAA', fontFamily: 'monospace'
            });

            // Next rank info (cost + effect)
            const nextText = this.add.text(leftX + 24, y + 52, '', {
                fontSize: '11px', color: '#FF8800', fontFamily: 'monospace'
            });

            this._rows.push({ highlight, nameText, starsText, descText, effectText, nextText, mastery });
        }

        // Feedback text (for purchase success/failure)
        this._feedbackText = this.add.text(width / 2, height - 48, '', {
            fontSize: '12px', color: '#44FF44', fontFamily: 'monospace'
        }).setOrigin(0.5);

        // Controls hint
        this.add.text(width / 2, height - 16, '[1-5] Select   [U] Upgrade   [ESC] Back', {
            fontSize: '11px', color: '#555555', fontFamily: 'monospace'
        }).setOrigin(0.5);

        this._refreshAll();

        // Keyboard input
        this.input.keyboard.on('keydown', (event) => {
            const key = event.key;
            if (key >= '1' && key <= '5') {
                const idx = parseInt(key) - 1;
                if (idx < this._masteries.length) {
                    this._selectedIdx = idx;
                    this._updateSelection();
                }
                return;
            }
            switch (event.code) {
                case 'ArrowUp':
                    this._selectedIdx = Math.max(0, this._selectedIdx - 1);
                    this._updateSelection();
                    break;
                case 'ArrowDown':
                    this._selectedIdx = Math.min(this._masteries.length - 1, this._selectedIdx + 1);
                    this._updateSelection();
                    break;
                case 'KeyU':
                    this._tryUpgrade();
                    break;
                case 'Escape':
                    this.input.keyboard.removeAllListeners();
                    this.scene.start('ClassSelect');
                    break;
            }
        });
    }

    _refreshAll() {
        // Update elixir display
        const avail = MetaProgression.getAvailableElixir();
        this._elixirText.setText(`Available Elixir: ${avail}`);

        // Update total mastery ranks
        const totalRanks = MetaProgression.getTotalMasteryRanks(this._classId);
        this._totalText.setText(`${totalRanks} / ${this._masteries.length * MAX_RANK} mastery ranks`);

        // Update each row
        for (let i = 0; i < this._rows.length; i++) {
            const row = this._rows[i];
            const mastery = row.mastery;
            const rank = MetaProgression.getMasteryRank(this._classId, mastery.id);

            // Stars: filled for owned ranks, empty for unowned
            let stars = '';
            for (let r = 0; r < MAX_RANK; r++) {
                stars += r < rank ? '\u2605' : '\u2606';
            }
            row.starsText.setText(stars);

            // Current effect
            if (rank > 0) {
                row.effectText.setText(`Current: ${mastery.ranks[rank - 1].label}`);
                row.effectText.setColor('#AADDAA');
            } else {
                row.effectText.setText('Not yet purchased');
                row.effectText.setColor('#666666');
            }

            // Next rank info
            if (rank >= MAX_RANK) {
                row.nextText.setText('MAXED');
                row.nextText.setColor('#FFCC00');
            } else {
                const nextRank = mastery.ranks[rank];
                const cost = nextRank.cost;
                const canAfford = MetaProgression.getAvailableElixir() >= cost;
                row.nextText.setText(`Next: ${nextRank.label}  (${cost} elixir)`);
                row.nextText.setColor(canAfford ? '#FF8800' : '#FF4444');
            }
        }

        this._updateSelection();
    }

    _updateSelection() {
        for (let i = 0; i < this._rows.length; i++) {
            this._rows[i].highlight.setVisible(i === this._selectedIdx);
        }
    }

    _tryUpgrade() {
        const mastery = this._masteries[this._selectedIdx];
        if (!mastery) return;

        const rank = MetaProgression.getMasteryRank(this._classId, mastery.id);
        if (rank >= MAX_RANK) {
            this._showFeedback('Already maxed!', '#FFCC00');
            return;
        }

        const success = MetaProgression.upgradeMastery(this._classId, mastery.id);
        if (success) {
            const newRank = MetaProgression.getMasteryRank(this._classId, mastery.id);
            this._showFeedback(`${mastery.name} upgraded to rank ${newRank}!`, '#44FF44');
            this._refreshAll();
        } else {
            this._showFeedback('Not enough elixir!', '#FF4444');
        }
    }

    _showFeedback(msg, color) {
        this._feedbackText.setText(msg).setColor(color).setAlpha(1);
        this.tweens.killTweensOf(this._feedbackText);
        this.tweens.add({
            targets: this._feedbackText,
            alpha: 0,
            duration: 2000,
            delay: 800,
        });
    }
}
