import Phaser from 'phaser';

export class ParticleManager {
    constructor(scene) {
        this.scene = scene;

        // Dash / Flame Step embers — particles spawn at player, low speed
        // The player's own fast movement creates the trail effect naturally
        this.dashEmitter = scene.add.particles(0, 0, 'pixel', {
            speed: { min: 20, max: 60 },
            scale: { start: 3, end: 0 },
            alpha: { start: 1, end: 0 },
            lifespan: 350,
            tint: [0xFF6600, 0xFFAA00, 0xFFDD44],
            emitting: false,
            quantity: 2,
            frequency: 25
        }).setDepth(50);

        // Mining sparkles
        this.mineEmitter = scene.add.particles(0, 0, 'pixel', {
            speed: { min: 40, max: 120 },
            angle: { min: 200, max: 340 },
            scale: { start: 2.5, end: 0 },
            alpha: { start: 1, end: 0 },
            lifespan: 600,
            tint: [0x00FFCC, 0x80FFE0, 0x00DDAA],
            emitting: false,
            quantity: 12,
            frequency: -1
        }).setDepth(50);

        // Wisp collect burst
        this.wispEmitter = scene.add.particles(0, 0, 'pixel', {
            speed: { min: 50, max: 130 },
            scale: { start: 2.5, end: 0 },
            alpha: { start: 1, end: 0 },
            lifespan: 500,
            tint: [0xFFAA33, 0xFFDD88, 0xFF8800],
            emitting: false,
            quantity: 10,
            frequency: -1
        }).setDepth(50);

        // Wraith banish puff
        this.wraithEmitter = scene.add.particles(0, 0, 'pixel', {
            speed: { min: 30, max: 100 },
            scale: { start: 3, end: 0 },
            alpha: { start: 0.8, end: 0 },
            lifespan: 500,
            tint: [0x6622AA, 0x4400AA, 0x00BFFF],
            emitting: false,
            quantity: 15,
            frequency: -1
        }).setDepth(50);

        // Shroud ambient wisps (continuous near shroud edge)
        this.shroudEmitter = scene.add.particles(0, 0, 'pixel', {
            speed: { min: 10, max: 40 },
            angle: { min: 250, max: 290 },
            scale: { start: 2, end: 0 },
            alpha: { start: 0.4, end: 0 },
            lifespan: 1500,
            tint: [0x00BFFF, 0x0044AA, 0x1A0A2E],
            emitting: false,
            quantity: 1,
            frequency: 200
        }).setDepth(50);

        // Corruption pool bubbles
        this.corruptionEmitter = scene.add.particles(0, 0, 'pixel', {
            speed: { min: 10, max: 30 },
            angle: { min: 250, max: 290 },
            scale: { start: 1.5, end: 0 },
            alpha: { start: 0.6, end: 0 },
            lifespan: 800,
            tint: [0x5500AA, 0x3A0055],
            emitting: false,
            quantity: 1,
            frequency: 400
        }).setDepth(50);

        // Landing dust puff
        this.landEmitter = scene.add.particles(0, 0, 'pixel', {
            speed: { min: 20, max: 60 },
            angle: { min: 150, max: 210 },
            scale: { start: 1.5, end: 0 },
            alpha: { start: 0.5, end: 0 },
            lifespan: 350,
            tint: [0x8A7A6A, 0x5A4A3A, 0xAA9A8A],
            emitting: false,
            quantity: 6,
            frequency: -1
        }).setDepth(49);

        // Double jump burst
        this.doubleJumpEmitter = scene.add.particles(0, 0, 'pixel', {
            speed: { min: 40, max: 100 },
            angle: { min: 200, max: 340 },
            scale: { start: 2, end: 0 },
            alpha: { start: 0.9, end: 0 },
            lifespan: 350,
            tint: [0xFFCC00, 0xFFDD88, 0xFFAA33],
            emitting: false,
            quantity: 8,
            frequency: -1
        }).setDepth(50);

        // Wall slide dust
        this.wallSlideEmitter = scene.add.particles(0, 0, 'pixel', {
            speed: { min: 10, max: 30 },
            angle: { min: 250, max: 290 },
            scale: { start: 1.5, end: 0 },
            alpha: { start: 0.5, end: 0 },
            lifespan: 300,
            tint: [0x8A7A6A, 0x5A4A3A],
            emitting: false,
            quantity: 1,
            frequency: 80
        }).setDepth(49);

        // Glider wind particles
        this.gliderEmitter = scene.add.particles(0, 0, 'pixel', {
            speed: { min: 30, max: 80 },
            angle: { min: 160, max: 200 },
            scale: { start: 1.5, end: 0 },
            alpha: { start: 0.4, end: 0 },
            lifespan: 400,
            tint: [0xBBDDFF, 0x88BBDD, 0xDDEEFF],
            emitting: false,
            quantity: 1,
            frequency: 60
        }).setDepth(49);

        // Running footstep dust
        this.footstepEmitter = scene.add.particles(0, 0, 'pixel', {
            speed: { min: 5, max: 20 },
            angle: { min: 160, max: 200 },
            scale: { start: 1, end: 0 },
            alpha: { start: 0.3, end: 0 },
            lifespan: 250,
            tint: [0x8A7A6A, 0x5A4A3A],
            emitting: false,
            quantity: 2,
            frequency: -1
        }).setDepth(48);

        // Mining sparkles (continuous while mining)
        this.miningEmitter = scene.add.particles(0, 0, 'pixel', {
            speed: { min: 15, max: 40 },
            angle: { min: 220, max: 320 },
            scale: { start: 1.5, end: 0 },
            alpha: { start: 0.7, end: 0 },
            lifespan: 400,
            tint: [0x00FFCC, 0x80FFE0],
            emitting: false,
            quantity: 1,
            frequency: 150
        }).setDepth(50);

        // ─── Biome atmosphere emitters ───
        // These are continuous, camera-fixed, low-density ambient particles.

        this._biomeEmitter = scene.add.particles(0, 0, 'pixel', {
            speed: { min: 5, max: 20 },
            angle: { min: 250, max: 290 },
            scale: { start: 1.5, end: 0 },
            alpha: { start: 0.3, end: 0 },
            lifespan: 3000,
            tint: [0x8A7A6A],
            emitting: false,
            quantity: 1,
            frequency: 300,
            emitZone: { type: 'random', source: new Phaser.Geom.Rectangle(-500, -400, 1000, 800) }
        }).setScrollFactor(0).setDepth(2);

        this._biomeConfigs = {
            springlands: {
                tint: [0x8A7A6A, 0xAA9A8A, 0x6A5A4A],
                speed: { min: 3, max: 12 },
                angle: { min: 230, max: 310 },
                lifespan: 4000,
                alpha: { start: 0.2, end: 0 },
                scale: { start: 1, end: 0 },
                frequency: 400,
            },
            revelwood: {
                tint: [0x44AA44, 0x228822, 0x66CC66],
                speed: { min: 8, max: 25 },
                angle: { min: 240, max: 300 },
                lifespan: 3500,
                alpha: { start: 0.35, end: 0 },
                scale: { start: 1.5, end: 0 },
                frequency: 250,
            },
            nomad_highlands: {
                tint: [0xBBAA88, 0xDDCC99, 0x998866],
                speed: { min: 15, max: 40 },
                angle: { min: 170, max: 200 },
                lifespan: 2500,
                alpha: { start: 0.3, end: 0 },
                scale: { start: 1, end: 0 },
                frequency: 150,
            },
            kindlewastes: {
                tint: [0xFF6600, 0xFF4400, 0xFFAA33],
                speed: { min: 10, max: 35 },
                angle: { min: 250, max: 290 },
                lifespan: 3000,
                alpha: { start: 0.5, end: 0 },
                scale: { start: 2, end: 0 },
                frequency: 120,
            },
        };

        // Ground slam dust burst
        this.slamEmitter = scene.add.particles(0, 0, 'pixel', {
            speed: { min: 60, max: 200 },
            angle: { min: 160, max: 200 },
            scale: { start: 3, end: 0 },
            alpha: { start: 0.8, end: 0 },
            lifespan: 600,
            tint: [0x8A7A6A, 0x5A4A3A, 0xAA9A8A],
            emitting: false,
            quantity: 20,
            frequency: -1
        }).setDepth(50);
    }

