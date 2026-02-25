import Phaser from 'phaser';
import { CLASS_DEFS } from '../systems/ClassDefs.js';
import { CLASS_MASTERIES, MASTERY_RANK_COSTS } from '../systems/ClassMasteries.js';
import { MetaProgression, ALL_CLASS_IDS } from '../systems/MetaProgression.js';

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
        this._returnScene = data.returnScene || 'ClassSelect';
    }

    create() {
        const { width, height } = this.scale;
        const classDef = CLASS_DEFS[this._classId];
        const masteries = CLASS_MASTERIES[this._classId];
        if (!classDef || !masteries) {
            this.scene.start('ClassSelect');
            return;
        }

        this.cameras.main.fadeIn(350, 0, 0, 0);

        this._selectedIdx = 0;
        this._masteries = masteries;
        this._rows = [];

        const colorNum = classDef.color;
        const colorStr = '#' + colorNum.toString(16).padStart(6, '0');

        // Background
        this.add.rectangle(0, 0, width, height, 0x0A0A1E).setOrigin(0, 0);

        // Title (with prestige stars)
        const _pStars = MetaProgression.prestigeCount > 0 ? '  ' + '★'.repeat(MetaProgression.prestigeCount) : '';
        this.add.text(width / 2, 14, `${classDef.className.toUpperCase()} MASTERIES${_pStars}`, {
            fontSize: '20px', color: colorStr, fontFamily: 'monospace', fontStyle: 'bold'
        }).setOrigin(0.5);

        // Elixir display
        this._elixirText = this.add.text(width / 2, 34, '', {
            fontSize: '12px', color: '#88DDFF', fontFamily: 'monospace'
        }).setOrigin(0.5);

        // Total mastery ranks
        this._totalText = this.add.text(width / 2, 48, '', {
            fontSize: '11px', color: '#888800', fontFamily: 'monospace'
        }).setOrigin(0.5);

        // ─── Class Attacks Info (two boxes) ───
        const attackY = 62;
        const boxW = 220;
        const boxH = 36;
        const boxGap = 16;
        const qInfo = this._getQAttackParts(classDef);
        const sInfo = this._getSAbilityParts(classDef);

        // Q attack box (left)
        const qBoxX = width / 2 - boxW / 2 - boxGap / 2;
        this.add.rectangle(qBoxX, attackY + boxH / 2, boxW, boxH, 0x1A1A2E)
            .setStrokeStyle(1, 0x444466);
        this.add.text(qBoxX, attackY + 4, `[Q]  ${qInfo.name}`, {
            fontSize: '12px', color: '#FF4444', fontFamily: 'monospace', fontStyle: 'bold'
        }).setOrigin(0.5, 0);
        this.add.text(qBoxX, attackY + 20, qInfo.desc, {
            fontSize: '10px', color: '#AAAAAA', fontFamily: 'monospace'
        }).setOrigin(0.5, 0);

        // S ability box (right)
        const sBoxX = width / 2 + boxW / 2 + boxGap / 2;
        this.add.rectangle(sBoxX, attackY + boxH / 2, boxW, boxH, 0x1A1A2E)
            .setStrokeStyle(1, 0x444466);
        this.add.text(sBoxX, attackY + 4, `[S]  ${sInfo.name}`, {
            fontSize: '12px', color: '#44AAFF', fontFamily: 'monospace', fontStyle: 'bold'
        }).setOrigin(0.5, 0);
        this.add.text(sBoxX, attackY + 20, sInfo.desc, {
            fontSize: '10px', color: '#AAAAAA', fontFamily: 'monospace'
        }).setOrigin(0.5, 0);

        // A/D class nav hint
        this.add.text(width / 2, attackY + boxH + 6, `\u25C0 [A] Prev Class     [D] Next Class \u25B6`, {
            fontSize: '9px', color: '#555555', fontFamily: 'monospace'
        }).setOrigin(0.5);

        // Build mastery rows
        const startY = attackY + boxH + 22;
        const rowH = 76;
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
            const descText = this.add.text(leftX + 24, y + 18, mastery.description, {
                fontSize: '10px', color: '#888888', fontFamily: 'monospace'
            });

            // Current effect
            const effectText = this.add.text(leftX + 24, y + 32, '', {
                fontSize: '11px', color: '#AADDAA', fontFamily: 'monospace'
            });

            // Next rank info (cost + effect)
            const nextText = this.add.text(leftX + 24, y + 46, '', {
                fontSize: '11px', color: '#FF8800', fontFamily: 'monospace'
            });

            this._rows.push({ highlight, nameText, starsText, descText, effectText, nextText, mastery });
        }

        // Feedback text (for purchase success/failure)
        this._feedbackText = this.add.text(width / 2, height - 48, '', {
            fontSize: '12px', color: '#44FF44', fontFamily: 'monospace'
        }).setOrigin(0.5);

        // Controls hint
        this.add.text(width / 2, height - 16, '[W/S] Navigate   [1-5] Select   [U] Upgrade   [A/D] Switch Class   [ESC] Back', {
            fontSize: '10px', color: '#555555', fontFamily: 'monospace'
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
                case 'KeyW':
                    this._selectedIdx = Math.max(0, this._selectedIdx - 1);
                    this._updateSelection();
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    this._selectedIdx = Math.min(this._masteries.length - 1, this._selectedIdx + 1);
                    this._updateSelection();
                    break;
                case 'ArrowLeft':
                case 'KeyA':
                    this._switchClass(-1);
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    this._switchClass(1);
                    break;
                case 'KeyU':
                    this._tryUpgrade();
                    break;
                case 'Escape':
                    this.input.keyboard.removeAllListeners();
                    this.cameras.main.fadeOut(350, 0, 0, 0);
                    this.cameras.main.once('camerafadeoutcomplete', () => {
                        if (this._returnScene === 'Level1') {
                            this.scene.stop('ClassMasteryScene');
                            this.scene.resume('Level1');
                        } else {
                            this.scene.start(this._returnScene);
                        }
                    });
                    break;
            }
        });
    }

    // ─── Attack Info Helpers ───

    _getQAttackParts(classDef) {
        if (!classDef.attackType) return { name: 'None', desc: 'No Q attack' };
        const cd = (classDef.attackCooldown / 1000).toFixed(0) + 's CD';
        const name = classDef.attackName || 'Attack';
        switch (classDef.attackType) {
            case 'aoe_banish':
                return { name, desc: `AoE banish ${classDef.attackRadius}px (${cd})` };
            case 'frontal_banish':
                return { name, desc: `Frontal banish ${classDef.attackRadius}px (${cd})` };
            case 'knockback':
                return { name, desc: `Knockback ${classDef.pushDistance}px (${cd})` };
            case 'shield':
                return { name, desc: `Shield ${(classDef.shieldDuration / 1000).toFixed(0)}s (${cd})` };
            case 'heal':
                return { name, desc: `Heal +${classDef.healAmount} flame (${cd})` };
            case 'melee_banish':
                return { name, desc: `Melee banish ${classDef.attackRadius || 100}px (${cd})` };
            case 'screen_stun':
                return { name, desc: `Stun all on-screen (${cd})` };
            case 'blink':
                return { name, desc: `Blink ${classDef.blinkDistance}px (${cd})` };
            case 'dual_strike':
                return { name, desc: `Two-hit frontal ${classDef.attackRadius}px (${cd})` };
            case 'flame_projectile':
                return { name, desc: `Fireball ${classDef.projectileRadius}px (${cd})` };
            default:
                return { name, desc: `${cd}` };
        }
    }

    _getSAbilityParts(classDef) {
        const sa = classDef.sAbility;
        if (!sa) return { name: 'Ground Slam', desc: 'Stun nearby enemies' };
        switch (sa.type) {
            case 'ground_slam':
                return { name: 'Ground Slam', desc: 'Stun nearby enemies' };
            case 'earthshatter':
                return { name: 'Earthshatter', desc: `Knockback ${sa.radius}px` };
            case 'arcane_mine':
                return { name: 'Arcane Mine', desc: `Delayed AoE ${sa.radius}px` };
            case 'arrow_rain':
                return { name: 'Arrow Rain', desc: `Stun ${sa.width}px wide` };
            case 'fortress_drop':
                return { name: 'Fortress Drop', desc: `Barrier ${(sa.barrierDuration / 1000).toFixed(1)}s` };
            case 'purifying_landing':
                return { name: 'Purifying Landing', desc: `Heal ${sa.healPerSec}/s for ${(sa.duration / 1000).toFixed(0)}s` };
            case 'shadow_dive':
                return { name: 'Shadow Dive', desc: `Invis ${(sa.invisDuration / 1000).toFixed(1)}s` };
            case 'staff_pogo':
                return { name: 'Staff Pogo', desc: `Bounce + stun ${(sa.stunDuration / 1000).toFixed(1)}s` };
            case 'piercing_thrust':
                return { name: 'Piercing Thrust', desc: `Stun ${(sa.stunDuration / 1000).toFixed(1)}s` };
            case 'meteor_drop':
                return { name: 'Meteor Drop', desc: `Fire zone ${sa.width}px, ${(sa.duration / 1000).toFixed(1)}s` };
            default:
                return { name: sa.type, desc: '' };
        }
    }

    // ─── Class Switching ───

    _switchClass(dir) {
        // Build list of unlocked class IDs
        const unlocked = ALL_CLASS_IDS.filter(id => MetaProgression.isClassUnlocked(id));
        if (unlocked.length <= 1) return;

        const curIdx = unlocked.indexOf(this._classId);
        if (curIdx < 0) return;

        let nextIdx = curIdx + dir;
        if (nextIdx < 0) nextIdx = unlocked.length - 1;
        if (nextIdx >= unlocked.length) nextIdx = 0;

        this.input.keyboard.removeAllListeners();
        this.scene.restart({ classId: unlocked[nextIdx] });
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
