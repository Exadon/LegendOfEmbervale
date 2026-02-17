import { PARALLAX } from '../constants.js';

export class ParallaxBackground {
    constructor(scene) {
        this.scene = scene;
        this.layers = [];

        const { width, height } = scene.scale;
        const zoom = scene.cameras.main.zoom || 1;

        // At higher zoom, scrollFactor(0) objects are magnified from the
        // camera center, pushing the origin off-screen.  Shift the
        // background up so the sky portion stays visible.
        const yOffset = -height * (zoom - 1) / (2 * zoom);

        for (let i = 0; i < 4; i++) {
            // Source images are 640x360.  Scale vertically to cover the
            // full screen height at the current zoom level.
            const vScale = (height / 360) * (1 / zoom) * 1.1; // 10% bleed
            const layer = scene.add.tileSprite(0, yOffset, width, 360, `bg_layer${i}`)
                .setOrigin(0, 0)
                .setScrollFactor(0)
                .setDepth(-10 + i)
                .setScale(1, vScale);
            this.layers.push(layer);
        }
    }

    update(cameraScrollX) {
        for (let i = 0; i < this.layers.length; i++) {
            // tilePositionX works in source pixel space, unaffected by scale
            this.layers[i].tilePositionX = cameraScrollX * PARALLAX.SPEEDS[i];
        }
    }
}
