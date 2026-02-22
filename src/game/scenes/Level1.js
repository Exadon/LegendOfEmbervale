import Phaser from 'phaser';
import { WORLD, PLAYER, FLAME, FLAME_WISP, FLAME_SHRINE, WRAITH, SHROUD, GROUND_SLAM, FLAME_BURST, COMBO, PROGRESSION_BAR, LORE_ENTRIES, SHRINE_INSCRIPTIONS, NEAR_DEATH, SURVIVOR, CHALLENGE_SHRINE, RELIC, RELIC_UPGRADE_COST, ENEMIES, CINDER_VESSEL, ELIXIR_CORRUPTION, CRAFTSPERSON, OBELISK, DEADLY_SHROUD, DOUBLE_JUMP, UNDEAD_HAND, ENDLESS, DIFFICULTIES } from '../constants.js';
import { RunModifier } from '../systems/RunModifier.js';
import { GlobalState } from '../GlobalState.js';
import { SkillManager } from '../systems/SkillManager.js';
import { Player } from '../entities/Player.js';
import { Shroud } from '../entities/Shroud.js';
import { InputManager } from '../systems/InputManager.js';
import { ParallaxBackground } from '../systems/ParallaxBackground.js';
import { AudioManager } from '../systems/AudioManager.js';
import { Settings } from '../systems/Settings.js';
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
import { MusicManager } from '../systems/MusicManager.js';
import { CombatSystem } from '../systems/CombatSystem.js';
import { MiningSystem } from '../systems/MiningSystem.js';
import { InteractionSystem } from '../systems/InteractionSystem.js';
import { MetaProgression } from '../systems/MetaProgression.js';

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
        const initAudio = () => {
            this.audio.init();
            this.audio.resume();
            this.audio.setVolume(Settings.data.volume);
            MusicManager.init(this.sound);
            MusicManager.playBiome(this.biomeManager.getCurrentBiome().id);
        };
        this.input.once('pointerdown', initAudio);
        this.input.keyboard.once('keydown', initAudio);

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
        this.undeadHandGroup = this.add.group();

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
        this.physics.add.collider(this.enemyGroup, this.ground);
        this.physics.add.collider(this.enemyGroup, this.platforms);

        // Shroud
        this.shroud = new Shroud(this);

        // Apply Flame Altar shroud slow (see also update loop — skipped if altarDisabled)
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

        // Endless loop callback
        this.biomeManager.onLoop = (n) => {
            this.loopCount = n;
            this.runStats.loopCount = n;
            this.levelGen.setLoop(n);
            this.shroud.baseSpeedMult = 1 + n * ENDLESS.SHROUD_RAMP_PER_LOOP;
            GlobalState.addElixir(ENDLESS.ELIXIR_BONUS_PER_LOOP);
            FlameAltar.addElixir(ENDLESS.ELIXIR_BONUS_PER_LOOP);
            this.popups.show(this.player.x, this.player.y - 80, `LOOP ${n} BEGINS`, '#FF44FF', '20px');
            this.cameras.main.flash(600, 180, 0, 200);
            if (this.hud && this.hud.updateLoop) this.hud.updateLoop(n);
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
            undeadHands: this.undeadHandGroup,
        }, this.biomeManager);

        this.levelGen.setDifficultyMult(this._diff);
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
        if (RunModifier.active) this.hud.showModifier(RunModifier.active);

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

        // Relic upgrade overlay [U]
        this.input.keyboard.on('keydown-U', () => {
            if (!this.isGameOver) this._showRelicUpgradeOverlay();
        });

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

        // Difficulty preset (E1)
        this._diff = DIFFICULTIES[Settings.data.difficulty] || DIFFICULTIES.standard;
        this._diffEnemyDamageMult = this._diff.enemyDamageMult;

        // Relic system
        this.relicManager = new RelicManager();
        this.relicOverlay = new RelicOverlay(this, this.relicManager);
        // Sprint 10d: Synergy notification
        this.relicManager.onSynergyActivated((synergies) => {
            this.runStats.relicSynergyTriggered = true;
            for (const syn of this.relicManager.getSynergyDefs()) {
                this.popups.show(this.player.x, this.player.y - 60, `SYNERGY: ${syn.name}!`, '#FFD700', '14px');
            }
        });

        // Challenge arena
        this.challengeArena = new ChallengeArena(this);

        // Boss manager
        this.bossManager = new BossManager(this);

        // Extracted subsystems
        this.combatSystem = new CombatSystem(this);
        this.miningSystem = new MiningSystem(this);
        this.interactionSystem = new InteractionSystem(this);

        // State
        this.isGameOver = false;
        this.loopCount = 0;
        this.playerInShroud = false;
        this.flameCrackleTimer = 0;
        this.closeShroudWarningTimer = 0;
        this.footstepTimer = 0;
        this.lastDiffTier = 0;

        // Near-death slow-mo
        this._nearDeathCooldown = 0;

        // Deadly tendril zones from mutations (Feature 2)
        this._deadlyTendrilZones = [];

        // Per-run stats for achievements
        this.runStats = {
            distanceMeters: 0,
            loopCount: 0,
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
            bossesDefeated: new Set(),
            isDaily: false,
        };
        this._winTriggered = false;

        // Apply daily flag from scene init data
        if (this.scene.settings.data && this.scene.settings.data.daily) {
            this.runStats.isDaily = true;
        }

        // ─── Run Modifier (Phase A2) ───
        this._modFlameDrainMult = 1;
        this._altarDisabled = false;
        this._modWispRestoreMult = null; // null means use normal relicManager value
        this._slowStartActive = false;
        {
            const mod = RunModifier.active;
            if (mod) {
                if (mod.apply.flameDrainMult)   this._modFlameDrainMult = mod.apply.flameDrainMult;
                if (mod.apply.altarDisabled)    this._altarDisabled = true;
                if (mod.apply.dashDisabled)     this.player._modifierNoDash = true;
                if (mod.apply.shroudSpeedMult)  this.shroud.speedMultiplier *= mod.apply.shroudSpeedMult;
                if (mod.apply.eliteSpawnMult)   this.levelGen.setEliteSpawnMult(mod.apply.eliteSpawnMult);
                if (mod.apply.relicsBossOnly)   this.relicManager._banishDropChance = 0;
                if (mod.apply.maxFlameCap)      GlobalState.maxFlame = mod.apply.maxFlameCap;
                if (mod.apply.wispRestoreMult !== undefined) this._modWispRestoreMult = mod.apply.wispRestoreMult;
                if (mod.apply.slowStartDist)    this._slowStartActive = true;
                // Show badge in HUD (added after HUD is created)
            }
        }

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
        this.events.on('groundSlam', (x, y, sType) => { this.runStats.slamCount++; this.combatSystem.handleClassSAbility(sType || 'ground_slam', x, y); });
        this.events.on('arcaneMine', (x, y, cfg) => { this.combatSystem.handleArcaneMine(x, y, cfg); });
        this.events.on('flameBurst', (x, y) => { this.runStats.burstCount++; this.combatSystem.handleFlameBurst(x, y); });
        this.events.on('classAttack', (x, y) => { this.runStats.classAttackCount++; this.combatSystem.handleClassAttack(x, y); });
        this.events.on('skillAcquired', () => { this.runStats.skillsAcquired++; });
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
            MetaProgression.recordRelic(relic.id);
            // Show tier2 upgrade indicator in popup if this relic can be upgraded
            if (!MetaProgression.hasUpgrade(relic.id)) {
                this.time.delayedCall(800, () => {
                    this.popups.show(this.player.x, this.player.y - 80, 'Upgrade at Flame Altar!', '#FFAA44', '11px');
                });
            }
        });
        this.events.on('bossRelicDrop', () => {
            if (this.relicManager.canDrop() && Math.random() < 0.15) {
                // Sprint 11: 15% chance for legendary relic from boss
                this.time.delayedCall(1000, () => this.relicOverlay.show(true));
            } else if (this.relicManager.canDrop()) {
                this.time.delayedCall(1000, () => this.relicOverlay.show(false));
            }
        });
        // Sprint 8: challenge relic drop
        this.events.on('challengeRelicDrop', () => {
            if (this.relicManager.canDrop()) {
                this.time.delayedCall(600, () => this.relicOverlay.show());
            }
        });

        // Challenge arena events
        this.events.on('challengeArenaStart', () => {
            this.shroud.speedMultiplier = 0;
            this._arenaWalls = this._createArenaWalls(this.challengeArena.arenaX, 700, 0xAA44FF);
        });
        this.events.on('challengeArenaEnd', (success, rewardData) => {
            this._destroyArenaWalls(this._arenaWalls);
            this._arenaWalls = null;
            this.shroud.speedMultiplier = 1.0;
            if (success) {
                // Sprint 8b: Tiered rewards
                const tier = (rewardData && rewardData.tier) || CHALLENGE_SHRINE.REWARD_TIERS.easy;
                const elixirBonus = (rewardData && rewardData.elixirBonus) || 0;
                const totalElixir = tier.elixir + elixirBonus;
                GlobalState.flame = Math.min(GlobalState.flame + tier.flame, GlobalState.maxFlame);
                GlobalState.addElixir(totalElixir);
                this.hud.popElixir();
                const cursedBadge = (rewardData && rewardData.isCursed) ? ' [CURSED BONUS]' : '';
                this.popups.show(this.player.x, this.player.y - 60, `CHALLENGE COMPLETE!${cursedBadge}`, '#44FF44', '16px');
                this.popups.show(this.player.x, this.player.y - 40, `+${tier.flame} FLAME +${totalElixir} ELIXIR`, '#00FFCC', '12px');
                this.audio.playLevelUp();
                // Relic drop chance
                if (tier.relicChance > 0 && Math.random() < tier.relicChance) {
                    this.events.emit('challengeRelicDrop', this.player.x, this.player.y);
                }
                // Achievement tracking
                if (this.runStats) {
                    this.runStats.challengesCompleted = (this.runStats.challengesCompleted || 0) + 1;
                    if (rewardData && rewardData.isCursed) this.runStats.cursedChallengeCompleted = true;
                }
            } else {
                this.popups.show(this.player.x, this.player.y - 60, 'CHALLENGE FAILED', '#FF4444', '16px');
                this.shroud.surge();
                this.cameras.main.shake(300, 0.008);
            }
        });

        // Boss fight events
        this.events.on('bossFightStart', () => {
            this.shroud.speedMultiplier = 0;
            MusicManager.playBoss();
            const arenaCenter = this.player.x + 150;
            this._arenaWalls = this._createArenaWalls(arenaCenter, 800, 0xFF4422);
            // Sprint 7f: spawn arena hazards
            const biome = this.biomeManager.getCurrentBiome();
            if (biome) this._spawnBossHazards(biome.id, arenaCenter);
        });
        this.events.on('bossFightEnd', () => {
            this.shroud.speedMultiplier = 1.0;
            MusicManager.stopBoss();
            this._destroyArenaWalls(this._arenaWalls);
            this._arenaWalls = null;
            // Clean up hazards
            this._destroyBossHazards();
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
            // Sprint 7f: Chieftain spike eruption — spikes erupt 800ms after ground pound
            if (this._hazardType === 'spike_eruption') {
                this.time.delayedCall(800, () => {
                    if (!this.bossManager.active) return;
                    const numSpikes = 3;
                    for (let i = 0; i < numSpikes; i++) {
                        const sx = bx + (Math.random() - 0.5) * 200;
                        const spike = this.add.triangle(
                            sx, WORLD.GROUND_Y, 0, 40, 20, 0, 40, 40, 0xCC8800, 0.9
                        ).setDepth(8);
                        this.time.delayedCall(50, () => {
                            if (Math.abs(this.player.x - sx) < 25 && this.player.hitInvincibleTimer <= 0) {
                                GlobalState.drainFlame(8);
                                this.player.hitInvincibleTimer = 400;
                                this._flashPlayer();
                            }
                        });
                        this.time.delayedCall(600, () => { if (spike.active) spike.destroy(); });
                    }
                });
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

        // ─── Sprint 7c: New boss attack handlers ───

        // VineBomb: spread projectiles toward player
        this.events.on('bossVineBomb', (bx, by, px, py, angleOffset) => {
            const baseAngle = Math.atan2(py - by, px - bx);
            const angle = baseAngle + (angleOffset * Math.PI / 180);
            const speed = 250;
            const proj = this.add.circle(bx, by, 5, 0x44AA22, 0.9).setDepth(55);
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            this.tweens.add({
                targets: proj,
                x: bx + vx * 2,
                y: by + vy * 2,
                duration: 2000,
                onUpdate: () => {
                    if (!proj.active) return;
                    if (Phaser.Math.Distance.Between(proj.x, proj.y, this.player.x, this.player.y) < 18) {
                        if (this.player.hitInvincibleTimer <= 0 && !this.player.isDashing) {
                            GlobalState.drainFlame(8);
                            this.player.hitInvincibleTimer = 500;
                            this._flashPlayer();
                        }
                        proj.destroy();
                    }
                },
                onComplete: () => { if (proj.active) proj.destroy(); }
            });
        });

        // WarCry: 800ms buff indicator
        this.events.on('bossWarCry', (bx) => {
            this.cameras.main.shake(200, 0.006);
            this.popups.show(bx, WORLD.GROUND_Y - 80, 'WAR CRY!', '#FFDD00', '14px');
        });

        // FlamePillar: 3 stationary fire zones
        this.events.on('bossFlamePillar', (bx, count) => {
            const arenaHalfW = 350;
            for (let i = 0; i < count; i++) {
                const px = bx + (Math.random() - 0.5) * arenaHalfW * 2;
                const pillar = this.add.rectangle(px, WORLD.GROUND_Y - 30, 60, 60, 0xFF4400, 0.6).setDepth(8);
                // Damage player if standing on it
                const iv = this.time.addEvent({
                    delay: 200,
                    repeat: 9, // 2s total
                    callback: () => {
                        if (!pillar.active) { iv.destroy(); return; }
                        if (Math.abs(this.player.x - px) < 35 && Math.abs(this.player.y - WORLD.GROUND_Y) < 50) {
                            if (this.player.hitInvincibleTimer <= 0 && !this.player.isDashing) {
                                GlobalState.drainFlame(5);
                                this.player.hitInvincibleTimer = 300;
                                this._flashPlayer();
                            }
                        }
                    }
                });
                this.time.delayedCall(2000, () => { if (pillar.active) pillar.destroy(); });
            }
        });

        // EyeBeam: sweep across arena floor
        this.events.on('bossEyeBeam', (bx, beamW) => {
            const arenaL = bx - 350;
            const beam = this.add.rectangle(arenaL, WORLD.GROUND_Y - 20, beamW, 40, 0x44FFFF, 0.5).setDepth(8);
            let elapsed = 0;
            const sweepDur = 2000;
            const sweepDist = 700;
            const iv = this.time.addEvent({
                delay: 50,
                repeat: sweepDur / 50 - 1,
                callback: () => {
                    elapsed += 50;
                    if (!beam.active) { iv.destroy(); return; }
                    beam.x = arenaL + (sweepDist * elapsed / sweepDur);
                    if (Math.abs(this.player.x - beam.x) < beamW / 2 && Math.abs(this.player.y - WORLD.GROUND_Y) < 50) {
                        if (this.player.hitInvincibleTimer <= 0 && !this.player.isDashing) {
                            GlobalState.drainFlame(8);
                            this.player.hitInvincibleTimer = 400;
                            this._flashPlayer();
                        }
                    }
                }
            });
            this.time.delayedCall(sweepDur, () => { if (beam.active) beam.destroy(); });
        });

        // IceRain: projectiles from above
        this.events.on('bossIceRain', (bx, count) => {
            for (let i = 0; i < count; i++) {
                this.time.delayedCall(i * 300, () => {
                    if (!this.scene.isActive()) return;
                    const px = bx + (Math.random() - 0.5) * 600;
                    const drop = this.add.circle(px, 0, 8, 0x88CCFF, 0.8).setDepth(55);
                    this.tweens.add({
                        targets: drop,
                        y: WORLD.GROUND_Y,
                        duration: 800,
                        ease: 'Power1',
                        onUpdate: () => {
                            if (!drop.active) return;
                            if (Phaser.Math.Distance.Between(drop.x, drop.y, this.player.x, this.player.y) < 22) {
                                if (this.player.hitInvincibleTimer <= 0 && !this.player.isDashing) {
                                    GlobalState.drainFlame(10);
                                    this.player.hitInvincibleTimer = 500;
                                    this._flashPlayer();
                                }
                                drop.destroy();
                            }
                        },
                        onComplete: () => {
                            if (drop.active) drop.destroy();
                        }
                    });
                });
            }
        });

        // Sprint 11: Corrupted Sentinel attacks

        // ShroudPulse: expanding ring of damage
        this.events.on('bossShroudPulse', (bx, by, radius) => {
            this.cameras.main.shake(300, 0.008);
            const ring = this.add.circle(bx, by, 10, 0x880088, 0).setDepth(8);
            ring.setStrokeStyle(3, 0xAA44FF, 1);
            this.tweens.add({
                targets: ring,
                displayWidth: radius * 2,
                displayHeight: radius * 2,
                alpha: 0,
                duration: 600,
                ease: 'Power1',
                onUpdate: () => {
                    if (!ring.active) return;
                    const r = ring.displayWidth / 2;
                    const dist = Phaser.Math.Distance.Between(bx, by, this.player.x, this.player.y);
                    if (dist < r && dist > r - 40) {
                        if (this.player.hitInvincibleTimer <= 0 && !this.player.isDashing) {
                            GlobalState.drainFlame(12);
                            this.player.hitInvincibleTimer = 600;
                            this._flashPlayer();
                        }
                    }
                },
                onComplete: () => { if (ring.active) ring.destroy(); }
            });
        });

        // CorruptionTether: links player to boss for 2s
        this.events.on('bossCorruptionTether', (bx, by, dur) => {
            let elapsed = 0;
            const SWEET_SPOT_MIN = 80;
            const SWEET_SPOT_MAX = 160;
            const tetherText = this.add.text(this.player.x, this.player.y - 50, 'TETHERED!', {
                fontSize: '12px', color: '#AA44FF', fontFamily: 'monospace',
                stroke: '#000000', strokeThickness: 2
            }).setDepth(260).setScrollFactor(0);
            const iv = this.time.addEvent({
                delay: 100,
                repeat: dur / 100 - 1,
                callback: () => {
                    elapsed += 100;
                    if (!this.bossManager.boss || !this.bossManager.boss.active) { iv.destroy(); if (tetherText.active) tetherText.destroy(); return; }
                    const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, bx, by);
                    if (dist < SWEET_SPOT_MIN || dist > SWEET_SPOT_MAX) {
                        if (this.player.hitInvincibleTimer <= 0) {
                            GlobalState.drainFlame(3);
                        }
                    }
                    if (elapsed >= dur && tetherText.active) tetherText.destroy();
                }
            });
        });

        // CloneStrike: boss creates 2 decoys for 3s
        this.events.on('bossCloneStrike', (bx, by) => {
            const decoys = [];
            const bossRef = this.bossManager.boss;
            if (!bossRef) return;
            for (let i = 0; i < 2; i++) {
                const dx = bx + (i === 0 ? -150 : 150);
                const decoy = this.add.rectangle(dx, by, 40, 60, bossRef.def.tint || 0x8844AA, 0.6).setDepth(9);
                decoys.push(decoy);
            }
            // Real boss flickers
            const flickerIv = this.time.addEvent({
                delay: 150, repeat: 19,
                callback: () => {
                    if (bossRef.active) bossRef.setAlpha(bossRef.alpha === 1 ? 0.4 : 1);
                }
            });
            this.time.delayedCall(3000, () => {
                decoys.forEach(d => { if (d.active) d.destroy(); });
                if (bossRef.active) { bossRef.setAlpha(1); flickerIv.destroy(); }
            });
        });

        // Biome change — trigger boss + music
        const origBiomeChange = this.biomeManager.onBiomeChange;
        this.biomeManager.onBiomeChange = (biome) => {
            if (origBiomeChange) origBiomeChange(biome);
            this.bossManager.trySpawnBoss(biome.id);
            if (!this.bossManager.active) {
                MusicManager.playBiome(biome.id);
            }
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

        // Update input manager (gamepad just-pressed state)
        this.inputManager.update();

        // --- Lore compendium toggle [J] / Gamepad Select ---
        if ((Phaser.Input.Keyboard.JustDown(this.loreKey) || this.inputManager.lore) && !this.loreCompendium.active && !this.levelUpOverlay.active && !this.relicOverlay.active && !this.obeliskOverlay.active) {
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
        const _altarSpeedMult = this._altarDisabled ? 1 : FlameAltar.getSpeedMult();
        let speedMult = this.relicManager.getMult('moveSpeedMult') * _altarSpeedMult;
        if (this.interactionSystem.survivorBuffTimer > 0 && this.interactionSystem.survivorBuffType === 'speed') {
            speedMult *= (1 + SURVIVOR.BUFFS.find(b => b.id === 'speed').value);
        }
        // Corruption speed bonus (Feature 5)
        if (GlobalState.corruption >= ELIXIR_CORRUPTION.THRESHOLD_HIGH) {
            speedMult *= (1 + ELIXIR_CORRUPTION.SPEED_BONUS);
        }
        // Frost fell freeze aura effect
        if (this.combatSystem.freezeSlowTimer > 0) {
            speedMult *= 0.7;
            this.combatSystem.freezeSlowTimer -= delta;
        }
        // Sprint 7f: Vine patch hazard slow
        if (this.player._vinePatchSpeedMult && this.player._vinePatchSpeedMult < 1) {
            speedMult *= this.player._vinePatchSpeedMult;
        }
        // Slow Start modifier: -20% speed for first 1000m
        if (this._slowStartActive) {
            const distMetersNow = (this.player.x - PLAYER.START_X) / 10;
            if (distMetersNow < 1000) {
                speedMult *= 0.8;
            } else {
                this._slowStartActive = false;
            }
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
        if (this.interactionSystem.shrineDrainBuffTimer > 0) {
            this.interactionSystem.shrineDrainBuffTimer -= delta;
            drainRate *= 0.5;
        }
        // Relic flame drain multiplier
        drainRate *= this.relicManager.getMult('flameDrainMult');
        // Run modifier flame drain multiplier
        drainRate *= this._modFlameDrainMult;
        // Difficulty preset drain multiplier (E1)
        drainRate *= this._diff ? this._diff.flameDrainMult : 1;

        // Sprint 11: Shroud Heart legendary — heals in shroud
        const shroudHeal = this.relicManager.getFlat('shroudHeal', 0);
        if (shroudHeal > 0 && this.playerInShroud) {
            GlobalState.flame = Math.min(GlobalState.flame + shroudHeal * (delta / 1000), GlobalState.maxFlame);
            drainRate = 0; // Override — relic negates drain
        }
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
        if (this.interactionSystem.survivorBuffTimer > 0 && this.interactionSystem.survivorBuffType === 'flame_regen') {
            const regenRate = SURVIVOR.BUFFS.find(b => b.id === 'flame_regen').value;
            GlobalState.flame = Math.min(GlobalState.flame + regenRate * (delta / 1000), GlobalState.maxFlame);
        }
        // Bard blessing flame regen (Feature 6)
        if (this.interactionSystem.bardBlessingTimer > 0) {
            GlobalState.flame = Math.min(GlobalState.flame + 3 * (delta / 1000), GlobalState.maxFlame);
            this.interactionSystem.bardBlessingTimer -= delta;
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
        if (GlobalState.flame <= 0 && this.interactionSystem.hasCinderVessel) {
            GlobalState._gameOver = false;
            GlobalState.flame = CINDER_VESSEL.RESTORE;
            this.interactionSystem.hasCinderVessel = false;
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

        // --- Relic: soul_anchor — death save ---
        if (GlobalState.flame <= 0 && this.relicManager.getFlag('deathSave') && !this.relicManager._deathSaveUsed) {
            const saveFlame = this.relicManager.getApplyOrTier2Value('soul_anchor', 'deathSaveFlame') || 1;
            GlobalState._gameOver = false;
            GlobalState._flame = saveFlame;
            this.relicManager._deathSaveUsed = true;
            this.cameras.main.flash(400, 136, 136, 255);
            this.cameras.main.shake(300, 0.01);
            this.popups.show(this.player.x, this.player.y - 60, 'SOUL ANCHORED', '#8888FF', '18px');
        }

        this.hud.showShroudWarning(this.playerInShroud);

        // --- Corruption decay (Feature 5) ---
        GlobalState.decayCorruption(ELIXIR_CORRUPTION.DECAY_RATE * (delta / 1000));
        this.miningSystem.updateCorruptionVisuals();

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
            this.time.delayedCall(NEAR_DEATH.SLOWMO_DURATION, () => { this.time.timeScale = 1.0; });
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
            MusicManager.playShroud(intensity);

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
        this.miningSystem.update(delta);

        // --- Flame Wisps ---
        this.interactionSystem.updateWisps();

        // --- Flame Shrines ---
        this.interactionSystem.updateShrines();

        // --- Lore Scrolls ---
        this.interactionSystem.updateScrolls();

        // --- Corruption Pools ---
        this.miningSystem.updateCorruption(delta);

        // --- Enemies ---
        this.combatSystem.updateEnemies(delta);

        // --- Undead Hands ---
        this.combatSystem.updateUndeadHands(delta);

        // --- Crumbling Platforms ---
        this._updateCrumblingPlatforms(delta);

        // --- Survivors ---
        this.interactionSystem.updateSurvivors(delta);

        // --- Challenge Shrines ---
        this.interactionSystem.updateChallengeShrines();

        // --- Cinder Vessels (Feature 1) ---
        this.interactionSystem.updateCinderVessels();

        // --- Craftspeople (Feature 6) ---
        this.interactionSystem.updateCraftspeople(delta);

        // --- Ancient Obelisks (Feature 7) ---
        this.interactionSystem.updateObelisks();

        // --- Challenge Arena ---
        this.challengeArena.update(delta);

        // --- Shroud Mutations ---
        this.shroudMutationManager.update(delta);

        // --- Shroud relic speed multiplier (reapply each frame) ---
        if (!this.bossManager.active && !this.challengeArena.active) {
            this.shroud.speedMultiplier = this.relicManager.getMult('shroudSpeedMult');
            // Flame Altar shroud slow (disabled if no_altar modifier active)
            if (!this._altarDisabled) this.shroud.speedMultiplier *= FlameAltar.getShroudSlowMult();
            // Survivor shroud_slow buff
            if (this.interactionSystem.survivorBuffTimer > 0 && this.interactionSystem.survivorBuffType === 'shroud_slow') {
                const slowVal = SURVIVOR.BUFFS.find(b => b.id === 'shroud_slow').value;
                this.shroud.speedMultiplier *= (1 - slowVal);
            }
            // Bard blessing shroud slow (Feature 6)
            if (this.interactionSystem.bardBlessingTimer > 0) {
                this.shroud.speedMultiplier *= 0.5;
            }
            // Mutation speed surge
            if (this.shroudMutationManager.surgeActive) {
                this.shroud.speedMultiplier *= 2;
            }
        }

        // --- Boss ---
        this.bossManager.update(delta);
        this._updateBossHazards(delta);

        // --- Ghost Run ---
        this.ghostRun.update(delta, this.player.x, this.player.y, !this.player.facingRight);

        // --- Survivor buff timer ---
        if (this.interactionSystem.survivorBuffTimer > 0) {
            this.interactionSystem.survivorBuffTimer -= delta;
            this.hud.updateBuff(this.interactionSystem.survivorBuffType, this.interactionSystem.survivorBuffTimer, SURVIVOR.BUFF_DURATION);
            if (this.interactionSystem.survivorBuffTimer <= 0) {
                this.interactionSystem.survivorBuffType = null;
                this.hud.updateBuff(null, 0, 0);
                this.popups.show(this.player.x, this.player.y - 40, 'BUFF EXPIRED', '#888888', '11px');
            }
        }

        // --- Combo timer ---
        if (this.combatSystem.comboCount > 0) {
            this.combatSystem.comboTimer -= delta;
            if (this.combatSystem.comboTimer <= 0) {
                this.combatSystem.comboCount = 0;
                if (this.hud && this.hud.updateCombo) this.hud.updateCombo(0);
            }
        }

        // --- Screen shake in shroud ---
        if (this.playerInShroud) {
            this.cameras.main.shake(100, 0.003);
        }

        // --- Companion (Beast Master) ---
        this.combatSystem.updateCompanion(delta);

        // --- HUD ---
        const distMeters = Math.max(0, (this.player.x - PLAYER.START_X) / 10);
        this.hud.update(this.player, distMeters);

        // --- Achievement stats ---
        this.runStats.distanceMeters = distMeters;
        this.runStats.survivalTime += delta / 1000;
        if (this.combatSystem.comboCount > this.runStats.maxCombo) {
            this.runStats.maxCombo = this.combatSystem.comboCount;
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

        // --- Win condition check ---
        this._checkWinConditions(distMeters);

        // --- Game over ---
        if (GlobalState.gameOver) {
            this._triggerGameOver(distMeters);
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

    // ─── Arena Walls ───

    _createArenaWalls(centerX, width, color) {
        // Sprint 7a: Full-height walls prevent aerial escape
        const wallH = WORLD.HEIGHT;
        const wallW = 6;
        const wallY = WORLD.HEIGHT / 2;
        const leftX = centerX - width / 2;
        const rightX = centerX + width / 2;

        // Visual bars
        const leftBar = this.add.rectangle(leftX, wallY, wallW, wallH, color, 0.7)
            .setDepth(55).setAlpha(0);
        const rightBar = this.add.rectangle(rightX, wallY, wallW, wallH, color, 0.7)
            .setDepth(55).setAlpha(0);

        // Static physics bodies (invisible, slightly wider for reliable collision)
        const leftBody = this.add.rectangle(leftX, wallY, 12, wallH, 0x000000, 0);
        this.physics.add.existing(leftBody, true);
        const rightBody = this.add.rectangle(rightX, wallY, 12, wallH, 0x000000, 0);
        this.physics.add.existing(rightBody, true);

        // Collide player only
        const colliderL = this.physics.add.collider(this.player, leftBody);
        const colliderR = this.physics.add.collider(this.player, rightBody);

        // Fade in
        this.tweens.add({ targets: [leftBar, rightBar], alpha: 0.7, duration: 300 });

        // Pulsing glow
        const pulse = this.tweens.add({
            targets: [leftBar, rightBar],
            alpha: { from: 0.5, to: 0.9 },
            duration: 800, yoyo: true, repeat: -1
        });

        return { leftBar, rightBar, leftBody, rightBody, colliderL, colliderR, pulse };
    }

    _destroyArenaWalls(walls) {
        if (!walls) return;
        walls.pulse.stop();
        this.tweens.add({
            targets: [walls.leftBar, walls.rightBar],
            alpha: 0, duration: 500,
            onComplete: () => {
                for (const el of [walls.leftBar, walls.rightBar, walls.leftBody, walls.rightBody]) {
                    if (el && el.active) el.destroy();
                }
                walls.colliderL.destroy();
                walls.colliderR.destroy();
            }
        });
    }

    // ─── Sprint 7f: Boss Arena Hazards ───

    _spawnBossHazards(bossId, arenaX) {
        this._bossHazards = [];
        const arenaW = 700;

        if (bossId === 'revelwood') {
            // Vine patches: player moves 40% slower inside them
            for (let i = 0; i < 3; i++) {
                const px = arenaX + (Math.random() - 0.5) * arenaW;
                const patch = this.add.rectangle(px, WORLD.GROUND_Y - 15, 80, 30, 0x226622, 0.35).setDepth(7);
                patch._hazardType = 'vine_slow';
                patch._x = px;
                this._bossHazards.push(patch);
            }
        } else if (bossId === 'nomad_highlands') {
            // Spike eruptions after ground pound — handled reactively in bossGroundPound
            // No persistent hazard; marker to indicate active hazard set
            this._hazardType = 'spike_eruption';
        } else if (bossId === 'kindlewastes') {
            // Burning floor strips: 3 zones dealing 2 flame/s
            for (let i = 0; i < 3; i++) {
                const px = arenaX + (i - 1) * 200;
                const strip = this.add.rectangle(px, WORLD.GROUND_Y - 10, 120, 20, 0xFF3300, 0.3).setDepth(7);
                strip._hazardType = 'burning_floor';
                strip._x = px;
                strip._damageTimer = 0;
                this._bossHazards.push(strip);
            }
        } else if (bossId === 'hollow') {
            // Gravity well: pulls player toward boss X
            this._gravityWellActive = true;
            this._gravityWellX = arenaX;
        } else if (bossId === 'albaneve') {
            // Icy floor: applied via update
            this._icyFloorActive = true;
        }
    }

    _destroyBossHazards() {
        if (this._bossHazards) {
            for (const h of this._bossHazards) {
                if (h && h.active) h.destroy();
            }
            this._bossHazards = null;
        }
        this._hazardType = null;
        this._gravityWellActive = false;
        this._icyFloorActive = false;
    }

    _updateBossHazards(delta) {
        if (!this._bossHazards && !this._gravityWellActive && !this._icyFloorActive) return;

        // Vine slow patches
        if (this._bossHazards) {
            for (const h of this._bossHazards) {
                if (!h || !h.active) continue;
                if (h._hazardType === 'vine_slow') {
                    const inPatch = Math.abs(this.player.x - h._x) < 45;
                    if (inPatch && !this.player._inVinePatch) {
                        this.player._inVinePatch = true;
                        this.player._vinePatchSpeedMult = 0.6;
                    } else if (!inPatch && this.player._inVinePatch) {
                        this.player._inVinePatch = false;
                        this.player._vinePatchSpeedMult = 1.0;
                    }
                } else if (h._hazardType === 'burning_floor') {
                    const onStrip = Math.abs(this.player.x - h._x) < 65 && Math.abs(this.player.y - WORLD.GROUND_Y) < 40;
                    if (onStrip) {
                        h._damageTimer = (h._damageTimer || 0) + delta;
                        if (h._damageTimer >= 500) {
                            h._damageTimer = 0;
                            if (this.player.hitInvincibleTimer <= 0) {
                                GlobalState.drainFlame(1); // ~2/s
                            }
                        }
                    }
                }
            }
        }

        // Gravity well
        if (this._gravityWellActive && this.bossManager.boss && this.bossManager.boss.active) {
            const dx = this.bossManager.boss.x - this.player.x;
            const pullSpeed = 60;
            const dir = dx > 0 ? 1 : -1;
            if (Math.abs(dx) > 30) {
                this.player.body.velocity.x += dir * pullSpeed * (delta / 1000);
            }
        }

        // Icy floor: reduce friction (clamp horizontal velocity change)
        if (this._icyFloorActive && this.player.body.blocked.down) {
            this.player.body.velocity.x *= 0.98; // sliding effect
        }
    }

    // ─── Relic Upgrade Overlay (Phase A3) ───

    _showRelicUpgradeOverlay() {
        if (this._relicUpgradeOpen) return;
        this._relicUpgradeOpen = true;
        this.physics.world.pause();

        const { width, height } = this.scale;
        const elems = [];

        const bg = this.add.rectangle(width / 2, height / 2, 420, 320, 0x000000, 0.9)
            .setScrollFactor(0).setDepth(310).setStrokeStyle(2, 0xFF8833);
        elems.push(bg);

        const title = this.add.text(width / 2, height / 2 - 140, 'RELIC UPGRADES  [20 Elixir each]', {
            fontSize: '14px', color: '#FF8833', fontFamily: 'monospace', fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(311);
        elems.push(title);

        const avail = MetaProgression.getAvailableElixir();
        const availText = this.add.text(width / 2, height / 2 - 120, `Available Elixir: ${avail}`, {
            fontSize: '11px', color: '#88DDFF', fontFamily: 'monospace'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(311);
        elems.push(availText);

        const seen = MetaProgression.seenRelics;
        if (seen.length === 0) {
            const none = this.add.text(width / 2, height / 2, 'Acquire relics in runs to unlock upgrades', {
                fontSize: '12px', color: '#666666', fontFamily: 'monospace'
            }).setOrigin(0.5).setScrollFactor(0).setDepth(311);
            elems.push(none);
        } else {
            for (let i = 0; i < seen.length; i++) {
                const relicId = seen[i];
                const def = RELIC.DEFINITIONS.find(r => r.id === relicId);
                if (!def) continue;
                const upgraded = MetaProgression.hasUpgrade(relicId);
                const canAfford = MetaProgression.canUpgradeRelic(relicId);
                const color = upgraded ? '#FFCC00' : (canAfford ? '#FFFFFF' : '#666666');
                const statusStr = upgraded ? '\u2713 UPGRADED' : (canAfford ? '[U] Upgrade' : 'Need elixir');
                const rowY = height / 2 - 90 + i * 28;
                const row = this.add.text(width / 2, rowY,
                    `${def.icon} ${def.name}  ${statusStr}`, {
                    fontSize: '12px', color, fontFamily: 'monospace'
                }).setOrigin(0.5).setScrollFactor(0).setDepth(311);
                elems.push(row);
            }
        }

        const hint = this.add.text(width / 2, height / 2 + 130, '[ESC] Close', {
            fontSize: '11px', color: '#555555', fontFamily: 'monospace'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(311);
        elems.push(hint);

        const close = () => {
            this._relicUpgradeOpen = false;
            for (const el of elems) { if (el.active) el.destroy(); }
            this.physics.world.resume();
            this.input.keyboard.removeListener('keydown-ESC', close);
        };
        this.input.keyboard.once('keydown-ESC', close);
    }

    // ─── Game Over ───

    _triggerGameOver(distMeters) {
        this.isGameOver = true;
        this.runStats.hasDied = true;

        // Run modifier reward (if died past 500m with an active modifier)
        const activeMod = RunModifier.active;
        if (activeMod && (distMeters || 0) > 500) {
            FlameAltar.addElixir(activeMod.reward);
            this.popups.show(this.player.x, this.player.y - 60, `+${activeMod.reward} ELIXIR (Modifier Bonus)`, '#00FFCC', '13px');
        }
        RunModifier.clear();

        AchievementManager.update();
        this.player.setVelocity(0, 0);
        this.player.body.enable = false;
        this.particles.stopDashTrail();
        this.audio.stopShroudWarning();
        this._destroyArenaWalls(this._arenaWalls);
        this._arenaWalls = null;

        // Save tombstone
        Tombstone.saveDeath(this.player.x, distMeters);

        // Save ghost run
        this.ghostRun.saveIfBest();

        // Sprint 10: Save run history
        MetaProgression.saveRunHistory({
            ...this.runStats,
            distanceMeters: distMeters || this.runStats.distanceMeters,
            className: this.runStats.className || (this.activeClass && this.activeClass.id) || 'adventurer',
            relics: this.relicManager.active.map(r => r.id),
        });

        // Phase 1: slow-mo + flicker + vignette
        this.time.timeScale = 0.3;
        this.cameras.main.shake(500, 0.01);

        if (this.audio.initialized) {
            this.audio.setShroudIntensity(0);
            this.audio.playGameOverStinger();
        }
        MusicManager.playGameOver();

        // Player rapid flicker (8 cycles, 50ms each)
        let flickerCount = 0;
        this.time.addEvent({
            delay: 50,
            repeat: 15,
            callback: () => {
                if (this.player.active) {
                    this.player.setAlpha(flickerCount % 2 === 0 ? 0 : 1);
                    flickerCount++;
                }
            }
        });

        // Red vignette overlay
        const { width, height } = this.scale;
        const vignette = this.add.rectangle(width / 2, height / 2, width, height, 0xFF0000, 0)
            .setScrollFactor(0).setDepth(199);
        this.tweens.add({ targets: vignette, fillAlpha: 0.25, duration: 800 });

        // Phase 2: restore timeScale + show stats
        this.time.delayedCall(1500, () => {
            this.time.timeScale = 1.0;
            if (this.player.active) {
                this.player.setAlpha(0);
            }
            this.hud.showGameOver(GlobalState.elixir, distMeters || 0, this.interactionSystem.loreScrollsCollected, this.runStats);
        });
    }

    // ─── Win Conditions (Phase C) ───

    _checkWinConditions(distMeters) {
        if (this._winTriggered || GlobalState.gameOver) return;
        const bosses = this.runStats.bossesDefeated;

        // Path 1: defeat all 6 bosses
        if (bosses && bosses.size >= 6) {
            this._triggerWin('boss_conquest');
            return;
        }
        // Path 2: collect all lore scrolls (lifetime)
        if (this.interactionSystem && this.interactionSystem.loreScrollsCollected >= LORE_ENTRIES.length) {
            this._triggerWin('lore_master');
            return;
        }
        // Path 3: reach 50000m AND have defeated shroud_maw boss
        if (distMeters >= 50000 && bosses && bosses.has('shroud_maw')) {
            this._triggerWin('shroud_conquest');
        }
    }

    _triggerWin(path) {
        if (this._winTriggered) return;
        this._winTriggered = true;

        // Stop flame drain and shroud
        GlobalState._gameOver = false;
        this.shroud.speedMultiplier = 0;

        // Award elixir
        FlameAltar.addElixir(100);
        MetaProgression.markWin(path);
        AchievementManager.update();

        // Music + camera flash
        MusicManager.playBoss();
        this.cameras.main.flash(800, 255, 200, 0);
        this.cameras.main.shake(400, 0.008);
        this.popups.show(this.player.x, this.player.y - 80, 'VICTORY!', '#FFDD00', '28px');

        // Save run history
        MetaProgression.saveRunHistory({
            ...this.runStats,
            distanceMeters: this.runStats.distanceMeters,
            className: (SkillManager.activeClass && SkillManager.activeClass.className) || 'adventurer',
            relics: this.relicManager.active.map(r => r.id),
            win: true,
        });

        // After 1.5s go to WinScene
        this.time.delayedCall(1500, () => {
            MusicManager.stopAll();
            this.cameras.main.fadeOut(800, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('WinScene', {
                    path,
                    runStats: { ...this.runStats, bossesDefeated: this.runStats.bossesDefeated ? [...this.runStats.bossesDefeated] : [] },
                    relics: this.relicManager.active.map(r => r.id),
                });
            });
        });
    }

    shutdown() {
        AchievementManager.unbind();
        MusicManager.stopAll();
    }
}
