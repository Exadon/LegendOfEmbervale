import { FlameBar } from './FlameBar.js';
import { ElixirCounter } from './ElixirCounter.js';

export class HUD {
    constructor(scene) {
        this.scene = scene;

        // Flame bar top-left
        this.flameBar = new FlameBar(scene, 20, 28);

        // Elixir counter top-right
        this.elixirCounter = new ElixirCounter(scene, scene.scale.width - 80, 28);

        // Shroud warning text (hidden by default)
        this.warningText = scene.add.text(scene.scale.width / 2, 60, 'IN THE SHROUD!', {
            fontSize: '18px',
            color: '#FF0000',
            fontFamily: 'monospace',
            fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(100).setVisible(false);

        // Game over overlay (hidden)
        this.gameOverGroup = scene.add.group();
        this.gameOverBg = scene.add.rectangle(
            scene.scale.width / 2, scene.scale.height / 2,
            scene.scale.width, scene.scale.height,
            0x000000, 0.7
        ).setScrollFactor(0).setDepth(200).setVisible(false);

        this.gameOverText = scene.add.text(scene.scale.width / 2, scene.scale.height / 2 - 30, 'THE SHROUD CLAIMS ALL', {
            fontSize: '36px',
            color: '#00BFFF',
            fontFamily: 'monospace',
            fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(201).setVisible(false);

        this.restartText = scene.add.text(scene.scale.width / 2, scene.scale.height / 2 + 30, 'Press SPACE to try again', {
            fontSize: '18px',
            color: '#D4A04A',
            fontFamily: 'monospace'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(201).setVisible(false);
    }

    update() {
        this.flameBar.update();
        this.elixirCounter.update();
    }

    showShroudWarning(visible) {
        this.warningText.setVisible(visible);
    }

    showGameOver() {
        this.gameOverBg.setVisible(true);
        this.gameOverText.setVisible(true);
        this.restartText.setVisible(true);
    }

    popElixir() {
        this.elixirCounter.pop();
    }
}
