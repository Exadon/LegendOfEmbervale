import { WORLD, GENERATION, ELIXIR, LORE_ENTRIES, LORE_SCROLL, FLAME_SHRINE, ENEMIES, DECORATION, CRUMBLING_PLATFORM, SURVIVOR, CHALLENGE_SHRINE, CINDER_VESSEL, CRAFTSPERSON, OBELISK, DEADLY_SHROUD, UNDEAD_HAND, ENDLESS } from '../constants.js';
import { ElixirVein } from '../entities/ElixirVein.js';
import { FlameWisp } from '../entities/FlameWisp.js';
import { CorruptionPool } from '../entities/CorruptionPool.js';
import { LoreScroll } from '../entities/LoreScroll.js';
import { FlameShrine } from '../entities/FlameShrine.js';
import { Enemy } from '../entities/Enemy.js';
import { CrumblingPlatform } from '../entities/CrumblingPlatform.js';
import { Survivor as SurvivorEntity } from '../entities/Survivor.js';
import { ChallengeShrine as ChallengeShrineEntity } from '../entities/ChallengeShrine.js';
import { CinderVessel } from '../entities/CinderVessel.js';
import { Craftsperson } from '../entities/Craftsperson.js';
import { AncientObelisk } from '../entities/AncientObelisk.js';
import { UndeadHand } from '../entities/UndeadHand.js';

export class LevelGenerator {
    constructor(scene, groups, biomeManager) {
        this.scene = scene;
        this.platforms = groups.platforms;
        this.elixirVeins = groups.elixirVeins;
        this.flameWisps = groups.flameWisps;
        this.corruptionPools = groups.corruptionPools;
        this.loreScrolls = groups.loreScrolls;
        this.flameShrines = groups.flameShrines;
        this.enemies = groups.enemies;
        this.decorations = groups.decorations;
        this.crumblingPlatforms = groups.crumblingPlatforms;
        this.survivors = groups.survivors;
        this.challengeShrines = groups.challengeShrines;
        this.cinderVessels = groups.cinderVessels;
        this.craftspeople = groups.craftspeople;
        this.obelisks = groups.obelisks;
        this.deadlyShroudZones = groups.deadlyShroudZones;
        this.undeadHands = groups.undeadHands;
        this.biomeManager = biomeManager;

        this.generatedUpTo = 0;
        this.difficulty = 0;
        this.loreIndex = 0; // cycles through LORE_ENTRIES
        this.loopCount = 0;
        this._eliteSpawnMult = 1;
        this._diffEnemySpeedMult = 1;
        this._diffEnemyHpMult = 1;

        // Pre-compute total decoration weight for weighted random
        this._totalDecoWeight = DECORATION.TYPES.reduce((sum, d) => sum + d.weight, 0);
    }

    setDifficulty(tier) {
        this.difficulty = tier;
    }

    setLoop(n) {
        this.loopCount = n;
    }

    setEliteSpawnMult(m) {
        this._eliteSpawnMult = m;
    }

    /** Apply difficulty preset multipliers (E1) */
    setDifficultyMult(diff) {
        this._diffEnemySpeedMult = diff ? diff.enemySpeedMult : 1;
        this._diffEnemyHpMult = diff ? diff.enemyHpMult : 1;
    }

    generateAhead(cameraRightX) {
        const targetSegment = Math.ceil(
            (cameraRightX + WORLD.SEGMENT_WIDTH * GENERATION.LOOKAHEAD_SEGMENTS) / WORLD.SEGMENT_WIDTH
        );

        while (this.generatedUpTo < targetSegment) {
            this.generatedUpTo++;
            this._generateSegment(this.generatedUpTo);
        }
    }

