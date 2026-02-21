import Phaser from 'phaser';
import { SHROUD, WORLD } from '../constants.js';
import { GlobalState } from '../GlobalState.js';

export class Shroud {
    constructor(scene) {
        this.scene = scene;
        this.currentSpeed = SHROUD.BASE_SPEED;
        this.speedMultiplier = 1.0;
        this.baseSpeedMult = 1.0; // Persistent loop ramp multiplier
        this.elapsed = 0;       // total seconds elapsed
        this.lastRampTier = 0;  // last difficulty tier applied

        // Visual: TileSprite spanning full height
        this.visual = scene.add.tileSprite(
            SHROUD.START_X - SHROUD.WIDTH,
            0,
            SHROUD.WIDTH,
            WORLD.HEIGHT,
            'shroud_tile'
        ).setOrigin(0, 0).setAlpha(SHROUD.ALPHA_MIN).setDepth(5);

        // Physics hit zone at the leading edge
        this.hitZone = scene.add.rectangle(
            SHROUD.START_X,
            WORLD.HEIGHT / 2,
            SHROUD.HIT_ZONE_WIDTH,
            WORLD.HEIGHT,
            0x000000, 0
        );
        scene.physics.add.existing(this.hitZone, true); // static body

        // Alpha pulse tween
        scene.tweens.add({
            targets: this.visual,
            alpha: { from: SHROUD.ALPHA_MIN, to: SHROUD.ALPHA_MAX },
            duration: SHROUD.PULSE_DURATION,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    update(delta) {
        // Speed ramp over time
        this.elapsed += delta / 1000;
        const tier = Math.floor(this.elapsed / SHROUD.RAMP_INTERVAL);
        if (tier > this.lastRampTier) {
            this.lastRampTier = tier;
            this.currentSpeed = Math.min(
                SHROUD.BASE_SPEED + tier * SHROUD.SPEED_RAMP,
                SHROUD.SPEED_MAX
            );
            this.speedJustIncreased = true;
        } else {
            this.speedJustIncreased = false;
        }

        // Advance shroud position
        const advance = this.currentSpeed * this.speedMultiplier * this.baseSpeedMult * (delta / 1000);
        GlobalState.shroudX += advance;

        // Move visual and hit zone
        const x = GlobalState.shroudX;
        this.visual.x = x - SHROUD.WIDTH;
        this.visual.tilePositionX -= advance * 0.3;
        this.visual.tilePositionY += 0.2;

        this.hitZone.x = x;
        this.hitZone.body.updateFromGameObject();
    }

    surge() {
        GlobalState.surgeShroud();
        // Flash effect on surge
        this.scene.tweens.add({
            targets: this.visual,
            alpha: 1,
            duration: 150,
            yoyo: true
        });
    }

    getLeadingX() {
        return GlobalState.shroudX;
    }

    getDifficultyTier() {
        return this.lastRampTier;
    }
}
