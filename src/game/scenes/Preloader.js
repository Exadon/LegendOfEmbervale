import Phaser from 'phaser';
import { TextureGenerator } from '../utils/TextureGenerator.js';
import { COLORS } from '../constants.js';

export class Preloader extends Phaser.Scene {
    constructor() {
        super('Preloader');
    }

    create() {
        const { width, height } = this.scale;

        // Progress bar background
        const barBg = this.add.rectangle(width / 2, height / 2, 320, 24, COLORS.BAR_BG);
        const barFill = this.add.rectangle(width / 2 - 156, height / 2, 0, 18, COLORS.ELIXIR_CYAN);
        barFill.setOrigin(0, 0.5);

        const loadingText = this.add.text(width / 2, height / 2 - 40, 'Generating textures...', {
            fontSize: '18px',
            color: '#D4A04A',
            fontFamily: 'monospace'
        }).setOrigin(0.5);

        // Generate all textures (synchronous, but we fake progress)
        this.time.delayedCall(100, () => {
            barFill.width = 100;
            TextureGenerator.generateAll(this);
            barFill.width = 312;

            this.time.delayedCall(300, () => {
                loadingText.setText('Ready.');
                this.time.delayedCall(500, () => {
                    this.scene.start('MainMenu');
                });
            });
        });
    }
}
