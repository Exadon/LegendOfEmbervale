import Phaser from 'phaser';
import { GROUND_SLAM, FLAME_BURST, COMBO, RELIC, ELIXIR_CORRUPTION, DOUBLE_JUMP, UNDEAD_HAND, HAZARD_ZONES, GENERATION } from '../constants.js';
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

            // Soul Leech / Void Slime: flame drain on proximity
            if (enemy.def?.flameDrainOnContact && !s.player.isDashing && !s.player.isInvincible) {
                const dist = Phaser.Math.Distance.Between(s.player.x, s.player.y, enemy.x, enemy.y);
                if (dist < 48) {
                    enemy._drainCooldown = (enemy._drainCooldown || 0) - delta;
                    if (enemy._drainCooldown <= 0) {
                        GlobalState.drainFlame(enemy.def.flameDrainOnContact);
                        enemy._drainCooldown = 1000;
                        s.popups.show(s.player.x, s.player.y - 30, `-${enemy.def.flameDrainOnContact} FLAME`, '#AA44FF', '10px');
                    }
                }
            }

            if (s.physics.overlap(s.player, enemy)) {
                if (s.player.isDashing || s.player.isInvincible) {
                    // Blacksmith buff: guaranteed banish on dash
                    if (s.interactionSystem.blacksmithBuff && s.player.isDashing && enemy.hitsToKill > 1) enemy.hitsToKill = 1;

                    // Relic: wraithbane — dash through enemy slows it
                    if (s.player.isDashing && s.relicManager && s.relicManager.getFlag('dashSlow')) {
                        const slowDur = s.relicManager.getApplyOrTier2Value('wraithbane', 'dashSlowDuration') || 3000;
                        enemy.stun(slowDur);
                        enemy.setTint(0x4488FF);
                    }
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
                    // Corrupted Warrior shield: only dash or class attack can break it
                    if (enemy.def?.shields) {
                        s.audio.playWraithHit?.();
                        s.popups.show(enemy.x, enemy.y - 20, 'SHIELDED', '#8888CC', '10px');
                        s.player.hitInvincibleTimer = 200; // brief grace to prevent spam popup
                        continue;
                    }

                    // Tank: reduced enemy damage, + relic multiplier + difficulty mult
                    const _diffDmgMult = s._diffEnemyDamageMult || 1;
                    const dmg = SkillManager.getValue('enemyDamage', enemy.def.damage) * (s.relicManager ? s.relicManager.getMult('enemyDamageMult') : 1) * _diffDmgMult;
                    GlobalState.drainFlame(dmg);
                    s.popups.show(s.player.x, s.player.y - 30, `-${Math.round(dmg)} FLAME`, '#FF4444', '12px');
                    s.audio.playEnemyHit(enemy.def.key);
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

        // Cap active enemies
        const alive = s.enemyGroup.getChildren().filter(e => e.active && e.alive);
        if (alive.length > GENERATION.ENEMY_CAP) {
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

        // Baseline flame restore per kill — makes combat feel rewarding, not just punishing
        const baseKillFlame = 2;
        GlobalState.restoreFlame(baseKillFlame);

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
            s.time.delayedCall(300, () => s._queueOverlay(() => s.relicOverlay.show()));
        }

        // Challenge arena kill tracking
        if (s.challengeArena.active) {
            s.challengeArena.onEnemyKilled();
        }

        if (this.comboCount >= 2) {
            // Combo dash acceleration: each chained kill shaves 500ms off dash cooldown
            s.player.dashCooldownTimer = Math.max(0, s.player.dashCooldownTimer - 500);

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
            // V6: stamp overlay at milestones
            if (this.comboCount === 3 || this.comboCount === 5 || this.comboCount === 7 || this.comboCount === 10) {
                if (s.hud?.showComboStamp) s.hud.showComboStamp(this.comboCount);
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

        // Relic: crimson_pyre — create fire zone on banish
        if (s.relicManager && s.relicManager.getFlag('pyreOnBanish')) {
            const pyreDuration = s.relicManager.getApplyOrTier2Value('crimson_pyre', 'pyreDuration') || 2000;
            const pyreZone = s.add.rectangle(x, y, 60, 40, 0xFF2200, 0.35).setDepth(5);
            s.time.delayedCall(pyreDuration, () => { if (pyreZone.active) pyreZone.destroy(); });
            s.time.addEvent({
                delay: 200, repeat: Math.ceil(pyreDuration / 200) - 1,
                callback: () => {
                    if (!pyreZone.active) return;
                    for (const en of s.enemyGroup.getChildren()) {
                        if (!en.active || !en.alive) continue;
                        if (Phaser.Math.Distance.Between(x, y, en.x, en.y) < 40) {
                            en.stun(300);
                        }
                    }
                }
            });
        }

        // Relic: chain_banish — splash damage to nearby enemies
        if (s.relicManager && s.relicManager.getFlag('chainBanish')) {
            const chainRadius = s.relicManager._getChainBanishRadius();
            for (const en of s.enemyGroup.getChildren()) {
                if (!en.active || !en.alive) continue;
                const dist = Phaser.Math.Distance.Between(x, y, en.x, en.y);
                if (dist < chainRadius && dist > 1) {
                    // Reduce hitsToKill or stun if multi-hit
                    if (en.hitsToKill > 1) {
                        en.hitsToKill--;
                        en._drawHitPips?.();
                        en.setTint(0xFF8844);
                        s.time.delayedCall(120, () => { if (en.active) { en.setTint(en._enemyTint || 0xFFFFFF); if (!en._enemyTint) en.clearTint(); } });
                    }
                    s.popups.show(en.x, en.y - 20, '-8 CHAIN', '#FF8844', '10px');
                    GlobalState.drainFlame(-0); // no flame cost; just visual
                }
            }
        }

        // E ability: lethal mark — on kill restore flame and clear mark
        if (s._lethalMarkExpiry && s.time.now < s._lethalMarkExpiry) {
            const cls = SkillManager.activeClass;
            const reward = cls?.eAbility?.flameReward ?? 30;
            GlobalState.restoreFlame(reward);
            s.popups.show(x, y - 50, `LETHAL MARK +${reward} FLAME`, '#AA44FF', '13px');
            s._lethalMarkExpiry = 0;
        }

        // E ability: parry stance — restore flame on banish during parry
        if (s._parryActive) {
            const cls = SkillManager.activeClass;
            const reward = cls?.eAbility?.parryFlame ?? 8;
            GlobalState.restoreFlame(reward);
            s.popups.show(x, y - 30, `PARRY +${reward} FLAME`, '#CCCCCC', '11px');
        }

        // Phase J: class passive effects on kill
        this._applyPassive(x, y, duringDash);

        // Lava zone kill bonus
        if (s.hazardZones) {
            const inLava = s.hazardZones.some(z => z.def.id === 'lava_pool' &&
                Math.abs(x - z.rect.x) < z.def.width / 2);
            if (inLava) {
                GlobalState.addElixir(HAZARD_ZONES.lava_pool.elixirBonus);
                s.popups.show(x, y - 30, `+${HAZARD_ZONES.lava_pool.elixirBonus} LAVA BONUS!`, '#FF6600', '12px');
            }
        }
    }

    // ─── Phase J: Class Passive on Kill ───

    /** Small particle burst at world position for passive trigger feedback */
    _passiveBurst(x, y, tint) {
        const s = this.scene;
        if (!s.textures.exists('pixel')) return;
        const emitter = s.add.particles(x, y, 'pixel', {
            speed: { min: 40, max: 120 },
            angle: { min: 0, max: 360 },
            scale: { start: 2.0, end: 0 },
            alpha: { start: 0.9, end: 0 },
            lifespan: { min: 180, max: 360 },
            tint,
            blendMode: 'ADD',
            quantity: 10,
            emitting: false,
        }).setDepth(12);
        emitter.explode(10);
        s.time.delayedCall(400, () => { if (emitter.active) emitter.destroy(); });
    }

    _applyPassive(x, y, duringDash) {
        const cls = SkillManager.activeClass;
        const p = cls?.passive;
        if (!p) return;
        const s = this.scene;

        if (p.id === 'kill_fuel') {
            GlobalState.flame = Math.min(GlobalState.flame + p.flamePerKill, GlobalState.maxFlame);
            s.popups.show(x, y - 30, `+${p.flamePerKill} FLAME`, '#FF8844', '10px');
            this._passiveBurst(x, y, 0xFF6622);
            s.audio?.playPassiveTrigger?.('kill_fuel');
        }

        if (p.id === 'shadow_strike') {
            const restore = duringDash ? p.dashKillFlame : p.normalKillFlame;
            GlobalState.flame = Math.min(GlobalState.flame + restore, GlobalState.maxFlame);
            s.popups.show(x, y - 30, `+${restore} FLAME`, '#AA44FF', '10px');
            this._passiveBurst(x, y, 0x8833CC);
            s.audio?.playPassiveTrigger?.('shadow_strike');
        }

        if (p.id === 'iron_palm') {
            for (const e of s.enemyGroup.getChildren()) {
                if (!e.active) continue;
                const dx = e.x - x, dy = e.y - y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < p.radius && dist > 1) {
                    e.body.setVelocityX((dx / dist) * p.pushSpeed);
                }
            }
            this._passiveBurst(x, y, 0xCCDDFF);
        }

        if (p.id === 'duelist_rhythm') {
            s._passiveBanishCount = (s._passiveBanishCount || 0) + 1;
            if (s._passiveBanishCount % p.killInterval === 0) {
                GlobalState.addElixir(p.bonusElixir);
                s.popups.show(x, y - 40, `+${p.bonusElixir} ELIXIR!`, '#FFCC00', '14px');
                this._passiveBurst(x, y, 0xFFDD44);
                s.audio?.playPassiveTrigger?.('duelist_rhythm');
            }
        }

        if (p.id === 'combustion') {
            s._spawnFireZone?.(x, y, p.radius, p.duration);
            this._passiveBurst(x, y, 0xFF3300);
            s.audio?.playPassiveTrigger?.('combustion');
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

    // ─── Primed State (Ability Synergy) ───

    /** Called after any S or E use. Opens 3s combo window for enhanced Q. */
    _setPrimed() {
        const s = this.scene;
        s._qPrimed = true;
        s._qPrimedExpiry = s.time.now + 3000;
        if (s._qPrimedTimer) s._qPrimedTimer.destroy();
        s._qPrimedTimer = s.time.delayedCall(3000, () => {
            s._qPrimed = false;
            s._qPrimedTimer = null;
            s.hud?.setQPrimed?.(false);
        });
        s.hud?.setQPrimed?.(true);
        s.audio?.playQPrimed?.();
    }

    // ─── E Ability Dispatcher ───

    handleEAbility(eType, x, y) {
        this._setPrimed();
        if (this.scene.audio?.playAbility) this.scene.audio.playAbility(eType);
        switch (eType) {
            case 'flame_burst':     return this._eFlameBurst(x, y);
            case 'war_howl':        return this._eWarHowl(x, y);
            case 'mana_shield':     return this._eManaShield(x, y);
            case 'eagle_eye':       return this._eEagleEye(x, y);
            case 'fortify':         return this._eFortify(x, y);
            case 'regen_pulse':     return this._eRegenPulse(x, y);
            case 'lethal_mark':     return this._eLethalMark(x, y);
            case 'chi_strike':      return this._eChiStrike(x, y);
            case 'parry_stance':    return this._eParryStance(x, y);
            case 'combustion_burst': return this._eCombustionBurst(x, y);
            default:                return this._eFlameBurst(x, y);
        }
    }

    // Adventurer: flame push + AoE banish (original flame burst logic)
    _eFlameBurst(x, y) {
        const s = this.scene;
        const radius = SkillManager.getValue('flameBurst.radius', FLAME_BURST.RADIUS);
        const banishRadius = SkillManager.getValue('flameBurst.banishRadius', FLAME_BURST.BANISH_RADIUS);

        s.audio.playFlameBurst();
        s.cameras.main.shake(200, 0.006);

        const ring = s.add.circle(x, y, 10, 0xFF6600, 0.4).setDepth(60);
        s.tweens.add({
            targets: ring, radius: radius, alpha: 0, duration: 400,
            onUpdate: () => ring.setRadius(ring.radius),
            onComplete: () => ring.destroy()
        });

        if (s.textures.exists('fx_blast')) {
            const blast = s.add.sprite(x, y, 'fx_blast').setDepth(61).setDisplaySize(banishRadius * 2, banishRadius * 2);
            if (s.anims.exists('fx_blast_anim')) blast.play('fx_blast_anim');
            blast.once('animationcomplete', () => { if (blast.active) blast.destroy(); });
        }

        for (const enemy of s.enemyGroup.getChildren()) {
            if (!enemy.active || !enemy.alive) continue;
            const dist = Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y);
            if (dist < banishRadius) {
                s.particles.wraithBanish(enemy.x, enemy.y);
                s.popups.wraithBanished(enemy.x, enemy.y);
                s.audio.playWraithBanish();
                enemy.banish();
                this.onEnemyBanished(enemy.x, enemy.y, false);
            } else if (dist < radius) {
                const angle = Phaser.Math.Angle.Between(x, y, enemy.x, enemy.y);
                enemy.setVelocity(
                    Math.cos(angle) * FLAME_BURST.PUSH_FORCE,
                    Math.sin(angle) * FLAME_BURST.PUSH_FORCE
                );
                enemy.stun(1000);
            }
        }

        if (SkillManager.getFlag('flameBurst.grantInvincibility')) {
            const invMs = SkillManager.getValue('flameBurst.invincibilityMs', 0);
            s.player.isInvincible = true;
            s.player.invincibleTimer = invMs;
            s.player.setTint(0x4488FF);
            s.time.delayedCall(invMs, () => { if (s.player.active) s.player.clearTint(); });
        }
    }

    // Barbarian: reset Q cooldown, stun nearby enemies, orange shockwave
    _eWarHowl(x, y) {
        const s = this.scene;
        const cls = SkillManager.activeClass;
        const stunR = cls.eAbility?.stunRadius ?? 200;
        const stunD = cls.eAbility?.stunDuration ?? 1500;

        s.player.classAttackCooldownTimer = 0;
        s.cameras.main.shake(200, 0.007);
        s.popups.show(x, y - 40, 'WAR HOWL!', '#FF8844', '14px');

        const ring = s.add.circle(x, y, 10, 0xFF6600, 0.5).setDepth(60);
        s.tweens.add({
            targets: ring, radius: stunR, alpha: 0, duration: 450,
            onUpdate: () => ring.setRadius(ring.radius),
            onComplete: () => ring.destroy()
        });

        for (const enemy of s.enemyGroup.getChildren()) {
            if (!enemy.active || !enemy.alive) continue;
            if (Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y) < stunR) {
                enemy.stun(stunD);
            }
        }
    }

    // Wizard: invincible 3s, then AoE banish on expiry
    _eManaShield(x, y) {
        const s = this.scene;
        const cls = SkillManager.activeClass;
        const invD = cls.eAbility?.invincDuration ?? 3000;
        const banishR = cls.eAbility?.banishRadius ?? 180;

        s.player.isInvincible = true;
        s.player.invincibleTimer = invD;
        s.player.setTint(0x4488FF);
        s.popups.show(x, y - 40, 'MANA SHIELD', '#4488FF', '14px');

        const ring = s.add.circle(x, y, banishR * 0.5, 0x4488FF, 0).setDepth(60);
        ring.setStrokeStyle(3, 0x4488FF, 0.7);
        s.tweens.add({
            targets: ring, scaleX: 1.5, scaleY: 1.5, alpha: { from: 0.7, to: 0 }, duration: invD,
            onComplete: () => ring.destroy()
        });

        s.time.delayedCall(invD, () => {
            if (!s.player.active) return;
            s.player.clearTint();
            // AoE banish on expiry
            for (const enemy of s.enemyGroup.getChildren()) {
                if (!enemy.active || !enemy.alive) continue;
                if (Phaser.Math.Distance.Between(s.player.x, s.player.y, enemy.x, enemy.y) < banishR) {
                    s.particles.wraithBanish(enemy.x, enemy.y);
                    s.popups.wraithBanished(enemy.x, enemy.y);
                    s.audio.playWraithBanish();
                    enemy.banish();
                    this.onEnemyBanished(enemy.x, enemy.y, false);
                }
            }
            s.cameras.main.shake(300, 0.01);
            s.popups.show(s.player.x, s.player.y - 50, 'SHIELD BURST!', '#4488FF', '15px');
        });
    }

    // Ranger: slow-mo 2s real time, then restore
    _eEagleEye(x, y) {
        const s = this.scene;
        const cls = SkillManager.activeClass;
        const dur = cls.eAbility?.duration ?? 2000;
        const slowScale = cls.eAbility?.slowScale ?? 0.3;

        s.time.timeScale = slowScale;
        s.player.setTint(0xFFFF44);
        s.popups.show(x, y - 40, 'EAGLE EYE', '#FFFF44', '14px');

        window.setTimeout(() => {
            if (s.time) s.time.timeScale = 1.0;
            if (s.player && s.player.active) s.player.clearTint();
        }, dur);
    }

    // Tank: restore 40 flame immediately
    _eFortify(x, y) {
        const s = this.scene;
        const cls = SkillManager.activeClass;
        const heal = cls.eAbility?.healAmount ?? 40;

        GlobalState.restoreFlame(heal);
        s.popups.show(x, y - 40, `+${heal} FLAME`, '#44FF44', '16px');
        s.cameras.main.shake(100, 0.004);

        const ring = s.add.circle(x, y, 10, 0x44FF44, 0.4).setDepth(60);
        s.tweens.add({
            targets: ring, radius: 80, alpha: 0, duration: 400,
            onUpdate: () => ring.setRadius(ring.radius),
            onComplete: () => ring.destroy()
        });
    }

    // Healer: passive regen for 4s
    _eRegenPulse(x, y) {
        const s = this.scene;
        const cls = SkillManager.activeClass;
        const rate = cls.eAbility?.rate ?? 8;
        const dur = cls.eAbility?.duration ?? 4000;

        s._eRegenActive = { rate, remaining: dur };
        s.popups.show(x, y - 40, 'REGEN PULSE', '#88DDFF', '14px');

        const ring = s.add.circle(x, y, 10, 0x88DDFF, 0.3).setDepth(60);
        s.tweens.add({
            targets: ring, radius: 70, alpha: 0, duration: 500,
            onUpdate: () => ring.setRadius(ring.radius),
            onComplete: () => ring.destroy()
        });
    }

    // Assassin: next banish within 3s restores 30 flame
    _eLethalMark(x, y) {
        const s = this.scene;
        const cls = SkillManager.activeClass;
        s._lethalMarkExpiry = s.time.now + (cls.eAbility?.markDuration ?? 3000);
        s.popups.show(x, y - 40, 'LETHAL MARK', '#AA44FF', '14px');

        const eye = s.add.circle(x, y - 20, 8, 0xAA44FF, 0.8).setDepth(60);
        s.tweens.add({
            targets: eye, alpha: 0, scaleX: 3, scaleY: 3, duration: 600,
            onComplete: () => eye.destroy()
        });
    }

    // Monk: banish closest enemy, push all others in 200px
    _eChiStrike(x, y) {
        const s = this.scene;
        const cls = SkillManager.activeClass;
        const pushR = cls.eAbility?.pushRadius ?? 200;
        const pushDist = cls.eAbility?.pushDistance ?? 150;

        s.cameras.main.shake(150, 0.005);
        s.popups.show(x, y - 40, 'CHI STRIKE', '#44DD66', '14px');

        // Orange chi ring
        const ring = s.add.circle(x, y, 10, 0xFF8800, 0.5).setDepth(60);
        s.tweens.add({
            targets: ring, radius: pushR, alpha: 0, duration: 400,
            onUpdate: () => ring.setRadius(ring.radius),
            onComplete: () => ring.destroy()
        });

        // Find closest enemy and banish
        let closest = null, closestDist = Infinity;
        for (const enemy of s.enemyGroup.getChildren()) {
            if (!enemy.active || !enemy.alive) continue;
            const d = Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y);
            if (d < closestDist) { closestDist = d; closest = enemy; }
        }
        if (closest) {
            s.particles.wraithBanish(closest.x, closest.y);
            s.popups.wraithBanished(closest.x, closest.y);
            s.audio.playWraithBanish();
            closest.banish();
            this.onEnemyBanished(closest.x, closest.y, false);
        }

        // Push all others in radius
        for (const enemy of s.enemyGroup.getChildren()) {
            if (!enemy.active || !enemy.alive || enemy === closest) continue;
            const dist = Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y);
            if (dist < pushR) {
                const angle = Phaser.Math.Angle.Between(x, y, enemy.x, enemy.y);
                enemy.setVelocityX(Math.cos(angle) * pushDist * 2);
                enemy.stun(500);
            }
        }
    }

    // Duelist: enter parry for 1.5s — next banish during parry restores flame
    _eParryStance(x, y) {
        const s = this.scene;
        const cls = SkillManager.activeClass;
        const parryDur = cls.eAbility?.parryDuration ?? 1500;

        s._parryActive = true;
        s.player.setTint(0xCCCCCC);
        s.popups.show(x, y - 40, 'PARRY STANCE', '#CCCCCC', '14px');

        const ring = s.add.circle(x, y, 30, 0xCCCCCC, 0.4).setDepth(60);
        s.tweens.add({
            targets: ring, radius: 60, alpha: 0, duration: parryDur,
            onUpdate: () => ring.setRadius(ring.radius),
            onComplete: () => ring.destroy()
        });

        s.time.delayedCall(parryDur, () => {
            s._parryActive = false;
            if (s.player.active) s.player.clearTint();
        });
    }

    // Pyromancer: all active enemies take 40 drain
    _eCombustionBurst(x, y) {
        const s = this.scene;
        const cls = SkillManager.activeClass;
        const dmg = cls.eAbility?.damage ?? 40;

        s.cameras.main.shake(250, 0.009);
        s.audio.playFlameBurst();
        s.popups.show(x, y - 40, 'COMBUSTION!', '#FF4400', '16px');

        // Fire ring VFX
        const ring = s.add.circle(x, y, 10, 0xFF4400, 0.6).setDepth(60);
        s.tweens.add({
            targets: ring, radius: 250, alpha: 0, duration: 500,
            onUpdate: () => ring.setRadius(ring.radius),
            onComplete: () => ring.destroy()
        });

        if (s.textures.exists('fx_blast')) {
            const blast = s.add.sprite(x, y, 'fx_blast').setDepth(61).setDisplaySize(320, 320);
            if (s.anims.exists('fx_blast_anim')) blast.play('fx_blast_anim');
            blast.once('animationcomplete', () => { if (blast.active) blast.destroy(); });
        }

        for (const enemy of s.enemyGroup.getChildren()) {
            if (!enemy.active || !enemy.alive) continue;
            // Apply damage: if multi-hit reduce hitsToKill, if 1-hit banish
            const dmgHits = Math.ceil(dmg / 20);
            for (let i = 0; i < dmgHits && enemy.alive; i++) {
                if (enemy.hitsToKill <= 1) {
                    s.particles.wraithBanish(enemy.x, enemy.y);
                    s.popups.wraithBanished(enemy.x, enemy.y);
                    s.audio.playWraithBanish();
                    enemy.banish();
                    this.onEnemyBanished(enemy.x, enemy.y, false);
                    break;
                } else {
                    enemy.hitsToKill = Math.max(1, enemy.hitsToKill - 1);
                    enemy.setTint(0xFF4400);
                    s.time.delayedCall(200, () => { if (enemy.active) { enemy.clearTint?.(); } });
                }
            }
        }
    }

    // ─── Class Attack Dispatcher ───

    handleClassAttack(x, y, charged = false) {
        const s = this.scene;
        const cls = SkillManager.activeClass;
        if (!cls || !cls.attackType) return;

        // Q charged window: all enemies within 300px are temporarily set to 1 HP so the
        // attack instant-banishes multi-hit enemies; HP is restored for survivors after dispatch.
        s._qCharged = charged;
        if (charged) {
            for (const e of s.enemyGroup.getChildren()) {
                if (e.active && e.alive && Phaser.Math.Distance.Between(x, y, e.x, e.y) < 300) {
                    e._savedHp = e.hitsToKill;
                    e.hitsToKill = 1;
                }
            }
            s.hud?.showQChargedFire?.();
            s.audio?.playComboFire?.();
        }

        // Check and consume primed state (set by S or E use within 3s)
        s._qActivePrimed = !!(s._qPrimed && s.time.now < (s._qPrimedExpiry || 0));
        if (s._qActivePrimed) {
            s._qPrimed = false;
            if (s._qPrimedTimer) { s._qPrimedTimer.destroy(); s._qPrimedTimer = null; }
            s.hud?.setQPrimed?.(false);
            s.hud?.showComboLabel?.();
            s.audio?.playComboFire?.();
        }

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
            case 'arrow_shot':
                this._classArrowShot(x, y, cls);
                break;
            case 'berserker_charge':
                this._classBerserkerCharge(x, y, cls);
                break;
        }
        s._qActivePrimed = false;
        s._qCharged = false;
        // Restore HP for enemies that survived the charged Q (weren't banished)
        if (charged) {
            for (const e of s.enemyGroup.getChildren()) {
                if (e.active && e.alive && e._savedHp != null) {
                    e.hitsToKill = e._savedHp;
                    e._savedHp = undefined;
                }
            }
        }
    }

    // AOE banish (Wizard)
    _classAoeBanish(x, y, cls) {
        const s = this.scene;
        const primed = s._qActivePrimed;
        const banishR = primed ? cls.attackRadius * 1.5 : cls.attackRadius;
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

        // Blast VFX
        if (s.textures.exists('fx_blast')) {
            const blast = s.add.sprite(x, y, 'fx_blast').setDepth(61).setDisplaySize(banishR * 2, banishR * 2);
            if (s.anims.exists('fx_blast_anim')) blast.play('fx_blast_anim');
            blast.once('animationcomplete', () => { if (blast.active) blast.destroy(); });
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
                // Primed: +5 flame per banish
                if (primed) {
                    GlobalState.restoreFlame(5);
                    s.popups.show(enemy.x, enemy.y - 40, '+5 FLAME', '#FF6600', '10px');
                }
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

    // Knockback (Tank / Monk)
    _classKnockback(x, y, cls) {
        const s = this.scene;
        const primed = s._qActivePrimed;
        const radius = primed ? 200 : cls.attackRadius;
        const pushDist = cls.pushDistance;
        const stunD = primed ? (cls.id === 'monk' ? cls.stunDuration : 3000) : cls.stunDuration;

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

        // Monk primed: auto-fire chi_wave after knockback
        if (primed && cls.id === 'monk') {
            s.time.delayedCall(150, () => {
                if (!s.player || !s.player.active) return;
                const chiCfg = cls.sAbility || { speed: 300, stunDuration: 1800, radius: 30 };
                this._sChiWave(s.player.x, s.player.y, chiCfg);
            });
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
        const primed = s._qActivePrimed;
        const healAmt = primed ? 50 : cls.healAmount;
        GlobalState.flame = Math.min(GlobalState.flame + healAmt, GlobalState.maxFlame);
        s.popups.show(x, y - 40, `+${healAmt} FLAME`, '#FF8833', '14px');

        if (primed) {
            // Eliminate drain for 3s using mend drain mult = 0
            s._sMendDrainMult = 0;
            s._sMendDrainExpiry = s.time.now + 3000;
            s.popups.show(x, y - 60, 'DRAIN STOPPED 3s', '#44FF44', '12px');
        } else {
            // Drain reduction buff
            s.interactionSystem.shrineDrainBuffTimer = cls.drainReductionDuration;
            s.popups.show(x, y - 60, 'DRAIN HALVED', '#4488FF', '12px');
        }

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

    // Melee banish (Adventurer) — primed: AoE 140px all enemies; normal: closest in 70px
    _classMeleeBanish(x, y, cls) {
        const s = this.scene;
        const primed = s._qActivePrimed;
        const radius = primed ? 140 : (cls.attackRadius || 70);

        if (primed) {
            // AoE banish all enemies within 140px
            s.cameras.main.shake(200, 0.007);
            const ring = s.add.circle(x, y, 10, 0xFF8833, 0.4).setDepth(60);
            s.tweens.add({
                targets: ring, radius, alpha: 0, duration: 350,
                onUpdate: () => ring.setRadius(ring.radius),
                onComplete: () => ring.destroy()
            });
            for (const enemy of s.enemyGroup.getChildren()) {
                if (!enemy.active || !enemy.alive) continue;
                if (Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y) < radius) {
                    s.particles.wraithBanish(enemy.x, enemy.y);
                    s.popups.wraithBanished(enemy.x, enemy.y);
                    s.audio.playWraithBanish();
                    enemy.banish();
                    this.onEnemyBanished(enemy.x, enemy.y, false);
                }
            }
        } else {
            // Normal: banish closest in radius
            let closest = null;
            let closestDist = radius;
            for (const enemy of s.enemyGroup.getChildren()) {
                if (!enemy.active || !enemy.alive) continue;
                const d = Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y);
                if (d < closestDist) { closestDist = d; closest = enemy; }
            }
            if (closest) {
                s.particles.wraithBanish(closest.x, closest.y);
                s.popups.wraithBanished(closest.x, closest.y);
                s.audio.playWraithBanish();
                closest.banish();
                this.onEnemyBanished(closest.x, closest.y, false);
            }
        }
        // Reset dash cooldown
        s.player.dashCooldownTimer = 0;
        s.popups.show(x, y - 40, primed ? 'SURGE BLAST!' : 'DASH RESET', '#FFCC00', '11px');
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

    // Blink (Assassin) — primed: 220px + 10 flame/kill; normal: 130px
    _classBlink(x, y, cls) {
        const s = this.scene;
        const primed = s._qActivePrimed;
        const dir = s.player.facingRight ? 1 : -1;
        const dist = primed ? 220 : cls.blinkDistance;
        const blinkFlamePerKill = primed ? 10 : 0;
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
                if (blinkFlamePerKill > 0) {
                    GlobalState.restoreFlame(blinkFlamePerKill);
                    s.popups.show(enemy.x, enemy.y - 30, `+${blinkFlamePerKill} FLAME`, '#AA44FF', '10px');
                }
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

    // Dual Strike (Duelist) — primed: 3-hit with 100px sweeping third strike; normal: 2-hit
    _classDualStrike(x, y, cls) {
        const s = this.scene;
        const primed = s._qActivePrimed;
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

            // Primed third hit: wide 100px sweeping arc banish
            if (primed) {
                s.time.delayedCall(180, () => {
                    s.cameras.main.shake(250, 0.008);
                    const sweepR = 100;
                    const sweepRing = s.add.circle(x + dir * 50, y, 10, 0xFFCC00, 0.5).setDepth(60);
                    s.tweens.add({
                        targets: sweepRing, radius: sweepR, alpha: 0, duration: 300,
                        onUpdate: () => sweepRing.setRadius(sweepRing.radius),
                        onComplete: () => sweepRing.destroy()
                    });
                    for (const enemy of s.enemyGroup.getChildren()) {
                        if (!enemy.active || !enemy.alive) continue;
                        const dist = Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y);
                        if (dist < sweepR) {
                            s.particles.wraithBanish(enemy.x, enemy.y);
                            s.popups.wraithBanished(enemy.x, enemy.y);
                            s.audio.playWraithBanish();
                            enemy.banish();
                            this.onEnemyBanished(enemy.x, enemy.y, false);
                        }
                    }
                    s.popups.show(x + dir * 50, y - 40, 'BLADE SWEEP!', '#FFCC00', '13px');
                });
            }
        });
    }

    // Flame Projectile (Pyromancer) — primed: triple spread ±15°; normal: single fireball
    _classFlameProjectile(x, y, cls) {
        const s = this.scene;
        const primed = s._qActivePrimed;
        const dir = s.player.facingRight ? 1 : -1;

        if (primed) {
            // Triple spread
            s.popups.show(x, y - 40, 'TRIPLE BLAST!', '#FFD700', '13px');
            const spreadRad = 15 * Math.PI / 180;
            for (const angleOff of [0, spreadRad, -spreadRad]) {
                this._fireFlameAtAngle(x, y, cls, dir, angleOff);
            }
        } else {
            this._fireFlameAtAngle(x, y, cls, dir, 0);
        }
    }

    /** Internal: fire a single fireball at a given vertical angle offset (radians) */
    _fireFlameAtAngle(x, y, cls, dir, angleOff) {
        const s = this.scene;
        const speed = cls.projectileSpeed;
        const radius = cls.projectileRadius;
        const vx = dir * Math.cos(angleOff) * speed;
        const vy = -Math.sin(angleOff) * speed; // negative = upward in Phaser

        const startX = x + dir * 20;
        const startY = y;
        let fbX = startX;
        let fbY = startY;

        const fireball = s.add.circle(fbX, fbY, 8, 0xFF4400, 0.9).setDepth(60);
        const glow = s.add.circle(fbX, fbY, 14, 0xFF6600, 0.3).setDepth(59);

        let fbSprite = null;
        if (s.textures.exists('fx_fireball')) {
            fbSprite = s.add.sprite(fbX, fbY, 'fx_fireball').setDepth(61).setDisplaySize(24, 24);
            if (s.anims.exists('fx_fireball_anim')) fbSprite.play('fx_fireball_anim');
            fireball.setAlpha(0);
        }

        const combat = this;
        const fbEvent = s.time.addEvent({
            delay: 16,
            repeat: 120,
            callback: () => {
                fbX += vx * 0.016;
                fbY += vy * 0.016;
                fireball.setPosition(fbX, fbY);
                glow.setPosition(fbX, fbY);
                if (fbSprite) fbSprite.setPosition(fbX, fbY);

                for (const enemy of s.enemyGroup.getChildren()) {
                    if (!enemy.active || !enemy.alive) continue;
                    if (Phaser.Math.Distance.Between(fbX, fbY, enemy.x, enemy.y) < radius) {
                        s.particles.wraithBanish(enemy.x, enemy.y);
                        s.popups.wraithBanished(enemy.x, enemy.y);
                        s.audio.playWraithBanish();
                        enemy.banish();
                        combat.onEnemyBanished(enemy.x, enemy.y, false);
                        fbEvent.destroy();
                        fireball.destroy();
                        glow.destroy();
                        if (fbSprite) fbSprite.destroy();
                        return;
                    }
                }

                if (Math.abs(fbX - startX) > 650 || Math.abs(fbY - startY) > 400) {
                    fbEvent.destroy();
                    fireball.destroy();
                    glow.destroy();
                    if (fbSprite) fbSprite.destroy();
                }
            }
        });
    }

    // Arrow Shot (Ranger) — primed: arrows pierce all enemies; normal: stop at first hit
    _classArrowShot(x, y, cls) {
        const s = this.scene;
        const primed = s._qActivePrimed;
        const dir = s.player.facingRight ? 1 : -1;
        const speed = cls.arrowSpeed || 620;
        const count = cls.arrowCount || 3;

        s.cameras.main.shake(60, 0.002);
        s.popups.show(x, y - 40, primed ? 'PIERCING SHOT' : 'RAPID SHOT', '#44DD66', '13px');

        const combat = this;

        for (let i = 0; i < count; i++) {
            s.time.delayedCall(i * 110, () => {
                if (!s.player || !s.player.active) return;

                const spreadY = (i - 1) * 8;
                const startX = s.player.x + dir * 30;
                const startY = s.player.y + spreadY - 4;

                const arrowColor = primed ? 0xFFDD44 : 0x88FF55;
                const tipColor = primed ? 0xFFFFAA : 0xFFFF88;
                const arrow = s.add.rectangle(startX, startY, 22, 3, arrowColor).setDepth(58);
                const tip = s.add.rectangle(startX + dir * 12, startY, 6, 5, tipColor).setDepth(59);

                let arrowX = startX;
                let destroyed = false;

                const arrowEvent = s.time.addEvent({
                    delay: 16,
                    repeat: 90,
                    callback: () => {
                        if (destroyed) return;

                        arrowX += dir * speed * 0.016;
                        arrow.setX(arrowX);
                        tip.setX(arrowX + dir * 12);

                        for (const enemy of s.enemyGroup.getChildren()) {
                            if (!enemy.active || !enemy.alive) continue;
                            const dx = Math.abs(arrowX - enemy.x);
                            const dy = Math.abs(startY - enemy.y);
                            if (dx < 24 && dy < 32) {
                                s.particles.wraithBanish(enemy.x, enemy.y);
                                s.popups.wraithBanished(enemy.x, enemy.y);
                                s.audio.playWraithBanish();
                                enemy.banish();
                                combat.onEnemyBanished(enemy.x, enemy.y, false);
                                if (!primed) {
                                    // Normal: stop at first hit
                                    destroyed = true;
                                    arrowEvent.destroy();
                                    if (arrow.active) arrow.destroy();
                                    if (tip.active) tip.destroy();
                                    return;
                                }
                                // Primed: pierce — continue flying
                            }
                        }

                        if (Math.abs(arrowX - startX) > 900) {
                            destroyed = true;
                            arrowEvent.destroy();
                            if (arrow.active) arrow.destroy();
                            if (tip.active) tip.destroy();
                        }
                    }
                });
            });
        }
    }

    // Berserker Charge (Barbarian) — primed: 350px + 15 flame/kill; normal: 210px + 8 flame/kill
    _classBerserkerCharge(x, y, cls) {
        const s = this.scene;
        const primed = s._qActivePrimed;
        const dir = s.player.facingRight ? 1 : -1;
        const chargeDist = primed ? 350 : (cls.chargeDistance || 210);
        const flamePerKill = primed ? 15 : (cls.chargeFlamePerKill || 8);
        const targetX = x + dir * chargeDist;

        s.cameras.main.shake(primed ? 400 : 300, 0.010);
        s.popups.show(x, y - 40, primed ? 'RAMPAGE CHARGE!!' : 'BERSERKER CHARGE!', '#FF4444', primed ? '15px' : '14px');

        // Charge trail VFX — red streak
        const trail = s.add.rectangle(
            x + dir * chargeDist / 2, y, chargeDist, 10, 0xFF4444, 0.45
        ).setDepth(58);
        s.tweens.add({
            targets: trail, alpha: 0, scaleX: 0.2, duration: 380,
            onComplete: () => trail.destroy()
        });

        // Brief red tint
        s.player.setTint(0xFF4444);
        s.time.delayedCall(280, () => { if (s.player.active) s.player.clearTint(); });

        // Banish all enemies in charge path
        const combat = this;
        let killCount = 0;
        for (const enemy of s.enemyGroup.getChildren()) {
            if (!enemy.active || !enemy.alive) continue;
            const ex = enemy.x;
            const ey = enemy.y;
            const inPath = dir > 0
                ? (ex > x - 10 && ex < targetX + 20)
                : (ex < x + 10 && ex > targetX - 20);
            if (inPath && Math.abs(ey - y) < 55) {
                s.particles.wraithBanish(enemy.x, enemy.y);
                s.popups.wraithBanished(enemy.x, enemy.y);
                s.audio.playWraithBanish();
                enemy.banish();
                combat.onEnemyBanished(enemy.x, enemy.y, false);
                killCount++;
            }
        }

        // Flame restore per enemy hit
        if (killCount > 0) {
            const totalFlame = killCount * flamePerKill;
            GlobalState.flame = Math.min(GlobalState.flame + totalFlame, GlobalState.maxFlame);
            s.popups.show(x + dir * chargeDist / 2, y - 54,
                `+${totalFlame} FLAME`, '#FF6600', '12px');
        }

        // Move player to end of charge + brief invincibility
        s.player.setX(targetX);
        s.player.isInvincible = true;
        s.player.invincibleTimer = 300;
    }

    // ─── Class S Ability Dispatcher ───

    handleSAbility(sType, x, y) {
        this._setPrimed();
        if (this.scene.audio?.playAbility) this.scene.audio.playAbility(sType);
        const cls = SkillManager.activeClass;
        const sAbility = cls && cls.sAbility ? cls.sAbility : { type: 'smoke_bomb' };

        switch (sType) {
            case 'smoke_bomb':
                this._sSmokeBomb(x, y, sAbility);
                break;
            case 'war_cry':
                this._sWarCry(x, y, sAbility);
                break;
            case 'arcane_mine':
                this.handleArcaneMine(x, y, sAbility);
                break;
            case 'volley':
                this._sVolley(x, y, sAbility);
                break;
            case 'iron_stance':
                this._sIronStance(x, y, sAbility);
                break;
            case 'mend':
                this._sMend(x, y, sAbility);
                break;
            case 'vanish':
                this._sVanish(x, y, sAbility);
                break;
            case 'chi_wave':
                this._sChiWave(x, y, sAbility);
                break;
            case 'blade_storm':
                this._sBladeStorm(x, y, sAbility);
                break;
            case 'inferno':
                this._sInferno(x, y, sAbility);
                break;
            default:
                this._sSmokeBomb(x, y, sAbility);
                break;
        }
    }

    // Adventurer: smoke bomb — stun zone ahead, restore flame
    _sSmokeBomb(x, y, cfg) {
        const s = this.scene;
        const radius = cfg.radius ?? 200;
        const stunD = cfg.stunDuration ?? 2500;
        const flameRestore = cfg.flameRestore ?? 8;
        const dir = s.player.facingRight ? 1 : -1;
        const cx = x + dir * 120; // place ahead of player

        s.cameras.main.shake(150, 0.005);
        s.popups.show(cx, y - 40, 'SMOKE BOMB', '#AAAAAA', '13px');

        GlobalState.restoreFlame(flameRestore);
        s.popups.show(x, y - 60, `+${flameRestore} FLAME`, '#FF8833', '11px');

        // Grey circle VFX
        const smoke = s.add.circle(cx, y, 10, 0x888888, 0.5).setDepth(60);
        s.tweens.add({
            targets: smoke, radius: radius, alpha: 0, duration: 600,
            onUpdate: () => smoke.setRadius(smoke.radius),
            onComplete: () => smoke.destroy()
        });

        for (const enemy of s.enemyGroup.getChildren()) {
            if (!enemy.active || !enemy.alive) continue;
            if (Phaser.Math.Distance.Between(cx, y, enemy.x, enemy.y) < radius) {
                enemy.stun(stunD);
            }
        }
    }

    // Barbarian: war cry — stun on-screen enemies, reduce drain
    _sWarCry(x, y, cfg) {
        const s = this.scene;
        const stunD = cfg.stunDuration ?? 2000;

        s.cameras.main.shake(300, 0.01);
        s.popups.show(x, y - 40, 'WAR CRY!', '#FF4444', '16px');

        const ring = s.add.circle(x, y, 10, 0xFF4444, 0.4).setDepth(60);
        s.tweens.add({
            targets: ring, radius: 300, alpha: 0, duration: 500,
            onUpdate: () => ring.setRadius(ring.radius),
            onComplete: () => ring.destroy()
        });

        for (const enemy of s.enemyGroup.getChildren()) {
            if (!enemy.active || !enemy.alive) continue;
            enemy.stun(stunD);
        }

        // Drain reduction flag picked up in Level1 drain section
        if (cfg.drainMult && cfg.drainDuration) {
            s._sWarCryDrainMult = cfg.drainMult;
            s._sWarCryDrainExpiry = s.time.now + cfg.drainDuration;
        }
    }

    // Wizard: drop mine at position, detonates after delay
    handleArcaneMine(x, y, cfg) {
        if (this.scene.audio?.playAbility) this.scene.audio.playAbility('arcane_mine');
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

    // Ranger: 5-arrow fan volley
    _sVolley(x, y, cfg) {
        const s = this.scene;
        const count = cfg.arrowCount ?? 5;
        const speed = cfg.arrowSpeed ?? 620;
        const spreadDeg = cfg.spreadDeg ?? 20;
        const dir = s.player.facingRight ? 1 : -1;

        s.cameras.main.shake(100, 0.003);
        s.popups.show(x, y - 40, 'VOLLEY!', '#44DD66', '14px');

        const combat = this;
        for (let i = 0; i < count; i++) {
            const angleOffset = (i - Math.floor(count / 2)) * (spreadDeg / (count - 1)) * (Math.PI / 180);
            const baseAngle = dir > 0 ? 0 : Math.PI;
            const angle = baseAngle + angleOffset;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;

            const arrow = s.add.rectangle(x + dir * 16, y, 22, 3, 0x44DD66).setDepth(55);
            const tip = s.add.rectangle(x + dir * 27, y, 6, 5, 0x88FF88).setDepth(56);
            arrow.setFlipX(dir < 0);

            let ax = x + dir * 16, ay = y;
            const range = 900;
            const duration = (range / speed) * 1000;

            s.tweens.add({
                targets: [arrow, tip],
                x: `+=${vx * duration / 1000}`,
                y: `+=${vy * duration / 1000}`,
                duration,
                onUpdate: () => {
                    ax = arrow.x; ay = arrow.y;
                    for (const enemy of s.enemyGroup.getChildren()) {
                        if (!enemy.active || !enemy.alive) continue;
                        if (Phaser.Math.Distance.Between(ax, ay, enemy.x, enemy.y) < 22) {
                            s.particles.wraithBanish(enemy.x, enemy.y);
                            s.popups.wraithBanished(enemy.x, enemy.y);
                            s.audio.playWraithBanish();
                            enemy.banish();
                            combat.onEnemyBanished(enemy.x, enemy.y, false);
                            arrow.destroy(); tip.destroy();
                        }
                    }
                },
                onComplete: () => { if (arrow.active) arrow.destroy(); if (tip.active) tip.destroy(); }
            });
        }
    }

    // Tank: invincibility 3s; while invincible, touching an enemy banishes it
    _sIronStance(x, y, cfg) {
        const s = this.scene;
        const invD = cfg.invincDuration ?? 3000;

        s.player.isInvincible = true;
        s.player.invincibleTimer = invD;
        s.popups.show(x, y - 40, 'IRON STANCE', '#CCCCCC', '14px');

        // Gold glow tween
        s.player.setTint(0xFFDD44);
        s.time.delayedCall(invD, () => {
            if (s.player.active) s.player.clearTint();
        });

        s.cameras.main.shake(150, 0.005);
    }

    // Healer: restore 30 flame, drain -50% for 4s
    _sMend(x, y, cfg) {
        const s = this.scene;
        const heal = cfg.healAmount ?? 30;

        GlobalState.restoreFlame(heal);
        s.popups.show(x, y - 40, `MEND +${heal} FLAME`, '#88DDFF', '14px');

        // Drain mult stored for Level1 drain section
        if (cfg.drainMult && cfg.drainDuration) {
            s._sMendDrainMult = cfg.drainMult;
            s._sMendDrainExpiry = s.time.now + cfg.drainDuration;
        }

        const ring = s.add.circle(x, y, 10, 0x88DDFF, 0.35).setDepth(60);
        s.tweens.add({
            targets: ring, radius: 80, alpha: 0, duration: 500,
            onUpdate: () => ring.setRadius(ring.radius),
            onComplete: () => ring.destroy()
        });
    }

    // Assassin: 2.5s semi-transparent + invincible
    _sVanish(x, y, cfg) {
        const s = this.scene;
        const dur = cfg.invisDuration ?? 2500;

        s.player.setAlpha(0.15);
        s.player.isInvincible = true;
        s.player.invincibleTimer = dur;
        s.popups.show(x, y - 40, 'VANISH', '#AA44FF', '14px');

        s.time.delayedCall(dur, () => {
            if (!s.player.active) return;
            s.player.setAlpha(1);
            s.player.isInvincible = false;
            // Burst VFX
            const burst = s.add.circle(s.player.x, s.player.y, 10, 0xAA44FF, 0.5).setDepth(60);
            s.tweens.add({
                targets: burst, radius: 80, alpha: 0, duration: 400,
                onUpdate: () => burst.setRadius(burst.radius),
                onComplete: () => burst.destroy()
            });
        });
    }

    // Monk: slow projectile that stuns all enemies it touches
    _sChiWave(x, y, cfg) {
        const s = this.scene;
        const speed = cfg.speed ?? 300;
        const stunD = cfg.stunDuration ?? 1800;
        const hitR = cfg.radius ?? 30;
        const dir = s.player.facingRight ? 1 : -1;

        s.popups.show(x, y - 40, 'CHI WAVE', '#44DD66', '13px');

        const wave = s.add.circle(x + dir * 20, y, hitR, 0x44DD66, 0.5).setDepth(60);
        const combat = this;
        const range = 800;
        const duration = (range / speed) * 1000;

        s.tweens.add({
            targets: wave,
            x: x + dir * range,
            duration,
            ease: 'Linear',
            onUpdate: () => {
                for (const enemy of s.enemyGroup.getChildren()) {
                    if (!enemy.active || !enemy.alive) continue;
                    if (Phaser.Math.Distance.Between(wave.x, wave.y, enemy.x, enemy.y) < hitR + 20) {
                        enemy.stun(stunD);
                        s.popups.show(enemy.x, enemy.y - 20, 'CHI STUN', '#44DD66', '10px');
                    }
                }
            },
            onComplete: () => wave.destroy()
        });
    }

    // Duelist: AoE banish at player position + reset Q cooldown
    _sBladeStorm(x, y, cfg) {
        const s = this.scene;
        const radius = cfg.radius ?? 120;

        s.cameras.main.shake(200, 0.008);
        s.popups.show(x, y - 40, 'BLADE STORM', '#FFCC00', '14px');

        const ring = s.add.circle(x, y, 10, 0xFFCC00, 0.4).setDepth(60);
        s.tweens.add({
            targets: ring, radius, alpha: 0, duration: 450,
            onUpdate: () => ring.setRadius(ring.radius),
            onComplete: () => ring.destroy()
        });

        for (const enemy of s.enemyGroup.getChildren()) {
            if (!enemy.active || !enemy.alive) continue;
            if (Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y) < radius) {
                s.particles.wraithBanish(enemy.x, enemy.y);
                s.popups.wraithBanished(enemy.x, enemy.y);
                s.audio.playWraithBanish();
                enemy.banish();
                this.onEnemyBanished(enemy.x, enemy.y, false);
            }
        }

        // Reset Q cooldown
        s.player.classAttackCooldownTimer = 0;
    }

    // Pyromancer: expanding DoT ring at player feet
    _sInferno(x, y, cfg) {
        const s = this.scene;
        const radius = cfg.radius ?? 120;
        const duration = cfg.duration ?? 3000;
        const tickDmg = cfg.tickDamage ?? 10;
        const tickInterval = cfg.tickInterval ?? 500;

        s.cameras.main.shake(200, 0.007);
        s.popups.show(x, y - 40, 'INFERNO!', '#FF4400', '15px');

        const zone = s.add.circle(x, y, radius, 0xFF4400, 0.25).setDepth(54);

        const combat = this;
        const burnEvent = s.time.addEvent({
            delay: tickInterval,
            repeat: Math.floor(duration / tickInterval) - 1,
            callback: () => {
                for (const enemy of s.enemyGroup.getChildren()) {
                    if (!enemy.active || !enemy.alive) continue;
                    if (Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y) < radius) {
                        GlobalState.drainFlame(-0); // no player cost
                        if (enemy.hitsToKill <= 1) {
                            s.particles.wraithBanish(enemy.x, enemy.y);
                            s.audio.playWraithBanish();
                            enemy.banish();
                            combat.onEnemyBanished(enemy.x, enemy.y, false);
                        } else {
                            enemy.hitsToKill = Math.max(1, enemy.hitsToKill - 1);
                            enemy.setTint(0xFF4400);
                            s.time.delayedCall(150, () => { if (enemy.active) enemy.clearTint?.(); });
                        }
                    }
                }
            }
        });

        s.time.delayedCall(duration, () => {
            s.tweens.add({
                targets: zone, alpha: 0, duration: 500,
                onComplete: () => zone.destroy()
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
