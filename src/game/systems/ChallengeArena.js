import { CHALLENGE_SHRINE, ENEMIES, WORLD, BOSS } from '../constants.js';
import { Enemy } from '../entities/Enemy.js';
import { GlobalState } from '../GlobalState.js';

export class ChallengeArena {
    constructor(scene) {
        this.scene = scene;
        this.active = false;
        this.timer = 0;
        this.kills = 0;
        this.challenge = null;
        this.spawnTimer = 0;
        this._elements = [];

        // Gauntlet wave tracking
        this.waveNumber = 0;
        this.activeEnemiesThisWave = 0;
        this._gauntletWaveAnnouncing = false;

        // Cursed modifier
        this.cursedModifier = null;
        this._cursedDrainTimer = 0;

        // Last second for which a countdown tick was played
        this._lastTickSecond = -1;

        // Segment index for difficulty scaling
        this.segmentIndex = 0;

        // Flame keeper tracking
        this._flameKeeperFailed = false;

        // Boss skirmish
        this._bossSkirmishEnemy = null;
    }

    start(challenge, x, segmentIndex = 0) {
        if (this.active) return;
        this.active = true;
        this.challenge = challenge;
        this.timer = challenge.timer || CHALLENGE_SHRINE.ARENA_DURATION;
        this.kills = 0;
        this.spawnTimer = 0;
        this.arenaX = x;
        this.segmentIndex = segmentIndex;
        this.waveNumber = 0;
        this.activeEnemiesThisWave = 0;
        this._gauntletWaveAnnouncing = false;
        this._flameKeeperFailed = false;
        this._bossSkirmishEnemy = null;
        this._cursedDrainTimer = 0;
        this._lastTickSecond = -1;

        // Determine if cursed variant
        this.cursedModifier = null;
        if (Math.random() < CHALLENGE_SHRINE.CURSED_CHANCE) {
            const mods = CHALLENGE_SHRINE.CURSED_MODIFIERS;
            this.cursedModifier = mods[Math.floor(Math.random() * mods.length)];
            // Apply cursed effects
            if (this.cursedModifier.id === 'half_flame_cursed') {
                GlobalState.flame = Math.floor(GlobalState.flame * 0.5);
            }
            if (this.cursedModifier.id === 'no_dash_cursed') {
                this.scene.player._cursedNoDash = true;
            }
        }

        // Pause shroud
        this.scene.events.emit('challengeArenaStart');

        // Start fanfare + camera flash
        if (this.scene.audio) this.scene.audio.playChallengeStart();
        this.scene.cameras.main.flash(180, 255, 180, 80);

        // UI: timer + objective
        const { width } = this.scene.scale;
        const zoom = this.scene.cameras.main.zoom;
        const s = 1 / zoom;
        const cx = width / 2;
        const cy = this.scene.scale.height / 2;
        const _ui = (sx, sy) => ({ x: (sx - cx) / zoom + cx, y: (sy - cy) / zoom + cy });

        const tp = _ui(width / 2, 80);
        this.timerText = this.scene.add.text(tp.x, tp.y, '', {
            fontSize: '18px', color: '#FF4488', fontFamily: 'monospace', fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 3
        }).setOrigin(0.5).setScrollFactor(0).setDepth(240).setScale(s);
        this._elements.push(this.timerText);

        const op = _ui(width / 2, 100);
        const desc = this.cursedModifier
            ? `[CURSED: ${this.cursedModifier.name}] ${challenge.desc}`
            : challenge.desc;
        this.objectiveText = this.scene.add.text(op.x, op.y, desc, {
            fontSize: '12px', color: this.cursedModifier ? '#FF4488' : '#FFFFFF', fontFamily: 'monospace',
            stroke: '#000000', strokeThickness: 2
        }).setOrigin(0.5).setScrollFactor(0).setDepth(240).setScale(s);
        this._elements.push(this.objectiveText);

        // Gauntlet: spawn first wave immediately
        if (challenge.id === 'gauntlet') {
            this._spawnGauntletWave();
        }

        // Elite hunt: spawn the elite
        if (challenge.id === 'elite_hunt') {
            this._spawnElite();
        }

        // Boss skirmish: spawn a weakened boss enemy
        if (challenge.id === 'boss_skirmish') {
            this._spawnBossSkirmish();
        }

        // No escape: accelerate the shroud
        if (challenge.id === 'no_escape' && this.scene.shroud) {
            this.scene.shroud.speedMultiplier = 2.5;
        }
    }

