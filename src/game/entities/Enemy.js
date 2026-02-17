import Phaser from 'phaser';
import { ENEMIES, ENEMY_SPRITES, ENEMY_AI, FELL_MUTATION } from '../constants.js';

/**
 * Data-driven enemy. Constructed from an ENEMIES config entry.
 * Uses Elthen character sprites (tinted) when available, falls back to procedural textures.
 */
export class Enemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, typeId) {
        const def = ENEMIES[typeId];
        const spriteCfg = ENEMY_SPRITES[typeId];
        const hasSprite = spriteCfg && scene.textures.exists(spriteCfg.spriteKey);
        const textureKey = hasSprite ? spriteCfg.spriteKey : def.texture;
        const startFrame = hasSprite && !spriteCfg.isAtlas ? 0 : undefined;
        super(scene, x, y, textureKey, startFrame);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.def = def;
        this.typeId = typeId;
        this.alive = true;
        this.stunned = false;
        this.stunTimer = 0;
        this._hasSprite = hasSprite;
        this._spriteCfg = spriteCfg;
        this._enemyTint = hasSprite ? spriteCfg.tint : null;

        // AI state machine
        this.aiState = 'patrol';
        this.spawnX = x;
        this.patrolDirection = Math.random() < 0.5 ? 1 : -1;
        this.chargeBurstTimer = 0;
        this._telegraphTimer = 0;

        // Fell mutation (Feature 3)
        this.aliveTimer = 0;
        this.mutated = false;
        this.hitsToKill = 1;

        // Shaman buff timer (Feature 4)
        this._shamanBuffTimer = 0;
        this._shamanBuffAura = null;
        this._speedBuffTimer = 0;
        this._baseSpeed = def.speed;

        // Hollow skeleton reassembly (Feature 10)
        this._reassembled = false;

        // Hollow mage shroud pocket timer (Feature 10)
        this._shroudPocketTimer = 0;

        // Hollow reaper teleport cooldown (Feature 10)
        this._teleportCooldown = 0;

        this.body.setAllowGravity(!def.stationary);
        this.body.setSize(def.width - 4, def.height - 4);
        this.setDepth(4);

        if (hasSprite) {
            this.setDisplaySize(spriteCfg.displaySize, spriteCfg.displaySize);
            // Center physics body within the sprite frame
            const fw = this.frame.width;
            const fh = this.frame.height;
            const bodyOffX = (fw - (def.width - 4)) / 2;
            const bodyOffY = fh - (def.height - 4) - 2;
            this.body.setOffset(bodyOffX, bodyOffY);
            // Apply enemy tint and start idle animation
            if (spriteCfg.tint) this.setTint(spriteCfg.tint);
            if (!def.stationary) this.play(spriteCfg.idleAnim);
        }

