import Phaser from 'phaser';

export class Boot extends Phaser.Scene {
    constructor() {
        super('Boot');
    }

    create() {
        // Generate a 1x1 white pixel texture for use as a building block
        const g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0xffffff);
        g.fillRect(0, 0, 1, 1);
        g.generateTexture('pixel', 1, 1);
        g.destroy();

        this.scene.start('Preloader');
    }
}
