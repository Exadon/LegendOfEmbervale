import Phaser from 'phaser';
import { BOSS, WORLD } from '../constants.js';
import { Boss } from '../entities/Boss.js';
import { GlobalState } from '../GlobalState.js';

export class BossManager {
    constructor(scene) {
        this.scene = scene;
        this.boss = null;
        this.healthBar = null;
        this.healthBarBg = null;
        this.nameText = null;
        this.active = false;
        this.defeated = new Set();
        this._elements = [];
        this._bossPhase = 1;
        this._dashHitCooldown = 0;
    }

    trySpawnBoss(biomeId) {
        if (this.active) return;
        if (this.defeated.has(biomeId)) return;
        if (!BOSS[biomeId]) return;

        const def = BOSS[biomeId];
        const playerX = this.scene.player.x;
        const surfaceY = this.scene.player.body.bottom;

        // Sprint 9: Camera drama — letterbox + pan to spawn position
        this._doCameraIntro(playerX + 300, def, surfaceY);
    }

    _doCameraIntro(spawnX, def, surfaceY) {
        const cam = this.scene.cameras.main;
        const { width, height } = this.scene.scale;

        // Letterbox bars
        const barH = 60;
        const topBar = this.scene.add.rectangle(width / 2, 0, width, barH, 0x000000)
            .setScrollFactor(0).setDepth(300).setOrigin(0.5, 0).setAlpha(0);
        const botBar = this.scene.add.rectangle(width / 2, height, width, barH, 0x000000)
            .setScrollFactor(0).setDepth(300).setOrigin(0.5, 1).setAlpha(0);

        this.scene.tweens.add({
            targets: [topBar, botBar],
            alpha: 1,
            duration: 300,
            onComplete: () => {
                // Pan camera to boss position
                cam.pan(spawnX, WORLD.GROUND_Y - 100, 400, 'Linear', false, (cam2, progress) => {
                    if (progress >= 1) {
                        // Show boss name card during hold, then cut back
                        this._showBossNameCard(def);
                        this.scene.time.delayedCall(2000, () => {
                            cam.pan(this.scene.player.x, this.scene.player.y, 300, 'Linear');
                            this.scene.tweens.add({
                                targets: [topBar, botBar],
                                alpha: 0,
                                duration: 200,
                                delay: 300,
                                onComplete: () => {
                                    topBar.destroy();
                                    botBar.destroy();
                                    // Now actually spawn the boss
                                    this._doSpawn(spawnX, def, surfaceY);
                                }
                            });
                        });
                    }
                });
            }
        });
    }

