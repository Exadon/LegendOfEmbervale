import Phaser from 'phaser';
import { WORLD, ENEMIES } from '../constants.js';
import { Enemy } from './Enemy.js';

const AI_STATE = { IDLE: 0, TELEGRAPH: 1, ATTACK: 2, STUNNED: 3 };

export class Boss extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, def, surfaceY) {
        const displayW = 48 * def.scale;
        const displayH = 48 * def.scale;
        // Spawn at the player's surface level so the boss appears on the same ground
        const y = (surfaceY || WORLD.GROUND_Y) - displayH / 2;
        super(scene, x, y, def.spriteKey);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.def = def;
        this.maxHealth = def.health;
        this.health = def.health;
        this.currentPhase = 1;
        this.aiState = AI_STATE.IDLE;
        this.stateTimer = 0;
        this.attackTimer = 0;
        this.stunTimer = 0;
        this.alive = true;

        // Sprint 7: combo sequences
        this.comboQueue = [];
        this.comboIndex = 0;
        this._lastAttackName = null;

        // Sprint 7: vulnerability window (2x damage for 600ms after attack completes)
        this.vulnerabilityWindow = false;
        this._vulnerabilityTimer = 0;

        // Sprint 9: phase text overlay
        this._phaseTextTimer = 0;

        this.setDisplaySize(displayW, displayH);
        this.setDepth(10);

        // Calculate body in source-frame coordinates so that non-uniform
        // scaling (setDisplaySize on non-square sprites) produces correct
        // world-space body dimensions (~40x60 px) at the sprite's feet
        const fw = this.frame.width;
        const fh = this.frame.height;
        const scaleX = displayW / fw;
        const scaleY = displayH / fh;
        const srcBodyW = Math.min(40 / scaleX, fw);
        const srcBodyH = Math.min(60 / scaleY, fh);
        this.body.setSize(srcBodyW, srcBodyH, false);
        this.body.setOffset((fw - srcBodyW) / 2, fh - srcBodyH);

        this.body.setAllowGravity(true);
        this.setCollideWorldBounds(false);

        if (def.tint) this.setTint(def.tint);

