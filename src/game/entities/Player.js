import Phaser from 'phaser';
import { PLAYER } from '../constants.js';

export class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'player');
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.body.setSize(PLAYER.WIDTH - 4, PLAYER.HEIGHT - 4);
        this.body.setOffset(2, 2);
        this.setCollideWorldBounds(true);

        this.isMining = false;
        this.miningTimer = 0;
    }

    handleInput(input) {
        const h = input.horizontalAxis;
        this.setVelocityX(h * PLAYER.SPEED);

        if (h < 0) this.setFlipX(true);
        else if (h > 0) this.setFlipX(false);

        if (input.jump && this.body.onFloor()) {
            this.setVelocityY(PLAYER.JUMP_VELOCITY);
        }
    }

    startMining() {
        this.isMining = true;
        this.miningTimer = 0;
    }

    stopMining() {
        this.isMining = false;
        this.miningTimer = 0;
    }

    updateMining(delta) {
        if (!this.isMining) return false;
        this.miningTimer += delta / 1000;
        return this.miningTimer;
    }
}
