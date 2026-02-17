import Phaser from 'phaser';
import { WORLD, PLAYER, FLAME, FLAME_WISP, FLAME_SHRINE, WRAITH, SHROUD, GROUND_SLAM, FLAME_BURST, COMBO } from '../constants.js';
import { GlobalState } from '../GlobalState.js';
import { SkillManager } from '../systems/SkillManager.js';
import { CLASS_DEFS } from '../systems/ClassDefs.js';
import { Player } from '../entities/Player.js';
import { Shroud } from '../entities/Shroud.js';
import { InputManager } from '../systems/InputManager.js';
import { ParallaxBackground } from '../systems/ParallaxBackground.js';
import { AudioManager } from '../systems/AudioManager.js';
import { LevelGenerator } from '../systems/LevelGenerator.js';
import { ParticleManager } from '../systems/ParticleManager.js';
import { PopupText } from '../systems/PopupText.js';
import { BiomeManager } from '../systems/BiomeManager.js';
import { AchievementManager } from '../systems/AchievementManager.js';
import { HUD } from '../ui/HUD.js';
import { LevelUpOverlay } from '../ui/LevelUpOverlay.js';
import { PauseOverlay } from '../ui/PauseOverlay.js';
import { DebugPanel } from '../ui/DebugPanel.js';

export class Level1 extends Phaser.Scene {
    constructor() {
        super('Level1');
    }

    create() {
        GlobalState.reset();

        this.physics.world.setBounds(0, 0, WORLD.WIDTH, WORLD.HEIGHT);

        // Parallax
        this.parallax = new ParallaxBackground(this);

        // Audio
        this.audio = new AudioManager();
        this.input.once('pointerdown', () => { this.audio.init(); this.audio.resume(); });
        this.input.keyboard.once('keydown', () => { this.audio.init(); this.audio.resume(); });

        // Ground
        this.ground = this.add.tileSprite(
            WORLD.WIDTH / 2, WORLD.GROUND_Y + WORLD.GROUND_HEIGHT / 2,
            WORLD.WIDTH, WORLD.GROUND_HEIGHT, 'ground'
        );
        this.physics.add.existing(this.ground, true);

        // Groups
        this.platforms = this.physics.add.staticGroup();
        this.elixirVeins = this.add.group();
        this.flameWisps = this.add.group();
        this.corruptionPools = this.add.group();
        this.loreScrolls = this.add.group();
        this.flameShrines = this.add.group();
        this.enemyGroup = this.add.group();
        this.decorations = this.add.group();
        this.crumblingPlatforms = this.add.group();

        // Player
        this.player = new Player(this, PLAYER.START_X, PLAYER.START_Y);
        this.inputManager = new InputManager(this);

        // Colliders
        this.physics.add.collider(this.player, this.ground);
        this.physics.add.collider(this.player, this.platforms, (player, platform) => {
            // Detect if player is standing on top of a crumbling platform
            if (platform.setPlayerOnTop && player.body.touching.down) {
                platform.setPlayerOnTop();
            }
        });

        // Shroud
        this.shroud = new Shroud(this);

        // Systems
        this.particles = new ParticleManager(this);
        this.popups = new PopupText(this);
        this.biomeManager = new BiomeManager(this);

        // Biome change callback — tint ground + atmosphere particles
        this.biomeManager.onBiomeChange = (biome) => {
            this.ground.setTint(biome.groundTint);
            this.particles.setBiomeAtmosphere(biome.id);
        };

        // Level generator (pass all groups)
        this.levelGen = new LevelGenerator(this, {
            platforms: this.platforms,
            elixirVeins: this.elixirVeins,
            flameWisps: this.flameWisps,
            corruptionPools: this.corruptionPools,
            loreScrolls: this.loreScrolls,
            flameShrines: this.flameShrines,
            enemies: this.enemyGroup,
            decorations: this.decorations,
            crumblingPlatforms: this.crumblingPlatforms,
        }, this.biomeManager);

        this.levelGen.generateAhead(this.cameras.main.scrollX + this.scale.width);

        // Camera
        this.cameras.main.setBounds(0, 0, WORLD.WIDTH, WORLD.HEIGHT);
        this.cameras.main.startFollow(this.player, true, 0.08, 0.1);
        this.cameras.main.setZoom(1.6);
        this.cameras.main.fadeIn(500, 0, 0, 0);
        this.cameraOffsetX = 0;

        // HUD
        this.hud = new HUD(this);

        // Level-up overlay
        this.levelUpOverlay = new LevelUpOverlay(this);

        // Pause overlay
        this.pauseOverlay = new PauseOverlay(this);

        // Debug panel
        this.debugPanel = new DebugPanel(this);

        // State
        this.isGameOver = false;
        this.playerInShroud = false;
        this.currentMiningVein = null;
        this.flameCrackleTimer = 0;
        this.closeShroudWarningTimer = 0;
        this.footstepTimer = 0;
        this.lastDiffTier = 0;
        this.loreScrollsCollected = 0;

        // Combo system
        this.comboCount = 0;
        this.comboTimer = 0;

        // Skill state
        this.shrineDrainBuffTimer = 0;
        this.companionTimer = 0;
        this.companionSprite = null;

        // Per-run stats for achievements
        this.runStats = {
            distanceMeters: 0,
            elixirMined: 0,
            enemiesBanished: 0,
            wispsCollected: 0,
            shrinesUsed: 0,
            dashCount: 0,
            slamCount: 0,
            burstCount: 0,
            classAttackCount: 0,
            wallJumpCount: 0,
            survivalTime: 0,
            maxCombo: 0,
            flameLowRecovery: false,
            _flameLowSeen: false,
            loreScrollsFound: 0,
            skillsAcquired: 0,
            hasDied: false,
            biomesReached: new Set(['springlands']),
        };

        // Achievement system
        AchievementManager.load();
        AchievementManager.incrementRestart();
        AchievementManager.bind(this, this.runStats);
        this._achievementToastActive = false;

        // Tutorial hints (first-run only, tracked in localStorage)
        this._tutorialShown = new Set();
        try {
            const raw = localStorage.getItem('elixirs-shadow-hints');
            if (raw) JSON.parse(raw).forEach(h => this._tutorialShown.add(h));
        } catch {}
        this._tutorialActive = null;
        this._tutorialCheckTimer = 0;

        // Initial biome atmosphere
        this.particles.setBiomeAtmosphere(this.biomeManager.getCurrentBiome().id);

        // Show opening biome banner after brief delay
        this.time.delayedCall(1500, () => {
            this.biomeManager._showBanner(this.biomeManager.getCurrentBiome());
        });

        // Player<->Shroud overlap
        this.physics.add.overlap(this.player, this.shroud.hitZone, () => {
            this.playerInShroud = true;
        });

        // Listen for player events
        this.events.on('playerLanded', (x, y) => this.particles.landingDust(x, y));
        this.events.on('doubleJump', (x, y) => this.particles.doubleJump(x, y));
        this.events.on('groundSlam', (x, y) => { this.runStats.slamCount++; this._handleGroundSlam(x, y); });
        this.events.on('flameBurst', (x, y) => { this.runStats.burstCount++; this._handleFlameBurst(x, y); });
        this.events.on('classAttack', (x, y) => { this.runStats.classAttackCount++; this._handleClassAttack(x, y); });
        this.events.on('skillAcquired', (skillId) => { this.runStats.skillsAcquired++; this._onSkillAcquired(skillId); });
        this.events.on('wallJump', () => { this.runStats.wallJumpCount++; });
        this.events.on('achievementUnlocked', () => this._showNextAchievementToast());
    }

