import Phaser from 'phaser';

export class InputManager {
    constructor(scene) {
        this.scene = scene;

        // Keyboard
        this.keys = scene.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
            jump: Phaser.Input.Keyboard.KeyCodes.SPACE
        });

        // Gamepad (if connected)
        this.pad = null;
        if (scene.input.gamepad) {
            scene.input.gamepad.once('connected', (pad) => {
                this.pad = pad;
            });
            if (scene.input.gamepad.total > 0) {
                this.pad = scene.input.gamepad.getPad(0);
            }
        }
    }

    get left() {
        if (this.keys.left.isDown) return true;
        if (this.pad && this.pad.leftStick.x < -0.3) return true;
        if (this.pad && this.pad.left) return true;
        return false;
    }

    get right() {
        if (this.keys.right.isDown) return true;
        if (this.pad && this.pad.leftStick.x > 0.3) return true;
        if (this.pad && this.pad.right) return true;
        return false;
    }

    get up() {
        if (this.keys.up.isDown) return true;
        if (this.pad && this.pad.leftStick.y < -0.3) return true;
        if (this.pad && this.pad.up) return true;
        return false;
    }

    get jump() {
        if (Phaser.Input.Keyboard.JustDown(this.keys.jump)) return true;
        if (this.pad && this.pad.A && this._padAJustPressed()) return true;
        return false;
    }

    _padAJustPressed() {
        if (!this._prevA && this.pad.A) {
            this._prevA = true;
            return true;
        }
        if (!this.pad.A) this._prevA = false;
        return false;
    }

    get horizontalAxis() {
        if (this.left) return -1;
        if (this.right) return 1;
        return 0;
    }
}
