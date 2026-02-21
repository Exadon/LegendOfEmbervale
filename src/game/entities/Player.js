import Phaser from 'phaser';
import { PLAYER, FLAME_STEP, CORRUPTION_POOL, DOUBLE_JUMP, WALL_SLIDE, GLIDER, GROUND_SLAM, FLAME_BURST } from '../constants.js';
import { SkillManager } from '../systems/SkillManager.js';

export class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        const classDef = SkillManager.activeClass;
        super(scene, x, y, classDef.spriteKey, classDef.isAtlas ? undefined : 0);
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.setDepth(3);

        // Initialize sprite for the selected class
        const fw = classDef.frameSize;
        const fh = classDef.frameHeight || fw;
        const displaySize = classDef.displaySize || Math.max(48, Math.round(fw * 0.75));
        this._targetScale = displaySize / fw;
        this.setScale(this._targetScale);
        // Constant world-space body (28×44) regardless of sprite scale
        const bodyW = (PLAYER.WIDTH - 4) / this._targetScale;
        const bodyH = (PLAYER.HEIGHT - 4) / this._targetScale;
        this.body.setSize(bodyW, bodyH);
        const bodyOffX = (fw - bodyW) / 2;
        const feetY = classDef.feetRatio ? fh * classDef.feetRatio : fh - 2;
        const bodyOffY = feetY - bodyH;
        this.body.setOffset(bodyOffX, bodyOffY);
        this.setCollideWorldBounds(true);

        // Play idle animation immediately
        this.play(classDef.idleAnim);

        this.isMining = false;
        this.miningTimer = 0;

        // Flame Step (dash)
        this.isDashing = false;
        this.dashCooldownTimer = 0;  // counts down to 0
        this.dashTimer = 0;          // active dash time remaining
        this.isInvincible = false;
        this.invincibleTimer = 0;
        this.facingRight = true;

        // Corruption slow
        this.inCorruption = false;

        // Double jump
        this.airJumpsRemaining = DOUBLE_JUMP.MAX_AIR_JUMPS;

        // Wall slide / wall jump
        this.isWallSliding = false;
        this.wallSideRight = false;

        // Ground slam / S ability
        this.isSlamming = false;
        this.sAbilityCooldownTimer = 0;

        // Coyote time (brief forgiveness window after leaving ground)
        this.coyoteTimer = 0;
        this._wasOnFloor = false;

        // Jump buffer (press jump slightly before landing and still jump)
        this.jumpBufferTimer = 0;

        // Hit invincibility (post-damage protection)
        this.hitInvincibleTimer = 0;

        // Flame burst
        this.flameBurstCooldownTimer = 0;

        // Glider
        this.isGliding = false;
        this.gliderSprite = null;

        // Class attack
        this.classAttackCooldownTimer = 0;
        this.isClassAttacking = false;
        this._classDef = classDef;
        this._attackFallbackTimer = null;

        // Run modifier flags
        this._modifierNoDash = false;
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);
        if (this._targetScale != null && Math.abs(this.scaleX - this._targetScale) > 0.001) {
            this.setScale(this._targetScale);
        }
    }

    get dashReady() {
        return this.dashCooldownTimer <= 0 && !this.isDashing;
    }

    get dashCooldownPct() {
        if (this.dashCooldownTimer <= 0) return 1;
        const effectiveCooldown = SkillManager.getValue('flameStep.cooldown', FLAME_STEP.COOLDOWN);
        return 1 - (this.dashCooldownTimer / effectiveCooldown);
    }

    get flameBurstReady() {
        return this.flameBurstCooldownTimer <= 0;
    }

    get flameBurstCooldownPct() {
        if (this.flameBurstCooldownTimer <= 0) return 1;
        const effectiveCooldown = SkillManager.getValue('flameBurst.cooldown', FLAME_BURST.COOLDOWN);
        return 1 - (this.flameBurstCooldownTimer / effectiveCooldown);
    }

    get classAttackReady() {
        return this.classAttackCooldownTimer <= 0 && !this.isClassAttacking;
    }

    get classAttackCooldownPct() {
        if (this.classAttackCooldownTimer <= 0) return 1;
        const cd = this._classDef.attackCooldown || 1;
        return 1 - (this.classAttackCooldownTimer / cd);
    }

    get sAbilityCooldownPct() {
        if (this.sAbilityCooldownTimer <= 0) return 1;
        return 1 - (this.sAbilityCooldownTimer / 3000);
    }

    swapClassSprite(classDef) {
        // Record body bottom before changes so we can snap to ground after
        const wasOnFloor = this.body.onFloor();
        this.body.updateFromGameObject();
        const oldBodyBottom = this.body.position.y + this.body.height;

        this._classDef = classDef;
        if (classDef.isAtlas) {
            this.setTexture(classDef.spriteKey);
        } else {
            this.setTexture(classDef.spriteKey, 0);
        }
        // Play idle FIRST so this.frame points to a real animation frame,
        // not the __BASE atlas frame (which is the full spritesheet)
        if (classDef.idleAnim) {
            this.play(classDef.idleAnim);
        }

        // frameSize = frame width, frameHeight = frame height (may differ for non-square sprites)
        const fw = classDef.frameSize;
        const fh = classDef.frameHeight || fw;
        const displaySize = classDef.displaySize || Math.max(48, Math.round(fw * 0.75));
        this._targetScale = displaySize / fw;
        this.setScale(this._targetScale);

        // Normalize body to constant world-space size (28×44) regardless of sprite scale
        const bodyW = (PLAYER.WIDTH - 4) / this._targetScale;
        const bodyH = (PLAYER.HEIGHT - 4) / this._targetScale;
        this.body.setSize(bodyW, bodyH);
        const bodyOffX = (fw - bodyW) / 2;
        const feetY = classDef.feetRatio
            ? fh * classDef.feetRatio
            : fh - 2;
        const bodyOffY = feetY - bodyH;
        this.body.setOffset(bodyOffX, bodyOffY);

        // Snap to ground: adjust sprite Y so body bottom stays at the same world Y
        if (wasOnFloor) {
            this.body.updateFromGameObject();
            const newBodyBottom = this.body.position.y + this.body.height;
            const drift = newBodyBottom - oldBodyBottom;
            if (Math.abs(drift) > 0.5) {
                this.y -= drift;
                this.body.updateFromGameObject();
            }
        }
    }

    handleInput(input, delta) {
        // Update timers
        if (this.dashCooldownTimer > 0) {
            this.dashCooldownTimer -= delta;
        }
        if (this.flameBurstCooldownTimer > 0) {
            this.flameBurstCooldownTimer -= delta;
        }
        if (this.invincibleTimer > 0) {
            this.invincibleTimer -= delta;
            if (this.invincibleTimer <= 0) this.isInvincible = false;
        }
        if (this.classAttackCooldownTimer > 0) {
            this.classAttackCooldownTimer -= delta;
        }
        if (this.sAbilityCooldownTimer > 0) {
            this.sAbilityCooldownTimer -= delta;
        }
        if (this.hitInvincibleTimer > 0) {
            this.hitInvincibleTimer -= delta;
        }
        if (this.jumpBufferTimer > 0) {
            this.jumpBufferTimer -= delta;
        }

        const onFloor = this.body.onFloor();

        // Coyote time: brief window after leaving ground where jump is still allowed
        if (onFloor) {
            this.coyoteTimer = 100; // ms
        } else {
            this.coyoteTimer -= delta;
        }
        const canGroundJump = onFloor || this.coyoteTimer > 0;

        // Reset air jumps when on floor
        if (onFloor) {
            this.airJumpsRemaining = SkillManager.getValue('doubleJump.maxAirJumps', DOUBLE_JUMP.MAX_AIR_JUMPS);
            this.isGliding = false;
            // Landing dust particles
            if (!this._wasOnFloor) {
                this.scene.events.emit('playerLanded', this.x, this.y);
                // Consume jump buffer: jump immediately on landing
                if (this.jumpBufferTimer > 0) {
                    this.setVelocityY(SkillManager.getValue('player.jumpVelocity', PLAYER.JUMP_VELOCITY));
                    this.jumpBufferTimer = 0;
                    this.scene.events.emit('jump');
                }
            }
            // Land from slam / class S ability
            if (this.isSlamming) {
                this.isSlamming = false;
                this.sAbilityCooldownTimer = 3000;
                const sType = this._sAbilityType || 'ground_slam';
                this._sAbilityType = null;
                // Clear shadow dive state
                if (sType === 'shadow_dive') {
                    this.setAlpha(1);
                }
                this.scene.events.emit('groundSlam', this.x, this.y, sType);
            }
        }
        this._wasOnFloor = onFloor;

        // Active dash overrides normal movement
        if (this.isDashing) {
            this.dashTimer -= delta;
            if (this.dashTimer <= 0) {
                this.isDashing = false;
                // Don't kill all velocity, just reduce to normal speed
                const dir = this.facingRight ? 1 : -1;
                this.setVelocityX(dir * SkillManager.getValue('player.speed', PLAYER.SPEED));
            }
            return;
        }

        // Ground slam overrides normal movement
        if (this.isSlamming) {
            this.setVelocityX(0);
            return;
        }

        // Wall slide detection
        const wasWallSliding = this.isWallSliding;
        this.isWallSliding = false;

        if (!onFloor && this.body.velocity.y > 0) {
            if (this.body.blocked.right) {
                this.isWallSliding = true;
                this.wallSideRight = true;
            } else if (this.body.blocked.left) {
                this.isWallSliding = true;
                this.wallSideRight = false;
            }
        }

        if (this.isWallSliding) {
            // Clamp fall speed for wall slide
            const maxFall = SkillManager.getValue('wallSlide.maxFallSpeed', WALL_SLIDE.MAX_FALL_SPEED);
            if (this.body.velocity.y > maxFall) {
                this.setVelocityY(maxFall);
            }
        }

        // Glider: cap fall speed while active
        if (this.isGliding) {
            if (onFloor || this.isWallSliding || this.isDashing || this.isSlamming) {
                this.isGliding = false;
            } else if (this.body.velocity.y > GLIDER.MAX_FALL_SPEED) {
                this.setVelocityY(GLIDER.MAX_FALL_SPEED);
            }
        }

        // Normal movement
        const h = input.horizontalAxis;
        const immuneSlow = SkillManager.getFlag('corruption.immuneSlow');
        const speedMult = (this.inCorruption && !immuneSlow) ? CORRUPTION_POOL.SLOW_FACTOR : 1;
        const glideMult = this.isGliding ? GLIDER.HORIZONTAL_BOOST : 1;
        this.setVelocityX(h * SkillManager.getValue('player.speed', PLAYER.SPEED) * speedMult * glideMult);

        if (h < 0) { this.setFlipX(true); this.facingRight = false; }
        else if (h > 0) { this.setFlipX(false); this.facingRight = true; }

        // Jump logic
        if (input.jump) {
            if (this.isWallSliding) {
                // Wall jump: kick away from wall
                const kickDir = this.wallSideRight ? -1 : 1;
                this.setVelocityX(kickDir * WALL_SLIDE.JUMP_VELOCITY_X);
                this.setVelocityY(WALL_SLIDE.JUMP_VELOCITY_Y);
                this.facingRight = kickDir > 0;
                this.setFlipX(!this.facingRight);
                this.isWallSliding = false;
                this.scene.events.emit('wallJump');
                this.airJumpsRemaining = DOUBLE_JUMP.MAX_AIR_JUMPS;
            } else if (canGroundJump) {
                this.setVelocityY(SkillManager.getValue('player.jumpVelocity', PLAYER.JUMP_VELOCITY));
                this.coyoteTimer = 0; // consume coyote
                this.scene.events.emit('jump');
            } else if (this.airJumpsRemaining > 0) {
                // Double jump
                this.airJumpsRemaining--;
                this.setVelocityY(DOUBLE_JUMP.VELOCITY);
                this.scene.events.emit('doubleJump', this.x, this.y);
            } else if (this.isGliding) {
                // Press jump while gliding — cancel glider
                this.isGliding = false;
            } else {
                // All air jumps exhausted — deploy glider or buffer jump
                if (!this.isSlamming) {
                    this.isGliding = true;
                }
                // Buffer the jump so it fires on landing
                this.jumpBufferTimer = 100;
            }
        }

        // Class S ability: S while airborne
        if (input.downJustPressed && !onFloor && !this.isSlamming && this.sAbilityCooldownTimer <= 0) {
            const sType = this._classDef.sAbility ? this._classDef.sAbility.type : 'ground_slam';
            this.isSlamming = true;
            this._sAbilityType = sType;

            if (sType === 'shadow_dive') {
                // Phase through enemies during descent
                this.isInvincible = true;
                this.invincibleTimer = 5000; // cleared on landing
                this.setAlpha(0.3);
                this.setVelocityX(0);
                this.setVelocityY(SkillManager.getValue('groundSlam.velocity', GROUND_SLAM.VELOCITY));
            } else if (sType === 'arcane_mine') {
                // Drop mine at current position, then fall normally
                this.scene.events.emit('arcaneMine', this.x, this.y, this._classDef.sAbility);
                this.isSlamming = false; // don't lock movement, mine is placed
                this._sAbilityType = null;
            } else if (sType === 'piercing_thrust') {
                // Fast diagonal dive
                const dir = this.facingRight ? 1 : -1;
                this.setVelocityX(dir * 350);
                this.setVelocityY(SkillManager.getValue('groundSlam.velocity', GROUND_SLAM.VELOCITY) * 1.2);
                this.isInvincible = true;
                this.invincibleTimer = 500;
            } else {
                // Default slam downward
                this.setVelocityX(0);
                this.setVelocityY(SkillManager.getValue('groundSlam.velocity', GROUND_SLAM.VELOCITY));
            }
        }

        // Flame burst: E
        if (input.flameBurst && this.flameBurstReady) {
            this.flameBurstCooldownTimer = SkillManager.getValue('flameBurst.cooldown', FLAME_BURST.COOLDOWN);
            this.scene.events.emit('flameBurst', this.x, this.y);
        }

        // Class attack: Q
        if (input.classAttack && this.classAttackReady && SkillManager.hasClassAttack()) {
            this.classAttackCooldownTimer = this._classDef.attackCooldown;
            this.isClassAttacking = true;
            // Cancel any prior fallback timer
            if (this._attackFallbackTimer) {
                this._attackFallbackTimer.destroy();
                this._attackFallbackTimer = null;
            }
            if (this._classDef.attackAnim) {
                this.play(this._classDef.attackAnim);
                // Clear any stale listener before registering a new one
                this.off('animationcomplete-' + this._classDef.attackAnim);
                this.once('animationcomplete-' + this._classDef.attackAnim, () => {
                    this.isClassAttacking = false;
                    this.play(this._classDef.idleAnim);
                });
                // Fallback timer based on actual animation duration
                const anim = this.scene.anims.get(this._classDef.attackAnim);
                const animDuration = anim ? (anim.frames.length / anim.frameRate) * 1000 : 1500;
                this._attackFallbackTimer = this.scene.time.delayedCall(animDuration + 500, () => {
                    if (this.isClassAttacking) {
                        this.isClassAttacking = false;
                        this.play(this._classDef.idleAnim);
                    }
                });
            } else {
                this.isClassAttacking = false;
            }
            this.scene.events.emit('classAttack', this.x, this.y);
        }

        // Flame Step trigger (blocked during cursed no_dash trial or run modifier)
        if (input.dash && this.dashReady && !this._cursedNoDash && !this._modifierNoDash) {
            this.startDash();
        }

        // ─── Animation state (only if class sprite active) ───
        // Safety: reset stuck isClassAttacking if the attack animation finished
        if (this.isClassAttacking && !this.anims.isPlaying) {
            this.isClassAttacking = false;
        }

        if (this._classDef.idleAnim && !this.isClassAttacking) {
            const moving = Math.abs(this.body.velocity.x) > 10;
            const moveAnim = this._classDef.moveAnim;
            const idleAnim = this._classDef.idleAnim;
            const currentKey = this.anims.currentAnim ? this.anims.currentAnim.key : null;
            if (moving && currentKey !== moveAnim) {
                this.play(moveAnim, true);
            } else if (!moving && (currentKey !== idleAnim || !this.anims.isPlaying)) {
                this.play(idleAnim);
            }
        }

        // Update glider visual
        this.updateGliderSprite();

        // Reset corruption flag each frame (set by overlap in Level1)
        this.inCorruption = false;
    }

    updateGliderSprite() {
        if (this.isGliding) {
            if (!this.gliderSprite) {
                this.gliderSprite = this.scene.add.image(0, 0, 'glider');
            }
            this.gliderSprite.setVisible(true);
            this.gliderSprite.setDepth(this.depth - 1);
            this.gliderSprite.setPosition(this.x, this.y - 10);
            this.gliderSprite.setFlipX(this.flipX);
        } else if (this.gliderSprite) {
            this.gliderSprite.setVisible(false);
        }
    }

    startDash() {
        const duration = SkillManager.getValue('flameStep.duration', FLAME_STEP.DURATION);
        const cooldown = SkillManager.getValue('flameStep.cooldown', FLAME_STEP.COOLDOWN);
        const speed = SkillManager.getValue('flameStep.speed', FLAME_STEP.SPEED);
        const invMs = SkillManager.getValue('flameStep.invincibleMs', FLAME_STEP.INVINCIBLE_MS);

        this.isDashing = true;
        this.dashTimer = duration;
        this.dashCooldownTimer = cooldown;
        this.isInvincible = true;
        this.invincibleTimer = invMs;

        const dir = this.facingRight ? 1 : -1;
        this.setVelocityX(dir * speed);

        // Play class attack animation during dash (full animation plays through)
        if (this._classDef.attackAnim) {
            this.isClassAttacking = true;
            if (this._attackFallbackTimer) {
                this._attackFallbackTimer.destroy();
                this._attackFallbackTimer = null;
            }
            this.play(this._classDef.attackAnim);
            // Clear any stale listener before registering a new one
            this.off('animationcomplete-' + this._classDef.attackAnim);
            this.once('animationcomplete-' + this._classDef.attackAnim, () => {
                this.isClassAttacking = false;
                this.play(this._classDef.idleAnim);
            });
            // Fallback timer based on actual animation duration
            const anim = this.scene.anims.get(this._classDef.attackAnim);
            const animDuration = anim ? (anim.frames.length / anim.frameRate) * 1000 : 1500;
            this._attackFallbackTimer = this.scene.time.delayedCall(animDuration + 500, () => {
                if (this.isClassAttacking) {
                    this.isClassAttacking = false;
                    this.play(this._classDef.idleAnim);
                }
            });
        }

        // Brief tint flash
        this.setTint(0xFFCC00);
        this.scene.time.delayedCall(duration, () => {
            this.clearTint();
        });
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
