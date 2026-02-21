import Phaser from 'phaser';
import { GROUND_SLAM, FLAME_BURST, COMBO, RELIC, ELIXIR_CORRUPTION, DOUBLE_JUMP, UNDEAD_HAND } from '../constants.js';
import { GlobalState } from '../GlobalState.js';
import { SkillManager } from './SkillManager.js';

export class CombatSystem {
    constructor(scene) {
        this.scene = scene;
        this.comboCount = 0;
        this.comboTimer = 0;
        this._freezeSlowTimer = 0;
        this.companionTimer = 0;
        this.companionSprite = null;
    }

    get freezeSlowTimer() {
        return this._freezeSlowTimer;
    }

    set freezeSlowTimer(v) {
        this._freezeSlowTimer = v;
    }

    // ─── Enemy Update ───

    updateEnemies(delta) {
        const s = this.scene;
        const camLeft = s.cameras.main.scrollX;
        const camRight = camLeft + s.scale.width / s.cameras.main.zoom;

        for (const enemy of s.enemyGroup.getChildren()) {
            if (!enemy.active || !enemy.alive) continue;

            // Culling: destroy enemies too far behind or ahead of camera
            if (enemy.x < camLeft - 1500 || enemy.x > camRight + 2000) {
                enemy.destroy();
                continue;
            }

            enemy.chasePlayer(s.player.x, s.player.y, delta);

            // Warrior: dash auto-banish enemies near path
            if (s.player.isDashing && SkillManager.getFlag('dash.autoBanish')) {
                const dist = Phaser.Math.Distance.Between(s.player.x, s.player.y, enemy.x, enemy.y);
                const radius = SkillManager.getValue('dash.autoBanishRadius', 50);
                if (dist < radius) {
                    // Blacksmith buff: guaranteed banish on dash
                    if (s.interactionSystem.blacksmithBuff && enemy.hitsToKill > 1) enemy.hitsToKill = 1;
                    s.particles.wraithBanish(enemy.x, enemy.y);
                    s.popups.wraithBanished(enemy.x, enemy.y);
                    s.audio.playWraithBanish();
                    s.cameras.main.shake(100, 0.004);
                    if (enemy.def.elixirDrop) {
                        GlobalState.addElixir(1);
                        s.hud.popElixir();
                        s.popups.show(enemy.x, enemy.y - 40, '+1 ELIXIR (ELITE)', '#00FFCC', '12px');
                    }
                    enemy.banish();
                    this.onEnemyBanished(enemy.x, enemy.y, true);
                    continue;
                }
            }

            if (s.physics.overlap(s.player, enemy)) {
                if (s.player.isDashing || s.player.isInvincible) {
                    // Blacksmith buff: guaranteed banish on dash
                    if (s.interactionSystem.blacksmithBuff && s.player.isDashing && enemy.hitsToKill > 1) enemy.hitsToKill = 1;
                    s.particles.wraithBanish(enemy.x, enemy.y);
                    s.popups.wraithBanished(enemy.x, enemy.y);
                    s.audio.playWraithBanish();
                    s.cameras.main.shake(100, 0.004);
                    if (enemy.def.elixirDrop) {
                        GlobalState.addElixir(1);
                        s.hud.popElixir();
                        s.popups.show(enemy.x, enemy.y - 40, '+1 ELIXIR (ELITE)', '#00FFCC', '12px');
                        // Sprint 9: elite death particles
                        if (s.particles && s.particles.eliteDeath) s.particles.eliteDeath(enemy.x, enemy.y);
                    }
                    enemy.banish();
                    this.onEnemyBanished(enemy.x, enemy.y, s.player.isDashing, enemy.def.elite);
                } else if (s.player.hitInvincibleTimer <= 0) {
                    // Tank: reduced enemy damage, + relic multiplier
                    const dmg = SkillManager.getValue('enemyDamage', enemy.def.damage) * s.relicManager.getMult('enemyDamageMult');
                    GlobalState.drainFlame(dmg);
                    s.audio.playWraithHit();
                    s.cameras.main.shake(200, 0.008);
                    enemy.banish();

                    // Frost fell freeze aura (Feature 10)
                    if (enemy.def.freezeAura) {
                        this._freezeSlowTimer = 2000;
                        s.player.setTint(0x88BBFF);
                        s.time.delayedCall(2000, () => {
                            if (s.player.active) s.player.clearTint();
                        });
                        s.popups.show(s.player.x, s.player.y - 40, 'FROZEN!', '#88BBFF', '12px');
                    }

                    // Post-hit invincibility with flash
                    s.player.hitInvincibleTimer = 500;
                    s._flashPlayer();
                    // Knockback (can be resisted by Tank steadfast skill)
                    if (!SkillManager.getFlag('steadfast.knockbackImmune')) {
                        const knockDir = s.player.x > enemy.x ? 1 : -1;
                        s.player.setVelocity(knockDir * 150, -100);
                    }
                }
            }

            // Destroy enemies that fall behind the shroud
            if (enemy.x < s.shroud.getLeadingX() - 100) {
                enemy.destroy();
            }
        }

        // Cap active enemies at 30
        const alive = s.enemyGroup.getChildren().filter(e => e.active && e.alive);
        if (alive.length > 30) {
            // Destroy furthest enemies from player first
            alive.sort((a, b) => {
                const da = Math.abs(a.x - s.player.x);
                const db = Math.abs(b.x - s.player.x);
                return db - da;
            });
            for (let i = 0; i < alive.length - 30; i++) {
                alive[i].destroy();
            }
        }
    }