    dashTrail(x, y) {
        this.dashEmitter.setPosition(x, y);
        if (!this.dashEmitter.emitting) {
            this.dashEmitter.start();
        }
    }

    stopDashTrail() {
        this.dashEmitter.stop();
    }

    mineComplete(x, y) {
        this.mineEmitter.setPosition(x, y);
        this.mineEmitter.explode();
    }

    wispCollect(x, y) {
        this.wispEmitter.setPosition(x, y);
        this.wispEmitter.explode();
    }

    wraithBanish(x, y) {
        this.wraithEmitter.setPosition(x, y);
        this.wraithEmitter.explode();
    }

    updateShroudAmbient(shroudX) {
        this.shroudEmitter.setPosition(shroudX, Phaser.Math.Between(100, 600));
        if (!this.shroudEmitter.emitting) {
            this.shroudEmitter.start();
        }
    }

    corruptionBubbles(x, y, active) {
        this.corruptionEmitter.setPosition(x, y);
        if (active && !this.corruptionEmitter.emitting) {
            this.corruptionEmitter.start();
        } else if (!active && this.corruptionEmitter.emitting) {
            this.corruptionEmitter.stop();
        }
    }

    landingDust(x, y) {
        this.landEmitter.setPosition(x, y);
        this.landEmitter.explode();
    }

