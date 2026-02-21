import Phaser from 'phaser';
import { WORLD, FLAME_WISP, FLAME_SHRINE, SHRINE_INSCRIPTIONS, LORE_ENTRIES, RELIC, SURVIVOR, CHALLENGE_SHRINE, CRAFTSPERSON, ENEMIES } from '../constants.js';
import { GlobalState } from '../GlobalState.js';
import { SkillManager } from './SkillManager.js';
import { FlameAltar } from './FlameAltar.js';
import { Enemy } from '../entities/Enemy.js';
import { LoreCompendium } from '../ui/LoreCompendium.js';

export class InteractionSystem {
    constructor(scene) {
        this.scene = scene;
        this.shrineDrainBuffTimer = 0;
        this._activeRescue = null;
        this.blacksmithBuff = false;
        this.hasCinderVessel = FlameAltar.startsWithVessel();
        this.survivorBuffTimer = 0;
        this.survivorBuffType = null;
        this.bardBlessingTimer = 0;
        this.loreScrollsCollected = 0;
    }

    updateWisps() {
        const s = this.scene;
        for (const wisp of s.flameWisps.getChildren()) {
            if (!wisp.active || wisp.collected) continue;
            const dist = Phaser.Math.Distance.Between(s.player.x, s.player.y, wisp.x, wisp.y);
            if (dist < FLAME_WISP.MAGNET_RANGE && dist > 5) {
                wisp.magnetTo(s.player.x, s.player.y);
            }
            if (s.physics.overlap(s.player, wisp)) {
                if (wisp.collect()) {
                    s.runStats.wispsCollected++;
                    const modWispMult = s._modWispRestoreMult !== null ? s._modWispRestoreMult : 1;
                    const restore = SkillManager.getValue('wisp.restoreAmount', FLAME_WISP.RESTORE)
                        * s.relicManager.getMult('wispRestoreMult')
                        * FlameAltar.getWispBonus()
                        * modWispMult;
                    GlobalState.flame = GlobalState.flame + restore;
                    s.popups.flameRestored(wisp.x, wisp.y, Math.round(restore));
                    s.particles.wispCollect(wisp.x, wisp.y);
                    s.audio.playWispCollect();
                }
            }
        }
    }

    updateShrines() {
        const s = this.scene;
        for (const shrine of s.flameShrines.getChildren()) {
            if (!shrine.active || shrine.used) continue;
            if (s.physics.overlap(s.player, shrine)) {
                if (shrine.activate()) {
                    s.runStats.shrinesUsed++;
                    GlobalState.flame = GlobalState.flame + FLAME_SHRINE.RESTORE;
                    s.popups.flameRestored(shrine.x, shrine.y, FLAME_SHRINE.RESTORE);
                    s.popups.show(shrine.x, shrine.y - 50, 'FLAME SHRINE', '#FF8833', '14px');
                    s.particles.wispCollect(shrine.x, shrine.y);
                    s.audio.playWispCollect();
                    s.cameras.main.flash(300, 255, 136, 51, false, null, s);

                    const inscription = SHRINE_INSCRIPTIONS[Math.floor(Math.random() * SHRINE_INSCRIPTIONS.length)];
                    s.hud.showLoreScroll({ author: 'Flame Shrine Inscription', text: inscription });

                    if (SkillManager.getFlag('shrine.drainBuff')) {
                        const dur = SkillManager.getValue('shrine.drainBuffDuration', 0);
                        this.shrineDrainBuffTimer = dur;
                        s.popups.show(shrine.x, shrine.y - 70, 'DRAIN HALVED', '#4488FF', '12px');
                    }

                    if (s.relicManager.canDrop() && Math.random() < RELIC.SHRINE_DROP_CHANCE) {
                        s.time.delayedCall(500, () => s.relicOverlay.show());
                    }
                }
            }
        }
    }