    _generateSegment(index) {
        const segX = index * WORLD.SEGMENT_WIDTH;
        const rng = this._seededRandom(index);
        const biome = this.biomeManager.getBiomeAt(segX);

        // Skip first 2 segments (player start area)
        if (index < 2) return;

        // --- Platforms ---
        if (rng() < GENERATION.PLATFORM_CHANCE) {
            const count = 1 + (rng() < 0.3 ? 1 : 0);
            for (let i = 0; i < count && i < GENERATION.MAX_PLATFORMS_PER_SEGMENT; i++) {
                const px = segX + 80 + rng() * (WORLD.SEGMENT_WIDTH - 160);
                const py = WORLD.GROUND_Y - 220 + rng() * 160;

                // 15% chance to be a crumbling platform
                if (rng() < CRUMBLING_PLATFORM.CHANCE) {
                    const crumble = new CrumblingPlatform(this.scene, px, py);
                    crumble.setTint(biome.platformTint);
                    this.platforms.add(crumble);
                    this.crumblingPlatforms.add(crumble);
                } else {
                    const plat = this.platforms.create(px, py, 'platform');
                    plat.setTint(biome.platformTint);
                }
            }
        }

        // --- Decorations ---
        if (rng() < DECORATION.CHANCE) {
            const count = DECORATION.MIN_PER_SEGMENT +
                Math.floor(rng() * (DECORATION.MAX_PER_SEGMENT - DECORATION.MIN_PER_SEGMENT + 1));
            for (let i = 0; i < count; i++) {
                const decoType = this._pickWeightedDecoration(rng);
                const dx = segX + 20 + rng() * (WORLD.SEGMENT_WIDTH - 40);
                // Tall decorations (trees, large rocks) render in front of
                // the player so the player walks behind them for depth.
                const isTall = decoType.height >= 128;
                const deco = this.scene.add.image(dx, WORLD.GROUND_Y + 12, decoType.key)
                    .setOrigin(0.5, 1.0)
                    .setDepth(isTall ? 6 : 0)
                    .setTint(biome.treeTint);
                if (isTall) deco.setAlpha(0.85);
                // Slight random scale variation
                const s = 0.8 + rng() * 0.4;
                deco.setScale(s);
                this.decorations.add(deco);
            }
        }

        // --- Elixir Wells ---
        if (rng() < GENERATION.VEIN_CHANCE) {
            const vx = segX + 100 + rng() * (WORLD.SEGMENT_WIDTH - 200);
            const vein = new ElixirVein(this.scene, vx, WORLD.GROUND_Y);
            this.elixirVeins.add(vein);
        }

        // --- Flame Wisps ---
        if (rng() < GENERATION.WISP_CHANCE) {
            const wx = segX + 50 + rng() * (WORLD.SEGMENT_WIDTH - 100);
            const wy = WORLD.GROUND_Y - 320 + rng() * 250;
            const wisp = new FlameWisp(this.scene, wx, wy);
            this.flameWisps.add(wisp);
        }

        // --- Corruption Pools ---
        const corruptChance = GENERATION.CORRUPTION_CHANCE + this.difficulty * GENERATION.CORRUPTION_RAMP;
        if (rng() < corruptChance) {
            const cx = segX + 100 + rng() * (WORLD.SEGMENT_WIDTH - 200);
            const pool = new CorruptionPool(this.scene, cx, WORLD.GROUND_Y);
            this.corruptionPools.add(pool);
        }

        // --- Lore Scrolls (biome-specific chance) ---
        if (rng() < biome.scrollChance) {
            const sx = segX + 80 + rng() * (WORLD.SEGMENT_WIDTH - 160);
            const sy = WORLD.GROUND_Y - LORE_SCROLL.HEIGHT / 2 - 5;
            const entry = LORE_ENTRIES[this.loreIndex % LORE_ENTRIES.length];
            this.loreIndex++;
            const scroll = new LoreScroll(this.scene, sx, sy, entry);
            this.loreScrolls.add(scroll);
        }

        // --- Flame Shrines (rare) ---
        if (rng() < biome.shrineChance) {
            const shx = segX + 150 + rng() * (WORLD.SEGMENT_WIDTH - 300);
            const shy = WORLD.GROUND_Y - FLAME_SHRINE.HEIGHT / 2 + 16;
            const shrine = new FlameShrine(this.scene, shx, shy);
            this.flameShrines.add(shrine);
        }

        // --- Biome Enemies (distance-scaled density) ---
        if (biome.enemies.length > 0) {
            const effectiveDifficulty = this.difficulty + this.loopCount * 3;
            const distBonus = segX * GENERATION.ENEMY_DISTANCE_RAMP;
            const enemyChance = Math.min(
                GENERATION.ENEMY_CHANCE + effectiveDifficulty * GENERATION.ENEMY_RAMP + distBonus + this.loopCount * 0.08,
                0.95
            );

            // Roll for up to MAX_ENEMIES_PER_SEGMENT enemies
            const thresholds = [0, 0.4, 0.7]; // offset subtracted for 2nd and 3rd enemy
            let spawnCount = 0;
            for (let i = 0; i < GENERATION.MAX_ENEMIES_PER_SEGMENT; i++) {
                if (rng() < enemyChance - thresholds[i]) {
                    spawnCount++;
                } else {
                    break;
                }
            }

            // Place each enemy at a spread-out X offset
            const slotWidth = (WORLD.SEGMENT_WIDTH - 200) / Math.max(spawnCount, 1);
            for (let i = 0; i < spawnCount; i++) {
                let typeId = biome.enemies[Math.floor(rng() * biome.enemies.length)];
                // Elite spawn mult: promote regular enemies to skullflame elite
                if (this._eliteSpawnMult > 1 && !ENEMIES[typeId]?.elite && rng() < 0.05 * this._eliteSpawnMult) {
                    typeId = 'skullflame';
                }
                const def = ENEMIES[typeId];
                if (def) {
                    const ex = segX + 100 + slotWidth * i + rng() * slotWidth;
                    const ey = def.stationary
                        ? WORLD.GROUND_Y - def.height / 2
                        : WORLD.GROUND_Y - def.height / 2 - rng() * 100;
                    const enemy = new Enemy(this.scene, ex, ey, typeId);
                    // Loop difficulty scaling
                    if (this.loopCount > 0) {
                        enemy.hitsToKill = Math.ceil(enemy.hitsToKill * (1 + this.loopCount * ENDLESS.HP_MULT_PER_LOOP));
                        enemy._baseSpeed = enemy._baseSpeed * (1 + this.loopCount * ENDLESS.SPEED_MULT_PER_LOOP);
                    }
                    // Difficulty preset scaling (E1)
                    if (this._diffEnemyHpMult !== 1) {
                        enemy.hitsToKill = Math.max(1, Math.ceil(enemy.hitsToKill * this._diffEnemyHpMult));
                    }
                    if (this._diffEnemySpeedMult !== 1) {
                        enemy._baseSpeed = enemy._baseSpeed * this._diffEnemySpeedMult;
                    }
                    // Relic: ember_crown / chain_banish enemy HP drawback
                    if (this.scene.relicManager) {
                        const relicHpMult = this.scene.relicManager.getMult('enemyHpMult');
                        if (relicHpMult !== 1) {
                            enemy.hitsToKill = Math.max(1, Math.ceil(enemy.hitsToKill * relicHpMult));
                        }
                    }
                    this.enemies.add(enemy);
                }
            }
        }

        // --- Survivors (after segment 5, 3% chance) ---
        if (index > 5 && rng() < SURVIVOR.CHANCE && this.survivors) {
            const sx = segX + 100 + rng() * (WORLD.SEGMENT_WIDTH - 200);
            const survivor = new SurvivorEntity(this.scene, sx);
            this.survivors.add(survivor);
        }

        // --- Challenge Shrines (after segment 8, 2% chance) ---
        if (index > 8 && rng() < CHALLENGE_SHRINE.CHANCE && this.challengeShrines) {
            const csx = segX + 150 + rng() * (WORLD.SEGMENT_WIDTH - 300);
            const shrine = new ChallengeShrineEntity(this.scene, csx);
            this.challengeShrines.add(shrine);
        }

        // --- Cinder Vessels (after segment 10, 0.8% chance) (Feature 1) ---
        if (index > 10 && rng() < CINDER_VESSEL.CHANCE && this.cinderVessels) {
            const cvx = segX + 100 + rng() * (WORLD.SEGMENT_WIDTH - 200);
            const vessel = new CinderVessel(this.scene, cvx);
            this.cinderVessels.add(vessel);
        }

        // --- Craftspeople (after segment 12, 1.2% chance) (Feature 6) ---
        if (index > 12 && rng() < CRAFTSPERSON.CHANCE && this.craftspeople) {
            const cpx = segX + 100 + rng() * (WORLD.SEGMENT_WIDTH - 200);
            const craftsperson = new Craftsperson(this.scene, cpx);
            this.craftspeople.add(craftsperson);
        }

        // --- Ancient Obelisks (after segment 6, 1.5% chance) (Feature 7) ---
        if (index > 6 && rng() < OBELISK.CHANCE && this.obelisks) {
            const ox = segX + 100 + rng() * (WORLD.SEGMENT_WIDTH - 200);
            const obelisk = new AncientObelisk(this.scene, ox);
            this.obelisks.add(obelisk);
        }

        // --- Undead Hands (hollow/albaneve biomes only) ---
        if ((biome.id === 'hollow' || biome.id === 'albaneve') && rng() < UNDEAD_HAND.CHANCE && this.undeadHands) {
            const uhx = segX + 80 + rng() * (WORLD.SEGMENT_WIDTH - 160);
            const hand = new UndeadHand(this.scene, uhx);
            this.undeadHands.add(hand);
        }

        // --- Deadly Shroud Zones (after segment 15, 3% chance) (Feature 9) ---
        if (index > 15 && rng() < DEADLY_SHROUD.CHANCE && this.deadlyShroudZones) {
            const dzx = segX + 80 + rng() * (WORLD.SEGMENT_WIDTH - 160);
            const zone = this.scene.add.rectangle(
                dzx, WORLD.GROUND_Y - DEADLY_SHROUD.HEIGHT / 2,
                DEADLY_SHROUD.WIDTH, DEADLY_SHROUD.HEIGHT, 0xFF0000, 0.25
            ).setDepth(3);
            // Pulsing
            this.scene.tweens.add({
                targets: zone,
                alpha: { from: 0.15, to: 0.35 },
                duration: 1500,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut',
            });
            // Store bounds for overlap detection in Level1
            zone._bounds = { x: dzx, w: DEADLY_SHROUD.WIDTH, h: DEADLY_SHROUD.HEIGHT };
            this.deadlyShroudZones.add(zone);
        }
    }

    _pickWeightedDecoration(rng) {
        let roll = rng() * this._totalDecoWeight;
        for (const d of DECORATION.TYPES) {
            roll -= d.weight;
            if (roll <= 0) return d;
        }
        return DECORATION.TYPES[0];
    }

    _seededRandom(seed) {
        let s = seed * 2654435761 >>> 0;
        return () => {
            s = (s ^ (s << 13)) >>> 0;
            s = (s ^ (s >> 17)) >>> 0;
            s = (s ^ (s << 5)) >>> 0;
            return (s >>> 0) / 4294967296;
        };
    }
}
