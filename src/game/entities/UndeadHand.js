import Phaser from 'phaser';
import { WORLD, UNDEAD_HAND } from '../constants.js';

export class UndeadHand extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x) {
        const y = WORLD.GROUND_Y - UNDEAD_HAND.HEIGHT / 2;
        super(scene, x, y, 'undead_hand');
        scene.add.existing(this);
        scene.physics.add.existing(this, true);

        this.setDepth(2);
        this.setDisplaySize(UNDEAD_HAND.WIDTH, UNDEAD_HAND.HEIGHT);

        if (scene.anims.exists('undead_hand_idle')) {
            this.play('undead_hand_idle');
        }

        this.grabbing = false;
        this.grabTimer = 0;
    }

    startGrab() {
        if (this.grabbing) return false;
        this.grabbing = true;
        this.grabTimer = UNDEAD_HAND.GRAB_DURATION;
        this.setTintFill(0xFF4444);
        this.scene.time.delayedCall(150, () => {
            if (this.active) this.clearTint();
        });
        return true;
    }

    update(delta) {
        if (this.grabbing) {
            this.grabTimer -= delta;
            if (this.grabTimer <= 0) {
                this.grabbing = false;
            }
        }
    }
}
