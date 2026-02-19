import Phaser from 'phaser';
import { WORLD, ENEMIES } from '../constants.js';
import { Enemy } from './Enemy.js';

const AI_STATE = { IDLE: 0, TELEGRAPH: 1, ATTACK: 2, STUNNED: 3 };

export class Boss extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, def, surfaceY) {
        const displayW = 48 * def.scale;
        const displayH = 48 * def.scale;
        // Spawn at the player's surface level so the boss appears on the same ground
        const y = (surfaceY || WORLD.GROUND_Y) - displayH / 2;
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

        this.setDisplaySize(displayW, displayH);
        this.setDepth(10);

        // Calculate body in source-frame coordinates so that non-uniform
        // scaling (setDisplaySize on non-square sprites) produces correct
        // world-space body dimensions (~40x60 px) at the sprite's feet
        const fw = this.frame.width;
        const fh = this.frame.height;
        const scaleX = displayW / fw;
        const scaleY = displayH / fh;
        const srcBodyW = Math.min(40 / scaleX, fw);
        const srcBodyH = Math.min(60 / scaleY, fh);
        this.body.setSize(srcBodyW, srcBodyH, false);
        this.body.setOffset((fw - srcBodyW) / 2, fh - srcBodyH);

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

    _startTelegraph(playerX) {
        this.aiState = AI_STATE.TELEGRAPH;
        this.stateTimer = 300;
        this.setVelocityX(0);
        // Flash white + red ground marker
        this.setTintFill(0xFF4444);
        const dir = playerX > this.x ? 1 : -1;
        this._telegraphMarker = this.scene.add.rectangle(
            this.x + dir * 60, this.y + 20, 100, 6, 0xFF0000, 0.5
        ).setDepth(54);
        this.scene.tweens.add({
            targets: this._telegraphMarker,
            alpha: { from: 0.2, to: 0.8 },
            duration: 100, yoyo: true, repeat: 1
        });
        // Play attack anim during telegraph
        this._playAttackAnim();
    }

    _endTelegraph() {
        if (this.def.tint) this.setTint(this.def.tint);
        else this.clearTint();
        if (this._telegraphMarker && this._telegraphMarker.active) {
            this._telegraphMarker.destroy();
            this._telegraphMarker = null;
        }
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

        // Telegraph (pre-attack warning)
        if (this.aiState === AI_STATE.TELEGRAPH) {
            this.stateTimer -= delta;
            if (this.stateTimer <= 0) {
                this._endTelegraph();
                this.aiState = AI_STATE.IDLE;
                this.attackTimer = -1; // force immediate attack on next check
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
                if (Math.abs(dx) < 250 || Math.abs(dx) < 150) {
                    // Telegraph before attack
                    this._pendingAttack = Math.abs(dx) < 150 ? 'ground_pound' : 'charge';
                    this._startTelegraph(playerX);
                }
            }

            // Execute pending attack after telegraph
            if (this.attackTimer === -1) {
                this.attackTimer = 0;
                if (this._pendingAttack === 'charge') {
                    this.aiState = AI_STATE.ATTACK;
                    this.stateTimer = 800;
                    const chargeDir = dx > 0 ? 1 : -1;
                    this.setVelocityX(chargeDir * this.def.chargeSpeed * speedMult);
                } else {
                    this.scene.events.emit('bossGroundPound', this.x, this.def.groundPoundRadius);
                }
                this._pendingAttack = null;
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
