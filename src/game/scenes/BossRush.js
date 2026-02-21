import Phaser from 'phaser';
import { WORLD, PLAYER, BOSS } from '../constants.js';
import { GlobalState } from '../GlobalState.js';
import { SkillManager } from '../systems/SkillManager.js';
import { Player } from '../entities/Player.js';
import { InputManager } from '../systems/InputManager.js';
import { AudioManager } from '../systems/AudioManager.js';
import { MusicManager } from '../systems/MusicManager.js';
import { ParticleManager } from '../systems/ParticleManager.js';
import { PopupText } from '../systems/PopupText.js';
import { BossManager } from '../systems/BossManager.js';
import { RelicManager } from '../systems/RelicManager.js';
import { RelicOverlay } from '../ui/RelicOverlay.js';
import { FlameBar } from '../ui/FlameBar.js';
import { ElixirCounter } from '../ui/ElixirCounter.js';
import { FlameAltar } from '../systems/FlameAltar.js';
import { MetaProgression } from '../systems/MetaProgression.js';
import { RunModifier } from '../systems/RunModifier.js';
import { CombatSystem } from '../systems/CombatSystem.js';

const BOSS_SEQUENCE = ['revelwood', 'nomad_highlands', 'kindlewastes', 'hollow', 'albaneve', 'shroud_maw'];
const ARENA_WIDTH = 900;
const ARENA_CENTER_X = WORLD.WIDTH / 2;

export class BossRush extends Phaser.Scene {
    constructor() {
        super('BossRush');
    }

