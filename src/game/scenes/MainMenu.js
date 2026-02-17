import Phaser from 'phaser';
import { GlobalState } from '../GlobalState.js';
import { Settings } from '../systems/Settings.js';

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
        const titleGlow = this.add.text(width / 2, 120, 'Legacy Of Embervale', {
            fontSize: '42px',
            color: '#0066CC',
            fontFamily: 'monospace',
            fontStyle: 'bold',
        }).setOrigin(0.5).setAlpha(0.4);

        // Main title
        const title = this.add.text(width / 2, 120, 'Legacy Of Embervale', {
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
        const startText = this.add.text(width / 2, height * 0.78, 'Press SPACE to awaken from the Cinder Vault', {
            fontSize: '18px',
            color: '#FF6600',
            fontFamily: 'monospace'
        }).setOrigin(0.5).setAlpha(0);

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
            '[WASD] Move  [SPACE] Jump/Double Jump  [SHIFT] Flame Step  [S] Slam  [E] Flame Burst', {
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
            `[R] Resolution: ${rw}x${rh}   [V] Sprite Viewer`, {
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

        // Sprite viewer
        this.input.keyboard.on('keydown-V', () => {
            this.input.keyboard.removeAllListeners();
            this.scene.start('SpriteViewer');
        });

        // Input
        this.input.keyboard.on('keydown-SPACE', () => {
            this.input.keyboard.removeAllListeners();
            this.cameras.main.fadeOut(800, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('ClassSelect');
            });
        });
    }

    update() {
        if (this.shroudBg) {
            this.shroudBg.tilePositionX += 0.3;
            this.shroudBg.tilePositionY += 0.1;
        }
    }
}