        if (def.stationary) {
            this.body.setImmovable(true);
            this.body.setAllowGravity(false);
            if (hasSprite) {
                // Animated vine: play idle anim + subtle body sway
                this.play(spriteCfg.idleAnim);
                scene.tweens.add({
                    targets: this,
                    y: y - 3,
                    duration: 1800,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
            } else {
                // Procedural vine: scaleX sway
                scene.tweens.add({
                    targets: this,
                    scaleX: { from: 0.95, to: 1.05 },
                    duration: 1500,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
            }
        } else {
            // Ghostly hover for Fell, stomping bob for Vukah
            scene.tweens.add({
                targets: this,
                y: y - (typeId.startsWith('vukah') ? 3 : 6),
                duration: typeId.startsWith('vukah') ? 800 : 1200,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }

        // Fell enemies flicker; others don't
        if (typeId.startsWith('fell_') && !hasSprite) {
            scene.tweens.add({
                targets: this,
                alpha: { from: 0.6, to: 0.9 },
                duration: 400,
                yoyo: true,
                repeat: -1
            });
        }
    }

    stun(duration) {
        if (!this.alive || this.stunned) return;
        this.stunned = true;
        this.stunTimer = duration;
        this.setTint(0xFFFF00);
        this.setVelocity(0, 0);

        // Pulsing alpha while stunned
        this._stunTween = this.scene.tweens.add({
            targets: this,
            alpha: { from: 1, to: 0.4 },
            duration: 200,
            yoyo: true,
            repeat: -1
        });

        this.scene.time.delayedCall(duration, () => {
            if (this._stunTween) {
                this._stunTween.destroy();
                this._stunTween = null;
            }
            if (this.active && this.alive) {
                this.stunned = false;
                this.setAlpha(1);
                // Restore enemy tint or clear
                if (this.mutated) {
                    this.setTint(0xAA22FF);
                } else if (this._enemyTint) {
                    this.setTint(this._enemyTint);
                } else {
                    this.clearTint();
                }
            }
        });
    }

    applySpeedBuff(duration, mult) {
        if (this._speedBuffTimer > 0) return;
        this._speedBuffTimer = duration;
        this._buffedSpeed = this._baseSpeed * mult;
    }

    chasePlayer(playerX, playerY, delta) {
        if (!this.alive || this.def.stationary || this.stunned) return;

        const distToPlayer = Phaser.Math.Distance.Between(this.x, this.y, playerX, playerY);

        // Fell mutation timer (Feature 3)
        if (this.aiState === 'chase' && !this.mutated) {
            this.aliveTimer += delta;
            if (this.aliveTimer >= FELL_MUTATION.TIME_TO_MUTATE) {
                this.mutated = true;
                this.hitsToKill = 2;
                this.setTint(0xAA22FF);
                this.setScale(this.scaleX * 1.2, this.scaleY * 1.2);
                this._baseSpeed = this.def.speed * FELL_MUTATION.SPEED_MULT;
            }
        }

        // Speed buff decay
        if (this._speedBuffTimer > 0) {
            this._speedBuffTimer -= delta;
            if (this._speedBuffTimer <= 0) {
                this._buffedSpeed = 0;
            }
        }

        // Shaman buff aura (Feature 4)
        if (this.def.shaman && this.aiState === 'chase') {
            this._shamanBuffTimer += delta;
            if (this._shamanBuffTimer >= 3000) {
                this._shamanBuffTimer = 0;
                this.scene.events.emit('shamanBuff', this.x, this.y);
            }
        }

        // Hollow mage shroud pocket (Feature 10)
        if (this.def.shroudPocket && this.aiState === 'chase') {
            this._shroudPocketTimer += delta;
            if (this._shroudPocketTimer >= 5000) {
                this._shroudPocketTimer = 0;
                this.scene.events.emit('hollowMagePocket', this.x, this.y);
            }
        }

        // Hollow reaper teleport (Feature 10)
        if (this.def.teleport && this.aiState === 'chase') {
            this._teleportCooldown = Math.max(0, this._teleportCooldown - delta);
            if (distToPlayer > 200 && this._teleportCooldown <= 0) {
                this._teleportCooldown = 5000;
                const dir = playerX > this.x ? -1 : 1;
                this.setPosition(playerX + dir * 80, playerY);
                // Teleport VFX
                const flash = this.scene.add.circle(this.x, this.y, 15, 0x4444AA, 0.5).setDepth(55);
                this.scene.tweens.add({
                    targets: flash,
                    alpha: 0,
                    scaleX: 2,
                    scaleY: 2,
                    duration: 300,
                    onComplete: () => flash.destroy(),
                });
            }
        }

        // Determine effective speed
        let effectiveSpeed = this._speedBuffTimer > 0 ? this._buffedSpeed : this._baseSpeed;

        switch (this.aiState) {
            case 'patrol': {
                // Drift ±PATROL_RANGE from spawn at reduced speed
                const patrolSpeed = effectiveSpeed * ENEMY_AI.PATROL_SPEED_MULT;
                this.setVelocityX(this.patrolDirection * patrolSpeed);
                this.setVelocityY(0);

                // Reverse at patrol boundaries
                if (Math.abs(this.x - this.spawnX) > ENEMY_AI.PATROL_RANGE) {
                    this.patrolDirection *= -1;
                }

                // Transition to telegraph when player is close
                if (distToPlayer < ENEMY_AI.CHASE_RANGE) {
                    this.aiState = 'telegraph';
                    this._telegraphTimer = ENEMY_AI.TELEGRAPH_DURATION;
                    this.setVelocity(0, 0);
                    this.setTint(0xFFFFFF); // white flash
                }
                break;
            }

            case 'telegraph': {
                this._telegraphTimer -= delta;
                if (this._telegraphTimer <= 0) {
                    // Restore tint
                    if (this.mutated) {
                        this.setTint(0xAA22FF);
                    } else if (this._enemyTint) {
                        this.setTint(this._enemyTint);
                    } else {
                        this.clearTint();
                    }
                    this.aiState = 'chase';
                    // Vukah gets a speed burst
                    if (this.typeId.startsWith('vukah') && !this.def.shaman) {
                        this.chargeBurstTimer = ENEMY_AI.VUKAH_BURST_DURATION;
                    }
                }
                break;
            }

            case 'chase': {
                // Shaman kiting (Feature 4) — stays at 200px from player
                if (this.def.shaman) {
                    const kiteDistance = 200;
                    if (distToPlayer < kiteDistance - 30) {
                        // Too close — retreat
                        const angle = Phaser.Math.Angle.Between(playerX, playerY, this.x, this.y);
                        this.setVelocityX(Math.cos(angle) * effectiveSpeed);
                        this.setVelocityY(Math.sin(angle) * effectiveSpeed * 0.3);
                    } else if (distToPlayer > kiteDistance + 30) {
                        // Too far — approach
                        const angle = Phaser.Math.Angle.Between(this.x, this.y, playerX, playerY);
                        this.setVelocityX(Math.cos(angle) * effectiveSpeed);
                        this.setVelocityY(Math.sin(angle) * effectiveSpeed * 0.3);
                    } else {
                        // Sweet spot — strafe
                        this.setVelocityX(this.patrolDirection * effectiveSpeed * 0.5);
                        this.setVelocityY(0);
                    }
                }
                // Hollow mage kiting (Feature 10)
                else if (this.def.shroudPocket && distToPlayer < 180) {
                    const angle = Phaser.Math.Angle.Between(playerX, playerY, this.x, this.y);
                    this.setVelocityX(Math.cos(angle) * effectiveSpeed);
                    this.setVelocityY(Math.sin(angle) * effectiveSpeed * 0.3);
                }
                // Fell ranger kites: retreats when player is too close
                else if (this.typeId === 'fell_ranger' && distToPlayer < ENEMY_AI.RANGER_KITE_DISTANCE) {
                    const angle = Phaser.Math.Angle.Between(playerX, playerY, this.x, this.y);
                    this.setVelocityX(Math.cos(angle) * effectiveSpeed);
                    this.setVelocityY(Math.sin(angle) * effectiveSpeed * 0.3);
                } else {
                    // Normal chase
                    let speed = effectiveSpeed;
                    if (this.chargeBurstTimer > 0) {
                        speed *= ENEMY_AI.VUKAH_BURST_MULT;
                        this.chargeBurstTimer -= delta;
                    }
                    const angle = Phaser.Math.Angle.Between(this.x, this.y, playerX, playerY);
                    this.setVelocityX(Math.cos(angle) * speed);
                    this.setVelocityY(Math.sin(angle) * speed * 0.3);
                }

                // Return to patrol when player is far away
                if (distToPlayer > ENEMY_AI.CHASE_RANGE * 1.5) {
                    this.aiState = 'patrol';
                }
                break;
            }
        }

        this.setFlipX(this.body.velocity.x > 0);

        if (this._hasSprite) {
            const isMoving = Math.abs(this.body.velocity.x) > 5;
            const desiredAnim = isMoving ? this._spriteCfg.moveAnim : this._spriteCfg.idleAnim;
            const currentKey = this.anims.currentAnim ? this.anims.currentAnim.key : null;
            if (currentKey !== desiredAnim) {
                this.play(desiredAnim, true);
            }
        }
    }

    banish() {
        if (!this.alive) return;

        // Fell mutation armor (Feature 3): requires multiple hits
        if (this.hitsToKill > 1) {
            this.hitsToKill--;
            this.setTint(0xFFFFFF);
            this.scene.time.delayedCall(100, () => {
                if (this.active && this.alive) this.setTint(0xAA22FF);
            });
            return;
        }

        this.alive = false;
        this.body.enable = false;
        if (this._stunTween) {
            this._stunTween.destroy();
            this._stunTween = null;
        }
        this.scene.tweens.killTweensOf(this);

        // Fell critter split on mutated death (Feature 3)
        if (this.typeId === 'fell_critter' && this.mutated) {
            this.scene.events.emit('fellSplit', this.x, this.y);
        }

        // Hollow skeleton reassembly (Feature 10)
        if (this.def.reassemble && !this._reassembled && Math.random() < 0.5) {
            const rx = this.x;
            const ry = this.y;
            this.scene.time.delayedCall(3000, () => {
                this.scene.events.emit('skeletonReassemble', rx, ry);
            });
        }

        // Shaman death: clear all buffs (Feature 4)
        if (this.def.shaman) {
            this.scene.events.emit('shamanDied');
        }

        // Fell vine: play death animation before fade-out
        if (this.typeId === 'fell_vine' && this._hasSprite) {
            this.play('fell_vine_death');
            this.once('animationcomplete', () => {
                if (!this.active) return;
                this.scene.tweens.add({
                    targets: this,
                    alpha: 0,
                    duration: 300,
                    ease: 'Power2',
                    onComplete: () => this.destroy()
                });
            });
            return;
        }

        // White flash before scale-up + fade
        this.setTint(0xFFFFFF);
        this.scene.time.delayedCall(80, () => {
            if (!this.active) return;
            this.clearTint();
            this.scene.tweens.add({
                targets: this,
                scaleX: 2.5,
                scaleY: 2.5,
                alpha: 0,
                duration: 300,
                ease: 'Power2',
                onComplete: () => this.destroy()
            });
        });
    }
}
