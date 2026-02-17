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
    }

    trySpawnBoss(biomeId) {
        if (this.active) return;
        if (this.defeated.has(biomeId)) return;
        if (!BOSS[biomeId]) return;

        const def = BOSS[biomeId];
        const playerX = this.scene.player.x;

        this.active = true;
        this.boss = new Boss(this.scene, playerX + 300, def);
        this.scene.physics.add.collider(this.boss, this.scene.ground);

        // Pause shroud
        this.scene.events.emit('bossFightStart');

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

        this.boss.update(delta, this.scene.player.x, this.scene.player.y);

        // Update health bar
        if (this.healthBar && this.healthBarBg) {
            const pct = Math.max(0, this.boss.health / this.boss.maxHealth);
            this.healthBar.width = this.healthBarBg.width * pct;
        }

        // Player damages boss: during dash, invincible, ground slam stun, flame burst
        const player = this.scene.player;
        const dist = Phaser.Math.Distance.Between(player.x, player.y, this.boss.x, this.boss.y);

        if (dist < 60) {
            if (player.isDashing || player.isInvincible) {
                this.boss.hit();
                this.scene.cameras.main.shake(100, 0.005);
                this.scene.audio.playWraithBanish();
                player.dashCooldownTimer = 0; // reset dash on boss hit
            } else if (player.hitInvincibleTimer <= 0 && this.boss.aiState !== 3) {
                // Boss damages player
                const dmg = 15;
                GlobalState.drainFlame(dmg);
                this.scene.audio.playWraithHit();
                this.scene.cameras.main.shake(200, 0.008);
                player.hitInvincibleTimer = 500;
                this.scene._flashPlayer();
            }
        }
    }

    _onBossDefeated(def) {
        this.defeated.add(def.id);
        this.active = false;

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
                    if (this.boss.active) this.boss.destroy();
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

        // Resume shroud
        this.scene.events.emit('bossFightEnd');

        // Popups + audio
        this.scene.popups.show(this.scene.player.x, this.scene.player.y - 60,
            `${def.name} DEFEATED!`, '#FFCC00', '18px');
        this.scene.popups.show(this.scene.player.x, this.scene.player.y - 40,
            '+FULL FLAME +1 ELIXIR', '#00FFCC', '12px');

        if (this.scene.audio.initialized) {
            this.scene.audio.playBossDefeated();
        }

        this.scene.cameras.main.flash(500, 255, 200, 0);

        // Trigger relic drop
        this.scene.events.emit('bossRelicDrop');
    }
}