        // Play idle animation if defined
        if (def.idleAnim && this.scene.anims.exists(def.idleAnim)) {
            this.play(def.idleAnim);
        }
    }

    hit(multiplier = 1) {
        if (!this.alive) return;

        // Vulnerability window: 2x damage
        const dmg = this.vulnerabilityWindow ? 2 * multiplier : multiplier;
        this.health = Math.max(0, this.health - dmg);

        // Flash white on hit (red tint during vulnerability)
        if (this.vulnerabilityWindow) {
            this.setTintFill(0xFF0000);
        } else {
            this.setTintFill(0xFFFFFF);
        }
        this.scene.time.delayedCall(100, () => {
            if (this.active) this._restoreTint();
        });

        // Phase 3 trigger at 25%
        if (this.currentPhase < 3 && this.health <= this.maxHealth * 0.25) {
            this.currentPhase = 3;
            this.scene.cameras.main.shake(600, 0.015);
            this.scene.cameras.main.flash(300, 180, 0, 0);
            this._showPhaseText('ENRAGED', '#FF0000');
            // Cycle boss tint red/white 3 times
            this._cycleEnrageTint(3);
        }
        // Phase 2 trigger at 50%
        else if (this.currentPhase === 1 && this.health <= this.maxHealth / 2) {
            this.currentPhase = 2;
            this.scene.cameras.main.shake(400, 0.008);
            this.scene.cameras.main.flash(200, 255, 100, 0);
            this._showPhaseText('PHASE 2', '#FF8833');
        }

        if (this.health <= 0) {
            this.alive = false;
            this.scene.events.emit('bossDefeated', this.def);
        }
    }

    _restoreTint() {
        if (!this.active) return;
        if (this.vulnerabilityWindow) {
            // Red tint during vulnerability
            this.setTint(0xFF4444);
        } else if (this.def.tint) {
            this.setTint(this.def.tint);
        } else {
            this.clearTint();
        }
    }

    _showPhaseText(msg, color) {
        const cam = this.scene.cameras.main;
        const cx = cam.scrollX + this.scene.scale.width / 2;
        const cy = cam.scrollY + this.scene.scale.height / 2;
        const txt = this.scene.add.text(cx, cy - 80, msg, {
            fontSize: '32px', color, fontFamily: 'monospace', fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 4
        }).setOrigin(0.5).setDepth(260).setScrollFactor(0);
        this.scene.tweens.add({
            targets: txt,
            alpha: 0,
            y: txt.y - 40,
            duration: 1500,
            ease: 'Power2',
            onComplete: () => { if (txt.active) txt.destroy(); }
        });
    }

    _cycleEnrageTint(times) {
        let count = 0;
        const iv = this.scene.time.addEvent({
            delay: 200,
            repeat: times * 2 - 1,
            callback: () => {
                if (!this.active) { iv.destroy(); return; }
                count++;
                if (count % 2 === 0) {
                    if (this.def.tint) this.setTint(this.def.tint); else this.clearTint();
                } else {
                    this.setTint(0xFF0000);
                }
            }
        });
    }

    stun(duration) {
        this.aiState = AI_STATE.STUNNED;
        this.stunTimer = duration;
        this.setVelocityX(0);
    }

    _startTelegraph(playerX) {
        this.aiState = AI_STATE.TELEGRAPH;
        this.stateTimer = 300;
        this.setVelocityX(0);
        // Flash red + ground marker
        this.setTintFill(0xFF4444);
        const dir = playerX > this.x ? 1 : -1;
        this._telegraphMarker = this.scene.add.rectangle(
            this.x + dir * 60, this.y + 20, 100, 6, 0xFF0000, 0.5
        ).setDepth(54);
        this.scene.tweens.add({
            targets: this._telegraphMarker,
            alpha: { from: 0.2, to: 0.8 },
            duration: 100, yoyo: true, repeat: 1
        });
        // Play attack anim during telegraph
        this._playAttackAnim();
    }

    _endTelegraph() {
        this._restoreTint();
        if (this._telegraphMarker && this._telegraphMarker.active) {
            this._telegraphMarker.destroy();
            this._telegraphMarker = null;
        }
        // Open vulnerability window
        this._openVulnerabilityWindow();
    }

    _openVulnerabilityWindow() {
        this.vulnerabilityWindow = true;
        this._vulnerabilityTimer = 600;
        this._restoreTint(); // shows red tint
    }

    update(delta, playerX, playerY) {
        if (!this.alive) return;

        // Update vulnerability timer
        if (this.vulnerabilityWindow) {
            this._vulnerabilityTimer -= delta;
            if (this._vulnerabilityTimer <= 0) {
                this.vulnerabilityWindow = false;
                this._restoreTint();
            }
        }

        const speedMult = this.currentPhase === 3
            ? (this.def.phase3SpeedMult || 2.0)
            : this.currentPhase === 2 ? this.def.phase2SpeedMult : 1;

        // Stunned
        if (this.aiState === AI_STATE.STUNNED) {
            this.stunTimer -= delta;
            if (this.stunTimer <= 0) {
                this.aiState = AI_STATE.IDLE;
            }
            return;
        }

        // Telegraph (pre-attack warning)
        if (this.aiState === AI_STATE.TELEGRAPH) {
            this.stateTimer -= delta;
            if (this.stateTimer <= 0) {
                this._endTelegraph();
                this.aiState = AI_STATE.IDLE;
                this.attackTimer = -1; // force immediate attack on next check
            }
            return;
        }

        // Animation switching (idle/move based on velocity)
        if (this.def.idleAnim) {
            const isMoving = Math.abs(this.body.velocity.x) > 5;
            const desiredAnim = isMoving ? this.def.moveAnim : this.def.idleAnim;
            const currentKey = this.anims.currentAnim ? this.anims.currentAnim.key : null;
            if (currentKey !== desiredAnim && currentKey !== this.def.attackAnim) {
                this.play(desiredAnim, true);
            }
            this.setFlipX(this.body.velocity.x > 0);
        }

        this.attackTimer += delta;

        // Phase 3: reduce attack interval significantly
        let interval = this.def.attackInterval / speedMult;
        if (this.currentPhase === 3) {
            interval = Math.min(interval, 800); // non-stop combos
        }

        switch (this.def.id) {
            case 'revelwood':
                this._updateVineQueen(delta, playerX, playerY, interval, speedMult);
                break;
            case 'nomad_highlands':
                this._updateChieftain(delta, playerX, playerY, interval, speedMult);
                break;
            case 'kindlewastes':
                this._updatePyrelord(delta, playerX, playerY, interval, speedMult);
                break;
            case 'hollow':
                this._updateHollowCyclops(delta, playerX, playerY, interval, speedMult);
                break;
            case 'albaneve':
                this._updateFrostWyvern(delta, playerX, playerY, interval, speedMult);
                break;
            case 'shroud_maw':
                this._updateCorruptedSentinel(delta, playerX, playerY, interval, speedMult);
                break;
        }
    }

    // ─── Combo helpers ───

    _nextComboAttack() {
        if (!this.def.combos || this.def.combos.length === 0) return null;
        // Phase 1: 2-attack combos; Phase 2+: 3-attack combos
        const comboSet = this.currentPhase >= 2 ? this.def.combos[0] : this.def.combos[1] || this.def.combos[0];
        const attack = comboSet[this.comboIndex % comboSet.length];
        this.comboIndex++;
        return attack;
    }

    // ─── Boss: Vine Queen ───

    _updateVineQueen(delta, playerX, playerY, interval, speedMult) {
        const dx = playerX - this.x;
        const dir = dx > 0 ? 1 : -1;

        // Lunge / retreat during ATTACK state
        if (this.aiState === AI_STATE.ATTACK) {
            this.stateTimer -= delta;
            if (this.stateTimer <= 0) {
                this.aiState = AI_STATE.IDLE;
                this.setVelocityX(0);
                this._openVulnerabilityWindow();
            }
            return;
        }

        if (this.aiState === AI_STATE.IDLE) {
            // Stalk the player: stay 120–250px away
            if (Math.abs(dx) > 250) {
                this.setVelocityX(dir * 65 * speedMult);
            } else if (Math.abs(dx) < 120) {
                this.setVelocityX(-dir * 50 * speedMult);
            } else {
                this.setVelocityX(0);
            }
            this.setFlipX(dir < 0);

            if (this.attackTimer >= interval) {
                this.attackTimer = 0;
                const count = this.currentPhase >= 2 ? 3 : this.def.vineSpawnCount;
                // Prefer sweep when close, otherwise random
                const attack = this._nextComboAttack() ||
                    (Math.abs(dx) < 200 ? 'vineSweep' : Math.random() < 0.5 ? 'vineSpawn' : 'vineBomb');

                if (attack === 'vineSpawn') {
                    // Plant feet while summoning vines
                    this.setVelocityX(0);
                    for (let i = 0; i < count; i++) {
                        const offset = (Math.random() - 0.5) * 200;
                        const def = ENEMIES['fell_vine'] || ENEMIES['fell_critter'];
                        if (def) {
                            const enemy = new Enemy(this.scene, this.x + offset, WORLD.GROUND_Y - def.height / 2, 'fell_vine');
                            this.scene.enemyGroup.add(enemy);
                        }
                    }
                    this._openVulnerabilityWindow();
                } else if (attack === 'vineSweep') {
                    // Lunge forward into the sweep
                    this.aiState = AI_STATE.ATTACK;
                    this.stateTimer = 500;
                    this.setVelocityX(dir * 180 * speedMult);
                    this.scene.events.emit('bossVineSweep', this.x, this.def.vineSweepWidth * speedMult);
                } else {
                    // vineBomb: step back to create arc room, then fire spread
                    this.setVelocityX(-dir * 70 * speedMult);
                    const count2 = this.def.vineBombCount || 3;
                    for (let i = 0; i < count2; i++) {
                        const angleOffset = (i - 1) * 15;
                        this.scene.events.emit('bossVineBomb', this.x, this.y, playerX, playerY, angleOffset);
                    }
                    this.scene.time.delayedCall(450, () => {
                        if (this.active && this.alive) this.setVelocityX(0);
                    });
                    this._openVulnerabilityWindow();
                }
            }
        }
    }

    // ─── Boss: Vukah Chieftain ───

    _updateChieftain(delta, playerX, playerY, interval, speedMult) {
        const dx = playerX - this.x;

        if (this.aiState === AI_STATE.IDLE) {
            const dir = dx > 0 ? 1 : -1;
            this.setVelocityX(dir * 80 * speedMult);
            this.setFlipX(dir < 0);

            if (this.attackTimer >= interval) {
                this.attackTimer = 0;
                const attack = this._nextComboAttack() || (Math.abs(dx) < 150 ? 'groundPound' : Math.random() < 0.5 ? 'charge' : 'warCry');

                if (attack === 'charge' && Math.abs(dx) >= 100) {
                    this._pendingAttack = 'charge';
                    this._startTelegraph(playerX);
                } else if (attack === 'groundPound') {
                    this._pendingAttack = 'ground_pound';
                    this._startTelegraph(playerX);
                } else {
                    // warCry
                    this._doWarCry(playerX, speedMult);
                }
            }

            if (this.attackTimer === -1) {
                this.attackTimer = 0;
                if (this._pendingAttack === 'charge') {
                    this.aiState = AI_STATE.ATTACK;
                    this.stateTimer = 800;
                    const chargeDir = dx > 0 ? 1 : -1;
                    this.setVelocityX(chargeDir * this.def.chargeSpeed * speedMult);
                } else if (this._pendingAttack === 'ground_pound') {
                    this.scene.events.emit('bossGroundPound', this.x, this.def.groundPoundRadius);
                }
                this._pendingAttack = null;
            }
        } else if (this.aiState === AI_STATE.ATTACK) {
            this.stateTimer -= delta;
            if (this.stateTimer <= 0) {
                this.aiState = AI_STATE.IDLE;
                this.setVelocityX(0);
            }
        }
    }

    _doWarCry(playerX, speedMult) {
        const dur = this.def.warCryDuration || 800;
        // Brief invulnerability tint
        this.setTint(0xFFDD00);
        this.scene.time.delayedCall(dur, () => {
            if (this.active) {
                this._restoreTint();
                // Spawn 2 warrior minions
                for (let i = 0; i < 2; i++) {
                    const offset = (i === 0 ? -80 : 80);
                    const def = ENEMIES['vukah_warrior'] || ENEMIES['fell_critter'];
                    if (def) {
                        const enemy = new Enemy(this.scene, this.x + offset, WORLD.GROUND_Y - def.height / 2, 'vukah_warrior');
                        this.scene.enemyGroup.add(enemy);
                    }
                }
                this.scene.events.emit('bossWarCry', this.x);
            }
        });
    }

    // ─── Boss: Hollow Cyclops ───

    _updateHollowCyclops(delta, playerX, playerY, interval, speedMult) {
        const dx = playerX - this.x;

        if (this.aiState === AI_STATE.IDLE) {
            const dir = dx > 0 ? 1 : -1;
            this.setVelocityX(dir * 70 * speedMult);
            this.setFlipX(dir < 0);

            if (this.attackTimer >= interval) {
                this.attackTimer = 0;
                const attack = this._nextComboAttack() || (Math.abs(dx) < 180 ? 'groundPound' : Math.random() < 0.5 ? 'summon' : 'eyeBeam');

                if (attack === 'groundPound') {
                    this._playAttackAnim();
                    this.scene.events.emit('bossGroundPound', this.x, this.def.groundPoundRadius);
                    this._openVulnerabilityWindow();
                } else if (attack === 'summon') {
                    for (let i = 0; i < this.def.summonCount; i++) {
                        const offset = (Math.random() - 0.5) * 200;
                        const def = ENEMIES['hollow_skeleton'] || ENEMIES['fell_critter'];
                        if (def) {
                            const enemy = new Enemy(this.scene, this.x + offset, WORLD.GROUND_Y - def.height / 2, 'hollow_skeleton');
                            this.scene.enemyGroup.add(enemy);
                        }
                    }
                } else {
                    // eyeBeam: sweep across arena floor
                    this.scene.events.emit('bossEyeBeam', this.x, this.def.eyeBeamWidth || 150);
                }
            }
        }
    }

    // ─── Boss: Frost Wyvern ───

    _updateFrostWyvern(delta, playerX, playerY, interval, speedMult) {
        const dx = playerX - this.x;
        const dir = dx > 0 ? 1 : -1;
        this.setFlipX(dir < 0);

        if (this.aiState === AI_STATE.IDLE) {
            if (Math.abs(dx) < 150) {
                this.setVelocityX(-dir * 60 * speedMult);
            } else if (Math.abs(dx) > 350) {
                this.setVelocityX(dir * 80 * speedMult);
            } else {
                this.setVelocityX(0);
            }

            if (this.attackTimer >= interval) {
                this.attackTimer = 0;
                const attack = this._nextComboAttack() || (Math.random() < 0.33 ? 'breath' : Math.random() < 0.5 ? 'diveBomb' : 'iceRain');

                if (attack === 'breath') {
                    this._playAttackAnim();
                    this.scene.events.emit('bossVineSweep', this.x, this.def.breathWidth * speedMult);
                    this._openVulnerabilityWindow();
                } else if (attack === 'diveBomb') {
                    this.aiState = AI_STATE.ATTACK;
                    this.stateTimer = 700;
                    this.setVelocityX(dir * this.def.diveBombSpeed * speedMult);
                } else {
                    // iceRain: 5 projectiles from above
                    const count = this.def.iceRainCount || 5;
                    this.scene.events.emit('bossIceRain', this.x, count);
                    this._openVulnerabilityWindow();
                }
            }
        } else if (this.aiState === AI_STATE.ATTACK) {
            this.stateTimer -= delta;
            if (this.stateTimer <= 0) {
                this.aiState = AI_STATE.IDLE;
                this.setVelocityX(0);
                this._openVulnerabilityWindow();
            }
        }
    }

    // ─── Boss: Scavenger Pyrelord ───

    _updatePyrelord(delta, playerX, playerY, interval, speedMult) {
        const dx = playerX - this.x;
        const dir = dx > 0 ? 1 : -1;
        this.setFlipX(dir < 0);

        if (this.aiState === AI_STATE.IDLE) {
            if (Math.abs(dx) < 120) {
                this.setVelocityX(-dir * 60 * speedMult);
            } else if (Math.abs(dx) > 300) {
                this.setVelocityX(dir * 80 * speedMult);
            } else {
                this.setVelocityX(0);
            }

            if (this.attackTimer >= interval) {
                this.attackTimer = 0;
                const attack = this._nextComboAttack() || (Math.random() < 0.33 ? 'projectile' : Math.random() < 0.5 ? 'dash' : 'flamePillar');

                if (attack === 'projectile') {
                    this.scene.events.emit('bossProjectile', this.x, this.y, dir, this.def.projectileSpeed * speedMult);
                    this._openVulnerabilityWindow();
                } else if (attack === 'dash') {
                    this.aiState = AI_STATE.ATTACK;
                    this.stateTimer = 600;
                    this.setVelocityX(dir * this.def.dashSpeed * speedMult);
                } else {
                    // flamePillar: 3 fire zones at random X in arena
                    const count = this.def.flamePillarCount || 3;
                    this.scene.events.emit('bossFlamePillar', this.x, count);
                    this._openVulnerabilityWindow();
                }
            }
        } else if (this.aiState === AI_STATE.ATTACK) {
            this.stateTimer -= delta;
            if (this.stateTimer <= 0) {
                this.aiState = AI_STATE.IDLE;
                this.setVelocityX(0);
                this._openVulnerabilityWindow();
            }
        }
    }

    // ─── Boss: Corrupted Sentinel (5th boss, Sprint 11) ───

    _updateCorruptedSentinel(delta, playerX, playerY, interval, speedMult) {
        if (this.aiState === AI_STATE.IDLE) {
            // Stays near center, slow movement
            const dx = playerX - this.x;
            const dir = dx > 0 ? 1 : -1;
            if (Math.abs(dx) > 200) {
                this.setVelocityX(dir * 40 * speedMult);
            } else {
                this.setVelocityX(0);
            }
            this.setFlipX(dir < 0);

            if (this.attackTimer >= interval) {
                this.attackTimer = 0;
                const attack = this._nextComboAttack() || (Math.random() < 0.33 ? 'shroudPulse' : Math.random() < 0.5 ? 'corruptionTether' : 'cloneStrike');

                if (attack === 'shroudPulse') {
                    this.scene.events.emit('bossShroudPulse', this.x, this.y, this.def.shroudPulseRadius || 200);
                } else if (attack === 'corruptionTether') {
                    this.scene.events.emit('bossCorruptionTether', this.x, this.y, 2000);
                } else {
                    this.scene.events.emit('bossCloneStrike', this.x, this.y);
                }
                this._openVulnerabilityWindow();
            }
        }
    }

    _playAttackAnim() {
        if (this.def.attackAnim && this.scene.anims.exists(this.def.attackAnim)) {
            this.play(this.def.attackAnim);
            this.once('animationcomplete', () => {
                if (this.active && this.alive && this.def.idleAnim) {
                    this.play(this.def.idleAnim, true);
                }
            });
        }
    }
}
