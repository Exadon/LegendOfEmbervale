import { CHALLENGE_SHRINE, ENEMIES, WORLD } from '../constants.js';
import { Enemy } from '../entities/Enemy.js';

export class ChallengeArena {
    constructor(scene) {
        this.scene = scene;
        this.active = false;
        this.timer = 0;
        this.kills = 0;
        this.challenge = null;
        this.spawnTimer = 0;
        this._elements = [];
    }

    start(challenge, x) {
        if (this.active) return;
        this.active = true;
        this.challenge = challenge;
        this.timer = CHALLENGE_SHRINE.ARENA_DURATION;
        this.kills = 0;
        this.spawnTimer = 0;
        this.arenaX = x;

        // Pause shroud
        this.scene.events.emit('challengeArenaStart');

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
        this.objectiveText = this.scene.add.text(op.x, op.y, challenge.desc, {
            fontSize: '12px', color: '#FFFFFF', fontFamily: 'monospace',
            stroke: '#000000', strokeThickness: 2
        }).setOrigin(0.5).setScrollFactor(0).setDepth(240).setScale(s);
        this._elements.push(this.objectiveText);
    }

    update(delta) {
        if (!this.active) return;

        this.timer -= delta;
        const secs = Math.max(0, Math.ceil(this.timer / 1000));
        this.timerText.setText(`${secs}s`);

        if (this.challenge.id === 'kill') {
            this.objectiveText.setText(`Banish ${this.challenge.target - this.kills} more enemies`);
        }

        // Spawn enemies periodically
        this.spawnTimer += delta;
        if (this.spawnTimer >= 2000) {
            this.spawnTimer -= 2000;
            this._spawnArenaEnemy();
        }

        // Check completion
        if (this.challenge.id === 'kill' && this.kills >= this.challenge.target) {
            this._resolve(true);
            return;
        }

        if (this.timer <= 0) {
            if (this.challenge.id === 'survive') {
                this._resolve(true);
            } else {
                this._resolve(false);
            }
        }
    }

    onEnemyKilled() {
        if (!this.active) return;
        this.kills++;
    }

    _spawnArenaEnemy() {
        const biome = this.scene.biomeManager.getCurrentBiome();
        if (!biome || biome.enemies.length === 0) return;
        const typeId = biome.enemies[Math.floor(Math.random() * biome.enemies.length)];
        const def = ENEMIES[typeId];
        if (!def) return;

        const offset = (Math.random() - 0.5) * 300;
        const ex = this.arenaX + offset;
        const ey = WORLD.GROUND_Y - def.height / 2 - 20;
        const enemy = new Enemy(this.scene, ex, ey, typeId);
        this.scene.enemyGroup.add(enemy);
    }

    _resolve(success) {
        this.active = false;

        // Cleanup UI
        for (const el of this._elements) {
            if (el && el.active) {
                this.scene.tweens.killTweensOf(el);
                el.destroy();
            }
        }
        this._elements = [];

        this.scene.events.emit('challengeArenaEnd', success);
    }
}