    // ─── Undead Hands ───

    updateUndeadHands(delta) {
        const s = this.scene;
        for (const hand of s.undeadHandGroup.getChildren()) {
            if (!hand.active) continue;
            hand.update(delta);

            if (s.physics.overlap(s.player, hand)) {
                if (hand.startGrab()) {
                    s.popups.show(s.player.x, s.player.y - 40, 'GRABBED!', '#AA44CC', '12px');
                    s.audio.playWraithHit();
                    s.cameras.main.shake(150, 0.004);
                }
                if (hand.grabbing) {
                    // Slow player movement
                    s.player.setVelocityX(s.player.body.velocity.x * UNDEAD_HAND.SLOW_MULT);
                    // Extra flame drain
                    GlobalState.drainFlame(UNDEAD_HAND.FLAME_DRAIN * delta / 1000);
                }
            }
        }
    }

    // ─── Combo System ───

    onEnemyBanished(x, y, duringDash = false, isElite = false) {
        const s = this.scene;
        s.runStats.enemiesBanished++;
        this.comboCount++;
        this.comboTimer = SkillManager.getValue('combo.window', COMBO.WINDOW) * s.relicManager.getMult('comboWindowMult');

        // Kill streak audio escalation
        s.audio.playBanishCombo(this.comboCount);

        // Sprint 9: Hit freeze — 50ms regular, 80ms elite
        s.cameras.main.shake(100, 0.004);
        this._hitFreeze(isElite ? 80 : 50);

        // Relic: siphon dash — dash banishes nearest enemy (synergy)
        if (duringDash && s.relicManager && s.relicManager.activeSynergies && s.relicManager.activeSynergies.has('siphon_dash')) {
            // Already happening by dash, so no extra banish needed
        }

        // Relic: banish flame restore
        const banishFlame = s.relicManager.getFlat('banishFlameFlat', 0);
        if (banishFlame > 0) {
            GlobalState.flame = Math.min(GlobalState.flame + banishFlame, GlobalState.maxFlame);
            s.popups.show(x, y - 40, `+${banishFlame} FLAME`, '#FF6600', '11px');
        }

        // Relic drop chance on banish
        if (s.relicManager.canDrop() && Math.random() < RELIC.BANISH_DROP_CHANCE) {
            s.time.delayedCall(300, () => s.relicOverlay.show());
        }

        // Challenge arena kill tracking
        if (s.challengeArena.active) {
            s.challengeArena.onEnemyKilled();
        }

        if (this.comboCount >= 2) {
            // Scale text size and effects with combo count
            const size = Math.min(16 + this.comboCount * 2, 30);
            const comboTxt = s.popups.show(x, y - 60, `x${this.comboCount} COMBO!`, '#FFCC00', `${size}px`);
            // Sprint 9e: scale punch tween 1.0 → 1.6 → 1.0 over 200ms
            if (comboTxt) {
                comboTxt.setScale(1.0);
                s.tweens.add({
                    targets: comboTxt,
                    scaleX: { from: 1.0, to: 1.6 },
                    scaleY: { from: 1.0, to: 1.6 },
                    duration: 100,
                    yoyo: true,
                    ease: 'Power2'
                });
            }
            if (this.comboCount >= 3) {
                s.cameras.main.shake(150, 0.003 + this.comboCount * 0.001);
                s.audio.playComboMilestone();
            }
            if (this.comboCount >= 4) {
                s.cameras.main.flash(100, 255, 200, 0, false, null, s);
            }
            // Sprint 9e: notify HUD for persistent glow/vignette effects
            if (s.hud && s.hud.updateCombo) {
                s.hud.updateCombo(this.comboCount);
            }
        }

        const threshold = SkillManager.getValue('combo.bonusThreshold', COMBO.BONUS_ELIXIR_THRESHOLD);
        if (this.comboCount >= threshold) {
            GlobalState.addElixir(1);
            s.hud.popElixir();
            s.popups.show(x, y - 80, '+1 ELIXIR BONUS', '#00FFCC', '18px');
            // Corruption from combo elixir bonus (Feature 5)
            GlobalState.addCorruption(ELIXIR_CORRUPTION.PER_ELIXIR_BONUS);
        }

        // Trickster: flame restore on dash banish
        if (duringDash && SkillManager.getFlag('dash.flameRestore')) {
            const restore = SkillManager.getValue('dash.flameRestoreAmount', 0);
            GlobalState.flame = GlobalState.flame + restore;
            s.popups.show(x, y - 40, `+${restore} FLAME`, '#FF6600', '12px');
        }
    }

    // ─── Companion (Beast Master) ───

