import Phaser from 'phaser';
import { WORLD, ENEMIES } from '../constants.js';
import { Enemy } from './Enemy.js';

const AI_STATE = { IDLE: 0, TELEGRAPH: 1, ATTACK: 2, STUNNED: 3 };

export class Boss extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, def) {
        const y = WORLD.GROUND_Y - 60;
        super(scene, x, y, def.spriteKey);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.def = def;
        this.maxHealth = def.health;
        this.health = def.health;
        this.currentPhase = 1;
        this.aiState = AI_STATE.IDLE;
        this.stateTimer = 0;
        this.attackTimer = 0;
        this.stunTimer = 0;
        this.alive = true;

        const displayH = 48 * def.scale;
        this.setDisplaySize(48 * def.scale, displayH);
        this.setDepth(10);
        this.body.setSize(40, 60);
        // Put physics body at the bottom of the display so the sprite
        // sits ON the ground instead of sinking into it
        this.body.setOffset((48 * def.scale - 40) / 2, displayH - 60);
        this.body.setAllowGravity(true);
        this.setCollideWorldBounds(false);

        if (def.tint) this.setTint(def.tint);

        // Play idle animation if defined
        if (def.idleAnim && this.scene.anims.exists(def.idleAnim)) {
            this.play(def.idleAnim);
        }
    }

    hit() {
        if (!this.alive) return;
        this.health--;

        // Flash white on hit
        this.setTintFill(0xFFFFFF);
        this.scene.time.delayedCall(100, () => {
            if (this.active) {
                if (this.def.tint) this.setTint(this.def.tint);
                else this.clearTint();
            }
        });

        // Phase transition at 50%
        if (this.currentPhase === 1 && this.health <= this.maxHealth / 2) {
            this.currentPhase = 2;
            this.scene.cameras.main.shake(400, 0.008);
            this.scene.cameras.main.flash(200, 255, 100, 0);
        }

        if (this.health <= 0) {
            this.alive = false;
            this.scene.events.emit('bossDefeated', this.def);
        }
    }

    stun(duration) {
        this.aiState = AI_STATE.STUNNED;
        this.stunTimer = duration;
        this.setVelocityX(0);
    }

    update(delta, playerX, playerY) {
        if (!this.alive) return;

        const speedMult = this.currentPhase === 2 ? this.def.phase2SpeedMult : 1;

        // Stunned
        if (this.aiState === AI_STATE.STUNNED) {
            this.stunTimer -= delta;
            if (this.stunTimer <= 0) {
                this.aiState = AI_STATE.IDLE;
            }
            return;
        }

        // Animation switching (idle/move based on velocity)
        if (this.def.idleAnim) {
            const isMoving = Math.abs(this.body.velocity.x) > 5;
            const desiredAnim = isMoving ? this.def.moveAnim : this.def.idleAnim;
            const currentKey = this.anims.currentAnim ? this.anims.currentAnim.key : null;
            if (currentKey !== desiredAnim && currentKey !== this.def.attackAnim) {
                this.play(desiredAnim, true);
            }
            this.setFlipX(this.body.velocity.x > 0);
        }

        this.attackTimer += delta;
        const interval = this.def.attackInterval / speedMult;

        switch (this.def.id) {
            case 'revelwood':
                this._updateVineQueen(delta, playerX, playerY, interval, speedMult);
                break;
            case 'nomad_highlands':
                this._updateChieftain(delta, playerX, playerY, interval, speedMult);
                break;
            case 'kindlewastes':
                this._updatePyrelord(delta, playerX, playerY, interval, speedMult);
                break;
            case 'hollow':
                this._updateHollowCyclops(delta, playerX, playerY, interval, speedMult);
                break;
            case 'albaneve':
                this._updateFrostWyvern(delta, playerX, playerY, interval, speedMult);
                break;
        }
    }

    _updateVineQueen(delta, playerX, playerY, interval, speedMult) {
        // Stationary — spawns vine minions, vine sweep
        this.setVelocityX(0);

        if (this.attackTimer >= interval) {
            this.attackTimer = 0;
            const count = this.currentPhase === 2 ? 3 : this.def.vineSpawnCount;

            // Alternate between spawn minions and sweep
            if (Math.random() < 0.5) {
                // Spawn fell_vine minions
                for (let i = 0; i < count; i++) {
                    const offset = (Math.random() - 0.5) * 200;
                    const def = ENEMIES['fell_vine'] || ENEMIES['fell_critter'];
                    if (def) {
                        const enemy = new Enemy(this.scene, this.x + offset, WORLD.GROUND_Y - def.height / 2, 'fell_vine');
                        this.scene.enemyGroup.add(enemy);
                    }
                }
            } else {
                // Vine sweep: damage zone
                this.scene.events.emit('bossVineSweep', this.x, this.def.vineSweepWidth * speedMult);
            }
        }
    }

    _updateChieftain(delta, playerX, playerY, interval, speedMult) {
        const dx = playerX - this.x;

        if (this.aiState === AI_STATE.IDLE) {
            // Move toward player
            const dir = dx > 0 ? 1 : -1;
            this.setVelocityX(dir * 80 * speedMult);
            this.setFlipX(dir < 0);

            if (this.attackTimer >= interval) {
                this.attackTimer = 0;
                if (Math.abs(dx) < 250) {
                    // Charge
                    this.aiState = AI_STATE.ATTACK;
                    this.stateTimer = 800;
                    const chargeDir = dx > 0 ? 1 : -1;
                    this.setVelocityX(chargeDir * this.def.chargeSpeed * speedMult);
                } else if (Math.abs(dx) < 150) {
                    // Ground pound
                    this.scene.events.emit('bossGroundPound', this.x, this.def.groundPoundRadius);
                }
            }
        } else if (this.aiState === AI_STATE.ATTACK) {
            this.stateTimer -= delta;
            if (this.stateTimer <= 0) {
                this.aiState = AI_STATE.IDLE;
                this.setVelocityX(0);
            }
        }
    }

    _playAttackAnim() {
        if (this.def.attackAnim && this.scene.anims.exists(this.def.attackAnim)) {
            this.play(this.def.attackAnim);
            this.once('animationcomplete', () => {
                if (this.active && this.alive && this.def.idleAnim) {
                    this.play(this.def.idleAnim, true);
                }
            });
        }
    }

    _updateHollowCyclops(delta, playerX, playerY, interval, speedMult) {
        const dx = playerX - this.x;

        if (this.aiState === AI_STATE.IDLE) {
            const dir = dx > 0 ? 1 : -1;
            this.setVelocityX(dir * 70 * speedMult);
            this.setFlipX(dir < 0);

            if (this.attackTimer >= interval) {
                this.attackTimer = 0;
                if (Math.abs(dx) < 180) {
                    // Ground pound
                    this._playAttackAnim();
                    this.scene.events.emit('bossGroundPound', this.x, this.def.groundPoundRadius);
                } else {
                    // Summon skeletons
                    for (let i = 0; i < this.def.summonCount; i++) {
                        const offset = (Math.random() - 0.5) * 200;
                        const def = ENEMIES['hollow_skeleton'] || ENEMIES['fell_critter'];
                        if (def) {
                            const enemy = new Enemy(this.scene, this.x + offset, WORLD.GROUND_Y - def.height / 2, 'hollow_skeleton');
                            this.scene.enemyGroup.add(enemy);
                        }
                    }
                }
            }
        }
    }

    _updateFrostWyvern(delta, playerX, playerY, interval, speedMult) {
        const dx = playerX - this.x;
        const dir = dx > 0 ? 1 : -1;
        this.setFlipX(dir < 0);

        if (this.aiState === AI_STATE.IDLE) {
            // Kite at distance
            if (Math.abs(dx) < 150) {
                this.setVelocityX(-dir * 60 * speedMult);
            } else if (Math.abs(dx) > 350) {
                this.setVelocityX(dir * 80 * speedMult);
            } else {
                this.setVelocityX(0);
            }

            if (this.attackTimer >= interval) {
                this.attackTimer = 0;
                if (Math.random() < 0.5 || this.currentPhase === 2) {
                    // Breath attack
                    this._playAttackAnim();
                    this.scene.events.emit('bossVineSweep', this.x, this.def.breathWidth * speedMult);
                } else {
                    // Dive bomb
                    this.aiState = AI_STATE.ATTACK;
                    this.stateTimer = 700;
                    this.setVelocityX(dir * this.def.diveBombSpeed * speedMult);
                }
            }
        } else if (this.aiState === AI_STATE.ATTACK) {
            this.stateTimer -= delta;
            if (this.stateTimer <= 0) {
                this.aiState = AI_STATE.IDLE;
                this.setVelocityX(0);
            }
        }
    }

    _updatePyrelord(delta, playerX, playerY, interval, speedMult) {
        const dx = playerX - this.x;
        const dir = dx > 0 ? 1 : -1;
        this.setFlipX(dir < 0);

        if (this.aiState === AI_STATE.IDLE) {
            // Kite — maintain distance
            if (Math.abs(dx) < 120) {
                this.setVelocityX(-dir * 60 * speedMult); // back away
            } else if (Math.abs(dx) > 300) {
                this.setVelocityX(dir * 80 * speedMult); // approach
            } else {
                this.setVelocityX(0);
            }

            if (this.attackTimer >= interval) {
                this.attackTimer = 0;
                if (Math.random() < 0.6 || this.currentPhase === 2) {
                    // Fire projectile
                    this.scene.events.emit('bossProjectile', this.x, this.y, dir, this.def.projectileSpeed * speedMult);
                } else {
                    // Dash attack
                    this.aiState = AI_STATE.ATTACK;
                    this.stateTimer = 600;
                    this.setVelocityX(dir * this.def.dashSpeed * speedMult);
                }
            }
        } else if (this.aiState === AI_STATE.ATTACK) {
            this.stateTimer -= delta;
            if (this.stateTimer <= 0) {
                this.aiState = AI_STATE.IDLE;
                this.setVelocityX(0);
            }
        }
    }
}
