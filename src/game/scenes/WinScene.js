import Phaser from 'phaser';
import { ENDING_NARRATIVE } from '../constants.js';
import { MusicManager } from '../systems/MusicManager.js';
import { MetaProgression } from '../systems/MetaProgression.js';
import { AudioManager } from '../systems/AudioManager.js';

const PATH_TITLES = {
    boss_conquest: 'BOSS CONQUEROR',
    lore_master:   'KEEPER OF TRUTH',
    shroud_conquest: 'SHROUD SLAYER',
};

export class WinScene extends Phaser.Scene {
    constructor() {
        super('WinScene');
    }

    init(data) {
        this.winPath = data.path || 'boss_conquest';
        this.runStats = data.runStats || {};
        this.relicIds = data.relics || [];
    }

    create() {
        const { width, height } = this.scale;

        // Victory stinger
        this._audio = new AudioManager();
        this._audio.init();
        this._audio.playWinStinger();

        // Black background
        this.add.rectangle(0, 0, width, height, 0x000000).setOrigin(0);

        // Ember particles drifting upward
        if (this.textures.exists('pixel')) {
            this.add.particles(0, 0, 'pixel', {
                x: { min: 0, max: width },
                y: height,
                speedY: { min: -60, max: -120 },
                speedX: { min: -20, max: 20 },
                scale: { start: 2, end: 0 },
                alpha: { start: 0.8, end: 0 },
                lifespan: { min: 2000, max: 4000 },
                frequency: 120,
                tint: [0xFF6600, 0xFFAA33, 0xFF8800, 0xFFDD00],
                blendMode: 'ADD',
            }).setDepth(10);
        }

        // Path title card (big, centered, fades in)
        const titleText = PATH_TITLES[this.winPath] || 'LEGEND';
        const title = this.add.text(width / 2, height * 0.18, titleText, {
            fontSize: '38px',
            color: '#FFDD00',
            fontFamily: 'monospace',
            fontStyle: 'bold',
            shadow: { offsetX: 0, offsetY: 0, color: '#FF8800', blur: 16, fill: true },
        }).setOrigin(0.5).setAlpha(0);

        this.tweens.add({ targets: title, alpha: 1, duration: 1000, ease: 'Power2' });

        // Narrative cycle
        this._narrativeIndex = 0;
        this._narrativeElements = [];
        this._showNarrative(width, height, title);
    }

    _showNarrative(width, height, title) {
        // Clear previous narrative elements
        for (const el of this._narrativeElements) {
            if (el && el.active) el.destroy();
        }
        this._narrativeElements = [];

        const entry = ENDING_NARRATIVE[this._narrativeIndex];
        if (!entry) {
            this._showSummary(width, height, title);
            return;
        }

        // Narrative title
        const ntitle = this.add.text(width / 2, height * 0.32, entry.title, {
            fontSize: '20px',
            color: '#FF8833',
            fontFamily: 'monospace',
            fontStyle: 'bold',
        }).setOrigin(0.5).setAlpha(0);
        this._narrativeElements.push(ntitle);

        // Narrative text
        const ntext = this.add.text(width / 2, height * 0.42, entry.text, {
            fontSize: '13px',
            color: '#CCCCCC',
            fontFamily: 'monospace',
            wordWrap: { width: width * 0.75 },
            align: 'center',
        }).setOrigin(0.5).setAlpha(0);
        this._narrativeElements.push(ntext);

        // Progress indicator
        const progress = this.add.text(width / 2, height * 0.72,
            `${this._narrativeIndex + 1} / ${ENDING_NARRATIVE.length}`, {
            fontSize: '11px',
            color: '#666666',
            fontFamily: 'monospace',
        }).setOrigin(0.5).setAlpha(0);
        this._narrativeElements.push(progress);

        // Advance hint
        const hint = this.add.text(width / 2, height * 0.78, '[SPACE] Continue', {
            fontSize: '13px',
            color: '#FF6600',
            fontFamily: 'monospace',
        }).setOrigin(0.5).setAlpha(0);
        this._narrativeElements.push(hint);

        // Fade in all
        this.tweens.add({
            targets: [ntitle, ntext, progress, hint],
            alpha: 1,
            duration: 600,
            ease: 'Power1',
        });

        // Pulse the hint
        this.tweens.add({
            targets: hint,
            alpha: { from: 1, to: 0.3 },
            duration: 700,
            yoyo: true,
            repeat: -1,
            delay: 800,
        });

        // Auto-advance after 4.5s; also [SPACE] advances immediately
        this._autoAdvanceTimer = this.time.delayedCall(4500, () => {
            this._advanceNarrative(width, height, title);
        });

        if (this._spaceKey) this._spaceKey.destroy();
        this._spaceKey = this.input.keyboard.once('keydown-SPACE', () => {
            if (this._autoAdvanceTimer) { this._autoAdvanceTimer.destroy(); this._autoAdvanceTimer = null; }
            this._advanceNarrative(width, height, title);
        });
    }