    updateCompanion(delta) {
        const s = this.scene;
        if (!SkillManager.getFlag('companion.enabled')) return;

        // Create companion sprite if needed
        if (!this.companionSprite) {
            this.companionSprite = s.add.circle(0, 0, 6, 0xFFAA33, 0.9).setDepth(50);
        }

        // Orbit around player
        this.companionTimer += delta;
        const angle = (this.companionTimer / 1000) * 2;
        this.companionSprite.setPosition(
            s.player.x + Math.cos(angle) * 40,
            s.player.y + Math.sin(angle) * 30
        );

        // Auto-banish on interval
        const interval = SkillManager.getValue('companion.interval', 8000);
        if (this.companionTimer >= interval) {
            this.companionTimer -= interval;

            // Find closest enemy
            let closest = null;
            let closestDist = 200; // max range
            for (const enemy of s.enemyGroup.getChildren()) {
                if (!enemy.active || !enemy.alive) continue;
                const d = Phaser.Math.Distance.Between(s.player.x, s.player.y, enemy.x, enemy.y);
                if (d < closestDist) {
                    closestDist = d;
                    closest = enemy;
                }
            }

            if (closest) {
                s.particles.wraithBanish(closest.x, closest.y);
                s.popups.show(closest.x, closest.y - 30, 'SPIRIT BANISH', '#FFAA33', '11px');
                s.audio.playWraithBanish();
                closest.banish();
                this.onEnemyBanished(closest.x, closest.y, false);

                const flameRestore = SkillManager.getValue('companion.flameRestore', 3);
                GlobalState.flame = GlobalState.flame + flameRestore;
            }
        }
    }

    // ─── Flame Burst Handler ───

    handleFlameBurst(x, y) {
        const s = this.scene;
        const radius = SkillManager.getValue('flameBurst.radius', FLAME_BURST.RADIUS);
        const banishRadius = SkillManager.getValue('flameBurst.banishRadius', FLAME_BURST.BANISH_RADIUS);

        s.audio.playFlameBurst();
        s.cameras.main.shake(200, 0.006);

        // Visual ring effect
        const ring = s.add.circle(x, y, 10, 0xFF6600, 0.4).setDepth(60);
        s.tweens.add({
            targets: ring,
            radius: radius,
            alpha: 0,
            duration: 400,
            onUpdate: () => {
                ring.setRadius(ring.radius);
            },
            onComplete: () => ring.destroy()
        });

        // Push/banish enemies in radius
        for (const enemy of s.enemyGroup.getChildren()) {
            if (!enemy.active || !enemy.alive) continue;
            const dist = Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y);
            if (dist < banishRadius) {
                // Close enemies get banished
                s.particles.wraithBanish(enemy.x, enemy.y);
                s.popups.wraithBanished(enemy.x, enemy.y);
                s.audio.playWraithBanish();
                enemy.banish();
                this.onEnemyBanished(enemy.x, enemy.y, false);
            } else if (dist < radius) {
                // Farther enemies get pushed
                const angle = Phaser.Math.Angle.Between(x, y, enemy.x, enemy.y);
                enemy.setVelocity(
                    Math.cos(angle) * FLAME_BURST.PUSH_FORCE,
                    Math.sin(angle) * FLAME_BURST.PUSH_FORCE
                );
                enemy.stun(1000);
            }
        }

