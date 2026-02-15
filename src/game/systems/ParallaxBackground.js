import { PARALLAX, WORLD } from '../constants.js';

export class ParallaxBackground {
    constructor(scene) {
        this.scene = scene;
        this.layers = [];

        const { width, height } = scene.scale;

        for (let i = 0; i < 4; i++) {
            const layer = scene.add.tileSprite(0, 0, width, height, `bg_layer${i}`)
                .setOrigin(0, 0)
                .setScrollFactor(0)
                .setDepth(-10 + i);
            this.layers.push(layer);
        }
    }

    update(cameraScrollX) {
        for (let i = 0; i < this.layers.length; i++) {
            this.layers[i].tilePositionX = cameraScrollX * PARALLAX.SPEEDS[i];
        }
    }
}