    update(time, delta) {
        if (this.isGameOver) {
            if (Phaser.Input.Keyboard.JustDown(this.inputManager.keys.jump)) {
                this.scene.restart();
            }
            return;
        }

        // --- Pause toggle ---
        if (this.inputManager.pause && !this.levelUpOverlay.active && !GlobalState.gameOver) {
            this.pauseOverlay.toggle();
        }
        if (this.pauseOverlay.active) return;

        // --- Level-up overlay active: skip game update ---
        if (this.levelUpOverlay.active) return;

        // --- Input & Player ---
        const wasDashing = this.player.isDashing;
        this.player.handleInput(this.inputManager, delta);

        if (this.player.isDashing && !wasDashing) {
            this.runStats.dashCount++;
            this.audio.playFlameStep();
            this.popups.flameStep(this.player.x, this.player.y);
            this.particles.dashTrail(this.player.x, this.player.y);
        }
        if (this.player.isDashing) {
            this.particles.dashTrail(this.player.x, this.player.y);
        }
        if (!this.player.isDashing && wasDashing) {
            this.particles.stopDashTrail();
        }

        // --- Wall slide / glider particles ---
        this.particles.wallSlide(this.player.x, this.player.y, this.player.isWallSliding);
        this.particles.gliderTrail(this.player.x, this.player.y + 10, this.player.isGliding);

        // --- Running footstep dust ---
        if (this.player.body.onFloor() && Math.abs(this.player.body.velocity.x) > 50) {
            this.footstepTimer += delta;
            if (this.footstepTimer >= 200) {
                this.footstepTimer = 0;
                this.particles.footstep(this.player.x, this.player.y + 20);
            }
        } else {
            this.footstepTimer = 0;
        }

        // --- Camera lookahead ---
        const targetOffset = this.player.facingRight ? 80 : -80;
        this.cameraOffsetX += (targetOffset - this.cameraOffsetX) * 0.03;
        this.cameras.main.setFollowOffset(-this.cameraOffsetX, 0);

        // --- Biome transitions ---
        this.biomeManager.update(this.player.x);

        // --- Shroud ---
        this.shroud.update(delta);

        if (this.shroud.speedJustIncreased) {
            this.popups.speedUp(this.player.x, this.player.y);
            this.cameras.main.shake(300, 0.004);
        }

        const tier = this.shroud.getDifficultyTier();
        if (tier !== this.lastDiffTier) {
            this.lastDiffTier = tier;
            this.levelGen.setDifficulty(tier);
        }

        // --- Procedural generation ---
        this.levelGen.generateAhead(this.cameras.main.scrollX + this.scale.width);

        // --- Parallax ---
        this.parallax.update(this.cameras.main.scrollX);

        // --- Shroud particles ---
        this.particles.updateShroudAmbient(this.shroud.getLeadingX());

        // --- Shroud overlap ---
        this.playerInShroud = false;
        this.physics.overlap(this.player, this.shroud.hitZone, () => {
            this.playerInShroud = true;
        });
        if (this.player.x < this.shroud.getLeadingX()) {
            this.playerInShroud = true;
        }

        // --- Flame drain ---
        let drainRate;
        if (this.playerInShroud) {
            drainRate = SkillManager.getValue('flameDrain.shroud', FLAME.DRAIN_SHROUD);
        } else {
            drainRate = SkillManager.getValue('flameDrain.normal', FLAME.DRAIN_NORMAL);
        }
        // Shrine drain buff (Healer): halve drain for duration
        if (this.shrineDrainBuffTimer > 0) {
            this.shrineDrainBuffTimer -= delta;
            drainRate *= 0.5;
        }
        GlobalState.drainFlame(drainRate * (delta / 1000));
        this.hud.showShroudWarning(this.playerInShroud);

        // Close call popup
        if (!this.playerInShroud) {
            const dist = this.player.x - this.shroud.getLeadingX();
            if (dist < 80 && dist > 0) {
                this.closeShroudWarningTimer += delta;
                if (this.closeShroudWarningTimer > 2000) {
                    this.closeShroudWarningTimer = 0;
                    this.popups.closeShroud(this.player.x, this.player.y);
                }
            } else {
                this.closeShroudWarningTimer = 0;
            }
        }

        // --- Audio: shroud proximity ---
        if (this.audio.initialized) {
            const dist = this.player.x - this.shroud.getLeadingX();
            const intensity = Phaser.Math.Clamp(1 - dist / 400, 0, 1);
            this.audio.setShroudIntensity(intensity);
        }

        this.flameCrackleTimer += delta;
        if (this.flameCrackleTimer > 3000) {
            this.flameCrackleTimer = 0;
            this.audio.playFlameCrackle();
        }

        // --- Mining ---
        this._updateMining(delta);

        // --- Flame Wisps ---
        this._updateWisps();

        // --- Flame Shrines ---
        this._updateShrines();

        // --- Lore Scrolls ---
        this._updateScrolls();

        // --- Corruption Pools ---
        this._updateCorruption(delta);

        // --- Enemies ---
        this._updateEnemies(delta);

        // --- Crumbling Platforms ---
        this._updateCrumblingPlatforms(delta);

        // --- Combo timer ---
        if (this.comboCount > 0) {
            this.comboTimer -= delta;
            if (this.comboTimer <= 0) {
                this.comboCount = 0;
            }
        }

        // --- Screen shake in shroud ---
        if (this.playerInShroud) {
            this.cameras.main.shake(100, 0.003);
        }

        // --- Companion (Beast Master) ---
        this._updateCompanion(delta);

        // --- HUD ---
        const distMeters = Math.max(0, (this.player.x - PLAYER.START_X) / 10);
        this.hud.update(this.player, distMeters);

        // --- Achievement stats ---
        this.runStats.distanceMeters = distMeters;
        this.runStats.survivalTime += delta / 1000;
        if (this.comboCount > this.runStats.maxCombo) {
            this.runStats.maxCombo = this.comboCount;
        }
        // Track flame low recovery
        if (GlobalState.flame <= 10) {
            this.runStats._flameLowSeen = true;
        } else if (this.runStats._flameLowSeen && GlobalState.flame >= 50) {
            this.runStats.flameLowRecovery = true;
        }
        // Track biome reached
        const currentBiome = this.biomeManager.getCurrentBiome();
        if (currentBiome) {
            this.runStats.biomesReached.add(currentBiome.id);
        }
        // Sync skill count
        this.runStats.skillsAcquired = SkillManager.acquired.length;
        AchievementManager.update();

        // --- Tutorial hints (throttled to every 500ms) ---
        this._tutorialCheckTimer += delta;
        if (this._tutorialCheckTimer >= 500 && !this._tutorialActive) {
            this._tutorialCheckTimer = 0;
            this._checkTutorialHints();
        }

        // --- Debug panel ---
        this.debugPanel.update(this.player);

        // --- Level-up check ---
        if (SkillManager.checkLevelUp(GlobalState.elixir)) {
            this.levelUpOverlay.show();
            this.cameras.main.flash(400, 255, 200, 0, false, null, this);
            this.cameras.main.shake(200, 0.005);
            this.audio.playWispCollect();
        }

        // --- Game over ---
        if (GlobalState.gameOver) {
            this._triggerGameOver(distMeters);
        }
    }