    create() {
        GlobalState.reset();
        GlobalState.flame = 100;

        const { width, height } = this.scale;

        // Physics world
        this.physics.world.setBounds(0, 0, WORLD.WIDTH, WORLD.HEIGHT);

        // Background
        this.add.rectangle(width / 2, height / 2, width, height, 0x0A0010);

        // Ground
        this.ground = this.add.tileSprite(
            WORLD.WIDTH / 2, WORLD.GROUND_Y + WORLD.GROUND_HEIGHT / 2,
            WORLD.WIDTH, WORLD.GROUND_HEIGHT, 'ground'
        );
        this.physics.add.existing(this.ground, true);

        // Platforms (empty group — needed by BossManager)
        this.platforms = this.physics.add.staticGroup();

        // Arena walls (permanent for boss rush)
        this._arenaWalls = this._createArenaWalls(ARENA_CENTER_X, ARENA_WIDTH, 0xFF4422);

        // Player
        this.player = new Player(this, ARENA_CENTER_X - 200, PLAYER.START_Y);
        this.physics.add.collider(this.player, this.ground);

        // Input
        this.inputManager = new InputManager(this);

        // Audio
        this.audio = new AudioManager();
        const initAudio = () => {
            this.audio.init();
            this.audio.resume();
            MusicManager.init(this.sound);
            MusicManager.playBoss();
        };
        this.input.once('pointerdown', initAudio);
        this.input.keyboard.once('keydown', initAudio);

        // Systems
        this.particles = new ParticleManager(this);
        this.popups = new PopupText(this);

        // Minimal InteractionSystem stub (BossManager uses scene.events)
        this.interactionSystem = { loreScrollsCollected: 0, shrineDrainBuffTimer: 0, survivorBuffTimer: 0, bardBlessingTimer: 0, blacksmithBuff: false };
        this.relicManager = new RelicManager();
        this.relicOverlay = new RelicOverlay(this, this.relicManager);

        // Empty enemy group (CombatSystem iterates this; no regular enemies in Boss Rush)
        this.enemyGroup = this.physics.add.group();

        // HUD stub (CombatSystem calls hud.popElixir / hud.updateCombo)
        this.hud = { popElixir: () => {}, updateCombo: () => {} };

        // Boss manager
        this.bossManager = new BossManager(this);

        // CombatSystem for class attacks (needed by player events)
        this.combatSystem = new CombatSystem(this);

        // Minimal shroud stub (BossManager may reference speedMultiplier)
        this.shroud = { speedMultiplier: 0, baseSpeedMult: 0, getLeadingX: () => -9999 };

        // Challenge arena stub
        this.challengeArena = { active: false };

        // Shroud mutation stub
        this.shroudMutationManager = { surgeActive: false };

        // Run stats stub
        this.runStats = {
            distanceMeters: 0, loopCount: 0, elixirMined: 0, enemiesBanished: 0,
            wispsCollected: 0, shrinesUsed: 0, dashCount: 0, slamCount: 0, burstCount: 0,
            classAttackCount: 0, wallJumpCount: 0, survivalTime: 0, maxCombo: 0,
            flameLowRecovery: false, _flameLowSeen: false, loreScrollsFound: 0,
            skillsAcquired: 0, hasDied: false, biomesReached: new Set(),
            bossesDefeated: new Set(),
        };

        // DOM HUD (minimal)
        this._hudBar = document.createElement('div');
        this._hudBar.id = 'hud-bar';
        const layer = document.getElementById('hud-layer');
        if (layer) layer.appendChild(this._hudBar);
        this.flameBar = new FlameBar();
        this._hudBar.appendChild(this.flameBar.el);
        this.elixirCounter = new ElixirCounter();
        this._hudBar.appendChild(this.elixirCounter.el);

        // Boss sequence state
        this._bossQueue = [...BOSS_SEQUENCE];
        this._bossIndex = 0;
        this._bossesKilled = 0;
        this._isGameOver = false;

        // Camera follows player, bounded to arena area
        this.cameras.main.setBounds(
            ARENA_CENTER_X - ARENA_WIDTH / 2 - 100, 0,
            ARENA_WIDTH + 200, WORLD.HEIGHT
        );
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cameras.main.setZoom(1.6);
        this.cameras.main.fadeIn(500, 0, 0, 0);

        // Player events
        this.events.on('playerLanded', (x, y) => { this.particles.landingDust(x, y); if (this.audio.initialized) this.audio.playLand(); });
        this.events.on('groundSlam', (x, y, sType) => { this.runStats.slamCount++; this.combatSystem.handleClassSAbility(sType || 'ground_slam', x, y); });
        this.events.on('flameBurst', (x, y) => { this.runStats.burstCount++; this.combatSystem.handleFlameBurst(x, y); });
        this.events.on('classAttack', (x, y) => { this.runStats.classAttackCount++; this.combatSystem.handleClassAttack(x, y); });
        this.events.on('jump', () => { if (this.audio.initialized) this.audio.playJump(); });
        this.events.on('doubleJump', (x, y) => { this.particles.doubleJump(x, y); });

        // Boss events
        this.events.on('bossFightStart', () => {
            MusicManager.playBoss();
        });
        this.events.on('bossFightEnd', () => {
            this._bossesKilled++;
            this.runStats.bossesDefeated.add(this._bossQueue[this._bossIndex]);

            // BossManager already restores full flame; top up to 80 min for next fight
            GlobalState.flame = Math.max(GlobalState.flame, 80);

            // Show relic overlay if possible, then advance to next boss
            if (this.relicManager.canDrop()) {
                this.time.delayedCall(800, () => {
                    this.relicOverlay.show();
                });
            } else {
                this.time.delayedCall(1200, () => this._advanceBoss());
            }
        });
        this.events.on('relicAcquired', () => {
            this.time.delayedCall(800, () => this._advanceBoss());
        });

        // Boss attack events (minimal damage handlers)
        this.events.on('bossVineSweep', (bx, sweepW) => {
            if (Math.abs(this.player.x - bx) < sweepW / 2 && this.player.hitInvincibleTimer <= 0) {
                GlobalState.drainFlame(10);
                if (this.audio.initialized) this.audio.playWraithHit();
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
                targets: proj, x: bx + dir * 500, duration: (500 / speed) * 1000,
                onUpdate: () => {
                    if (Phaser.Math.Distance.Between(proj.x, proj.y, this.player.x, this.player.y) < 20) {
                        if (this.player.hitInvincibleTimer <= 0 && !this.player.isDashing) {
                            GlobalState.drainFlame(10);
                            this.player.hitInvincibleTimer = 500;
                            this._flashPlayer();
                        }
                        if (proj.active) proj.destroy();
                    }
                },
                onComplete: () => { if (proj.active) proj.destroy(); }
            });
        });
        this.events.on('bossVineBomb', (bx, by, px, py, angleOffset) => {
            const baseAngle = Math.atan2(py - by, px - bx);
            const angle = baseAngle + (angleOffset * Math.PI / 180);
            const speed = 250;
            const proj = this.add.circle(bx, by, 5, 0x44AA22, 0.9).setDepth(55);
            this.tweens.add({
                targets: proj, x: bx + Math.cos(angle) * speed * 2, y: by + Math.sin(angle) * speed * 2,
                duration: 2000,
                onUpdate: () => {
                    if (Phaser.Math.Distance.Between(proj.x, proj.y, this.player.x, this.player.y) < 18) {
                        if (this.player.hitInvincibleTimer <= 0) {
                            GlobalState.drainFlame(8);
                            this.player.hitInvincibleTimer = 400;
                            this._flashPlayer();
                        }
                        if (proj.active) proj.destroy();
                    }
                },
                onComplete: () => { if (proj.active) proj.destroy(); }
            });
        });
        this.events.on('bossWarCry', (bx) => {
            this.cameras.main.shake(300, 0.008);
            this.popups.show(bx, WORLD.GROUND_Y - 80, 'WAR CRY!', '#FF8833', '14px');
        });
        this.events.on('bossFlamePillar', (bx, height) => {
            const pillar = this.add.rectangle(bx, WORLD.GROUND_Y - height / 2, 30, height, 0xFF4422, 0.7).setDepth(8);
            if (Math.abs(this.player.x - bx) < 30 && this.player.hitInvincibleTimer <= 0) {
                GlobalState.drainFlame(15);
                this.player.hitInvincibleTimer = 500;
                this._flashPlayer();
            }
            this.time.delayedCall(600, () => { if (pillar.active) pillar.destroy(); });
        });