        // Battlemage: grant invincibility after burst
        if (SkillManager.getFlag('flameBurst.grantInvincibility')) {
            const invMs = SkillManager.getValue('flameBurst.invincibilityMs', 0);
            s.player.isInvincible = true;
            s.player.invincibleTimer = invMs;
            s.player.setTint(0x4488FF);
            s.time.delayedCall(invMs, () => {
                if (s.player.active) s.player.clearTint();
            });
        }
    }

    // ─── Class Attack Dispatcher ───

    handleClassAttack(x, y) {
        const s = this.scene;
        const cls = SkillManager.activeClass;
        if (!cls || !cls.attackType) return;

        switch (cls.attackType) {
            case 'aoe_banish':
                this._classAoeBanish(x, y, cls);
                break;
            case 'frontal_banish':
                this._classFrontalBanish(x, y, cls);
                break;
            case 'knockback':
                this._classKnockback(x, y, cls);
                break;
            case 'shield':
                this._classShield(cls);
                break;
            case 'heal':
                this._classHeal(x, y, cls);
                break;
            case 'melee_banish':
                this._classMeleeBanish(x, y, cls);
                break;
            case 'projectile':
                this._classProjectile(x, y, cls);
                break;
            case 'screen_stun':
                this._classScreenStun(x, y, cls);
                break;
            case 'blink':
                this._classBlink(x, y, cls);
                break;
            case 'dual_strike':
                this._classDualStrike(x, y, cls);
                break;
            case 'flame_projectile':
                this._classFlameProjectile(x, y, cls);
                break;
        }
    }

    // AOE banish (Barbarian, Wizard, Battlemage)
    _classAoeBanish(x, y, cls) {
        const s = this.scene;
        const banishR = cls.attackRadius;
        const stunR = cls.stunRadius || 0;
        const stunD = cls.stunDuration || 0;

        // Visual ring
        const ring = s.add.circle(x, y, 10, 0xFF4444, 0.4).setDepth(60);
        s.tweens.add({
            targets: ring,
            radius: banishR,
            alpha: 0,
            duration: 400,
            onUpdate: () => ring.setRadius(ring.radius),
            onComplete: () => ring.destroy()
        });

        // Blast VFX for Wizard
        if (cls.useBlastVFX) {
            const blast = s.add.sprite(x, y, 'fx_blast').setDepth(61).setDisplaySize(200, 200);
            blast.play('fx_blast_anim');
            blast.once('animationcomplete', () => blast.destroy());
        }

        s.cameras.main.shake(300, 0.008);

        for (const enemy of s.enemyGroup.getChildren()) {
            if (!enemy.active || !enemy.alive) continue;
            const dist = Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y);
            if (dist < banishR) {
                s.particles.wraithBanish(enemy.x, enemy.y);
                s.popups.wraithBanished(enemy.x, enemy.y);
                s.audio.playWraithBanish();
                enemy.banish();
                this.onEnemyBanished(enemy.x, enemy.y, false);
            } else if (stunR > 0 && dist < stunR) {
                enemy.stun(stunD);
            }
        }
    }

    // Frontal banish (Warrior)
    _classFrontalBanish(x, y, cls) {
        const s = this.scene;
        const radius = cls.attackRadius;
        const dir = s.player.facingRight ? 1 : -1;

        s.cameras.main.shake(200, 0.005);

        for (const enemy of s.enemyGroup.getChildren()) {
            if (!enemy.active || !enemy.alive) continue;
            const dx = enemy.x - x;
            const dy = enemy.y - y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            // Only enemies in front of player within arc
            if (dist < radius && dx * dir > 0) {
                s.particles.wraithBanish(enemy.x, enemy.y);
                s.popups.wraithBanished(enemy.x, enemy.y);
                s.audio.playWraithBanish();
                enemy.banish();
                this.onEnemyBanished(enemy.x, enemy.y, false);
            }
        }
    }

    // Knockback (Athlete/Monk)
    _classKnockback(x, y, cls) {
        const s = this.scene;
        const radius = cls.attackRadius;
        const pushDist = cls.pushDistance;
        const stunD = cls.stunDuration;

        s.cameras.main.shake(250, 0.006);

        for (const enemy of s.enemyGroup.getChildren()) {
            if (!enemy.active || !enemy.alive) continue;
            const dist = Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y);
            if (dist < radius) {
                const angle = Phaser.Math.Angle.Between(x, y, enemy.x, enemy.y);
                enemy.setVelocity(
                    Math.cos(angle) * pushDist * 2,
                    Math.sin(angle) * pushDist
                );
                enemy.stun(stunD);
                s.popups.show(enemy.x, enemy.y - 20, 'PUSHED', '#44DD66', '11px');
            }
        }
    }

    // Shield (Tank)
    _classShield(cls) {
        const s = this.scene;
        const dur = cls.shieldDuration;
        s.player.isInvincible = true;
        s.player.invincibleTimer = dur;
        s.player.setTint(0x4488FF);
        s.popups.show(s.player.x, s.player.y - 40, 'SHIELD UP', '#4488FF', '14px');
        s.time.delayedCall(dur, () => {
            if (s.player.active) s.player.clearTint();
        });
    }

    // Heal (Healer)
    _classHeal(x, y, cls) {
        const s = this.scene;
        GlobalState.flame = Math.min(GlobalState.flame + cls.healAmount, GlobalState.maxFlame);
        s.popups.show(x, y - 40, `+${cls.healAmount} FLAME`, '#FF8833', '14px');

        // Drain reduction buff
        s.interactionSystem.shrineDrainBuffTimer = cls.drainReductionDuration;
        s.popups.show(x, y - 60, 'DRAIN HALVED', '#4488FF', '12px');

        // Healing visual
        const ring = s.add.circle(x, y, 10, 0xFF8833, 0.3).setDepth(60);
        s.tweens.add({
            targets: ring,
            radius: 60,
            alpha: 0,
            duration: 500,
            onUpdate: () => ring.setRadius(ring.radius),
            onComplete: () => ring.destroy()
        });
    }

    // Melee banish (Trickster/Adventurer) — banish closest + reset dash CD
    _classMeleeBanish(x, y, cls) {
        const s = this.scene;
        let closest = null;
        let closestDist = cls.attackRadius || 100;
        for (const enemy of s.enemyGroup.getChildren()) {
            if (!enemy.active || !enemy.alive) continue;
            const d = Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y);
            if (d < closestDist) {
                closestDist = d;
                closest = enemy;
            }
        }
        if (closest) {
            s.particles.wraithBanish(closest.x, closest.y);
            s.popups.wraithBanished(closest.x, closest.y);
            s.audio.playWraithBanish();
            closest.banish();
            this.onEnemyBanished(closest.x, closest.y, false);
        }
        // Reset dash cooldown
        s.player.dashCooldownTimer = 0;
        s.popups.show(x, y - 40, 'DASH RESET', '#FFCC00', '11px');
    }

    // Projectile (Arcane Archer, Beast Master)
    _classProjectile(x, y, cls) {
        const s = this.scene;
        const dir = s.player.facingRight ? 1 : -1;
        const speed = cls.projectileSpeed;
        const range = cls.projectileRange;

        // Determine projectile texture
        const projKey = cls.grantsElixir ? 'fx_spell_proj' : 'fx_fireball';
        const projAnim = cls.grantsElixir ? 'fx_spell_proj_anim' : 'fx_fireball_anim';

        const proj = s.add.sprite(x + dir * 20, y, projKey).setDepth(55);
        proj.setDisplaySize(24, 24);
        proj.setFlipX(dir < 0);
        proj.play(projAnim);

        const startX = proj.x;
        const combat = this;

        s.tweens.add({
            targets: proj,
            x: x + dir * range,
            duration: (range / speed) * 1000,
            onUpdate: () => {
                // Check collision with enemies
                for (const enemy of s.enemyGroup.getChildren()) {
                    if (!enemy.active || !enemy.alive) continue;
                    const d = Phaser.Math.Distance.Between(proj.x, proj.y, enemy.x, enemy.y);
                    if (d < 30) {
                        s.particles.wraithBanish(enemy.x, enemy.y);
                        s.popups.wraithBanished(enemy.x, enemy.y);
                        s.audio.playWraithBanish();
                        enemy.banish();
                        combat.onEnemyBanished(enemy.x, enemy.y, false);

                        if (cls.grantsElixir) {
                            GlobalState.addElixir(1);
                            s.hud.popElixir();
                            s.popups.show(enemy.x, enemy.y - 40, '+1 ELIXIR', '#00FFCC', '12px');
                        }
                        if (cls.flameRestore) {
                            GlobalState.flame = GlobalState.flame + cls.flameRestore;
                            s.popups.show(enemy.x, enemy.y - 20, `+${cls.flameRestore} FLAME`, '#FF6600', '11px');
                        }

                        proj.destroy();
                        return;
                    }
                }
            },
            onComplete: () => {
                if (proj.active) proj.destroy();
            }
        });
    }

    // Screen stun (Ranger) — stuns all on-screen enemies, banishes closest N if maxBanish set
    _classScreenStun(x, y, cls) {
        const s = this.scene;
        const stunD = cls.stunDuration;
        const camLeft = s.cameras.main.scrollX;
        const camRight = camLeft + s.scale.width;
        const maxBanish = cls.maxBanish || 0;

        s.cameras.main.flash(200, 100, 200, 255);
        s.popups.show(x, y - 40, 'ARROW RAIN', '#44DD66', '14px');

        // Collect on-screen enemies
        const onScreen = [];
        for (const enemy of s.enemyGroup.getChildren()) {
            if (!enemy.active || !enemy.alive) continue;
            if (enemy.x > camLeft && enemy.x < camRight) {
                onScreen.push(enemy);
            }
        }

        // Banish the N closest enemies
        if (maxBanish > 0 && onScreen.length > 0) {
            onScreen.sort((a, b) => {
                const da = Phaser.Math.Distance.Between(x, y, a.x, a.y);
                const db = Phaser.Math.Distance.Between(x, y, b.x, b.y);
                return da - db;
            });
            const toBanish = onScreen.splice(0, maxBanish);
            for (const enemy of toBanish) {
                s.particles.wraithBanish(enemy.x, enemy.y);
                s.popups.wraithBanished(enemy.x, enemy.y);
                s.audio.playWraithBanish();
                enemy.banish();
                this.onEnemyBanished(enemy.x, enemy.y, false);
            }
        }

        // Stun remaining on-screen enemies
        for (const enemy of onScreen) {
            enemy.stun(stunD);
        }
    }

    // Blink (Assassin) — teleport forward, banish enemies in path
    _classBlink(x, y, cls) {
        const s = this.scene;
        const dir = s.player.facingRight ? 1 : -1;
        const dist = cls.blinkDistance;
        const targetX = x + dir * dist;

        // Banish enemies along the path
        for (const enemy of s.enemyGroup.getChildren()) {
            if (!enemy.active || !enemy.alive) continue;
            const ex = enemy.x;
            const ey = enemy.y;
            // Check if enemy is roughly in the blink path
            const inXRange = dir > 0 ? (ex > x && ex < targetX) : (ex < x && ex > targetX);
            const inYRange = Math.abs(ey - y) < 40;
            if (inXRange && inYRange) {
                s.particles.wraithBanish(enemy.x, enemy.y);
                s.popups.wraithBanished(enemy.x, enemy.y);
                s.audio.playWraithBanish();
                enemy.banish();
                this.onEnemyBanished(enemy.x, enemy.y, false);
            }
        }

        // Teleport player
        s.player.setPosition(targetX, y);
        s.player.setTint(0x44DD66);
        s.time.delayedCall(200, () => {
            if (s.player.active) s.player.clearTint();
        });

        // VFX: after-image at origin
        const ghost = s.add.rectangle(x, y, 48, 48, 0x44DD66, 0.5).setDepth(55);
        s.tweens.add({
            targets: ghost,
            alpha: 0,
            duration: 400,
            onComplete: () => ghost.destroy()
        });
    }

    // Dual Strike (Duelist) — rapid two-hit frontal, second hit banishes
    _classDualStrike(x, y, cls) {
        const s = this.scene;
        const dir = s.player.facingRight ? 1 : -1;
        const radius = cls.attackRadius;

        s.cameras.main.shake(150, 0.005);

        // First hit: stun
        for (const enemy of s.enemyGroup.getChildren()) {
            if (!enemy.active || !enemy.alive) continue;
            const dx = enemy.x - x;
            const dy = enemy.y - y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < radius && dx * dir > 0) {
                enemy.stun(500);
            }
        }

        // Second hit after brief delay: banish
        s.time.delayedCall(200, () => {
            s.cameras.main.shake(200, 0.006);
            for (const enemy of s.enemyGroup.getChildren()) {
                if (!enemy.active || !enemy.alive) continue;
                const dx = enemy.x - x;
                const dy = enemy.y - y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < radius && dx * dir > 0) {
                    s.particles.wraithBanish(enemy.x, enemy.y);
                    s.popups.wraithBanished(enemy.x, enemy.y);
                    s.audio.playWraithBanish();
                    enemy.banish();
                    this.onEnemyBanished(enemy.x, enemy.y, false);
                }
            }
        });
    }

    // Flame Projectile (Pyromancer) — launch fireball forward
    _classFlameProjectile(x, y, cls) {
        const s = this.scene;
        const dir = s.player.facingRight ? 1 : -1;
        const speed = cls.projectileSpeed;
        const radius = cls.projectileRadius;

        // Create fireball
        const fireball = s.add.circle(x + dir * 20, y, 8, 0xFF4400, 0.9).setDepth(60);
        const glow = s.add.circle(x + dir * 20, y, 14, 0xFF6600, 0.3).setDepth(59);

        // Use fx_fireball sprite if available
        let fbSprite = null;
        if (s.textures.exists('fx_fireball')) {
            fbSprite = s.add.sprite(x + dir * 20, y, 'fx_fireball').setDepth(61).setDisplaySize(24, 24);
            if (s.anims.exists('fx_fireball_anim')) fbSprite.play('fx_fireball_anim');
            fireball.setAlpha(0);
        }

        const startX = x + dir * 20;
        let fbX = startX;
        const combat = this;
        const fbEvent = s.time.addEvent({
            delay: 16,
            repeat: 120,  // ~2 seconds of travel
            callback: () => {
                fbX += dir * speed * 0.016;
                fireball.setPosition(fbX, y);
                glow.setPosition(fbX, y);
                if (fbSprite) fbSprite.setPosition(fbX, y);

                // Check collision with enemies
                for (const enemy of s.enemyGroup.getChildren()) {
                    if (!enemy.active || !enemy.alive) continue;
                    const dist = Phaser.Math.Distance.Between(fbX, y, enemy.x, enemy.y);
                    if (dist < radius) {
                        s.particles.wraithBanish(enemy.x, enemy.y);
                        s.popups.wraithBanished(enemy.x, enemy.y);
                        s.audio.playWraithBanish();
                        enemy.banish();
                        combat.onEnemyBanished(enemy.x, enemy.y, false);
                        // Destroy fireball on hit
                        fbEvent.destroy();
                        fireball.destroy();
                        glow.destroy();
                        if (fbSprite) fbSprite.destroy();
                        return;
                    }
                }

                // Destroy if too far
                if (Math.abs(fbX - startX) > 600) {
                    fbEvent.destroy();
                    fireball.destroy();
                    glow.destroy();
                    if (fbSprite) fbSprite.destroy();
                }
            }
        });
    }

    // ─── Class S Ability Dispatcher ───

    handleClassSAbility(sType, x, y) {
        const cls = SkillManager.activeClass;
        const sAbility = cls && cls.sAbility ? cls.sAbility : { type: 'ground_slam' };

        switch (sType) {
            case 'ground_slam':
                this._sGroundSlam(x, y);
                break;
            case 'earthshatter':
                this._sEarthshatter(x, y, sAbility);
                break;
            case 'arrow_rain':
                this._sArrowRain(x, y, sAbility);
                break;
            case 'fortress_drop':
                this._sFortressDrop(x, y, sAbility);
                break;
            case 'purifying_landing':
                this._sPurifyingLanding(x, y, sAbility);
                break;
            case 'shadow_dive':
                this._sShadowDive(x, y, sAbility);
                break;
            case 'staff_pogo':
                this._sStaffPogo(x, y, sAbility);
                break;
            case 'piercing_thrust':
                this._sPiercingThrust(x, y, sAbility);
                break;
            case 'meteor_drop':
                this._sMeteorDrop(x, y, sAbility);
                break;
            default:
                this._sGroundSlam(x, y);
                break;
        }
    }

    // Default ground slam (Adventurer)
    _sGroundSlam(x, y) {
        const s = this.scene;
        s.particles.groundSlam(x, y);
        s.cameras.main.shake(300, 0.012);
        s.audio.playSlamImpact();
        this._hitFreeze(50);

        const stunRadius = SkillManager.getValue('groundSlam.stunRadius', GROUND_SLAM.STUN_RADIUS);
        const stunDuration = SkillManager.getValue('groundSlam.stunDuration', GROUND_SLAM.STUN_DURATION);

        for (const enemy of s.enemyGroup.getChildren()) {
            if (!enemy.active || !enemy.alive) continue;
            const dist = Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y);
            if (dist < stunRadius) {
                // Sprint 11: Time Fracture relic — freeze (stun) ALL enemies for 2s
                const freeze = s.relicManager && s.relicManager.getFlag('slamFreeze');
                enemy.stun(freeze ? 2000 : stunDuration);
            }
        }
        // Time Fracture: stun ALL enemies regardless of distance
        if (s.relicManager && s.relicManager.getFlag('slamFreeze')) {
            for (const enemy of s.enemyGroup.getChildren()) {
                if (!enemy.active || !enemy.alive) continue;
                enemy.stun(2000);
            }
            s.popups.show(x, y - 40, 'TIME FRACTURE!', '#00CCFF', '14px');
        }
    }

    // Barbarian: slam + shockwave knockback
    _sEarthshatter(x, y, cfg) {
        const s = this.scene;
        s.particles.groundSlam(x, y);
        s.cameras.main.shake(400, 0.016);
        s.audio.playSlamImpact();
        this._hitFreeze(60);

        const ring = s.add.circle(x, y, 10, 0xFF4444, 0.3).setDepth(60);
        s.tweens.add({
            targets: ring, radius: cfg.radius, alpha: 0, duration: 500,
            onUpdate: () => ring.setRadius(ring.radius),
            onComplete: () => ring.destroy()
        });

        for (const enemy of s.enemyGroup.getChildren()) {
            if (!enemy.active || !enemy.alive) continue;
            const dist = Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y);
            if (dist < cfg.radius) {
                const angle = Phaser.Math.Angle.Between(x, y, enemy.x, enemy.y);
                enemy.setVelocity(Math.cos(angle) * cfg.knockback, Math.sin(angle) * cfg.knockback * 0.5);
                enemy.stun(cfg.stunDuration);
            }
        }
    }

    // Wizard: drop mine at position, detonates after delay
    handleArcaneMine(x, y, cfg) {
        const s = this.scene;
        const mine = s.add.circle(x, y, 12, 0x4488FF, 0.6).setDepth(55);
        s.tweens.add({
            targets: mine, alpha: { from: 0.3, to: 0.9 }, scaleX: { from: 0.8, to: 1.2 },
            scaleY: { from: 0.8, to: 1.2 }, duration: 200, yoyo: true,
            repeat: Math.floor(cfg.detonateDelay / 400)
        });

        const combat = this;
        s.time.delayedCall(cfg.detonateDelay, () => {
            if (!mine.active) return;
            s.cameras.main.shake(200, 0.008);
            s.audio.playSlamImpact();

            const blast = s.add.circle(mine.x, mine.y, 10, 0x4488FF, 0.5).setDepth(60);
            s.tweens.add({
                targets: blast, radius: cfg.radius, alpha: 0, duration: 400,
                onUpdate: () => blast.setRadius(blast.radius),
                onComplete: () => blast.destroy()
            });

            for (const enemy of s.enemyGroup.getChildren()) {
                if (!enemy.active || !enemy.alive) continue;
                const dist = Phaser.Math.Distance.Between(mine.x, mine.y, enemy.x, enemy.y);
                if (dist < cfg.radius) {
                    s.particles.wraithBanish(enemy.x, enemy.y);
                    s.popups.wraithBanished(enemy.x, enemy.y);
                    s.audio.playWraithBanish();
                    enemy.banish();
                    combat.onEnemyBanished(enemy.x, enemy.y, false);
                }
            }
            mine.destroy();
        });
    }

    // Ranger: arrows stun enemies across wide horizontal range
    _sArrowRain(x, y, cfg) {
        const s = this.scene;
        s.particles.groundSlam(x, y);
        s.cameras.main.shake(200, 0.008);
        s.audio.playSlamImpact();
        this._hitFreeze(40);

        // Visual: arrow lines falling
        for (let i = -2; i <= 2; i++) {
            const ax = x + i * 60;
            const arrow = s.add.rectangle(ax, y - 100, 2, 20, 0x44DD66).setDepth(60);
            s.tweens.add({
                targets: arrow, y: y, alpha: 0, duration: 300, delay: Math.abs(i) * 50,
                onComplete: () => arrow.destroy()
            });
        }

        for (const enemy of s.enemyGroup.getChildren()) {
            if (!enemy.active || !enemy.alive) continue;
            if (Math.abs(enemy.x - x) < cfg.width / 2 && Math.abs(enemy.y - y) < 150) {
                enemy.stun(cfg.stunDuration);
            }
        }
    }

    // Tank: slam + create brief barrier
    _sFortressDrop(x, y, cfg) {
        const s = this.scene;
        s.particles.groundSlam(x, y);
        s.cameras.main.shake(300, 0.012);
        s.audio.playSlamImpact();
        this._hitFreeze(50);

        // Create barrier rectangle
        const barrier = s.add.rectangle(x, y - 20, 8, 40, 0xCCCCCC, 0.7).setDepth(55);
        const barrierBody = s.physics.add.existing(barrier, true);

        // Stun nearby enemies
        for (const enemy of s.enemyGroup.getChildren()) {
            if (!enemy.active || !enemy.alive) continue;
            const dist = Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y);
            if (dist < cfg.radius) {
                enemy.stun(cfg.stunDuration);
            }
        }

        // Remove barrier after duration
        s.time.delayedCall(cfg.barrierDuration, () => {
            s.tweens.add({
                targets: barrier, alpha: 0, duration: 300,
                onComplete: () => barrier.destroy()
            });
        });
    }

    // Healer: healing zone on landing
    _sPurifyingLanding(x, y, cfg) {
        const s = this.scene;
        s.particles.groundSlam(x, y);
        s.cameras.main.shake(200, 0.006);
        s.audio.playSlamImpact();

        const zone = s.add.circle(x, y, cfg.radius, 0x88DDFF, 0.15).setDepth(54);
        s.popups.show(x, y - 40, 'PURIFYING ZONE', '#88DDFF', '12px');

        let elapsed = 0;
        const healEvent = s.time.addEvent({
            delay: 500,
            repeat: Math.floor(cfg.duration / 500) - 1,
            callback: () => {
                elapsed += 500;
                const dist = Phaser.Math.Distance.Between(x, y, s.player.x, s.player.y);
                if (dist < cfg.radius) {
                    const heal = cfg.healPerSec * 0.5;
                    GlobalState.flame = Math.min(GlobalState.flame + heal, GlobalState.maxFlame);
                    s.popups.show(s.player.x, s.player.y - 30, `+${heal}`, '#88DDFF', '10px');
                }
            }
        });

        s.time.delayedCall(cfg.duration, () => {
            s.tweens.add({
                targets: zone, alpha: 0, duration: 500,
                onComplete: () => zone.destroy()
            });
        });
    }

    // Assassin: invisible after landing
    _sShadowDive(x, y, cfg) {
        const s = this.scene;
        s.particles.groundSlam(x, y);
        s.cameras.main.shake(200, 0.008);
        s.audio.playSlamImpact();
        this._hitFreeze(40);

        // Become invisible + invincible
        s.player.setAlpha(0.15);
        s.player.isInvincible = true;
        s.player.invincibleTimer = cfg.invisDuration;
        s.popups.show(x, y - 40, 'SHADOW', '#AA44FF', '14px');

        s.time.delayedCall(cfg.invisDuration, () => {
            if (s.player.active) {
                s.player.setAlpha(1);
            }
        });

        // Stun nearby enemies
        for (const enemy of s.enemyGroup.getChildren()) {
            if (!enemy.active || !enemy.alive) continue;
            const dist = Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y);
            if (dist < GROUND_SLAM.STUN_RADIUS) {
                enemy.stun(GROUND_SLAM.STUN_DURATION);
            }
        }
    }

    // Monk: staff pogo — bounce back up on landing
    _sStaffPogo(x, y, cfg) {
        const s = this.scene;
        s.particles.groundSlam(x, y);
        s.cameras.main.shake(150, 0.008);
        s.audio.playSlamImpact();

        // Bounce back up
        s.player.setVelocityY(-450);
        s.player.airJumpsRemaining = DOUBLE_JUMP.MAX_AIR_JUMPS;
        s.popups.show(x, y - 30, 'POGO!', '#44DD66', '12px');

        // Stun enemies at landing point
        for (const enemy of s.enemyGroup.getChildren()) {
            if (!enemy.active || !enemy.alive) continue;
            const dist = Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y);
            if (dist < (cfg.radius || 100)) {
                enemy.stun(cfg.stunDuration || 1500);
            }
        }
    }

    // Duelist: fast diagonal dive with bonus stun
    _sPiercingThrust(x, y, cfg) {
        const s = this.scene;
        s.particles.groundSlam(x, y);
        s.cameras.main.shake(250, 0.010);
        s.audio.playSlamImpact();
        this._hitFreeze(40);

        s.popups.show(x, y - 40, 'PIERCE!', '#FFCC00', '14px');

        for (const enemy of s.enemyGroup.getChildren()) {
            if (!enemy.active || !enemy.alive) continue;
            const dist = Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y);
            if (dist < (cfg.radius || 80)) {
                enemy.stun(cfg.stunDuration || 2500);
                s.popups.show(enemy.x, enemy.y - 20, 'STUNNED', '#FFCC00', '11px');
            }
        }
    }

    // Pyromancer: fire slam, leaves burning ground
    _sMeteorDrop(x, y, cfg) {
        const s = this.scene;
        s.particles.groundSlam(x, y);
        s.cameras.main.shake(350, 0.014);
        s.audio.playSlamImpact();
        this._hitFreeze(50);

        const fireZone = s.add.rectangle(x, y - 4, cfg.width || 120, 8, 0xFF4400, 0.5).setDepth(54);
        s.popups.show(x, y - 40, 'METEOR!', '#FF4400', '14px');

        const combat = this;
        // Burning ground damages enemies who enter for 3s
        const burnEvent = s.time.addEvent({
            delay: 500,
            repeat: Math.floor((cfg.duration || 3000) / 500) - 1,
            callback: () => {
                for (const enemy of s.enemyGroup.getChildren()) {
                    if (!enemy.active || !enemy.alive) continue;
                    if (Math.abs(enemy.x - x) < (cfg.width || 120) / 2 && Math.abs(enemy.y - y) < 30) {
                        s.particles.wraithBanish(enemy.x, enemy.y);
                        s.audio.playWraithBanish();
                        enemy.banish();
                        combat.onEnemyBanished(enemy.x, enemy.y, false);
                    }
                }
            }
        });

        s.time.delayedCall(cfg.duration || 3000, () => {
            s.tweens.add({
                targets: fireZone, alpha: 0, duration: 500,
                onComplete: () => fireZone.destroy()
            });
        });
    }

    // ─── Hit Freeze ───

    _hitFreeze(duration = 50) {
        const s = this.scene;
        if (s.isGameOver) return;
        s.time.timeScale = 0.1;
        s.time.delayedCall(duration, () => { s.time.timeScale = 1.0; });
    }
}