    groundSlam(x, y) {
        this.slamEmitter.setPosition(x, y);
        this.slamEmitter.explode();
    }

    footstep(x, y) {
        this.footstepEmitter.setPosition(x, y);
        this.footstepEmitter.explode();
    }

    doubleJump(x, y) {
        this.doubleJumpEmitter.setPosition(x, y);
        this.doubleJumpEmitter.explode();
    }

    wallSlide(x, y, active) {
        this.wallSlideEmitter.setPosition(x, y);
        if (active && !this.wallSlideEmitter.emitting) {
            this.wallSlideEmitter.start();
        } else if (!active && this.wallSlideEmitter.emitting) {
            this.wallSlideEmitter.stop();
        }
    }

    gliderTrail(x, y, active) {
        this.gliderEmitter.setPosition(x, y);
        if (active && !this.gliderEmitter.emitting) {
            this.gliderEmitter.start();
        } else if (!active && this.gliderEmitter.emitting) {
            this.gliderEmitter.stop();
        }
    }

    miningSparkles(x, y, active) {
        this.miningEmitter.setPosition(x, y);
        if (active && !this.miningEmitter.emitting) {
            this.miningEmitter.start();
        } else if (!active && this.miningEmitter.emitting) {
            this.miningEmitter.stop();
        }
    }

    setBiomeAtmosphere(biomeId) {
        const cfg = this._biomeConfigs[biomeId];
        if (!cfg) {
            this._biomeEmitter.stop();
            return;
        }
        this._biomeEmitter.setConfig({
            speed: cfg.speed,
            angle: cfg.angle,
            lifespan: cfg.lifespan,
            alpha: cfg.alpha,
            scale: cfg.scale,
            tint: cfg.tint,
            frequency: cfg.frequency,
            quantity: 1,
            emitZone: { type: 'random', source: new Phaser.Geom.Rectangle(-500, -400, 1000, 800) }
        });
        if (!this._biomeEmitter.emitting) {
            this._biomeEmitter.start();
        }
    }
}