        // Title overlay
        this._showTitleOverlay();

        // ESC to abort
        this.input.keyboard.on('keydown-ESC', () => {
            if (!this._isGameOver) {
                this._endRun();
            }
        });

        // Shutdown cleanup
        this.events.once('shutdown', () => {
            if (this._hudBar && this._hudBar.parentNode) {
                this._hudBar.parentNode.removeChild(this._hudBar);
            }
        });
    }

    _showTitleOverlay() {
        const { width, height } = this.scale;
        const title = this.add.text(width / 2, height / 2 - 30, 'BOSS RUSH', {
            fontSize: '36px', color: '#FF4444', fontFamily: 'monospace', fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 4
        }).setOrigin(0.5).setScrollFactor(0).setDepth(300);
        const sub = this.add.text(width / 2, height / 2 + 20, 'Face all 6 bosses — pick a relic between each', {
            fontSize: '14px', color: '#AAAAAA', fontFamily: 'monospace'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(300);

        this.time.delayedCall(1800, () => {
            this.tweens.add({
                targets: [title, sub], alpha: 0, duration: 400,
                onComplete: () => {
                    title.destroy();
                    sub.destroy();
                    this._spawnNextBoss();
                }
            });
        });
    }

    _spawnNextBoss() {
        if (this._bossIndex >= this._bossQueue.length) {
            this._victory();
            return;
        }

        // Restore player flame to 80 before each boss
        GlobalState.flame = 80;

        const biomeId = this._bossQueue[this._bossIndex];
        const bossNum = this._bossIndex + 1;
        const total = this._bossQueue.length;

        this.popups.show(this.player.x, this.player.y - 80, `BOSS ${bossNum} / ${total}`, '#FF4444', '18px');

        // Slight delay then spawn
        this.time.delayedCall(1000, () => {
            if (!this._isGameOver) {
                this.bossManager.trySpawnBoss(biomeId);
            }
        });
    }

    _advanceBoss() {
        this._bossIndex++;
        this._spawnNextBoss();
    }

    _victory() {
        if (this._isGameOver) return;
        this._isGameOver = true;

        // Big celebration
        if (this.particles) {
            const { width, height } = this.scale;
            this.add.particles(width / 2, height / 2, 'pixel', {
                speed: { min: 100, max: 300 },
                angle: { min: 0, max: 360 },
                scale: { start: 3, end: 0 },
                alpha: { start: 1, end: 0 },
                lifespan: { min: 800, max: 1500 },
                tint: [0xFFCC00, 0xFF8800, 0xFF4444, 0x44FFCC],
                blendMode: 'ADD',
                quantity: 60,
                emitting: false
            }).setScrollFactor(0).setDepth(300).explode(60);
        }
        this.cameras.main.flash(800, 255, 200, 0);

        // Award 50 elixir
        FlameAltar.addElixir(50);
        this.popups.show(this.player.x, this.player.y - 80, '+50 ELIXIR — ALL BOSSES DEFEATED!', '#FFCC00', '18px');

        // Save to run history
        MetaProgression.saveRunHistory({
            mode: 'boss_rush',
            className: SkillManager.activeClass?.id || 'adventurer',
            distanceMeters: 0,
            enemiesBanished: 0,
            bossesDefeated: [...this.runStats.bossesDefeated],
            win: true,
            elixirMined: 0,
            relics: this.relicManager.active.map(r => r.id),
        });

        // Return to MainMenu after delay
        this.time.delayedCall(3500, () => {
            MusicManager.stopAll();
            this.cameras.main.fadeOut(800, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('MainMenu');
            });
        });
    }

    _endRun() {
        if (this._isGameOver) return;
        this._isGameOver = true;

        // Consolation reward
        const consolation = this._bossesKilled * 8;
        if (consolation > 0) {
            FlameAltar.addElixir(consolation);
            this.popups.show(this.player.x, this.player.y - 60, `+${consolation} ELIXIR (${this._bossesKilled} bosses)`, '#00FFCC', '13px');
        }

        MetaProgression.saveRunHistory({
            mode: 'boss_rush',
            className: SkillManager.activeClass?.id || 'adventurer',
            distanceMeters: 0,
            enemiesBanished: 0,
            bossesDefeated: [...this.runStats.bossesDefeated],
            win: false,
            elixirMined: 0,
            relics: this.relicManager.active.map(r => r.id),
        });

        this.time.delayedCall(2000, () => {
            MusicManager.stopAll();
            this.cameras.main.fadeOut(800, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('MainMenu');
            });
        });
    }

    _flashPlayer() {
        if (!this.player.active) return;
        this.tweens.add({
            targets: this.player,
            alpha: 0,
            duration: 80,
            yoyo: true,
            repeat: 3,
            onComplete: () => { if (this.player.active) this.player.setAlpha(1); }
        });
    }

    _createArenaWalls(centerX, arenaWidth, color) {
        const wallH = WORLD.HEIGHT;
        const wallW = 6;
        const wallY = WORLD.HEIGHT / 2;
        const leftX = centerX - arenaWidth / 2;
        const rightX = centerX + arenaWidth / 2;

        const leftBar = this.add.rectangle(leftX, wallY, wallW, wallH, color, 0.7).setDepth(55);
        const rightBar = this.add.rectangle(rightX, wallY, wallW, wallH, color, 0.7).setDepth(55);

        const leftBody = this.add.rectangle(leftX, wallY, 12, wallH, 0x000000, 0);
        this.physics.add.existing(leftBody, true);
        const rightBody = this.add.rectangle(rightX, wallY, 12, wallH, 0x000000, 0);
        this.physics.add.existing(rightBody, true);

        const colliderL = this.physics.add.collider(this.player, leftBody);
        const colliderR = this.physics.add.collider(this.player, rightBody);

        this.tweens.add({
            targets: [leftBar, rightBar],
            alpha: { from: 0.5, to: 0.9 },
            duration: 800, yoyo: true, repeat: -1
        });

        return { leftBar, rightBar, leftBody, rightBody, colliderL, colliderR };
    }

    update(time, delta) {
        if (this._isGameOver) return;

        // Update input
        this.inputManager.update(delta);

        // Player
        this.player.handleInput(this.inputManager, delta);

        // Apply speed mults (relics only — no altar, no shroud)
        const speedMult = this.relicManager.getMult('moveSpeedMult');
        if (speedMult !== 1 && !this.player.isDashing) {
            this.player.body.velocity.x *= speedMult;
        }

        // Boss
        this.bossManager.update(delta);

        // Flame drain (small constant rate in boss rush)
        const drainRate = 1.5; // slower than normal — focus on boss fights
        GlobalState.drainFlame(drainRate * (delta / 1000));

        // HUD
        this.flameBar.update();
        this.elixirCounter.update();

        // Game over if flame runs out
        if (GlobalState.flame <= 0 && !this._isGameOver) {
            this._endRun();
        }

        // Survival time tracking
        this.runStats.survivalTime += delta / 1000;
    }

    shutdown() {
        RunModifier.clear();
        MusicManager.stopAll();
    }
}
