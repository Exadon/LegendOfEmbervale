import Phaser from 'phaser';
import { WORLD, PLAYER, FLAME, FLAME_WISP, FLAME_SHRINE, WRAITH, SHROUD, GROUND_SLAM, FLAME_BURST, COMBO, PROGRESSION_BAR, LORE_ENTRIES, SHRINE_INSCRIPTIONS, NEAR_DEATH, SURVIVOR, CHALLENGE_SHRINE, RELIC, ENEMIES, CINDER_VESSEL, ELIXIR_CORRUPTION, CRAFTSPERSON, OBELISK, DEADLY_SHROUD } from '../constants.js';
import { GlobalState } from '../GlobalState.js';
import { SkillManager } from '../systems/SkillManager.js';
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
import { LoreCompendium } from '../ui/LoreCompendium.js';
import { ObeliskOverlay } from '../ui/ObeliskOverlay.js';
import { Enemy } from '../entities/Enemy.js';
import { Tombstone } from '../entities/Tombstone.js';
import { GhostRun } from '../systems/GhostRun.js';
import { ShroudMutationManager } from '../systems/ShroudMutationManager.js';
import { RelicManager } from '../systems/RelicManager.js';
import { RelicOverlay } from '../ui/RelicOverlay.js';
import { ChallengeArena } from '../systems/ChallengeArena.js';
import { BossManager } from '../systems/BossManager.js';
import { FlameAltar } from '../systems/FlameAltar.js';

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
        this.survivorGroup = this.add.group();
        this.challengeShrineGroup = this.add.group();
        this.cinderVesselGroup = this.add.group();
        this.craftspeopleGroup = this.add.group();
        this.obeliskGroup = this.add.group();
        this.deadlyShroudZoneGroup = this.add.group();

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

        // Apply Flame Altar shroud slow
        this.shroud._baseShroudSlowMult = FlameAltar.getShroudSlowMult();

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
            survivors: this.survivorGroup,
            challengeShrines: this.challengeShrineGroup,
            cinderVessels: this.cinderVesselGroup,
            craftspeople: this.craftspeopleGroup,
            obelisks: this.obeliskGroup,
            deadlyShroudZones: this.deadlyShroudZoneGroup,
        }, this.biomeManager);

        this.levelGen.generateAhead(this.cameras.main.scrollX + this.scale.width);

        // Camera
        this.cameras.main.setBounds(0, 0, WORLD.WIDTH, WORLD.HEIGHT);
        this.cameras.main.startFollow(this.player, true, 0.08, 0.1);
        this.cameras.main.setZoom(1.6);
        this.cameras.main.fadeIn(500, 0, 0, 0);
        this.cameraOffsetX = 0;
        this.cameraOffsetY = 0;

        // HUD
        this.hud = new HUD(this);

        // Level-up overlay
        this.levelUpOverlay = new LevelUpOverlay(this);

        // Pause overlay
        this.pauseOverlay = new PauseOverlay(this);

        // Lore compendium
        this.loreCompendium = new LoreCompendium(this);

        // Obelisk overlay (Feature 7)
        this.obeliskOverlay = new ObeliskOverlay(this);

        // Debug panel
        this.debugPanel = new DebugPanel(this);

        // Lore key [J]
        this.loreKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.J);

        // Interact key [F] for survivors
        this.interactKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);

        // Tombstones from previous deaths
        const previousDeaths = Tombstone.loadDeaths();
        for (const death of previousDeaths) {
            new Tombstone(this, death.x, death.dist);
        }

        // Ghost run
        this.ghostRun = new GhostRun(this);

        // Shroud mutations
        this.shroudMutationManager = new ShroudMutationManager(this);

        // Relic system
        this.relicManager = new RelicManager();
        this.relicOverlay = new RelicOverlay(this, this.relicManager);

        // Challenge arena
        this.challengeArena = new ChallengeArena(this);

        // Boss manager
        this.bossManager = new BossManager(this);

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

        // Near-death slow-mo
        this._nearDeathCooldown = 0;

        // Survivor buff
        this._survivorBuffTimer = 0;
        this._survivorBuffType = null;

        // Skill state
        this.shrineDrainBuffTimer = 0;
        this.companionTimer = 0;
        this.companionSprite = null;

        // Cinder Vessel (Feature 1)
        this._hasCinderVessel = FlameAltar.startsWithVessel();

        // Corruption meter (Feature 5)
        this._corruptionOverlay = null;

        // Craftsperson rescue state (Feature 6)
        this._activeRescue = null;

        // Deadly tendril zones from mutations (Feature 2)
        this._deadlyTendrilZones = [];

        // Bard blessing timer (Feature 6)
        this._bardBlessingTimer = 0;

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
        this.events.on('playerLanded', (x, y) => { this.particles.landingDust(x, y); this.audio.playLand(); });
        this.events.on('doubleJump', (x, y) => { this.particles.doubleJump(x, y); this.audio.playJump(); });
        this.events.on('groundSlam', (x, y) => { this.runStats.slamCount++; this._handleGroundSlam(x, y); });
        this.events.on('flameBurst', (x, y) => { this.runStats.burstCount++; this._handleFlameBurst(x, y); });
        this.events.on('classAttack', (x, y) => { this.runStats.classAttackCount++; this._handleClassAttack(x, y); });
        this.events.on('skillAcquired', (skillId) => { this.runStats.skillsAcquired++; this._onSkillAcquired(skillId); });
        this.events.on('wallJump', () => { this.runStats.wallJumpCount++; this.audio.playJump(); });
        this.events.on('jump', () => this.audio.playJump());
        this.events.on('achievementUnlocked', () => this._showNextAchievementToast());

        // Shroud mutation events
        this.events.on('shroudMutationWarning', (mutation) => {
            this.popups.show(this.player.x, this.player.y - 80, `SHROUD: ${mutation.name}`, '#FF4488', '16px');
            this.cameras.main.shake(300, 0.004);
        });
        this.events.on('shroudMutation', (mutation) => {
            this._executeShroudMutation(mutation);
        });
        this.events.on('shroudMutationSurgeEnd', () => {
            this.shroud.speedMultiplier = 1.0;
        });

        // Relic events
        this.events.on('relicAcquired', (relic) => {
            this.hud.updateRelics(this.relicManager);
            this.popups.show(this.player.x, this.player.y - 60, `RELIC: ${relic.name}`, '#FFCC00', '14px');
        });
        this.events.on('bossRelicDrop', () => {
            if (this.relicManager.canDrop()) {
                this.time.delayedCall(1000, () => this.relicOverlay.show());
            }
        });

        // Challenge arena events
        this.events.on('challengeArenaStart', () => {
            this.shroud.speedMultiplier = 0;
        });
        this.events.on('challengeArenaEnd', (success) => {
            this.shroud.speedMultiplier = 1.0;
            if (success) {
                GlobalState.flame = Math.min(GlobalState.flame + CHALLENGE_SHRINE.REWARDS.flame, GlobalState.maxFlame);
                GlobalState.addElixir(CHALLENGE_SHRINE.REWARDS.elixir);
                this.hud.popElixir();
                this.popups.show(this.player.x, this.player.y - 60, 'CHALLENGE COMPLETE!', '#44FF44', '16px');
                this.popups.show(this.player.x, this.player.y - 40, `+${CHALLENGE_SHRINE.REWARDS.flame} FLAME +${CHALLENGE_SHRINE.REWARDS.elixir} ELIXIR`, '#00FFCC', '12px');
                this.audio.playLevelUp();
            } else {
                this.popups.show(this.player.x, this.player.y - 60, 'CHALLENGE FAILED', '#FF4444', '16px');
                this.shroud.surge();
                this.cameras.main.shake(300, 0.008);
            }
        });

        // Boss fight events
        this.events.on('bossFightStart', () => {
            this.shroud.speedMultiplier = 0;
        });
        this.events.on('bossFightEnd', () => {
            this.shroud.speedMultiplier = 1.0;
        });
        this.events.on('bossVineSweep', (bx, sweepW) => {
            // Create brief damage zone
            const zone = this.add.rectangle(bx, WORLD.GROUND_Y - 30, sweepW, 60, 0x66AA44, 0.3).setDepth(8);
            this.time.delayedCall(600, () => {
                if (zone.active) zone.destroy();
            });
            // Damage player if in range
            if (Math.abs(this.player.x - bx) < sweepW / 2 && this.player.hitInvincibleTimer <= 0) {
                GlobalState.drainFlame(10);
                this.audio.playWraithHit();
                this.cameras.main.shake(200, 0.006);
                this.player.hitInvincibleTimer = 500;
                this._flashPlayer();
            }
        });
        this.events.on('bossGroundPound', (bx, radius) => {
            this.cameras.main.shake(400, 0.01);
            if (Phaser.Math.Distance.Between(this.player.x, this.player.y, bx, WORLD.GROUND_Y) < radius) {
                if (this.player.hitInvincibleTimer <= 0) {
                    GlobalState.drainFlame(12);
                    this.player.hitInvincibleTimer = 500;
                    this._flashPlayer();
                }
            }
        });
        this.events.on('bossProjectile', (bx, by, dir, speed) => {
            const proj = this.add.circle(bx, by, 6, 0xFF4422, 0.8).setDepth(55);
            this.tweens.add({
                targets: proj,
                x: bx + dir * 500,
                duration: (500 / speed) * 1000,
                onUpdate: () => {
                    if (Phaser.Math.Distance.Between(proj.x, proj.y, this.player.x, this.player.y) < 20) {
                        if (this.player.hitInvincibleTimer <= 0 && !this.player.isDashing) {
                            GlobalState.drainFlame(10);
                            this.player.hitInvincibleTimer = 500;
                            this._flashPlayer();
                        }
                        proj.destroy();
                    }
                },
                onComplete: () => { if (proj.active) proj.destroy(); }
            });
        });

        // Biome change — trigger boss
        const origBiomeChange = this.biomeManager.onBiomeChange;
        this.biomeManager.onBiomeChange = (biome) => {
            if (origBiomeChange) origBiomeChange(biome);
            this.bossManager.trySpawnBoss(biome.id);
        };

        // Fell split event (Feature 3)
        this.events.on('fellSplit', (x, y) => {
            for (let i = 0; i < 2; i++) {
                const offsetX = (i === 0 ? -20 : 20);
                const enemy = new Enemy(this, x + offsetX, y, 'fell_critter');
                enemy.setScale(0.7);
                this.enemyGroup.add(enemy);
            }
        });

        // Skeleton reassemble event (Feature 10)
        this.events.on('skeletonReassemble', (x, y) => {
            const enemy = new Enemy(this, x, y, 'hollow_skeleton');
            enemy._reassembled = true;
            this.enemyGroup.add(enemy);
            this.popups.show(x, y - 30, 'REASSEMBLED', '#8888AA', '11px');
        });

        // Shaman buff event (Feature 4)
        this.events.on('shamanBuff', (sx, sy) => {
            // Buff all enemies within 200px
            const aura = this.add.circle(sx, sy, 10, 0x44AA44, 0.3).setDepth(55);
            this.tweens.add({
                targets: aura,
                radius: 200,
                alpha: 0,
                duration: 600,
                onUpdate: () => aura.setRadius(aura.radius),
                onComplete: () => aura.destroy(),
            });
            for (const enemy of this.enemyGroup.getChildren()) {
                if (!enemy.active || !enemy.alive || enemy.def.shaman) continue;
                const d = Phaser.Math.Distance.Between(sx, sy, enemy.x, enemy.y);
                if (d < 200) {
                    enemy.applySpeedBuff(3000, 1.5);
                }
            }
        });

        // Shaman death — clear buffs (Feature 4)
        this.events.on('shamanDied', () => {
            for (const enemy of this.enemyGroup.getChildren()) {
                if (!enemy.active || !enemy.alive) continue;
                enemy._speedBuffTimer = 0;
            }
        });

        // Hollow mage shroud pocket event (Feature 10)
        this.events.on('hollowMagePocket', (mx, my) => {
            const pocket = this.add.circle(mx, my, 60, 0x4400AA, 0.2).setDepth(3);
            this.tweens.add({
                targets: pocket,
                alpha: { from: 0.1, to: 0.3 },
                duration: 800,
                yoyo: true,
                repeat: 2,
                onComplete: () => { if (pocket.active) pocket.destroy(); },
            });
            // Store reference for drain check
            pocket._pocketX = mx;
            pocket._pocketR = 60;
            pocket._pocketTimer = 4000;
            if (!this._magePockets) this._magePockets = [];
            this._magePockets.push(pocket);
        });

        // Obelisk answer event (Feature 7)
        this.events.on('obeliskAnswer', (correct) => {
            if (correct) {
                GlobalState.flame = Math.min(GlobalState.flame + OBELISK.CORRECT_REWARD_FLAME, GlobalState.maxFlame);
                GlobalState.addElixir(OBELISK.CORRECT_REWARD_ELIXIR);
                this.hud.popElixir();
                this.popups.show(this.player.x, this.player.y - 60, `+${OBELISK.CORRECT_REWARD_FLAME} FLAME +${OBELISK.CORRECT_REWARD_ELIXIR} ELIXIR`, '#44FF44', '14px');
                this.audio.playLevelUp();
            } else {
                this.shroud.surge();
                this.cameras.main.shake(400, 0.008);
                this.popups.show(this.player.x, this.player.y - 60, 'SHROUD SURGE!', '#FF4444', '14px');
            }
        });
    }

    update(time, delta) {
        if (this.isGameOver) {
            if (Phaser.Input.Keyboard.JustDown(this.inputManager.keys.jump)) {
                this.cameras.main.fadeOut(600, 0, 0, 0);
                this.cameras.main.once('camerafadeoutcomplete', () => {
                    this.scene.restart();
                });
            }
            return;
        }

        // --- Pause toggle ---
        if (this.inputManager.pause && !this.levelUpOverlay.active && !GlobalState.gameOver) {
            this.pauseOverlay.toggle();
        }
        if (this.pauseOverlay.active) return;

        // --- Lore compendium toggle [J] ---
        if (Phaser.Input.Keyboard.JustDown(this.loreKey) && !this.loreCompendium.active && !this.levelUpOverlay.active && !this.relicOverlay.active && !this.obeliskOverlay.active) {
            this.loreCompendium.show();
        }
        if (this.loreCompendium.active) return;

        // --- Level-up overlay active: skip game update ---
        if (this.levelUpOverlay.active) return;

        // --- Relic overlay active: skip game update ---
        if (this.relicOverlay.active) return;

        // --- Obelisk overlay active: skip game update ---
        if (this.obeliskOverlay.active) return;

        // --- Input & Player ---
        const wasDashing = this.player.isDashing;
        this.player.handleInput(this.inputManager, delta);

        // Apply speed multipliers from relics + survivor buff + Flame Altar + corruption
        let speedMult = this.relicManager.getMult('moveSpeedMult') * FlameAltar.getSpeedMult();
        if (this._survivorBuffTimer > 0 && this._survivorBuffType === 'speed') {
            speedMult *= (1 + SURVIVOR.BUFFS.find(b => b.id === 'speed').value);
        }
        // Corruption speed bonus (Feature 5)
        if (GlobalState.corruption >= ELIXIR_CORRUPTION.THRESHOLD_HIGH) {
            speedMult *= (1 + ELIXIR_CORRUPTION.SPEED_BONUS);
        }
        // Frost fell freeze aura effect
        if (this._freezeSlowTimer > 0) {
            speedMult *= 0.7;
            this._freezeSlowTimer -= delta;
        }
        if (speedMult !== 1 && !this.player.isDashing) {
            this.player.body.velocity.x *= speedMult;
        }

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

        // --- Camera lookahead (X + Y) ---
        const targetOffX = this.player.facingRight ? 120 : -120;
        this.cameraOffsetX += (targetOffX - this.cameraOffsetX) * 0.05;

        let targetOffY = 0;
        if (this.player.body.velocity.y < -200) targetOffY = -40;
        else if (this.player.body.velocity.y > 200) targetOffY = 30;
        this.cameraOffsetY += (targetOffY - this.cameraOffsetY) * 0.04;

        this.cameras.main.setFollowOffset(-this.cameraOffsetX, -this.cameraOffsetY);

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
        // Relic flame drain multiplier
        drainRate *= this.relicManager.getMult('flameDrainMult');
        // Corruption drain penalty (Feature 5)
        if (GlobalState.corruption >= ELIXIR_CORRUPTION.THRESHOLD_HIGH) {
            drainRate *= (1 + ELIXIR_CORRUPTION.DRAIN_PENALTY);
        }
        // Albaneve cold drain (Feature 10)
        const currentBiome = this.biomeManager.getCurrentBiome();
        if (currentBiome && currentBiome.coldDrain) {
            drainRate += currentBiome.coldDrain;
        }
        // Survivor flame_regen buff
        if (this._survivorBuffTimer > 0 && this._survivorBuffType === 'flame_regen') {
            const regenRate = SURVIVOR.BUFFS.find(b => b.id === 'flame_regen').value;
            GlobalState.flame = Math.min(GlobalState.flame + regenRate * (delta / 1000), GlobalState.maxFlame);
        }
        // Bard blessing flame regen (Feature 6)
        if (this._bardBlessingTimer > 0) {
            GlobalState.flame = Math.min(GlobalState.flame + 3 * (delta / 1000), GlobalState.maxFlame);
            this._bardBlessingTimer -= delta;
        }

        // --- Deadly Shroud Zones drain multiplier (Feature 9) ---
        let inDeadlyShroud = false;
        for (const zone of this.deadlyShroudZoneGroup.getChildren()) {
            if (!zone.active || !zone._bounds) continue;
            const b = zone._bounds;
            if (Math.abs(this.player.x - b.x) < b.w / 2 &&
                this.player.y > WORLD.GROUND_Y - b.h) {
                inDeadlyShroud = true;
                break;
            }
        }
        if (inDeadlyShroud) {
            drainRate *= DEADLY_SHROUD.DRAIN_MULT;
        }

        // --- Deadly tendril zones drain (Feature 2) ---
        for (let i = this._deadlyTendrilZones.length - 1; i >= 0; i--) {
            const tz = this._deadlyTendrilZones[i];
            tz.timer -= delta;
            if (tz.timer <= 0) {
                if (tz.rect && tz.rect.active) tz.rect.destroy();
                this._deadlyTendrilZones.splice(i, 1);
                continue;
            }
            if (Math.abs(this.player.x - tz.x) < 40 &&
                this.player.y > WORLD.GROUND_Y - 50) {
                drainRate *= 3;
            }
        }

        // --- Mage pocket drain (Feature 10) ---
        if (this._magePockets) {
            for (let i = this._magePockets.length - 1; i >= 0; i--) {
                const p = this._magePockets[i];
                p._pocketTimer -= delta;
                if (p._pocketTimer <= 0 || !p.active) {
                    this._magePockets.splice(i, 1);
                    continue;
                }
                if (Phaser.Math.Distance.Between(this.player.x, this.player.y, p._pocketX, p.y) < p._pocketR) {
                    drainRate *= 2;
                }
            }
        }

        // --- Cinder Vessel death save (Feature 1) ---
        if (GlobalState.flame <= 0 && this._hasCinderVessel) {
            GlobalState._gameOver = false;
            GlobalState.flame = CINDER_VESSEL.RESTORE;
            this._hasCinderVessel = false;
            this.player.isInvincible = true;
            this.player.invincibleTimer = CINDER_VESSEL.INVINCIBLE_MS;
            this.player.setTint(0xFFCC00);
            this.time.delayedCall(CINDER_VESSEL.INVINCIBLE_MS, () => {
                if (this.player.active) this.player.clearTint();
            });
            this.cameras.main.flash(500, 255, 200, 0);
            this.cameras.main.shake(400, 0.01);
            this.popups.show(this.player.x, this.player.y - 80, 'VESSEL SHATTERED', '#FFCC00', '18px');
            this.popups.show(this.player.x, this.player.y - 60, `+${CINDER_VESSEL.RESTORE} FLAME`, '#FF8833', '14px');
            this.audio.playLevelUp();
        }

        GlobalState.drainFlame(drainRate * (delta / 1000));
        this.hud.showShroudWarning(this.playerInShroud);

        // --- Corruption decay (Feature 5) ---
        GlobalState.decayCorruption(ELIXIR_CORRUPTION.DECAY_RATE * (delta / 1000));
        this._updateCorruptionVisuals();

        // --- Near-death slow-mo ---
        this._nearDeathCooldown = Math.max(0, this._nearDeathCooldown - delta);
        if (GlobalState.flame <= NEAR_DEATH.FLAME_THRESHOLD && GlobalState.flame > 0 && this._nearDeathCooldown <= 0) {
            this._nearDeathCooldown = NEAR_DEATH.COOLDOWN;
            this.time.timeScale = NEAR_DEATH.SLOWMO_SCALE;
            this.audio.playHeartbeat();
            this.cameras.main.shake(300, 0.006);
            // Red flash overlay
            const { width, height } = this.scale;
            const redFlash = this.add.rectangle(width / 2, height / 2, width, height, 0xFF0000, 0.15)
                .setScrollFactor(0).setDepth(198);
            this.tweens.add({ targets: redFlash, alpha: 0, duration: 600, onComplete: () => redFlash.destroy() });
            setTimeout(() => { if (this.time) this.time.timeScale = 1.0; }, NEAR_DEATH.SLOWMO_DURATION);
        }

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
        const shroudDist = this.player.x - this.shroud.getLeadingX();
        if (this.audio.initialized) {
            const intensity = Phaser.Math.Clamp(1 - shroudDist / 400, 0, 1);
            this.audio.setShroudIntensity(intensity);

            // Shroud warning rumble
            if (shroudDist < PROGRESSION_BAR.SHROUD_WARN_DISTANCE) {
                this.audio.playShroudWarning();
            } else {
                this.audio.stopShroudWarning();
            }
        }

        // HUD shroud proximity warning
        if (this.hud.updateShroudProximity) {
            this.hud.updateShroudProximity(shroudDist);
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

        // --- Survivors ---
        this._updateSurvivors(delta);

        // --- Challenge Shrines ---
        this._updateChallengeShrines();

        // --- Cinder Vessels (Feature 1) ---
        this._updateCinderVessels();

        // --- Craftspeople (Feature 6) ---
        this._updateCraftspeople(delta);

        // --- Ancient Obelisks (Feature 7) ---
        this._updateObelisks();

        // --- Challenge Arena ---
        this.challengeArena.update(delta);

        // --- Shroud Mutations ---
        this.shroudMutationManager.update(delta);

        // --- Shroud relic speed multiplier (reapply each frame) ---
        if (!this.bossManager.active && !this.challengeArena.active) {
            this.shroud.speedMultiplier = this.relicManager.getMult('shroudSpeedMult');
            // Flame Altar shroud slow
            this.shroud.speedMultiplier *= FlameAltar.getShroudSlowMult();
            // Survivor shroud_slow buff
            if (this._survivorBuffTimer > 0 && this._survivorBuffType === 'shroud_slow') {
                const slowVal = SURVIVOR.BUFFS.find(b => b.id === 'shroud_slow').value;
                this.shroud.speedMultiplier *= (1 - slowVal);
            }
            // Bard blessing shroud slow (Feature 6)
            if (this._bardBlessingTimer > 0) {
                this.shroud.speedMultiplier *= 0.5;
            }
            // Mutation speed surge
            if (this.shroudMutationManager.surgeActive) {
                this.shroud.speedMultiplier *= 2;
            }
        }

        // --- Boss ---
        this.bossManager.update(delta);

        // --- Ghost Run ---
        this.ghostRun.update(delta, this.player.x, this.player.y, !this.player.facingRight);

        // --- Survivor buff timer ---
        if (this._survivorBuffTimer > 0) {
            this._survivorBuffTimer -= delta;
            if (this._survivorBuffTimer <= 0) {
                this._survivorBuffType = null;
                this.popups.show(this.player.x, this.player.y - 40, 'BUFF EXPIRED', '#888888', '11px');
            }
        }

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
            this.audio.playLevelUp();

            // Zoom pulse
            this.tweens.add({
                targets: this.cameras.main,
                zoom: 1.7,
                duration: 300,
                yoyo: true,
                ease: 'Sine.easeInOut',
                onComplete: () => { this.cameras.main.setZoom(1.6); }
            });
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

                // Corruption from mining (Feature 5)
                GlobalState.addCorruption(ELIXIR_CORRUPTION.PER_MINE);

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
                    const restore = SkillManager.getValue('wisp.restoreAmount', FLAME_WISP.RESTORE)
                        * this.relicManager.getMult('wispRestoreMult')
                        * FlameAltar.getWispBonus();
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

                    // Show a shrine inscription
                    const inscription = SHRINE_INSCRIPTIONS[Math.floor(Math.random() * SHRINE_INSCRIPTIONS.length)];
                    this.hud.showLoreScroll({ author: 'Flame Shrine Inscription', text: inscription });

                    // Healer: shrine drain buff
                    if (SkillManager.getFlag('shrine.drainBuff')) {
                        const dur = SkillManager.getValue('shrine.drainBuffDuration', 0);
                        this.shrineDrainBuffTimer = dur;
                        this.popups.show(shrine.x, shrine.y - 70, 'DRAIN HALVED', '#4488FF', '12px');
                    }

                    // Relic drop chance from shrine
                    if (this.relicManager.canDrop() && Math.random() < RELIC.SHRINE_DROP_CHANCE) {
                        this.time.delayedCall(500, () => this.relicOverlay.show());
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

                    // Persist to lifetime lore collection
                    const idx = LORE_ENTRIES.indexOf(entry);
                    if (idx >= 0) {
                        LoreCompendium.addCollected(idx);
                    }
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
        // Initialize freeze slow timer if needed
        if (this._freezeSlowTimer === undefined) this._freezeSlowTimer = 0;

        for (const enemy of this.enemyGroup.getChildren()) {
            if (!enemy.active || !enemy.alive) continue;

            enemy.chasePlayer(this.player.x, this.player.y, delta);

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
                    // Tank: reduced enemy damage, + relic multiplier
                    const dmg = SkillManager.getValue('enemyDamage', enemy.def.damage) * this.relicManager.getMult('enemyDamageMult');
                    GlobalState.drainFlame(dmg);
                    this.audio.playWraithHit();
                    this.cameras.main.shake(200, 0.008);
                    enemy.banish();

                    // Frost fell freeze aura (Feature 10)
                    if (enemy.def.freezeAura) {
                        this._freezeSlowTimer = 2000;
                        this.player.setTint(0x88BBFF);
                        this.time.delayedCall(2000, () => {
                            if (this.player.active) this.player.clearTint();
                        });
                        this.popups.show(this.player.x, this.player.y - 40, 'FROZEN!', '#88BBFF', '12px');
                    }

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

    // ─── Cinder Vessels (Feature 1) ───

    _updateCinderVessels() {
        if (this._hasCinderVessel) return; // already have one
        for (const vessel of this.cinderVesselGroup.getChildren()) {
            if (!vessel.active || vessel.collected) continue;
            if (this.physics.overlap(this.player, vessel)) {
                if (vessel.collect()) {
                    this._hasCinderVessel = true;
                    this.popups.show(vessel.x, vessel.y - 60, 'CINDER VESSEL', '#FFCC00', '16px');
                    this.popups.show(vessel.x, vessel.y - 40, 'Death save acquired', '#D4A04A', '11px');
                    this.audio.playWispCollect();
                    this.cameras.main.flash(200, 255, 200, 0);
                }
            }
        }
    }

    // ─── Craftspeople (Feature 6) ───

    _updateCraftspeople(delta) {
        // Handle active rescue timer
        if (this._activeRescue) {
            this._activeRescue.timer -= delta;
            // Count alive rescue enemies
            let aliveCount = 0;
            for (const e of this._activeRescue.enemies) {
                if (e.active && e.alive) aliveCount++;
            }
            if (aliveCount === 0) {
                // Success!
                this._completeRescue(this._activeRescue.craftsperson);
                this._activeRescue = null;
            } else if (this._activeRescue.timer <= 0) {
                // Failure
                this.popups.show(this._activeRescue.craftsperson.x, this._activeRescue.craftsperson.y - 60,
                    'CONSUMED BY SHROUD', '#FF4444', '14px');
                this._activeRescue.craftsperson.failed = true;
                this.tweens.add({
                    targets: this._activeRescue.craftsperson,
                    alpha: 0,
                    duration: 500,
                });
                this._activeRescue = null;
            }
            return;
        }

        for (const cp of this.craftspeopleGroup.getChildren()) {
            if (!cp.active || cp.rescued || cp.failed || cp.rescueActive) continue;
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, cp.x, cp.y);
            if (dist < CRAFTSPERSON.RESCUE_RADIUS) {
                cp.showPrompt();
                if (Phaser.Input.Keyboard.JustDown(this.interactKey)) {
                    this._startRescue(cp);
                }
            } else {
                cp.hidePrompt();
            }
        }
    }

    _startRescue(craftsperson) {
        craftsperson.rescueActive = true;
        craftsperson.hidePrompt();

        // Spawn 3 enemies nearby
        const biome = this.biomeManager.getCurrentBiome();
        const rescueEnemies = [];
        for (let i = 0; i < 3; i++) {
            const typeId = biome.enemies.length > 0
                ? biome.enemies[Math.floor(Math.random() * biome.enemies.length)]
                : 'fell_critter';
            const def = ENEMIES[typeId];
            if (def) {
                const ex = craftsperson.x + (i - 1) * 80;
                const ey = WORLD.GROUND_Y - def.height / 2;
                const enemy = new Enemy(this, ex, ey, typeId);
                this.enemyGroup.add(enemy);
                rescueEnemies.push(enemy);
            }
        }

        this._activeRescue = {
            craftsperson,
            timer: CRAFTSPERSON.RESCUE_TIME,
            enemies: rescueEnemies,
        };

        this.popups.show(craftsperson.x, craftsperson.y - 70, `RESCUE: ${craftsperson.craftType.name}`, '#FFCC00', '14px');
        this.popups.show(craftsperson.x, craftsperson.y - 50, 'Banish all enemies!', '#CCCCCC', '11px');
        this.cameras.main.shake(200, 0.005);
    }

    _completeRescue(craftsperson) {
        craftsperson.rescued = true;
        const type = craftsperson.craftType;

        this.popups.show(craftsperson.x, craftsperson.y - 70, `${type.name} RESCUED!`, '#44FF44', '16px');
        this.popups.show(craftsperson.x, craftsperson.y - 50, type.desc, '#CCCCCC', '11px');
        this.audio.playLevelUp();
        this.cameras.main.flash(300, 100, 255, 100);

        switch (type.reward) {
            case 'dash_damage':
                // Permanent +10% dash damage — stored as flag
                this._blacksmithBuff = true;
                break;
            case 'full_flame':
                GlobalState.flame = GlobalState.maxFlame;
                this.player.isInvincible = true;
                this.player.invincibleTimer = 5000;
                this.player.setTint(0x44FF44);
                this.time.delayedCall(5000, () => {
                    if (this.player.active) this.player.clearTint();
                });
                break;
            case 'banish_all': {
                const camLeft = this.cameras.main.scrollX;
                const camRight = camLeft + this.scale.width;
                for (const enemy of this.enemyGroup.getChildren()) {
                    if (!enemy.active || !enemy.alive) continue;
                    if (enemy.x > camLeft && enemy.x < camRight) {
                        this.particles.wraithBanish(enemy.x, enemy.y);
                        enemy.banish();
                        this._onEnemyBanished(enemy.x, enemy.y, false);
                    }
                }
                break;
            }
            case 'bard_blessing':
                this._bardBlessingTimer = 30000;
                this.popups.show(craftsperson.x, craftsperson.y - 30, 'Bard\'s Blessing: 30s', '#AA6688', '11px');
                break;
        }
    }

    // ─── Ancient Obelisks (Feature 7) ───

    _updateObelisks() {
        if (this.obeliskOverlay.active) return;
        for (const obelisk of this.obeliskGroup.getChildren()) {
            if (!obelisk.active || obelisk.used) continue;
            if (this.physics.overlap(this.player, obelisk)) {
                if (obelisk.activate()) {
                    this.obeliskOverlay.show();
                    this.audio.playMineComplete();
                }
            }
        }
    }

    // ─── Corruption Visuals (Feature 5) ───

    _updateCorruptionVisuals() {
        const c = GlobalState.corruption;
        if (c >= ELIXIR_CORRUPTION.THRESHOLD_MEDIUM && !this._corruptionOverlay) {
            const { width, height } = this.scale;
            this._corruptionOverlay = this.add.rectangle(width / 2, height / 2, width, height, 0x5500AA, 0)
                .setScrollFactor(0).setDepth(97);
        }
        if (this._corruptionOverlay) {
            if (c < ELIXIR_CORRUPTION.THRESHOLD_MEDIUM) {
                this._corruptionOverlay.setAlpha(0);
            } else if (c < ELIXIR_CORRUPTION.THRESHOLD_HIGH) {
                this._corruptionOverlay.setAlpha(0.05);
            } else {
                this._corruptionOverlay.setAlpha(0.1);
            }
        }
        // Update HUD corruption bar
        if (this.hud.updateCorruption) {
            this.hud.updateCorruption(c);
        }
    }

    // ─── Ground Slam Handler ───

    _handleGroundSlam(x, y) {
        this.particles.groundSlam(x, y);
        this.cameras.main.shake(300, 0.012);
        this.audio.playSlamImpact();
        this._hitFreeze(50);

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

        this.audio.playFlameBurst();
        this.cameras.main.shake(200, 0.006);

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
        this.comboTimer = SkillManager.getValue('combo.window', COMBO.WINDOW) * this.relicManager.getMult('comboWindowMult');

        // Kill streak audio escalation
        this.audio.playBanishCombo(this.comboCount);

        // Hit freeze + shake on every banish
        this.cameras.main.shake(100, 0.004);
        this._hitFreeze(50);

        // Relic: banish flame restore
        const banishFlame = this.relicManager.getFlat('banishFlameFlat', 0);
        if (banishFlame > 0) {
            GlobalState.flame = Math.min(GlobalState.flame + banishFlame, GlobalState.maxFlame);
            this.popups.show(x, y - 40, `+${banishFlame} FLAME`, '#FF6600', '11px');
        }

        // Relic drop chance on banish
        if (this.relicManager.canDrop() && Math.random() < RELIC.BANISH_DROP_CHANCE) {
            this.time.delayedCall(300, () => this.relicOverlay.show());
        }

        // Challenge arena kill tracking
        if (this.challengeArena.active) {
            this.challengeArena.onEnemyKilled();
        }

        if (this.comboCount >= 2) {
            // Scale text size and effects with combo count
            const size = Math.min(16 + this.comboCount * 2, 30);
            this.popups.show(x, y - 60, `x${this.comboCount} COMBO!`, '#FFCC00', `${size}px`);
            if (this.comboCount >= 3) {
                this.cameras.main.shake(150, 0.003 + this.comboCount * 0.001);
                this.audio.playComboMilestone();
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
            // Corruption from combo elixir bonus (Feature 5)
            GlobalState.addCorruption(ELIXIR_CORRUPTION.PER_ELIXIR_BONUS);
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

    // ─── Skill Acquired ───

    _onSkillAcquired(_nodeId) {
        // Class is chosen pre-run, no sprite swap needed during level-up
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
        GlobalState.flame = Math.min(GlobalState.flame + cls.healAmount, GlobalState.maxFlame);
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

    // ─── Survivors ───

    _updateSurvivors(delta) {
        for (const survivor of this.survivorGroup.getChildren()) {
            if (!survivor.active || survivor.interacted) continue;
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, survivor.x, survivor.y);
            if (dist < SURVIVOR.INTERACTION_RANGE) {
                survivor.showPrompt();
                if (Phaser.Input.Keyboard.JustDown(this.interactKey)) {
                    const result = survivor.interact();
                    if (result) {
                        this._survivorBuffType = result.buff.id;
                        this._survivorBuffTimer = SURVIVOR.BUFF_DURATION;
                        this.popups.show(survivor.x, survivor.y - 70, result.dialogue, '#FFFFFF', '11px');
                        this.popups.show(survivor.x, survivor.y - 50, `${result.buff.name}: ${result.buff.desc}`, '#44FF44', '12px');
                        this.audio.playWispCollect();
                    }
                }
            } else {
                survivor.hidePrompt();
            }
        }
    }

    // ─── Challenge Shrines ───

    _updateChallengeShrines() {
        if (this.challengeArena.active) return;
        for (const shrine of this.challengeShrineGroup.getChildren()) {
            if (!shrine.active || shrine.used) continue;
            if (this.physics.overlap(this.player, shrine)) {
                if (shrine.activate()) {
                    const types = CHALLENGE_SHRINE.TYPES;
                    const challenge = types[Math.floor(Math.random() * types.length)];
                    this.challengeArena.start(challenge, shrine.x);
                    this.popups.show(shrine.x, shrine.y - 60, challenge.name, '#FF4488', '16px');
                    this.cameras.main.shake(200, 0.005);
                }
            }
        }
    }

    // ─── Shroud Mutation Executor ───

    _executeShroudMutation(mutation) {
        switch (mutation.id) {
            case 'spectral_wave': {
                // Spawn 3 enemies near the shroud leading edge
                const biome = this.biomeManager.getCurrentBiome();
                for (let i = 0; i < 3; i++) {
                    if (biome.enemies.length === 0) break;
                    const typeId = biome.enemies[Math.floor(Math.random() * biome.enemies.length)];
                    const def = ENEMIES[typeId];
                    if (def) {
                        const ex = this.shroud.getLeadingX() + 100 + Math.random() * 200;
                        const ey = WORLD.GROUND_Y - def.height / 2;
                        const enemy = new Enemy(this, ex, ey, typeId);
                        this.enemyGroup.add(enemy);
                    }
                }
                this.cameras.main.shake(300, 0.006);
                break;
            }
            case 'tendril_reach': {
                // Create 3 damage zones ahead of shroud
                for (let i = 0; i < 3; i++) {
                    const zx = this.shroud.getLeadingX() + 150 + i * 120;
                    const zone = this.add.rectangle(zx, WORLD.GROUND_Y - 20, 60, 40, 0x4400AA, 0.4).setDepth(8);
                    // Damage player if overlapping
                    const checkDmg = () => {
                        if (Math.abs(this.player.x - zx) < 30 && this.player.hitInvincibleTimer <= 0) {
                            GlobalState.drainFlame(8);
                            this.player.hitInvincibleTimer = 500;
                            this._flashPlayer();
                        }
                    };
                    this.time.delayedCall(500, checkDmg);
                    this.time.delayedCall(2000, () => { if (zone.active) zone.destroy(); });
                }
                break;
            }
            case 'speed_surge': {
                // Speed handled by ShroudMutationManager + update loop
                this.popups.show(this.player.x, this.player.y - 60, 'SHROUD SURGES!', '#FF0000', '16px');
                break;
            }
            case 'deadly_tendrils': {
                // Feature 2: Create 2-3 red-tinted drain zones ahead of player
                const count = 2 + Math.floor(Math.random() * 2);
                for (let i = 0; i < count; i++) {
                    const tx = this.player.x + 200 + Math.random() * 400;
                    const rect = this.add.rectangle(tx, WORLD.GROUND_Y - 25, 70, 50, 0xFF0000, 0.3).setDepth(8);
                    this.tweens.add({
                        targets: rect,
                        alpha: { from: 0.2, to: 0.45 },
                        duration: 800,
                        yoyo: true,
                        repeat: -1,
                    });
                    this._deadlyTendrilZones.push({ x: tx, rect, timer: 5000 });
                    this.time.delayedCall(5000, () => {
                        if (rect.active) rect.destroy();
                    });
                }
                this.popups.show(this.player.x, this.player.y - 60, 'DEADLY TENDRILS!', '#FF0000', '16px');
                break;
            }
        }
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
        this.audio.playAchievement();
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

    _hitFreeze(duration = 50) {
        if (this.isGameOver) return;
        this.time.timeScale = 0.1;
        setTimeout(() => {
            if (this.time) this.time.timeScale = 1.0;
        }, duration);
    }

    _triggerGameOver(distMeters) {
        this.isGameOver = true;
        this.runStats.hasDied = true;
        AchievementManager.update();
        this.player.setVelocity(0, 0);
        this.player.body.enable = false;
        this.particles.stopDashTrail();
        this.audio.stopShroudWarning();

        // Save tombstone
        Tombstone.saveDeath(this.player.x, distMeters);

        // Save ghost run
        this.ghostRun.saveIfBest();

        // Phase 1: slow-mo + flicker + vignette
        this.time.timeScale = 0.3;
        this.cameras.main.shake(500, 0.01);

        if (this.audio.initialized) {
            this.audio.setShroudIntensity(0);
            this.audio.playGameOverStinger();
        }

        // Player rapid flicker (8 cycles, 50ms each)
        let flickerCount = 0;
        const flickerInterval = setInterval(() => {
            if (this.player.active) {
                this.player.setAlpha(flickerCount % 2 === 0 ? 0 : 1);
            }
            flickerCount++;
            if (flickerCount >= 16) clearInterval(flickerInterval);
        }, 50);

        // Red vignette overlay
        const { width, height } = this.scale;
        const vignette = this.add.rectangle(width / 2, height / 2, width, height, 0xFF0000, 0)
            .setScrollFactor(0).setDepth(199);
        this.tweens.add({ targets: vignette, fillAlpha: 0.25, duration: 800 });

        // Phase 2: after 1.5s real time, restore timeScale, show stats
        setTimeout(() => {
            if (this.time) this.time.timeScale = 1.0;
            if (this.player.active) {
                this.player.setAlpha(0);
            }
            this.hud.showGameOver(GlobalState.elixir, distMeters || 0, this.loreScrollsCollected, this.runStats);
        }, 1500);
    }

    shutdown() {
        AchievementManager.unbind();
    }
}