    updateScrolls() {
        const s = this.scene;
        for (const scroll of s.loreScrolls.getChildren()) {
            if (!scroll.active || scroll.collected) continue;
            if (s.physics.overlap(s.player, scroll)) {
                const entry = scroll.collect();
                if (entry) {
                    this.loreScrollsCollected++;
                    s.runStats.loreScrollsFound++;
                    s.hud.showLoreScroll(entry);
                    s.audio.playMineComplete();

                    const idx = LORE_ENTRIES.indexOf(entry);
                    if (idx >= 0) {
                        LoreCompendium.addCollected(idx);
                    }
                }
            }
        }
    }

    updateCinderVessels() {
        const s = this.scene;
        if (this.hasCinderVessel) return;
        for (const vessel of s.cinderVesselGroup.getChildren()) {
            if (!vessel.active || vessel.collected) continue;
            if (s.physics.overlap(s.player, vessel)) {
                if (vessel.collect()) {
                    this.hasCinderVessel = true;
                    s.popups.show(vessel.x, vessel.y - 60, 'CINDER VESSEL', '#FFCC00', '16px');
                    s.popups.show(vessel.x, vessel.y - 40, 'Death save acquired', '#D4A04A', '11px');
                    s.audio.playWispCollect();
                    s.cameras.main.flash(200, 255, 200, 0);
                }
            }
        }
    }

    updateCraftspeople(delta) {
        const s = this.scene;

        if (this._activeRescue) {
            this._activeRescue.timer -= delta;
            let aliveCount = 0;
            for (const e of this._activeRescue.enemies) {
                if (e.active && e.alive) aliveCount++;
            }
            s.hud.updateBuff(
                'rescue',
                Math.max(0, this._activeRescue.timer),
                CRAFTSPERSON.RESCUE_TIME
            );
            if (aliveCount === 0) {
                this._completeRescue(this._activeRescue.craftsperson);
                this._activeRescue = null;
                s.hud.updateBuff(null, 0, 0);
            } else if (this._activeRescue.timer <= 0) {
                s.popups.show(this._activeRescue.craftsperson.x, this._activeRescue.craftsperson.y - 60,
                    'CONSUMED BY SHROUD', '#FF4444', '14px');
                this._activeRescue.craftsperson.failed = true;
                s.tweens.add({
                    targets: this._activeRescue.craftsperson,
                    alpha: 0,
                    duration: 500,
                });
                this._activeRescue = null;
                s.hud.updateBuff(null, 0, 0);
            }
            return;
        }

        for (const cp of s.craftspeopleGroup.getChildren()) {
            if (!cp.active || cp.rescued || cp.failed || cp.rescueActive) continue;
            const dist = Phaser.Math.Distance.Between(s.player.x, s.player.y, cp.x, cp.y);
            if (dist < CRAFTSPERSON.RESCUE_RADIUS) {
                cp.showPrompt();
                if (Phaser.Input.Keyboard.JustDown(s.interactKey)) {
                    this._startRescue(cp);
                }
            } else {
                cp.hidePrompt();
            }
        }
    }

    _startRescue(craftsperson) {
        const s = this.scene;
        craftsperson.rescueActive = true;
        craftsperson.hidePrompt();

        const biome = s.biomeManager.getCurrentBiome();
        const rescueEnemies = [];
        for (let i = 0; i < 3; i++) {
            const typeId = biome.enemies.length > 0
                ? biome.enemies[Math.floor(Math.random() * biome.enemies.length)]
                : 'fell_critter';
            const def = ENEMIES[typeId];
            if (def) {
                const ex = craftsperson.x + (i - 1) * 80;
                const ey = WORLD.GROUND_Y - def.height / 2;
                const enemy = new Enemy(s, ex, ey, typeId);
                s.enemyGroup.add(enemy);
                rescueEnemies.push(enemy);
            }
        }

        this._activeRescue = {
            craftsperson,
            timer: CRAFTSPERSON.RESCUE_TIME,
            enemies: rescueEnemies,
        };

        s.popups.show(craftsperson.x, craftsperson.y - 70, `RESCUE: ${craftsperson.craftType.name}`, '#FFCC00', '14px');
        s.popups.show(craftsperson.x, craftsperson.y - 50, 'Banish all enemies!', '#CCCCCC', '11px');
        s.cameras.main.shake(200, 0.005);
    }