    update(delta) {
        if (!this.active) return;

        this.timer -= delta;
        const secs = Math.max(0, Math.ceil(this.timer / 1000));
        this.timerText.setText(`${secs}s`);

        // Countdown ticks for last 5 seconds
        if (secs <= 5 && secs > 0 && secs !== this._lastTickSecond) {
            this._lastTickSecond = secs;
            if (this.scene.audio) this.scene.audio.playChallengeTimerTick();
            this.timerText.setColor(secs <= 3 ? '#FF2222' : '#FF8800');
        }

        // Cursed drain
        if (this.cursedModifier && this.cursedModifier.id === 'flame_drain_cursed') {
            this._cursedDrainTimer += delta;
            if (this._cursedDrainTimer >= 1000) {
                this._cursedDrainTimer -= 1000;
                GlobalState.drainFlame(10);
            }
        }

        if (this.challenge.id === 'kill') {
            this.objectiveText.setText(`Banish ${this.challenge.target - this.kills} more enemies`);
        } else if (this.challenge.id === 'gauntlet' && !this._gauntletWaveAnnouncing) {
            this.objectiveText.setText(`Wave ${this.waveNumber + 1}/3 — ${this.kills} kills`);
        } else if (this.challenge.id === 'speed_kill') {
            this.objectiveText.setText(`Kill ${this.challenge.target - this.kills} more quickly!`);
        } else if (this.challenge.id === 'flame_keeper') {
            const pct = Math.round((GlobalState.flame / GlobalState.maxFlame) * 100);
            this.objectiveText.setText(`Keep flame above 30 — current: ${Math.round(GlobalState.flame)}`);
            if (GlobalState.flame < 30) {
                this._flameKeeperFailed = true;
            }
        }

        // Spawn enemies periodically (not for gauntlet, elite_hunt, boss_skirmish)
        if (!['gauntlet', 'elite_hunt', 'boss_skirmish'].includes(this.challenge.id)) {
            this.spawnTimer += delta;
            const spawnInterval = this.challenge.id === 'speed_kill' ? 800 : 2000;
            if (this.spawnTimer >= spawnInterval) {
                this.spawnTimer -= spawnInterval;
                this._spawnArenaEnemy();
            }
        }

        // Check completion
        this._checkCompletion();
    }

    _checkCompletion() {
        const id = this.challenge.id;

        if (id === 'kill' && this.kills >= this.challenge.target) {
            this._resolve(true); return;
        }
        if (id === 'speed_kill' && this.kills >= this.challenge.target) {
            this._resolve(true); return;
        }
        if (id === 'elite_hunt' && this.kills >= 1) {
            this._resolve(true); return;
        }
        if (id === 'boss_skirmish' && this.kills >= 1) {
            this._resolve(true); return;
        }
        if (id === 'flame_keeper' && this._flameKeeperFailed) {
            this._resolve(false); return;
        }

        if (this.timer <= 0) {
            if (id === 'survive' || id === 'no_escape') {
                this._resolve(true);
            } else if (id === 'flame_keeper') {
                this._resolve(!this._flameKeeperFailed);
            } else {
                this._resolve(false);
            }
        }
    }

    onEnemyKilled() {
        if (!this.active) return;
        this.kills++;

        // Gauntlet wave progression
        if (this.challenge.id === 'gauntlet') {
            this.activeEnemiesThisWave--;
            if (this.activeEnemiesThisWave <= 0) {
                this.waveNumber++;
                if (this.waveNumber >= 3) {
                    this._resolve(true);
                } else {
                    // Wave cleared — suppress normal text update and announce
                    this._gauntletWaveAnnouncing = true;
                    if (this.scene.audio) this.scene.audio.playGauntletWaveCleared();
                    if (this.objectiveText && this.objectiveText.active) {
                        const prevColor = this.cursedModifier ? '#FF4488' : '#FFFFFF';
                        this.objectiveText.setText(`WAVE ${this.waveNumber} CLEARED!`).setColor('#00FFCC');
                        this.scene.time.delayedCall(700, () => {
                            if (this.objectiveText && this.objectiveText.active) {
                                this.objectiveText.setText(`WAVE ${this.waveNumber + 1} INCOMING...`).setColor('#FFAA00');
                            }
                        });
                        this.scene.time.delayedCall(1400, () => {
                            if (this.objectiveText && this.objectiveText.active) {
                                this.objectiveText.setColor(prevColor);
                            }
                        });
                    }
                    // Short delay then next wave
                    this.scene.time.delayedCall(1500, () => {
                        this._gauntletWaveAnnouncing = false;
                        if (this.active) this._spawnGauntletWave();
                    });
                }
            }
        }
    }

    _spawnGauntletWave() {
        const biome = this.scene.biomeManager.getCurrentBiome();
        if (!biome || biome.enemies.length === 0) return;
        const waveSize = 3 + this.waveNumber * 2; // 3, 5, 7
        this.activeEnemiesThisWave = waveSize;

        for (let i = 0; i < waveSize; i++) {
            let typeId = biome.enemies[Math.floor(Math.random() * biome.enemies.length)];
            // Wave 2+: prefer harder enemies
            if (this.waveNumber >= 2 && biome.enemies.length > 1) {
                typeId = biome.enemies[biome.enemies.length - 1]; // last = hardest
            }
            this._spawnArenaEnemy(typeId);
        }
    }

