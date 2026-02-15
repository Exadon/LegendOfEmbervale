import Phaser from 'phaser';
import { COLORS } from '../constants.js';
import { GlobalState } from '../GlobalState.js';

export class MainMenu extends Phaser.Scene {
    constructor() {
        super('MainMenu');
    }

    create() {
        const { width, height } = this.scale;

        // Reset state for fresh game
        GlobalState.reset();

        // Pulsing shroud background
        this.shroudBg = this.add.tileSprite(0, 0, width, height, 'shroud_tile')
            .setOrigin(0, 0)
            .setAlpha(0.3);

        this.tweens.add({
            targets: this.shroudBg,
            alpha: { from: 0.2, to: 0.5 },
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Title
        this.add.text(width / 2, height / 3, "ELIXIR'S SHADOW", {
            fontSize: '52px',
            color: '#D4A04A',
            fontFamily: 'monospace',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        // Subtitle
        this.add.text(width / 2, height / 3 + 60, 'An Enshrouded Prequel', {
            fontSize: '20px',
            color: '#00BFFF',
            fontFamily: 'monospace'
        }).setOrigin(0.5);

        // Start prompt
        const startText = this.add.text(width / 2, height * 0.7, 'Press SPACE to begin', {
            fontSize: '22px',
            color: '#FF6600',
            fontFamily: 'monospace'
        }).setOrigin(0.5);

        this.tweens.add({
            targets: startText,
            alpha: { from: 1, to: 0.3 },
            duration: 800,
            yoyo: true,
            repeat: -1
        });

        // Controls hint
        this.add.text(width / 2, height * 0.82, 'WASD to move  |  SPACE to jump  |  Walk into crystals to mine', {
            fontSize: '14px',
            color: '#888888',
            fontFamily: 'monospace'
        }).setOrigin(0.5);

        // Input
        this.input.keyboard.once('keydown-SPACE', () => {
            this.cameras.main.fadeOut(500, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('Level1');
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