    _completeRescue(craftsperson) {
        const s = this.scene;
        craftsperson.rescued = true;
        const type = craftsperson.craftType;

        s.popups.show(craftsperson.x, craftsperson.y - 70, `${type.name} RESCUED!`, '#44FF44', '16px');
        s.popups.show(craftsperson.x, craftsperson.y - 50, type.desc, '#CCCCCC', '11px');
        s.audio.playLevelUp();
        s.cameras.main.flash(300, 100, 255, 100);

        switch (type.reward) {
            case 'dash_damage':
                this.blacksmithBuff = true;
                break;
            case 'full_flame':
                GlobalState.flame = GlobalState.maxFlame;
                s.player.isInvincible = true;
                s.player.invincibleTimer = 5000;
                s.player.setTint(0x44FF44);
                s.time.delayedCall(5000, () => {
                    if (s.player.active) s.player.clearTint();
                });
                break;
            case 'banish_all': {
                const camLeft = s.cameras.main.scrollX;
                const camRight = camLeft + s.scale.width;
                for (const enemy of s.enemyGroup.getChildren()) {
                    if (!enemy.active || !enemy.alive) continue;
                    if (enemy.x > camLeft && enemy.x < camRight) {
                        s.particles.wraithBanish(enemy.x, enemy.y);
                        enemy.banish();
                        s.combatSystem.onEnemyBanished(enemy.x, enemy.y, false);
                    }
                }
                break;
            }
            case 'bard_blessing':
                this.bardBlessingTimer = 30000;
                s.popups.show(craftsperson.x, craftsperson.y - 30, 'Bard\'s Blessing: 30s', '#AA6688', '11px');
                break;
        }
    }

    updateObelisks() {
        const s = this.scene;
        if (s.obeliskOverlay.active) return;
        for (const obelisk of s.obeliskGroup.getChildren()) {
            if (!obelisk.active || obelisk.used) continue;
            if (s.physics.overlap(s.player, obelisk)) {
                if (obelisk.activate()) {
                    s.obeliskOverlay.show();
                    s.audio.playMineComplete();
                }
            }
        }
    }

    updateSurvivors(delta) {
        const s = this.scene;
        for (const survivor of s.survivorGroup.getChildren()) {
            if (!survivor.active || survivor.interacted) continue;
            const dist = Phaser.Math.Distance.Between(s.player.x, s.player.y, survivor.x, survivor.y);
            if (dist < SURVIVOR.INTERACTION_RANGE) {
                survivor.showPrompt();
                if (Phaser.Input.Keyboard.JustDown(s.interactKey)) {
                    const result = survivor.interact();
                    if (result) {
                        this.survivorBuffType = result.buff.id;
                        this.survivorBuffTimer = SURVIVOR.BUFF_DURATION;
                        s.hud.showSurvivorDialogue(result.dialogue, result.buff);
                        s.audio.playWispCollect();
                        s.time.delayedCall(4000, () => {
                            if (survivor.active) survivor.fadeAway();
                        });
                    }
                }
            } else {
                survivor.hidePrompt();
            }
        }
    }

    updateChallengeShrines() {
        const s = this.scene;
        if (s.challengeArena.active) return;
        for (const shrine of s.challengeShrineGroup.getChildren()) {
            if (!shrine.active || shrine.used) continue;
            if (s.physics.overlap(s.player, shrine)) {
                if (shrine.activate()) {
                    const types = CHALLENGE_SHRINE.TYPES;
                    const challenge = types[Math.floor(Math.random() * types.length)];
                    const segIdx = s.levelGenerator ? s.levelGenerator.segmentIndex || 0 : 0;
                    s.challengeArena.start(challenge, shrine.x, segIdx);
                    s.popups.show(shrine.x, shrine.y - 60, challenge.name, '#FF4488', '16px');
                    s.cameras.main.shake(200, 0.005);
                }
            }
        }
    }
}
