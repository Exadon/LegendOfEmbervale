import Phaser from 'phaser';
import { WORLD, PLAYER, FLAME, FLAME_WISP, FLAME_SHRINE, WRAITH, SHROUD, GROUND_SLAM, FLAME_BURST, COMBO, PROGRESSION_BAR, LORE_ENTRIES, SHRINE_INSCRIPTIONS, NEAR_DEATH, SURVIVOR, CHALLENGE_SHRINE, RELIC, ENEMIES, CINDER_VESSEL, ELIXIR_CORRUPTION, CRAFTSPERSON, OBELISK, DEADLY_SHROUD, DOUBLE_JUMP, UNDEAD_HAND } from '../constants.js';
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
            undeadHands: this.undeadHandGroup,
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

        // Extracted subsystems
        this.combatSystem = new CombatSystem(this);
        this.miningSystem = new MiningSystem(this);
        this.interactionSystem = new InteractionSystem(this);

        // State
        this.isGameOver = false;
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
        });
        this.events.on('bossRelicDrop', () => {
            if (this.relicManager.canDrop()) {
                this.time.delayedCall(1000, () => this.relicOverlay.show());
            }
        });

        // Challenge arena events
        this.events.on('challengeArenaStart', () => {
            this.shroud.speedMultiplier = 0;
            this._arenaWalls = this._createArenaWalls(this.challengeArena.arenaX, 700, 0xAA44FF);
        });
        this.events.on('challengeArenaEnd', (success) => {
            this._destroyArenaWalls(this._arenaWalls);
            this._arenaWalls = null;
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
            MusicManager.playBoss();
            const arenaCenter = this.player.x + 150;
            this._arenaWalls = this._createArenaWalls(arenaCenter, 800, 0xFF4422);
        });
        this.events.on('bossFightEnd', () => {
            this.shroud.speedMultiplier = 1.0;
            MusicManager.stopBoss();
            this._destroyArenaWalls(this._arenaWalls);
            this._arenaWalls = null;
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
            // Flame Altar shroud slow
            this.shroud.speedMultiplier *= FlameAltar.getShroudSlowMult();
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
        const wallH = 300;
        const wallW = 6;
        const wallY = WORLD.GROUND_Y - wallH / 2 + 20;
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

    // ─── Game Over ───

    _triggerGameOver(distMeters) {
        this.isGameOver = true;
        this.runStats.hasDied = true;
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

        // Phase 1: slow-mo + flicker + vignette
        this.time.timeScale = 0.3;
        this.cameras.main.shake(500, 0.01);

        if (this.audio.initialized) {
            this.audio.setShroudIntensity(0);
            this.audio.playGameOverStinger();
        }
        MusicManager.playGameOver();

        // Player rapid flicker (8 cycles, 50ms each)
        this.time.addEvent({
            delay: 50,
            repeat: 15,
            callback: (_args, event) => {
                if (this.player.active) {
                    const count = 16 - event.repeatCount;
                    this.player.setAlpha(count % 2 === 0 ? 0 : 1);
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

    shutdown() {
        AchievementManager.unbind();
        MusicManager.stopAll();
    }
}