    // ─── Mining ───

    _updateMining(delta) {
        const PROXIMITY_RANGE = 60;
        let overlappingVein = null;

        for (const vein of this.elixirVeins.getChildren()) {
            if (!vein.active || vein.depleted) continue;
            if (this.physics.overlap(this.player, vein)) {
                overlappingVein = vein;
                vein.hidePrompt();
            } else {
                const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, vein.x, vein.y);
                if (dist < PROXIMITY_RANGE) vein.showPrompt();
                else vein.hidePrompt();
            }
        }

        if (overlappingVein) {
            if (this.currentMiningVein !== overlappingVein) {
                if (this.currentMiningVein) {
                    this.currentMiningVein.stopMining();
                    this.particles.miningSparkles(0, 0, false);
                }
                this.currentMiningVein = overlappingVein;
                overlappingVein.startMining();
            }
            this.particles.miningSparkles(overlappingVein.x, overlappingVein.y - 10, true);
            const complete = overlappingVein.updateMining(delta);
            if (complete) {
                this.particles.miningSparkles(0, 0, false);
                this.runStats.elixirMined++;
                GlobalState.addElixir(1);
                this.shroud.surge();
                this.hud.popElixir();
                this.audio.playMineComplete();
                this.popups.elixirMined(overlappingVein.x, overlappingVein.y);
                this.particles.mineComplete(overlappingVein.x, overlappingVein.y);
                this.cameras.main.shake(200, 0.005);

                // Arcane Archer: stun enemies near veins on mine complete
                if (SkillManager.getFlag('mining.stunOnComplete')) {
                    const stunR = SkillManager.getValue('mining.stunRadius', 150);
                    const stunD = SkillManager.getValue('mining.stunDuration', 3000);
                    for (const enemy of this.enemyGroup.getChildren()) {
                        if (!enemy.active || !enemy.alive) continue;
                        const d = Phaser.Math.Distance.Between(overlappingVein.x, overlappingVein.y, enemy.x, enemy.y);
                        if (d < stunR) {
                            enemy.stun(stunD);
                        }
                    }
                }

                this.currentMiningVein = null;
            }
        } else {
            if (this.currentMiningVein) {
                this.currentMiningVein.stopMining();
                this.particles.miningSparkles(0, 0, false);
                this.currentMiningVein = null;
            }
        }
    }

    // ─── Flame Wisps ───

    _updateWisps() {
        for (const wisp of this.flameWisps.getChildren()) {
            if (!wisp.active || wisp.collected) continue;
            if (this.physics.overlap(this.player, wisp)) {
                if (wisp.collect()) {
                    this.runStats.wispsCollected++;
                    const restore = SkillManager.getValue('wisp.restoreAmount', FLAME_WISP.RESTORE);
                    GlobalState.flame = GlobalState.flame + restore;
                    this.popups.flameRestored(wisp.x, wisp.y, Math.round(restore));
                    this.particles.wispCollect(wisp.x, wisp.y);
                    this.audio.playWispCollect();
                }
            }
        }
    }

    // ─── Flame Shrines ───

    _updateShrines() {
        for (const shrine of this.flameShrines.getChildren()) {
            if (!shrine.active || shrine.used) continue;
            if (this.physics.overlap(this.player, shrine)) {
                if (shrine.activate()) {
                    this.runStats.shrinesUsed++;
                    GlobalState.flame = GlobalState.flame + FLAME_SHRINE.RESTORE;
                    this.popups.flameRestored(shrine.x, shrine.y, FLAME_SHRINE.RESTORE);
                    this.popups.show(shrine.x, shrine.y - 50, 'FLAME SHRINE', '#FF8833', '14px');
                    this.particles.wispCollect(shrine.x, shrine.y); // reuse warm burst
                    this.audio.playWispCollect();
                    this.cameras.main.flash(300, 255, 136, 51, false, null, this);

                    // Healer: shrine drain buff
                    if (SkillManager.getFlag('shrine.drainBuff')) {
                        const dur = SkillManager.getValue('shrine.drainBuffDuration', 0);
                        this.shrineDrainBuffTimer = dur;
                        this.popups.show(shrine.x, shrine.y - 70, 'DRAIN HALVED', '#4488FF', '12px');
                    }
                }
            }
        }
    }

    // ─── Lore Scrolls ───

    _updateScrolls() {
        for (const scroll of this.loreScrolls.getChildren()) {
            if (!scroll.active || scroll.collected) continue;
            if (this.physics.overlap(this.player, scroll)) {
                const entry = scroll.collect();
                if (entry) {
                    this.loreScrollsCollected++;
                    this.runStats.loreScrollsFound++;
                    this.hud.showLoreScroll(entry);
                    this.audio.playMineComplete(); // reuse chime
                }
            }
        }
    }

    // ─── Corruption Pools ───

    _updateCorruption(delta) {
        let inCorruption = false;
        for (const pool of this.corruptionPools.getChildren()) {
            if (!pool.active) continue;
            if (this.physics.overlap(this.player, pool)) {
                inCorruption = true;
                this.particles.corruptionBubbles(pool.x, pool.y - 6, true);
            }
        }
        if (inCorruption) {
            // Survivor: corruption pools no longer slow
            if (!SkillManager.getFlag('corruption.immuneSlow')) {
                this.player.inCorruption = true;
            }
            GlobalState.drainFlame(FLAME.DRAIN_CORRUPTION * (delta / 1000));
        }
    }

    // ─── Enemies (biome-specific, data-driven) ───

    _updateEnemies(delta) {
        for (const enemy of this.enemyGroup.getChildren()) {
            if (!enemy.active || !enemy.alive) continue;

            enemy.chasePlayer(this.player.x, this.player.y);

            // Warrior: dash auto-banish enemies near path
            if (this.player.isDashing && SkillManager.getFlag('dash.autoBanish')) {
                const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
                const radius = SkillManager.getValue('dash.autoBanishRadius', 50);
                if (dist < radius) {
                    this.particles.wraithBanish(enemy.x, enemy.y);
                    this.popups.wraithBanished(enemy.x, enemy.y);
                    this.audio.playWraithBanish();
                    this.cameras.main.shake(100, 0.004);
                    enemy.banish();
                    this._onEnemyBanished(enemy.x, enemy.y, true);
                    continue;
                }
            }

            if (this.physics.overlap(this.player, enemy)) {
                if (this.player.isDashing || this.player.isInvincible) {
                    this.particles.wraithBanish(enemy.x, enemy.y);
                    this.popups.wraithBanished(enemy.x, enemy.y);
                    this.audio.playWraithBanish();
                    this.cameras.main.shake(100, 0.004);
                    enemy.banish();
                    this._onEnemyBanished(enemy.x, enemy.y, this.player.isDashing);
                } else if (this.player.hitInvincibleTimer <= 0) {
                    // Tank: reduced enemy damage
                    const dmg = SkillManager.getValue('enemyDamage', enemy.def.damage);
                    GlobalState.drainFlame(dmg);
                    this.audio.playWraithHit();
                    this.cameras.main.shake(200, 0.008);
                    enemy.banish();

                    // Post-hit invincibility with flash
                    this.player.hitInvincibleTimer = 500;
                    this._flashPlayer();
                }
            }

            // Destroy enemies that fall behind the shroud
            if (enemy.x < this.shroud.getLeadingX() - 100) {
                enemy.destroy();
            }
        }
    }

    // ─── Crumbling Platforms ───

    _updateCrumblingPlatforms(delta) {
        for (const plat of this.crumblingPlatforms.getChildren()) {
            if (!plat.active) continue;
            plat.update(delta);
            // Emit dust while platform is shaking
            if (plat._emitDust) {
                plat._emitDust = false;
                if (Math.random() < 0.3) { // throttle particle rate
                    this.particles.landingDust(plat.x, plat.y - 5);
                }
            }
        }
    }

    // ─── Ground Slam Handler ───

    _handleGroundSlam(x, y) {
        this.particles.groundSlam(x, y);
        this.cameras.main.shake(300, 0.008);

        const stunRadius = SkillManager.getValue('groundSlam.stunRadius', GROUND_SLAM.STUN_RADIUS);
        const stunDuration = SkillManager.getValue('groundSlam.stunDuration', GROUND_SLAM.STUN_DURATION);

        // Stun enemies in radius
        for (const enemy of this.enemyGroup.getChildren()) {
            if (!enemy.active || !enemy.alive) continue;
            const dist = Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y);
            if (dist < stunRadius) {
                enemy.stun(stunDuration);
            }
        }
    }

    // ─── Flame Burst Handler ───

    _handleFlameBurst(x, y) {
        const radius = SkillManager.getValue('flameBurst.radius', FLAME_BURST.RADIUS);
        const banishRadius = SkillManager.getValue('flameBurst.banishRadius', FLAME_BURST.BANISH_RADIUS);

        this.audio.playFlameStep(); // reuse flame sound

        // Visual ring effect
        const ring = this.add.circle(x, y, 10, 0xFF6600, 0.4).setDepth(60);
        this.tweens.add({
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
        for (const enemy of this.enemyGroup.getChildren()) {
            if (!enemy.active || !enemy.alive) continue;
            const dist = Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y);
            if (dist < banishRadius) {
                // Close enemies get banished
                this.particles.wraithBanish(enemy.x, enemy.y);
                this.popups.wraithBanished(enemy.x, enemy.y);
                this.audio.playWraithBanish();
                enemy.banish();
                this._onEnemyBanished(enemy.x, enemy.y, false);
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
            this.player.isInvincible = true;
            this.player.invincibleTimer = invMs;
            this.player.setTint(0x4488FF);
            this.time.delayedCall(invMs, () => {
                if (this.player.active) this.player.clearTint();
            });
        }
    }

    // ─── Combo System ───

    _onEnemyBanished(x, y, duringDash = false) {
        this.runStats.enemiesBanished++;
        this.comboCount++;
        this.comboTimer = SkillManager.getValue('combo.window', COMBO.WINDOW);

        if (this.comboCount >= 2) {
            // Scale text size and effects with combo count
            const size = Math.min(16 + this.comboCount * 2, 30);
            this.popups.show(x, y - 60, `x${this.comboCount} COMBO!`, '#FFCC00', `${size}px`);
            if (this.comboCount >= 3) {
                this.cameras.main.shake(150, 0.003 + this.comboCount * 0.001);
            }
            if (this.comboCount >= 4) {
                this.cameras.main.flash(100, 255, 200, 0, false, null, this);
            }
        }

        const threshold = SkillManager.getValue('combo.bonusThreshold', COMBO.BONUS_ELIXIR_THRESHOLD);
        if (this.comboCount >= threshold) {
            GlobalState.addElixir(1);
            this.hud.popElixir();
            this.popups.show(x, y - 80, '+1 ELIXIR BONUS', '#00FFCC', '18px');
        }

        // Trickster: flame restore on dash banish
        if (duringDash && SkillManager.getFlag('dash.flameRestore')) {
            const restore = SkillManager.getValue('dash.flameRestoreAmount', 0);
            GlobalState.flame = GlobalState.flame + restore;
            this.popups.show(x, y - 40, `+${restore} FLAME`, '#FF6600', '12px');
        }
    }

    // ─── Companion (Beast Master) ───

    _updateCompanion(delta) {
        if (!SkillManager.getFlag('companion.enabled')) return;

        // Create companion sprite if needed
        if (!this.companionSprite) {
            this.companionSprite = this.add.circle(0, 0, 6, 0xFFAA33, 0.9).setDepth(50);
        }

        // Orbit around player
        this.companionTimer += delta;
        const angle = (this.companionTimer / 1000) * 2;
        this.companionSprite.setPosition(
            this.player.x + Math.cos(angle) * 40,
            this.player.y + Math.sin(angle) * 30
        );

        // Auto-banish on interval
        const interval = SkillManager.getValue('companion.interval', 8000);
        if (this.companionTimer >= interval) {
            this.companionTimer -= interval;

            // Find closest enemy
            let closest = null;
            let closestDist = 200; // max range
            for (const enemy of this.enemyGroup.getChildren()) {
                if (!enemy.active || !enemy.alive) continue;
                const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
                if (d < closestDist) {
                    closestDist = d;
                    closest = enemy;
                }
            }

            if (closest) {
                this.particles.wraithBanish(closest.x, closest.y);
                this.popups.show(closest.x, closest.y - 30, 'SPIRIT BANISH', '#FFAA33', '11px');
                this.audio.playWraithBanish();
                closest.banish();
                this._onEnemyBanished(closest.x, closest.y, false);

                const flameRestore = SkillManager.getValue('companion.flameRestore', 3);
                GlobalState.flame = GlobalState.flame + flameRestore;
            }
        }
    }

    // ─── Skill Acquired (sprite swap) ───

    _onSkillAcquired(skillId) {
        // First skill defines the class — swap sprite
        if (SkillManager.acquired.length === 1 && CLASS_DEFS[skillId]) {
            const classDef = CLASS_DEFS[skillId];
            this.player.swapClassSprite(classDef);
        }
    }

    // ─── Class Attack Dispatcher ───

    _handleClassAttack(x, y) {
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
                this._classMeleeBanish(x, y);
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
        }
    }

    // AOE banish (Barbarian, Wizard, Battlemage)
    _classAoeBanish(x, y, cls) {
        const banishR = cls.attackRadius;
        const stunR = cls.stunRadius || 0;
        const stunD = cls.stunDuration || 0;

        // Visual ring
        const ring = this.add.circle(x, y, 10, 0xFF4444, 0.4).setDepth(60);
        this.tweens.add({
            targets: ring,
            radius: banishR,
            alpha: 0,
            duration: 400,
            onUpdate: () => ring.setRadius(ring.radius),
            onComplete: () => ring.destroy()
        });

        // Blast VFX for Wizard
        if (cls.useBlastVFX) {
            const blast = this.add.sprite(x, y, 'fx_blast').setDepth(61).setDisplaySize(200, 200);
            blast.play('fx_blast_anim');
            blast.once('animationcomplete', () => blast.destroy());
        }

        this.cameras.main.shake(300, 0.008);

        for (const enemy of this.enemyGroup.getChildren()) {
            if (!enemy.active || !enemy.alive) continue;
            const dist = Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y);
            if (dist < banishR) {
                this.particles.wraithBanish(enemy.x, enemy.y);
                this.popups.wraithBanished(enemy.x, enemy.y);
                this.audio.playWraithBanish();
                enemy.banish();
                this._onEnemyBanished(enemy.x, enemy.y, false);
            } else if (stunR > 0 && dist < stunR) {
                enemy.stun(stunD);
            }
        }
    }

    // Frontal banish (Warrior)
    _classFrontalBanish(x, y, cls) {
        const radius = cls.attackRadius;
        const dir = this.player.facingRight ? 1 : -1;

        this.cameras.main.shake(200, 0.005);

        for (const enemy of this.enemyGroup.getChildren()) {
            if (!enemy.active || !enemy.alive) continue;
            const dx = enemy.x - x;
            const dy = enemy.y - y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            // Only enemies in front of player within arc
            if (dist < radius && dx * dir > 0) {
                this.particles.wraithBanish(enemy.x, enemy.y);
                this.popups.wraithBanished(enemy.x, enemy.y);
                this.audio.playWraithBanish();
                enemy.banish();
                this._onEnemyBanished(enemy.x, enemy.y, false);
            }
        }
    }

    // Knockback (Athlete/Monk)
    _classKnockback(x, y, cls) {
        const radius = cls.attackRadius;
        const pushDist = cls.pushDistance;
        const stunD = cls.stunDuration;

        this.cameras.main.shake(250, 0.006);

        for (const enemy of this.enemyGroup.getChildren()) {
            if (!enemy.active || !enemy.alive) continue;
            const dist = Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y);
            if (dist < radius) {
                const angle = Phaser.Math.Angle.Between(x, y, enemy.x, enemy.y);
                enemy.setVelocity(
                    Math.cos(angle) * pushDist * 2,
                    Math.sin(angle) * pushDist
                );
                enemy.stun(stunD);
                this.popups.show(enemy.x, enemy.y - 20, 'PUSHED', '#44DD66', '11px');
            }
        }
    }

    // Shield (Tank)
    _classShield(cls) {
        const dur = cls.shieldDuration;
        this.player.isInvincible = true;
        this.player.invincibleTimer = dur;
        this.player.setTint(0x4488FF);
        this.popups.show(this.player.x, this.player.y - 40, 'SHIELD UP', '#4488FF', '14px');
        this.time.delayedCall(dur, () => {
            if (this.player.active) this.player.clearTint();
        });
    }

    // Heal (Healer)
    _classHeal(x, y, cls) {
        GlobalState.flame = Math.min(GlobalState.flame + cls.healAmount, 100);
        this.popups.show(x, y - 40, `+${cls.healAmount} FLAME`, '#FF8833', '14px');

        // Drain reduction buff
        this.shrineDrainBuffTimer = cls.drainReductionDuration;
        this.popups.show(x, y - 60, 'DRAIN HALVED', '#4488FF', '12px');

        // Healing visual
        const ring = this.add.circle(x, y, 10, 0xFF8833, 0.3).setDepth(60);
        this.tweens.add({
            targets: ring,
            radius: 60,
            alpha: 0,
            duration: 500,
            onUpdate: () => ring.setRadius(ring.radius),
            onComplete: () => ring.destroy()
        });
    }

    // Melee banish (Trickster) — banish closest + reset dash CD
    _classMeleeBanish(x, y) {
        let closest = null;
        let closestDist = 100;
        for (const enemy of this.enemyGroup.getChildren()) {
            if (!enemy.active || !enemy.alive) continue;
            const d = Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y);
            if (d < closestDist) {
                closestDist = d;
                closest = enemy;
            }
        }
        if (closest) {
            this.particles.wraithBanish(closest.x, closest.y);
            this.popups.wraithBanished(closest.x, closest.y);
            this.audio.playWraithBanish();
            closest.banish();
            this._onEnemyBanished(closest.x, closest.y, false);
        }
        // Reset dash cooldown
        this.player.dashCooldownTimer = 0;
        this.popups.show(x, y - 40, 'DASH RESET', '#FFCC00', '11px');
    }

    // Projectile (Arcane Archer, Beast Master)
    _classProjectile(x, y, cls) {
        const dir = this.player.facingRight ? 1 : -1;
        const speed = cls.projectileSpeed;
        const range = cls.projectileRange;

        // Determine projectile texture
        const projKey = cls.grantsElixir ? 'fx_spell_proj' : 'fx_fireball';
        const projAnim = cls.grantsElixir ? 'fx_spell_proj_anim' : 'fx_fireball_anim';

        const proj = this.add.sprite(x + dir * 20, y, projKey).setDepth(55);
        proj.setDisplaySize(24, 24);
        proj.setFlipX(dir < 0);
        proj.play(projAnim);

        const startX = proj.x;
        const scene = this;

        this.tweens.add({
            targets: proj,
            x: x + dir * range,
            duration: (range / speed) * 1000,
            onUpdate: () => {
                // Check collision with enemies
                for (const enemy of scene.enemyGroup.getChildren()) {
                    if (!enemy.active || !enemy.alive) continue;
                    const d = Phaser.Math.Distance.Between(proj.x, proj.y, enemy.x, enemy.y);
                    if (d < 30) {
                        scene.particles.wraithBanish(enemy.x, enemy.y);
                        scene.popups.wraithBanished(enemy.x, enemy.y);
                        scene.audio.playWraithBanish();
                        enemy.banish();
                        scene._onEnemyBanished(enemy.x, enemy.y, false);

                        if (cls.grantsElixir) {
                            GlobalState.addElixir(1);
                            scene.hud.popElixir();
                            scene.popups.show(enemy.x, enemy.y - 40, '+1 ELIXIR', '#00FFCC', '12px');
                        }
                        if (cls.flameRestore) {
                            GlobalState.flame = GlobalState.flame + cls.flameRestore;
                            scene.popups.show(enemy.x, enemy.y - 20, `+${cls.flameRestore} FLAME`, '#FF6600', '11px');
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

    // Screen stun (Ranger)
    _classScreenStun(x, y, cls) {
        const stunD = cls.stunDuration;
        const camLeft = this.cameras.main.scrollX;
        const camRight = camLeft + this.scale.width;

        this.cameras.main.flash(200, 100, 200, 255);
        this.popups.show(x, y - 40, 'ARROW RAIN', '#44DD66', '14px');

        for (const enemy of this.enemyGroup.getChildren()) {
            if (!enemy.active || !enemy.alive) continue;
            if (enemy.x > camLeft && enemy.x < camRight) {
                enemy.stun(stunD);
            }
        }
    }

    // Blink (Assassin) — teleport forward, banish enemies in path
    _classBlink(x, y, cls) {
        const dir = this.player.facingRight ? 1 : -1;
        const dist = cls.blinkDistance;
        const targetX = x + dir * dist;

        // Banish enemies along the path
        for (const enemy of this.enemyGroup.getChildren()) {
            if (!enemy.active || !enemy.alive) continue;
            const ex = enemy.x;
            const ey = enemy.y;
            // Check if enemy is roughly in the blink path
            const inXRange = dir > 0 ? (ex > x && ex < targetX) : (ex < x && ex > targetX);
            const inYRange = Math.abs(ey - y) < 40;
            if (inXRange && inYRange) {
                this.particles.wraithBanish(enemy.x, enemy.y);
                this.popups.wraithBanished(enemy.x, enemy.y);
                this.audio.playWraithBanish();
                enemy.banish();
                this._onEnemyBanished(enemy.x, enemy.y, false);
            }
        }

        // Teleport player
        this.player.setPosition(targetX, y);
        this.player.setTint(0x44DD66);
        this.time.delayedCall(200, () => {
            if (this.player.active) this.player.clearTint();
        });

        // VFX: after-image at origin
        const ghost = this.add.rectangle(x, y, 48, 48, 0x44DD66, 0.5).setDepth(55);
        this.tweens.add({
            targets: ghost,
            alpha: 0,
            duration: 400,
            onComplete: () => ghost.destroy()
        });
    }

    // ─── Tutorial Hints ───

    _checkTutorialHints() {
        const p = this.player;
        const dist = this.runStats.distanceMeters;

        // Hint: dash — after 20m, first enemy encounter area
        if (!this._tutorialShown.has('dash') && dist > 20) {
            this._showTutorialHint('dash', 'Press SHIFT to Flame Step (dash)');
            return;
        }

        // Hint: mine — when near an elixir vein
        if (!this._tutorialShown.has('mine')) {
            for (const vein of this.elixirVeins.getChildren()) {
                if (!vein.active || vein.depleted) continue;
                const d = Phaser.Math.Distance.Between(p.x, p.y, vein.x, vein.y);
                if (d < 120) {
                    this._showTutorialHint('mine', 'Stand on glowing veins to mine Elixir');
                    return;
                }
            }
        }

        // Hint: slam — after first jump and 50m
        if (!this._tutorialShown.has('slam') && dist > 50 && !p.body.onFloor()) {
            this._showTutorialHint('slam', 'Press S while airborne to Ground Slam');
            return;
        }

        // Hint: burst — after 80m
        if (!this._tutorialShown.has('burst') && dist > 80) {
            this._showTutorialHint('burst', 'Press E for Flame Burst (costs 15 flame)');
            return;
        }

        // Hint: wall jump — when near a wall/platform while airborne
        if (!this._tutorialShown.has('walljump') && !p.body.onFloor() && (p.body.blocked.left || p.body.blocked.right)) {
            this._showTutorialHint('walljump', 'Press SPACE near walls to Wall Jump');
            return;
        }
    }

    _showTutorialHint(id, text) {
        if (this._tutorialShown.has(id) || this._tutorialActive) return;
        this._tutorialShown.add(id);
        this._tutorialActive = id;

        // Save to localStorage
        try {
            localStorage.setItem('elixirs-shadow-hints', JSON.stringify([...this._tutorialShown]));
        } catch {}

        const { width } = this.scale;
        const hint = this.add.text(width / 2, 100, text, {
            fontSize: '13px', color: '#FFFFFF', fontFamily: 'monospace',
            backgroundColor: '#00000099', padding: { x: 14, y: 6 },
            stroke: '#FFCC00', strokeThickness: 1
        }).setOrigin(0.5).setScrollFactor(0).setDepth(240).setAlpha(0);

        this.tweens.add({
            targets: hint,
            alpha: 1,
            duration: 300,
            onComplete: () => {
                this.time.delayedCall(4000, () => {
                    this.tweens.add({
                        targets: hint,
                        alpha: 0,
                        duration: 500,
                        onComplete: () => {
                            hint.destroy();
                            this._tutorialActive = null;
                        }
                    });
                });
            }
        });
    }

    // ─── Achievement Toast ───

    _showNextAchievementToast() {
        if (this._achievementToastActive) return;
        const ach = AchievementManager.popNewlyUnlocked();
        if (!ach) return;

        this._achievementToastActive = true;
        const { width } = this.scale;

        // Toast drops down from top-center, depth 250 (above gameplay, below pause)
        const toastW = 280;
        const toastH = 52;
        const centerX = width / 2;
        const startY = -toastH;
        const endY = 36;

        const bg = this.add.rectangle(centerX, startY, toastW, toastH, 0x000000, 0.85)
            .setScrollFactor(0).setDepth(250).setStrokeStyle(1, 0xFFCC00);
        const icon = this.add.text(centerX - toastW / 2 + 12, startY - 6, ach.icon || '', {
            fontSize: '18px', fontFamily: 'monospace'
        }).setScrollFactor(0).setDepth(251).setOrigin(0, 0.5);
        const title = this.add.text(centerX - toastW / 2 + 36, startY - 10, ach.name, {
            fontSize: '13px', color: '#FFCC00', fontFamily: 'monospace', fontStyle: 'bold'
        }).setScrollFactor(0).setDepth(251).setOrigin(0, 0.5);
        const desc = this.add.text(centerX - toastW / 2 + 36, startY + 8, ach.description, {
            fontSize: '11px', color: '#AAAAAA', fontFamily: 'monospace'
        }).setScrollFactor(0).setDepth(251).setOrigin(0, 0.5);

        const elements = [bg, icon, title, desc];

        // Drop down from top
        this.tweens.add({
            targets: elements,
            y: `+=${endY - startY}`,
            duration: 400,
            ease: 'Back.easeOut',
            onComplete: () => {
                // Hold, then fade up and out
                this.time.delayedCall(3500, () => {
                    this.tweens.add({
                        targets: elements,
                        alpha: 0,
                        y: `-=${30}`,
                        duration: 300,
                        ease: 'Power2',
                        onComplete: () => {
                            elements.forEach(el => { if (el.active) el.destroy(); });
                            this._achievementToastActive = false;
                            // Chain to next toast
                            this._showNextAchievementToast();
                        }
                    });
                });
            }
        });
    }

    // ─── Hit Flash ───

    _flashPlayer() {
        let count = 0;
        const flash = this.time.addEvent({
            delay: 80,
            repeat: 5,
            callback: () => {
                if (!this.player.active) return;
                this.player.setAlpha(count % 2 === 0 ? 0.3 : 1);
                count++;
            }
        });
        // Ensure alpha is restored after flashing
        this.time.delayedCall(500, () => {
            if (this.player.active) this.player.setAlpha(1);
        });
    }

    // ─── Game Over ───

    _triggerGameOver(distMeters) {
        this.isGameOver = true;
        this.runStats.hasDied = true;
        AchievementManager.update();
        this.player.setVelocity(0, 0);
        this.player.body.enable = false;

        this.cameras.main.shake(500, 0.01);
        this.hud.showGameOver(GlobalState.elixir, distMeters || 0, this.loreScrollsCollected, this.runStats);

        // Player death animation: fade + shrink
        this.tweens.add({
            targets: this.player,
            alpha: 0,
            scaleX: 0,
            scaleY: 0,
            duration: 800,
            ease: 'Power2'
        });

        if (this.audio.initialized) {
            this.audio.setShroudIntensity(0);
            this.audio.playGameOverStinger();
        }
        this.particles.stopDashTrail();
    }

    shutdown() {
        AchievementManager.unbind();
    }
}
