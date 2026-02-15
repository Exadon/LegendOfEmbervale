import { COLORS, FLAME } from '../constants.js';
import { GlobalState } from '../GlobalState.js';

export class FlameBar {
    constructor(scene, x, y) {
        this.scene = scene;

        const barWidth = 180;
        const barHeight = 16;

        // Icon
        this.icon = scene.add.image(x, y, 'flame_icon').setScrollFactor(0).setDepth(100);

        // Background
        this.bg = scene.add.rectangle(x + 20, y, barWidth, barHeight, COLORS.BAR_BG)
            .setOrigin(0, 0.5)
            .setScrollFactor(0)
            .setDepth(100);

        // Fill
        this.fill = scene.add.rectangle(x + 22, y, barWidth - 4, barHeight - 4, COLORS.BAR_FLAME_FULL)
            .setOrigin(0, 0.5)
            .setScrollFactor(0)
            .setDepth(101);

        this.maxWidth = barWidth - 4;
    }

    update() {
        const pct = GlobalState.flame / FLAME.MAX;
        this.fill.width = this.maxWidth * pct;

        // Color interpolation: orange at full -> red at empty
        const r = 0xFF;
        const g = Math.floor(0x66 * pct);
        const b = 0;
        this.fill.fillColor = (r << 16) | (g << 8) | b;
    }
}