    _advanceNarrative(width, height, title) {
        // Fade out current narrative
        this.tweens.add({
            targets: this._narrativeElements,
            alpha: 0,
            duration: 400,
            onComplete: () => {
                this._narrativeIndex++;
                this._showNarrative(width, height, title);
            }
        });
    }

    _showSummary(width, height, title) {
        const stats = this.runStats;
        const distM = Math.round(stats.distanceMeters || 0);
        const kills = stats.enemiesBanished || 0;
        const mins = Math.floor((stats.survivalTime || 0) / 60);
        const secs = String(Math.floor((stats.survivalTime || 0) % 60)).padStart(2, '0');
        const relicCount = this.relicIds.length;

        const cx = width / 2;
        const base = height * 0.32;
        const lh = 26;
        const _t = (dy, msg, col, sz = '14px') =>
            this.add.text(cx, base + dy, msg, {
                fontSize: sz, color: col, fontFamily: 'monospace', align: 'center'
            }).setOrigin(0.5).setAlpha(0);

        const statEls = [
            _t(0,        '+100 ELIXIR REWARDED',                        '#FFCC00', '16px'),
            _t(lh * 1.5, `\u25C6 Distance:  ${distM.toLocaleString()}m`, '#FFD700'),
            _t(lh * 2.5, `\u25C6 Kills:     ${kills}`,                   '#FF7777'),
            _t(lh * 3.5, `\u25C6 Time:      ${mins}:${secs}`,            '#88CCFF'),
            _t(lh * 4.5, `\u25C6 Relics:    ${relicCount}`,              '#CC88FF'),
            _t(lh * 6.2, 'Achievement Unlocked: Flameborn Legend \u2605', '#FFD700', '13px'),
        ];

        const returnHint = this.add.text(width / 2, height * 0.78, '[SPACE] Return to Menu', {
            fontSize: '15px',
            color: '#FFCC00',
            fontFamily: 'monospace',
        }).setOrigin(0.5).setAlpha(0);

        this.tweens.add({ targets: [...statEls, returnHint], alpha: 1, duration: 800, ease: 'Power1' });
        this.tweens.add({ targets: returnHint, alpha: { from: 1, to: 0.3 }, duration: 800, yoyo: true, repeat: -1, delay: 1000 });

        // ─── Prestige CTA ───
        const canPrestige = MetaProgression.canPrestige();
        const prestigeCount = MetaProgression.prestigeCount;

        if (canPrestige) {
            const prestigeBlock = this.add.text(width / 2, height * 0.64,
                '\u2605 PRESTIGE AVAILABLE \u2605\n[P] Reset progress — gain a permanent relic', {
                fontSize: '13px',
                color: '#FFD700',
                fontFamily: 'monospace',
                align: 'center',
                wordWrap: { width: width * 0.7 },
            }).setOrigin(0.5).setAlpha(0);

            this.tweens.add({ targets: prestigeBlock, alpha: 1, duration: 800, delay: 500, ease: 'Power1' });
            this.tweens.add({
                targets: prestigeBlock,
                alpha: { from: 1, to: 0.35 },
                duration: 900,
                yoyo: true,
                repeat: -1,
                delay: 1400,
            });

            this.input.keyboard.once('keydown-P', () => {
                MetaProgression.prestige();
                this.tweens.killTweensOf(prestigeBlock);
                prestigeBlock
                    .setText(`\u2605 PRESTIGE ${MetaProgression.prestigeCount} ACTIVATED\nA new relic awaits you...`)
                    .setColor('#FF8800')
                    .setAlpha(1);
            });
        } else if (prestigeCount < 3) {
            this.add.text(width / 2, height * 0.64,
                `Prestige ${prestigeCount + 1}/3 — reach max Flame Altar + 100 elixir to unlock`, {
                fontSize: '11px',
                color: '#444444',
                fontFamily: 'monospace',
                align: 'center',
                wordWrap: { width: width * 0.7 },
            }).setOrigin(0.5);
        }

        this.input.keyboard.once('keydown-SPACE', () => {
            MusicManager.stopAll();
            this.cameras.main.fadeOut(800, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('MainMenu');
            });
        });
    }
}