    _spawnElite() {
        // Spawn a skullflame elite
        const def = ENEMIES['skullflame'];
        if (!def) return;
        const ex = this.arenaX + (Math.random() - 0.5) * 200;
        const ey = WORLD.GROUND_Y - def.height / 2 - 20;
        const enemy = new Enemy(this.scene, ex, ey, 'skullflame');
        this._scaleEnemyForBiome(enemy);
        this.scene.enemyGroup.add(enemy);
    }

    _spawnBossSkirmish() {
        // Spawn an actual Boss.js instance using the current biome's boss def
        const biome = this.scene.biomeManager?.getCurrentBiome();
        const bm = this.scene.bossManager;
        const biomeId = biome?.id;
        const bossDef = biomeId && BOSS && BOSS[biomeId] ? BOSS[biomeId] : null;

        if (bm && bossDef) {
            // Mark as skirmish so _onBossDefeated skips adding to defeated set
            bm._skirmishMode = true;
            const spawnX = this.arenaX + 120;
            const surfaceY = this.scene.player?.body?.bottom || WORLD.GROUND_Y;
            bm._doSpawn(spawnX, bossDef, surfaceY);

            // When boss dies, count as a challenge kill
            this.scene.events.once('bossFightEnd', () => {
                if (this.active) this.onEnemyKilled();
            });
        } else {
            // Fallback: spawn a buffed regular enemy if no boss def found
            if (!biome || biome.enemies.length === 0) return;
            const typeId = biome.enemies[biome.enemies.length - 1];
            const def = ENEMIES[typeId];
            if (!def) return;
            const ex = this.arenaX + 100;
            const ey = WORLD.GROUND_Y - def.height / 2 - 20;
            const enemy = new Enemy(this.scene, ex, ey, typeId);
            if (enemy.hitsToKill !== undefined) {
                enemy.hitsToKill = Math.max(3, enemy.hitsToKill + 2);
            }
            this.scene.enemyGroup.add(enemy);
            this._bossSkirmishEnemy = enemy;
        }
    }

    _scaleEnemyForBiome(enemy) {
        const biome = this.scene.biomeManager.getCurrentBiome();
        if (!biome) return;
        const hpMult = { springlands: 1, revelwood: 1.2, nomad_highlands: 1.2, kindlewastes: 1.6, hollow: 1.6, albaneve: 2.0, shroud_maw: 2.0 };
        const mult = hpMult[biome.id] || 1;
        if (enemy.hitsToKill) {
            enemy.hitsToKill = Math.ceil(enemy.hitsToKill * mult);
        }
    }

    _spawnArenaEnemy(typeId) {
        const biome = this.scene.biomeManager.getCurrentBiome();
        if (!typeId) {
            if (!biome || biome.enemies.length === 0) return;
            typeId = biome.enemies[Math.floor(Math.random() * biome.enemies.length)];
        }
        const def = ENEMIES[typeId];
        if (!def) return;

        const offset = (Math.random() - 0.5) * 300;
        const ex = this.arenaX + offset;
        const ey = WORLD.GROUND_Y - def.height / 2 - 20;
        const enemy = new Enemy(this.scene, ex, ey, typeId);
        this._scaleEnemyForBiome(enemy);
        this.scene.enemyGroup.add(enemy);
    }

    _resolve(success) {
        this.active = false;

        // Clean up cursed effects
        if (this.cursedModifier && this.cursedModifier.id === 'no_dash_cursed') {
            if (this.scene.player) this.scene.player._cursedNoDash = false;
        }

        // Reset shroud speed if no_escape challenge
        if (this.challenge?.id === 'no_escape' && this.scene.shroud) {
            this.scene.shroud.speedMultiplier = 1;
        }

        // Cleanup UI
        for (const el of this._elements) {
            if (el && el.active) {
                this.scene.tweens.killTweensOf(el);
                el.destroy();
            }
        }
        this._elements = [];

        // Success flash + audio / failure audio + shake
        if (success) {
            this.scene.cameras.main.flash(250, 100, 255, 100);
            if (this.scene.audio) this.scene.audio.playChallengeSuccess();
        } else if (this.scene.audio) {
            this.scene.audio.playChallengeFailure();
            this.scene.cameras.main.shake(300, 0.008);
        }

        // Build reward data for the event
        const tier = CHALLENGE_SHRINE.REWARD_TIERS[this.challenge.difficulty] || CHALLENGE_SHRINE.REWARD_TIERS.easy;
        const isCursed = !!this.cursedModifier;
        const elixirBonus = isCursed && success ? Math.round(tier.elixir * (this.cursedModifier.bonusElixir || 0.5)) : 0;

        this.scene.events.emit('challengeArenaEnd', success, {
            tier,
            elixirBonus,
            isCursed,
            challengeId: this.challenge.id,
        });
    }
}
