import Phaser from 'phaser';
import { GlobalState } from '../GlobalState.js';
import { Settings } from '../systems/Settings.js';
import { MusicManager } from '../systems/MusicManager.js';
import { AchievementManager } from '../systems/AchievementManager.js';
import { RunModifier } from '../systems/RunModifier.js';
import { FlameAltar } from '../systems/FlameAltar.js';
import { MetaProgression, ALL_CLASS_IDS } from '../systems/MetaProgression.js';
import { CLASS_DEFS } from '../systems/ClassDefs.js';
import { DailyRun } from '../systems/DailyRun.js';

export class MainMenu extends Phaser.Scene {
    constructor() {
        super('MainMenu');
    }

    create() {
        const { width, height } = this.scale;
        GlobalState.reset();

        // Pulsing shroud background
        this.shroudBg = this.add.tileSprite(0, 0, width, height, 'shroud_tile')
            .setOrigin(0, 0).setAlpha(0.3);

        this.tweens.add({
            targets: this.shroudBg,
            alpha: { from: 0.2, to: 0.5 },
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Glow layer behind title
        const titleGlow = this.add.text(width / 2, 120, 'Legacy of Embervale', {
            fontSize: '42px',
            color: '#0066CC',
            fontFamily: 'monospace',
            fontStyle: 'bold',
        }).setOrigin(0.5).setAlpha(0.4);

        // Main title
        const title = this.add.text(width / 2, 120, 'Legacy of Embervale', {
            fontSize: '42px',
            color: '#00BFFF',
            fontFamily: 'monospace',
            fontStyle: 'bold',
            shadow: { offsetX: 0, offsetY: 0, color: '#00BFFF', blur: 12, fill: true },
        }).setOrigin(0.5);

        // Sparkle: pulse title between bright cyan and white
        this.tweens.add({
            targets: title,
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
            onUpdate: (tween) => {
                const v = tween.getValue();
                // Interpolate from 0x00BFFF (cyan) toward 0xCCEEFF (bright white-blue)
                const r = Math.round(0x00 + v * (0xCC - 0x00));
                const g = Math.round(0xBF + v * (0xEE - 0xBF));
                const b = Math.round(0xFF);
                title.setColor(`rgb(${r},${g},${b})`);
            },
        });

        // Glow pulse
        this.tweens.add({
            targets: titleGlow,
            alpha: { from: 0.2, to: 0.6 },
            scaleX: { from: 1, to: 1.02 },
            scaleY: { from: 1, to: 1.02 },
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
        });

        // Sparkle particles around the title
        if (this.textures.exists('pixel')) {
            const titleBounds = title.getBounds();
            const sparkles = this.add.particles(0, 0, 'pixel', {
                x: { min: titleBounds.left - 10, max: titleBounds.right + 10 },
                y: { min: titleBounds.top - 5, max: titleBounds.bottom + 5 },
                speed: { min: 5, max: 20 },
                scale: { start: 1.5, end: 0 },
                alpha: { start: 0.9, end: 0 },
                lifespan: { min: 600, max: 1200 },
                frequency: 150,
                tint: [0x00BFFF, 0xCCEEFF, 0x0088FF, 0xFFFFFF],
                blendMode: 'ADD',
            });
            sparkles.setDepth(10);
        }

        // ─── Lore narrative ───
        const loreLines = [
            'The Ancients mined the earth for a wondrous Elixir,',
            'and in doing so, they awoke a slumbering malady —',
            'the Shroud, a devouring fog that consumed Embervale.',
            '',
            'In desperation, the Alchemist Balthazar forged',
            'the Cinder Vault: a Flame\'s soul in a mortal body.',
            '',
            'You are the Flameborn — the last ember of hope.',
            'Awaken. Run. Gather what Elixir remains.',
            'The Shroud follows. It always follows.',
        ];

        const loreY = Math.round(height * 0.20);
        loreLines.forEach((line, i) => {
            const txt = this.add.text(width / 2, loreY + i * 22, line, {
                fontSize: '13px',
                color: line === '' ? '#000000' : '#AAAAAA',
                fontFamily: 'monospace'
            }).setOrigin(0.5).setAlpha(0);

            this.tweens.add({
                targets: txt,
                alpha: 1,
                delay: 500 + i * 300,
                duration: 600
            });
        });

        // Start prompt (appears after lore)
        const startText = this.add.text(width / 2, height * 0.78, 'Press SPACE or click to awaken from the Cinder Vault', {
            fontSize: '18px',
            color: '#FFCC00',
            fontFamily: 'monospace'
        }).setOrigin(0.5).setAlpha(0).setInteractive({ useHandCursor: true });

        this.tweens.add({
            targets: startText,
            alpha: 1,
            delay: 4500,
            duration: 800,
            onComplete: () => {
                this.tweens.add({
                    targets: startText,
                    alpha: { from: 1, to: 0.3 },
                    duration: 800,
                    yoyo: true,
                    repeat: -1
                });
            }
        });

        // Controls
        const ctrlText = this.add.text(width / 2, height * 0.86,
            '[WASD] Move  [SPACE] Jump  [SHIFT] Flame Step  [S] Ability  [E] Ability  [Q] Class Attack', {
            fontSize: '12px',
            color: '#666666',
            fontFamily: 'monospace'
        }).setOrigin(0.5).setAlpha(0);

        this.tweens.add({
            targets: ctrlText,
            alpha: 1,
            delay: 5000,
            duration: 800
        });

        // Resolution toggle
        const [rw, rh] = Settings.data.resolution;
        this._resText = this.add.text(width / 2, height * 0.92,
            `[R] Resolution: ${rw}x${rh}   [A] Achievements   [B] Boss Rush   [D] Daily Run`, {
            fontSize: '12px',
            color: '#666666',
            fontFamily: 'monospace'
        }).setOrigin(0.5).setAlpha(0);

        this.tweens.add({
            targets: this._resText,
            alpha: 1,
            delay: 5000,
            duration: 800
        });

        // Credits line
        this.add.text(width / 2, height - 20, 'Inspired by the world of Enshrouded', {
            fontSize: '10px',
            color: '#444444',
            fontFamily: 'monospace'
        }).setOrigin(0.5);

        // ─── Daily Run banner ───
        const todayMod = DailyRun.getTodayModifier();
        const todayClass = DailyRun.getTodayClass();
        const todayResult = DailyRun.getTodayResult();
        const dailyLabel = todayResult
            ? `✓ DAILY: ${todayMod.icon} ${todayMod.name} · ${todayClass}   ${Math.round(todayResult.distance).toLocaleString()}m`
            : `DAILY: ${todayMod.icon} ${todayMod.name} · ${todayClass}`;
        const dailyBanner = this.add.text(width / 2, height * 0.97, dailyLabel, {
            fontSize: '11px',
            color: todayResult ? '#44FF44' : '#FFAA33',
            fontFamily: 'monospace',
        }).setOrigin(0.5).setAlpha(0);
        this.tweens.add({ targets: dailyBanner, alpha: 1, delay: 5000, duration: 600 });

        // ─── Legend badge ───
        if (MetaProgression.hasWon()) {
            const _prestige = MetaProgression.prestigeCount;
            const _prestigeStr = _prestige > 0 ? ' ' + '★'.repeat(_prestige) : '';
            const badge = this.add.text(width / 2, 158, `✦ FLAMEBORN LEGEND${_prestigeStr}`, {
                fontSize: '13px',
                color: '#FFDD00',
                fontFamily: 'monospace',
                fontStyle: 'bold',
                shadow: { offsetX: 0, offsetY: 0, color: '#FFAA00', blur: 8, fill: true },
            }).setOrigin(0.5);
            this.tweens.add({ targets: badge, alpha: { from: 0.5, to: 1 }, duration: 1200, yoyo: true, repeat: -1 });
        }

        // ─── Next class unlock hint (U1) ───
        {
            const _avail = MetaProgression.getAvailableElixir();
            const _cost = MetaProgression.getUnlockCost();
            const _nextLocked = ALL_CLASS_IDS.find(id => !MetaProgression.isClassUnlocked(id));
            if (_nextLocked && _cost < Infinity && _avail < _cost) {
                const _nextName = CLASS_DEFS[_nextLocked]?.className || _nextLocked;
                const _hint = this.add.text(width / 2, 192,
                    `Next unlock: ${_nextName}  —  ${_avail} / ${_cost} elixir`, {
                    fontSize: '10px', color: '#667788', fontFamily: 'monospace'
                }).setOrigin(0.5).setAlpha(0);
                this.tweens.add({ targets: _hint, alpha: 1, delay: 5000, duration: 600 });
            }
        }

        // ─── W1: Lifetime stats snapshot ───
        {
            const _history = MetaProgression.getRunHistory();
            if (_history.length > 0) {
                const _unlockedCount = MetaProgression.unlockedClasses.length;
                const _bestDist = _history.reduce((b, r) => Math.max(b, r.distance), 0);
                const _wonPaths = ['boss_conquest', 'lore_master', 'shroud_conquest'].filter(p => MetaProgression.hasWonPath(p)).length;
                const _sessionRuns = MetaProgression.getSessionRuns();
                const _sessionStr = _sessionRuns > 0 ? `  ·  ${_sessionRuns} this session` : '';
                const _statsLine = `Classes ${_unlockedCount}/${ALL_CLASS_IDS.length}  ·  Best ${Math.floor(_bestDist).toLocaleString()}m  ·  Wins ${_wonPaths}/3  ·  ${FlameAltar.lifetimeElixir.toLocaleString()} lifetime elixir${_sessionStr}`;
                const _statsText = this.add.text(width / 2, 208, _statsLine, {
                    fontSize: '10px', color: '#556677', fontFamily: 'monospace'
                }).setOrigin(0.5).setAlpha(0);
                this.tweens.add({ targets: _statsText, alpha: 1, delay: 5000, duration: 600 });
            }
        }

        // ─── Prestige available hint ───
        if (MetaProgression.canPrestige && MetaProgression.canPrestige()) {
            const prestigeHint = this.add.text(width / 2, 175, '★ PRESTIGE AVAILABLE — visit the Flame Altar', {
                fontSize: '11px',
                color: '#FFD700',
                fontFamily: 'monospace',
                shadow: { offsetX: 0, offsetY: 0, color: '#FF8800', blur: 6, fill: true },
            }).setOrigin(0.5);
            this.tweens.add({ targets: prestigeHint, alpha: { from: 0.3, to: 1 }, duration: 1000, yoyo: true, repeat: -1 });
        }

        // Music (start on first gesture)
        const startMusic = () => {
            MusicManager.init(this.sound);
            MusicManager.setVolume(Settings.data.volume);
            MusicManager.playMenu();
        };
        this.input.once('pointerdown', startMusic);
        this.input.keyboard.once('keydown', startMusic);

        // Resolution toggle key
        this.input.keyboard.on('keydown-R', () => {
            const [cw, ch] = Settings.data.resolution;
            if (cw === 960) {
                Settings.data.resolution = [1280, 800];
            } else {
                Settings.data.resolution = [960, 600];
            }
            Settings.save();
            const [nw, nh] = Settings.data.resolution;
            this.game.scale.resize(nw, nh);
            this.scene.restart();
        });

        // Sprint 10e: Achievement panel
        this._achievePanelOpen = false;
        this.input.keyboard.on('keydown-A', () => {
            if (this._achievePanelOpen) {
                this._closeAchievementPanel();
            } else {
                this._showAchievementPanel();
            }
        });

        // Input
        const _goPlay = () => {
            this.input.keyboard.removeAllListeners();
            MusicManager.stopMenu();
            this.cameras.main.fadeOut(800, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('ClassSelect');
            });
        };
        this.input.keyboard.on('keydown-SPACE', _goPlay);
        startText.on('pointerdown', _goPlay);

        // Boss Rush shortcut
        this.input.keyboard.on('keydown-B', () => {
            this.input.keyboard.removeAllListeners();
            RunModifier.clear();
            MusicManager.stopMenu();
            this.cameras.main.fadeOut(800, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('ClassSelect', { bossRush: true });
            });
        });

        // Daily Run shortcut [D]
        this.input.keyboard.on('keydown-D', () => {
            this.input.keyboard.removeAllListeners();
            const todayMod = DailyRun.getTodayModifier();
            const todayClass = DailyRun.getTodayClass();
            RunModifier.set(todayMod);
            MusicManager.stopMenu();
            this.cameras.main.fadeOut(800, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('ClassSelect', { daily: true, suggestedClass: todayClass });
            });
        });
    }

    _showAchievementPanel() {
        if (this._achievePanelOpen) return;
        this._achievePanelOpen = true;
        this._achieveElements = [];
        AchievementManager.load();

        const { width, height } = this.scale;
        const all = AchievementManager.getAll();
        const unlockedCount = all.filter(a => AchievementManager.isUnlocked(a.id)).length;
        const pct = Math.round((unlockedCount / all.length) * 100);

        // Backdrop
        const bg = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.85)
            .setScrollFactor(0).setDepth(200)
            .setInteractive();
        this._achieveElements.push(bg);

        // Title
        const title = this.add.text(width / 2, 36, `ACHIEVEMENTS  (${unlockedCount}/${all.length} — ${pct}%)`, {
            fontSize: '18px', color: '#FFCC00', fontFamily: 'monospace', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(201);
        this._achieveElements.push(title);

        const closeHint = this.add.text(width / 2, height - 20, '[A] or [ESC] to close', {
            fontSize: '11px', color: '#666666', fontFamily: 'monospace'
        }).setOrigin(0.5).setDepth(201);
        this._achieveElements.push(closeHint);

        // Group achievements by category
        const CATEGORIES = ['Distance', 'Elixir', 'Combat', 'Collection', 'Survival', 'Lore', 'Biome', 'Skills', 'Mechanics', 'Meta'];
        const CATEGORY_COLORS = {
            Distance: '#AACCFF', Elixir: '#00FFCC', Combat: '#FF4444', Collection: '#FFCC00',
            Survival: '#FF6600', Lore: '#CC88FF', Biome: '#44FF88', Skills: '#FFD700',
            Mechanics: '#FF88CC', Meta: '#FF8866'
        };

        const colW = Math.floor(width / 2) - 20;
        const cols = [[],[],[],[],[], [], [], [], [], []].slice(0, CATEGORIES.length);
        // Two-column layout: 5 categories per column
        const leftCats = CATEGORIES.slice(0, 5);
        const rightCats = CATEGORIES.slice(5);

        const startY = 70;
        const rowH = 20;

        [leftCats, rightCats].forEach((catList, colIdx) => {
            let curY = startY;
            const colX = colIdx === 0 ? 10 : width / 2 + 10;

            catList.forEach(cat => {
                const catAchs = all.filter(a => a.category === cat);
                if (catAchs.length === 0) return;
                const catColor = CATEGORY_COLORS[cat] || '#FFFFFF';

                // Category header
                const header = this.add.text(colX + colW / 2, curY, cat.toUpperCase(), {
                    fontSize: '12px', color: catColor, fontFamily: 'monospace', fontStyle: 'bold'
                }).setOrigin(0.5).setDepth(201);
                this._achieveElements.push(header);
                curY += 16;

                // Achievement rows
                catAchs.forEach(ach => {
                    const unlocked = AchievementManager.isUnlocked(ach.id);
                    const iconColor = unlocked ? catColor : '#333333';
                    const nameColor = unlocked ? '#CCCCCC' : '#444444';

                    const icon = this.add.text(colX + 6, curY, ach.icon || '◆', {
                        fontSize: '11px', color: iconColor, fontFamily: 'monospace'
                    }).setOrigin(0, 0).setDepth(201);
                    this._achieveElements.push(icon);

                    const label = this.add.text(colX + 22, curY, unlocked ? ach.name : '???', {
                        fontSize: '11px', color: nameColor, fontFamily: 'monospace'
                    }).setOrigin(0, 0).setDepth(201);
                    this._achieveElements.push(label);

                    if (unlocked) {
                        // Short desc on hover (interactive zone)
                        label.setInteractive({ useHandCursor: true });
                        label.on('pointerover', () => {
                            this._achTooltip && this._achTooltip.destroy();
                            this._achTooltip = this.add.text(width / 2, height / 2, ach.description, {
                                fontSize: '13px', color: '#FFFFFF', fontFamily: 'monospace',
                                backgroundColor: '#222222', padding: { x: 8, y: 4 }
                            }).setOrigin(0.5).setDepth(202);
                        });
                        label.on('pointerout', () => {
                            this._achTooltip && this._achTooltip.destroy();
                            this._achTooltip = null;
                        });
                    }

                    curY += rowH;
                });
                curY += 6; // gap between categories
            });
        });

        // ESC also closes
        this._escHandler = (e) => {
            if (e.keyCode === 27) this._closeAchievementPanel();
        };
        this.input.keyboard.on('keydown', this._escHandler);
    }

    _closeAchievementPanel() {
        if (!this._achievePanelOpen) return;
        this._achievePanelOpen = false;
        this._achTooltip && this._achTooltip.destroy();
        this._achTooltip = null;
        for (const el of (this._achieveElements || [])) {
            if (el && el.active) el.destroy();
        }
        this._achieveElements = [];
        if (this._escHandler) {
            this.input.keyboard.off('keydown', this._escHandler);
            this._escHandler = null;
        }
    }

    update() {
        if (this.shroudBg) {
            this.shroudBg.tilePositionX += 0.3;
            this.shroudBg.tilePositionY += 0.1;
        }
    }
}
