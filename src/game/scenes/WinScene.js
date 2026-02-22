import Phaser from 'phaser';
import { ENDING_NARRATIVE } from '../constants.js';
import { MusicManager } from '../systems/MusicManager.js';

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

        // Auto-advance after 3s; also [SPACE] advances immediately
        this._autoAdvanceTimer = this.time.delayedCall(3000, () => {
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

        const lines = [
            '',
            '+100 ELIXIR REWARDED',
            '',
            `Distance:  ${distM.toLocaleString()}m`,
            `Kills:     ${kills}`,
            `Time:      ${mins}:${secs}`,
            `Relics:    ${relicCount}`,
            '',
            'Achievement Unlocked: Flameborn Legend',
            '',
        ];

        const summaryText = this.add.text(width / 2, height * 0.35, lines.join('\n'), {
            fontSize: '14px',
            color: '#CCCCCC',
            fontFamily: 'monospace',
            align: 'center',
        }).setOrigin(0.5).setAlpha(0);

        const returnHint = this.add.text(width / 2, height * 0.78, '[SPACE] Return to Menu', {
            fontSize: '15px',
            color: '#FFCC00',
            fontFamily: 'monospace',
        }).setOrigin(0.5).setAlpha(0);

        this.tweens.add({ targets: [summaryText, returnHint], alpha: 1, duration: 800, ease: 'Power1' });
        this.tweens.add({ targets: returnHint, alpha: { from: 1, to: 0.3 }, duration: 800, yoyo: true, repeat: -1, delay: 1000 });

        this.input.keyboard.once('keydown-SPACE', () => {
            MusicManager.stopAll();
            this.cameras.main.fadeOut(800, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('MainMenu');
            });
        });
    }
}
