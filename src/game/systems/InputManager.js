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
            jump: Phaser.Input.Keyboard.KeyCodes.SPACE,
            dash: Phaser.Input.Keyboard.KeyCodes.SHIFT,
            flameBurst: Phaser.Input.Keyboard.KeyCodes.E,
            classAttack: Phaser.Input.Keyboard.KeyCodes.Q,
            pause: Phaser.Input.Keyboard.KeyCodes.ESC,
            mine: Phaser.Input.Keyboard.KeyCodes.M,
            lore: Phaser.Input.Keyboard.KeyCodes.J,
        });

        // Per-button "just pressed" state for gamepad
        this._prevPad = {};

        // Gamepad (if connected)
        this.pad = null;
        this.gamepadConnected = false;
        if (scene.input.gamepad) {
            scene.input.gamepad.on('connected', (pad) => {
                this.pad = pad;
                this.gamepadConnected = true;
                scene.events.emit('gamepadConnected');
            });
            scene.input.gamepad.on('disconnected', () => {
                this.pad = null;
                this.gamepadConnected = false;
                scene.events.emit('gamepadDisconnected');
            });
            if (scene.input.gamepad.total > 0) {
                this.pad = scene.input.gamepad.getPad(0);
                this.gamepadConnected = true;
            }
        }
    }

    // ─── Movement ───

    get left() {
        if (this.keys.left.isDown) return true;
        if (this.pad && (this.pad.leftStick.x < -0.3 || this.pad.left)) return true;
        return false;
    }

    get right() {
        if (this.keys.right.isDown) return true;
        if (this.pad && (this.pad.leftStick.x > 0.3 || this.pad.right)) return true;
        return false;
    }

    get up() {
        if (this.keys.up.isDown) return true;
        if (this.pad && (this.pad.leftStick.y < -0.3 || this.pad.up)) return true;
        return false;
    }

    get down() {
        if (this.keys.down.isDown) return true;
        if (this.pad && (this.pad.leftStick.y > 0.3 || this.pad.down)) return true;
        return false;
    }

    get downJustPressed() {
        if (Phaser.Input.Keyboard.JustDown(this.keys.down)) return true;
        return this._padJustPressed('R2') || this._padJustPressed('RT');
    }

    // ─── Actions ───

    get jump() {
        if (Phaser.Input.Keyboard.JustDown(this.keys.jump)) return true;
        return this._padJustPressed('A');  // A / Cross
    }

    get dash() {
        if (Phaser.Input.Keyboard.JustDown(this.keys.dash)) return true;
        return this._padJustPressed('B');  // B / Circle
    }

    get flameBurst() {
        if (Phaser.Input.Keyboard.JustDown(this.keys.flameBurst)) return true;
        return this._padJustPressed('X');  // X / Square
    }

    get classAttack() {
        if (Phaser.Input.Keyboard.JustDown(this.keys.classAttack)) return true;
        return this._padJustPressed('Y');  // Y / Triangle
    }

    /** S key — ground slam / class S ability */
    get sAbility() {
        return this._padJustPressed('RT') || this._padJustPressed('R2');
    }

    /** M key — mine */
    get mine() {
        if (Phaser.Input.Keyboard.JustDown(this.keys.mine)) return true;
        return this._padJustPressed('L1') || this._padJustPressed('LB');
    }

    /** J key — lore compendium */
    get lore() {
        if (Phaser.Input.Keyboard.JustDown(this.keys.lore)) return true;
        return this._padJustPressed('select');
    }

    get pause() {
        if (Phaser.Input.Keyboard.JustDown(this.keys.pause)) return true;
        return this._padJustPressed('start');
    }

    get horizontalAxis() {
        if (this.left) return -1;
        if (this.right) return 1;
        // Smooth analog from gamepad
        if (this.pad && Math.abs(this.pad.leftStick.x) > 0.1) {
            return this.pad.leftStick.x;
        }
        return 0;
    }

    // ─── Gamepad "just pressed" helper ───

    _padJustPressed(button) {
        if (!this.pad) return false;
        let current = false;
        switch (button) {
            case 'A':      current = !!(this.pad.A); break;
            case 'B':      current = !!(this.pad.B); break;
            case 'X':      current = !!(this.pad.X); break;
            case 'Y':      current = !!(this.pad.Y); break;
            case 'L1':     // fall through
            case 'LB':     current = !!(this.pad.L1); break;
            case 'R1':     // fall through
            case 'RB':     current = !!(this.pad.R1); break;
            case 'L2':     // fall through
            case 'LT':     current = !!(this.pad.L2 > 0.5); break;
            case 'R2':     // fall through
            case 'RT':     current = !!(this.pad.R2 > 0.5); break;
            case 'start':  current = !!(this.pad.index === undefined ? false : this.pad.buttons[9]?.pressed); break;
            case 'select': current = !!(this.pad.index === undefined ? false : this.pad.buttons[8]?.pressed); break;
            default: return false;
        }
        const prev = !!this._prevPad[button];
        if (current && !prev) {
            this._prevPad[button] = true;
            return true;
        }
        if (!current) this._prevPad[button] = false;
        return false;
    }

    /** Call each frame so "just pressed" state stays accurate */
    update() {
        // Refresh gamepad pad reference if needed
        if (!this.pad && this.scene.input.gamepad && this.scene.input.gamepad.total > 0) {
            this.pad = this.scene.input.gamepad.getPad(0);
            this.gamepadConnected = true;
        }
    }
}
