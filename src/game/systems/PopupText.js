export class PopupText {
    constructor(scene) {
        this.scene = scene;
        this._stack = new Map();
    }

    show(x, y, message, color = '#FFFFFF', fontSize = '14px') {
        const bucket = Math.round(x / 70);
        const now = Date.now();
        const entry = this._stack.get(bucket);
        const depth = (entry && now - entry.timestamp < 250) ? entry.count : 0;
        this._stack.set(bucket, { count: depth + 1, timestamp: now });
        y = y - depth * 30;
        const text = this.scene.add.text(x, y, message, {
            fontSize,
            color,
            fontFamily: 'monospace',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5).setDepth(150);

        text.setScale(0);
        this.scene.tweens.add({
            targets: text,
            scaleX: 1.2, scaleY: 1.2,
            duration: 100,
            ease: 'Back.easeOut',
            onComplete: () => {
                this.scene.tweens.add({
                    targets: text,
                    y: y - 50,
                    alpha: { from: 1, to: 0 },
                    scaleX: 0.85, scaleY: 0.85,
                    duration: 1100,
                    ease: 'Power2',
                    onComplete: () => text.destroy()
                });
            }
        });

        return text;
    }

    elixirMined(x, y) {
        this.show(x, y - 20, '+1 ELIXIR', '#00FFCC', '16px');
    }

    flameRestored(x, y, amount) {
        this.show(x, y - 20, `+${amount} FLAME`, '#FFAA33', '16px');
    }

    flameStep(x, y) {
        this.show(x, y - 30, 'FLAME STEP!', '#FFCC00', '13px');
    }

    wraithBanished(x, y) {
        this.show(x, y - 20, 'BANISHED!', '#AA44FF', '14px');
    }

    closeShroud(x, y) {
        this.show(x, y - 40, 'TOO CLOSE!', '#FF4444', '13px');
    }

    speedUp(x, y) {
        this.show(x, y - 50, 'THE SHROUD QUICKENS...', '#00BFFF', '15px');
    }
}
