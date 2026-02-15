import { COLORS } from '../constants.js';
import { GlobalState } from '../GlobalState.js';

export class ElixirCounter {
    constructor(scene, x, y) {
        this.scene = scene;

        // Icon
        this.icon = scene.add.image(x, y, 'elixir_icon').setScrollFactor(0).setDepth(100);

        // Counter text
        this.text = scene.add.text(x + 16, y, '0', {
            fontSize: '20px',
            color: '#00FFCC',
            fontFamily: 'monospace',
            fontStyle: 'bold'
        }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(100);
    }

    update() {
        this.text.setText(String(GlobalState.elixir));
    }

    pop() {
        this.scene.tweens.add({
            targets: [this.icon, this.text],
            scaleX: 1.4,
            scaleY: 1.4,
            duration: 100,
            yoyo: true
        });
    }
}