    _showBossNameCard(def) {
        const { width, height } = this.scene.scale;
        const cx = width / 2;
        const overlay = this.scene.add.rectangle(cx, height / 2, width, height, 0x000000, 0)
            .setScrollFactor(0).setDepth(490);
        const sub = this.scene.add.text(cx, height * 0.38, 'BOSS ENCOUNTER', {
            fontSize: '12px', color: '#888888', fontFamily: 'monospace', letterSpacing: 4
        }).setOrigin(0.5).setScrollFactor(0).setDepth(491).setAlpha(0);
        const name = this.scene.add.text(cx, height * 0.45, def.name.toUpperCase(), {
            fontSize: '26px', color: '#FFD700', fontFamily: 'monospace', fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 4
        }).setOrigin(0.5).setScrollFactor(0).setDepth(491).setAlpha(0);
        const hp = this.scene.add.text(cx, height * 0.53, `\u2665 ${def.health}`, {
            fontSize: '14px', color: '#FF4444', fontFamily: 'monospace'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(491).setAlpha(0);

        // Fade in overlay + text, hold, then fade out
        this.scene.tweens.add({
            targets: overlay, alpha: 0.55, duration: 300,
            onComplete: () => {
                this.scene.tweens.add({ targets: [sub, name, hp], alpha: 1, duration: 300,
                    onComplete: () => {
                        this.scene.time.delayedCall(1400, () => {
                            this.scene.tweens.add({
                                targets: [overlay, sub, name, hp], alpha: 0, duration: 300,
                                onComplete: () => [overlay, sub, name, hp].forEach(c => c.destroy())
                            });
                        });
                    }
                });
            }
        });
    }

    _doSpawn(spawnX, def, surfaceY) {
        // Clean up any lingering UI from a previous boss (prevents stacking in BossRush mode)
        for (const el of this._elements) { if (el && el.active) el.destroy(); }
        this._elements = [];
        this.active = true;
        this.boss = new Boss(this.scene, spawnX, def, surfaceY);
        this.scene.physics.add.collider(this.boss, this.scene.ground);
        this.scene.physics.add.collider(this.boss, this.scene.platforms);

        // S3b: Arena glow floor
        const glowColor = def.tint || 0xFF4444;
        this._arenaGlow = this.scene.add.rectangle(
            spawnX, WORLD.GROUND_Y - 10,
            WORLD.SEGMENT_WIDTH * 4, 28,
            glowColor, 0.06
        ).setDepth(-1);
        this.scene.tweens.add({
            targets: this._arenaGlow,
            alpha: { from: 0.03, to: 0.10 },
            duration: 2000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
        });

        // Pause shroud + create arena walls
        this.scene.events.emit('bossFightStart');

        // Wire boss into the arena walls so it can't escape (walls are created synchronously above)
        const walls = this.scene._arenaWalls;
        if (walls) {
            walls.colliderBossL = this.scene.physics.add.collider(this.boss, walls.leftBody);
            walls.colliderBossR = this.scene.physics.add.collider(this.boss, walls.rightBody);
        }

        // Health bar UI
        const { width } = this.scene.scale;
        const zoom = this.scene.cameras.main.zoom;
        const s = 1 / zoom;
        const cx = width / 2;
        const cy = this.scene.scale.height / 2;
        const _ui = (sx, sy) => ({ x: (sx - cx) / zoom + cx, y: (sy - cy) / zoom + cy });

        const barW = 200 * s;
        const barH = 10 * s;
        const bp = _ui(width / 2, 40);

        this.healthBarBg = this.scene.add.rectangle(bp.x, bp.y, barW, barH, 0x333333)
            .setScrollFactor(0).setDepth(250);
        this._elements.push(this.healthBarBg);

        this.healthBar = this.scene.add.rectangle(bp.x - barW / 2, bp.y, barW, barH, 0xFF0000)
            .setScrollFactor(0).setDepth(251).setOrigin(0, 0.5);
        this._elements.push(this.healthBar);

        const np = _ui(width / 2, 24);
        this.nameText = this.scene.add.text(np.x, np.y, def.name, {
            fontSize: '14px', color: '#FF4444', fontFamily: 'monospace', fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 2
        }).setOrigin(0.5).setScrollFactor(0).setDepth(251).setScale(s);
        this._elements.push(this.nameText);

        // Reset phase tracker for this fight
        this._bossPhase = 1;

        // Boss warning audio
        if (this.scene.audio.initialized) {
            this.scene.audio.playBossWarning();
        }

        this.scene.cameras.main.shake(500, 0.006);

        // Listen for defeat
        this.scene.events.once('bossDefeated', (bDef) => {
            this._onBossDefeated(bDef);
        });
    }

    update(delta) {
        if (!this.active || !this.boss || !this.boss.alive) return;

        if (this._dashHitCooldown > 0) this._dashHitCooldown -= delta;

        this.boss.update(delta, this.scene.player.x, this.scene.player.y);

        // Update health bar
        if (this.healthBar && this.healthBarBg) {
            const pct = Math.max(0, this.boss.health / this.boss.maxHealth);
            this.healthBar.width = this.healthBarBg.width * pct;
            // Color shift + phase transition detection
            if (pct > 0.5) {
                this.healthBar.setFillStyle(0xFF6600);
            } else if (pct > 0.25) {
                this.healthBar.setFillStyle(0xFF3300);
                if (this._bossPhase === 1) {
                    this._bossPhase = 2;
                    this._onPhaseTransition(2);
                }
            } else {
                this.healthBar.setFillStyle(0xFF0000);
                if (this._bossPhase < 3) {
                    this._bossPhase = 3;
                    this._onPhaseTransition(3);
                }
            }
        }

        // Player damages boss: during dash, invincible, ground slam stun, flame burst
        const player = this.scene.player;
        const dist = Phaser.Math.Distance.Between(player.x, player.y, this.boss.x, this.boss.y);

        if (dist < 60) {
            if ((player.isDashing || player.isInvincible) && this._dashHitCooldown <= 0) {
                this.boss.hit();
                this._dashHitCooldown = 600; // one hit per 600 ms — prevents every-frame damage
                // Sprint 9: boss hit particles
                if (this.scene.particles && this.scene.particles.bossHit) {
                    this.scene.particles.bossHit(this.boss.x, this.boss.y);
                }
                this.scene.cameras.main.shake(100, 0.005);
                this.scene.audio.playWraithBanish();
                if (player.isDashing) player.dashCooldownTimer = 0; // dash-through refreshes dash
            } else if (player.hitInvincibleTimer <= 0 && this.boss.aiState !== 3) {
                // Boss damages player
                const dmg = 15;
                GlobalState.drainFlame(dmg);
                this.scene.audio.playWraithHit();
                this.scene.cameras.main.shake(200, 0.008);
                player.hitInvincibleTimer = 500;
                this.scene._flashPlayer();
                const knockDir = player.x > this.boss.x ? 1 : -1;
                player.setVelocity(knockDir * 200, -150);
            }
        }
    }

    _onPhaseTransition(phase) {
        if (this.scene.audio && this.scene.audio.initialized) {
            this.scene.audio.playBossPhaseTransition();
        }

        // S3c: Phase ring burst + audio stinger
        if (this.scene.particles && this.boss) {
            this.scene.particles.bossPhaseTransition(this.boss.x, this.boss.y);
            if (phase === 3) {
                // extra burst for enraged
                this.scene.time.delayedCall(150, () => {
                    if (this.boss && this.boss.active) {
                        this.scene.particles.bossPhaseTransition(this.boss.x, this.boss.y);
                    }
                });
            }
        }
        if (phase === 3 && this.scene.audio && this.scene.audio.initialized) {
            this.scene.audio.playPhaseStinger();
        }
        this.scene.cameras.main.shake(250, 0.007);
        // Color flash: orange for phase 2, red for enraged
        if (phase === 3) {
            this.scene.cameras.main.flash(400, 255, 20, 20, true);
        } else {
            this.scene.cameras.main.flash(300, 255, 110, 0, true);
        }

        const isEnraged = phase === 3;
        const label = isEnraged ? '\u26A0 ENRAGED!' : 'PHASE 2';
        const color = isEnraged ? '#FF2222' : '#FF8800';

        const { width } = this.scene.scale;
        const zoom = this.scene.cameras.main.zoom;
        const s = 1 / zoom;
        const cx = width / 2;
        const cy = this.scene.scale.height / 2;
        const _ui = (sx, sy) => ({ x: (sx - cx) / zoom + cx, y: (sy - cy) / zoom + cy });
        const tp = _ui(width / 2, 60);
        const phaseText = this.scene.add.text(tp.x, tp.y, label, {
            fontSize: '22px', color, fontFamily: 'monospace', fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 3
        }).setOrigin(0.5).setScrollFactor(0).setDepth(252).setScale(s).setAlpha(0);
        this._elements.push(phaseText);

        this.scene.tweens.add({
            targets: phaseText,
            alpha: 1,
            duration: 200,
            yoyo: true,
            hold: 1000,
            onComplete: () => {
                this.scene.tweens.add({ targets: phaseText, alpha: 0, duration: 300,
                    onComplete: () => { if (phaseText.active) phaseText.destroy(); }
                });
            }
        });

        // Tint boss name red on enrage
        if (isEnraged && this.nameText && this.nameText.active) {
            this.nameText.setColor('#FF2222');
        }
    }

    _onBossDefeated(def) {
        // Skirmish mode: don't lock out the real biome boss
        if (!this._skirmishMode) {
            this.defeated.add(def.id);
        }
        this._skirmishMode = false;
        this.active = false;

        const bossX = this.boss ? this.boss.x : this.scene.player.x;
        const bossY = this.boss ? this.boss.y : this.scene.player.y;

        // Sprint 9: Boss kill slow-mo + gray desaturate overlay
        this.scene.time.timeScale = 0.15;
        const { width, height } = this.scene.scale;
        const grayOverlay = this.scene.add.rectangle(width / 2, height / 2, width, height, 0x888888, 0.55)
            .setScrollFactor(0).setDepth(250);
        window.setTimeout(() => { // real-time 1200ms (scene.time is slowed by timeScale)
            this.scene.time.timeScale = 1;
            if (grayOverlay && grayOverlay.active) {
                this.scene.tweens.add({
                    targets: grayOverlay,
                    alpha: 0,
                    duration: 300,
                    onComplete: () => grayOverlay.destroy()
                });
            }
        }, 1200);

        // Sprint 9: explosion particle burst
        if (this.scene.particles && this.scene.particles.bossKillBurst) {
            this.scene.particles.bossKillBurst(bossX, bossY);
        }

        // Rewards
        GlobalState.flame = 100; // full flame
        GlobalState.addElixir(1);

        // Cleanup boss sprite
        if (this.boss && this.boss.active) {
            this.scene.tweens.add({
                targets: this.boss,
                alpha: 0,
                scaleX: 2,
                scaleY: 2,
                duration: 600,
                onComplete: () => {
                    if (this.boss && this.boss.active) this.boss.destroy();
                    this.boss = null;
                }
            });
        }

        // Cleanup UI
        this.scene.time.delayedCall(800, () => {
            for (const el of this._elements) {
                if (el && el.active) {
                    this.scene.tweens.killTweensOf(el);
                    el.destroy();
                }
            }
            this._elements = [];
        });

        // S3b: Fade out arena glow
        if (this._arenaGlow) {
            this.scene.tweens.add({
                targets: this._arenaGlow, alpha: 0, duration: 800,
                onComplete: () => { this._arenaGlow?.destroy(); this._arenaGlow = null; }
            });
        }

        // Resume shroud
        this.scene.events.emit('bossFightEnd');

        // Popups + audio
        this.scene.popups.show(bossX, bossY - 60, `${def.name} DEFEATED!`, '#FFCC00', '18px');
        this.scene.popups.show(bossX, bossY - 40, '+FULL FLAME +1 ELIXIR', '#00FFCC', '12px');

        if (this.scene.audio.initialized) {
            this.scene.audio.playBossDefeated();
        }

        this.scene.cameras.main.flash(500, 255, 200, 0);

        // Trigger relic drop
        this.scene.events.emit('bossRelicDrop');

        // Achievement tracking
        if (this.scene.runStats) {
            if (!this.scene.runStats.bossesDefeated) this.scene.runStats.bossesDefeated = new Set();
            this.scene.runStats.bossesDefeated.add(def.id);
            this.scene.runStats.bossKilled = true;
        }
    }
}
