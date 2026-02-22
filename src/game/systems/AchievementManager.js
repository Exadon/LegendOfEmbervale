/**
 * AchievementManager — singleton tracking ~35 achievements with localStorage persistence.
 *
 * Usage:
 *   AchievementManager.load();                        // on game boot
 *   AchievementManager.bind(scene, runStats);         // on Level1.create
 *   AchievementManager.update();                      // each frame
 *   AchievementManager.unbind();                      // on scene shutdown
 *   AchievementManager.popNewlyUnlocked();            // drain toast queue
 */

import { BIOMES, LORE_ENTRIES } from '../constants.js';
import { GlobalState } from '../GlobalState.js';
import { SkillManager } from './SkillManager.js';
import { MetaProgression } from './MetaProgression.js';

const LORE_STORAGE_KEY = 'elixirs-shadow-lore-collected';
const META_STORAGE_KEY = 'elixirs-shadow-meta-progression';

const STORAGE_KEY = 'elixirs-shadow-achievements';

// ── Lore helpers for lifetime achievements ──

function _getLoreCount() {
    try {
        const raw = localStorage.getItem(LORE_STORAGE_KEY);
        if (raw) return JSON.parse(raw).length;
    } catch {}
    return 0;
}

function _checkBiomeLore(biomeId) {
    try {
        const raw = localStorage.getItem(LORE_STORAGE_KEY);
        if (!raw) return false;
        const collected = new Set(JSON.parse(raw));
        // Check that every entry whose author mentions biome-relevant content is collected
        // Use a simpler approach: map biomes to author substrings that indicate Springlands/Revelwood lore
        const biomeAuthors = {
            springlands: ['Elin, Watchkeeper', 'Alden Crowley'],
            revelwood: ['Revelwood Chronicle', 'Sophie, Moth\'s Grove'],
        };
        const authors = biomeAuthors[biomeId];
        if (!authors) return false;
        for (let i = 0; i < LORE_ENTRIES.length; i++) {
            if (authors.some(a => LORE_ENTRIES[i].author.includes(a))) {
                if (!collected.has(i)) return false;
            }
        }
        return true;
    } catch {}
    return false;
}

// ── Prestige helper (lifetime) ──

function _getPrestigeCount() {
    try {
        const raw = localStorage.getItem(META_STORAGE_KEY);
        if (raw) {
            const data = JSON.parse(raw);
            return data.prestigeCount || 0;
        }
    } catch {}
    return 0;
}

// ── Achievement Definitions ──

const ACHIEVEMENTS = [
    // Distance (5)
    { id: 'dist_100',   name: 'First Steps',         description: 'Travel 100 meters',            category: 'Distance',   icon: '\u{1F463}', check: (s) => s.distanceMeters >= 100 },
    { id: 'dist_500',   name: 'Trailblazer',          description: 'Travel 500 meters',            category: 'Distance',   icon: '\u{1F463}', check: (s) => s.distanceMeters >= 500 },
    { id: 'dist_1000',  name: 'Road Warrior',          description: 'Travel 1,000 meters',          category: 'Distance',   icon: '\u{1F463}', check: (s) => s.distanceMeters >= 1000 },
    { id: 'dist_2500',  name: 'Long Haul',             description: 'Travel 2,500 meters',          category: 'Distance',   icon: '\u{1F463}', check: (s) => s.distanceMeters >= 2500 },
    { id: 'dist_5000',  name: 'Marathon Runner',        description: 'Travel 5,000 meters',          category: 'Distance',   icon: '\u{1F463}', check: (s) => s.distanceMeters >= 5000 },

    // Elixir (4)
    { id: 'elixir_5',   name: 'Elixir Novice',        description: 'Mine 5 elixir in one run',     category: 'Elixir',     icon: '\u{1F48E}', check: (s) => s.elixirMined >= 5 },
    { id: 'elixir_15',  name: 'Elixir Adept',          description: 'Mine 15 elixir in one run',    category: 'Elixir',     icon: '\u{1F48E}', check: (s) => s.elixirMined >= 15 },
    { id: 'elixir_30',  name: 'Elixir Master',         description: 'Mine 30 elixir in one run',    category: 'Elixir',     icon: '\u{1F48E}', check: (s) => s.elixirMined >= 30 },
    { id: 'elixir_50',  name: 'Elixir Hoarder',        description: 'Mine 50 elixir in one run',    category: 'Elixir',     icon: '\u{1F48E}', check: (s) => s.elixirMined >= 50 },

    // Combat (6)
    { id: 'banish_1',   name: 'First Blood',           description: 'Banish your first enemy',      category: 'Combat',     icon: '\u{2694}',  check: (s) => s.enemiesBanished >= 1 },
    { id: 'banish_10',  name: 'Wraith Slayer',          description: 'Banish 10 enemies in one run', category: 'Combat',     icon: '\u{2694}',  check: (s) => s.enemiesBanished >= 10 },
    { id: 'banish_25',  name: 'Fell Hunter',            description: 'Banish 25 enemies in one run', category: 'Combat',     icon: '\u{2694}',  check: (s) => s.enemiesBanished >= 25 },
    { id: 'banish_50',  name: 'Shroud\'s Bane',         description: 'Banish 50 enemies in one run', category: 'Combat',     icon: '\u{2694}',  check: (s) => s.enemiesBanished >= 50 },
    { id: 'combo_3',    name: 'Combo Starter',          description: 'Reach a x3 combo',             category: 'Combat',     icon: '\u{2694}',  check: (s) => s.maxCombo >= 3 },
    { id: 'combo_5',    name: 'Combo King',             description: 'Reach a x5 combo',             category: 'Combat',     icon: '\u{2694}',  check: (s) => s.maxCombo >= 5 },

    // Collection (4)
    { id: 'wisp_1',     name: 'Spark Catcher',          description: 'Collect your first wisp',      category: 'Collection', icon: '\u{2728}',  check: (s) => s.wispsCollected >= 1 },
    { id: 'wisp_5',     name: 'Wisp Gatherer',          description: 'Collect 5 wisps in one run',   category: 'Collection', icon: '\u{2728}',  check: (s) => s.wispsCollected >= 5 },
    { id: 'wisp_10',    name: 'Flame Keeper',           description: 'Collect 10 wisps in one run',  category: 'Collection', icon: '\u{2728}',  check: (s) => s.wispsCollected >= 10 },
    { id: 'wisp_20',    name: 'Will-o-Wisp',            description: 'Collect 20 wisps in one run',  category: 'Collection', icon: '\u{2728}',  check: (s) => s.wispsCollected >= 20 },

    // Survival (4)
    { id: 'flame_recovery', name: 'Phoenix Rising',     description: 'Recover from below 10% flame', category: 'Survival',   icon: '\u{1F525}', check: (s) => s.flameLowRecovery },
    { id: 'survive_60',    name: 'Minute Man',           description: 'Survive 60 seconds',           category: 'Survival',   icon: '\u{1F525}', check: (s) => s.survivalTime >= 60 },
    { id: 'survive_120',   name: 'Enduring Flame',       description: 'Survive 2 minutes',            category: 'Survival',   icon: '\u{1F525}', check: (s) => s.survivalTime >= 120 },
    { id: 'survive_300',   name: 'Eternal Ember',        description: 'Survive 5 minutes',            category: 'Survival',   icon: '\u{1F525}', check: (s) => s.survivalTime >= 300 },

    // Lore (8)
    { id: 'lore_1',    name: 'Curious Mind',            description: 'Find your first lore scroll',          category: 'Lore', icon: '\u{1F4DC}', check: (s) => s.loreScrollsFound >= 1 },
    { id: 'lore_3',    name: 'Scholar',                  description: 'Find 3 lore scrolls in one run',      category: 'Lore', icon: '\u{1F4DC}', check: (s) => s.loreScrollsFound >= 3 },
    { id: 'lore_5',    name: 'Lorekeeper',               description: 'Find 5 lore scrolls in one run',      category: 'Lore', icon: '\u{1F4DC}', check: (s) => s.loreScrollsFound >= 5 },
    { id: 'lore_10',   name: 'Archivist',                description: 'Find 10 lore scrolls in one run',     category: 'Lore', icon: '\u{1F4DC}', check: (s) => s.loreScrollsFound >= 10 },
    { id: 'lore_all_springlands', name: 'Springlands Scholar', description: 'Collect all Springlands lore (lifetime)', category: 'Lore', icon: '\u{1F4DC}', check: () => _checkBiomeLore('springlands') },
    { id: 'lore_all_revelwood',   name: 'Revelwood Scholar',   description: 'Collect all Revelwood lore (lifetime)',   category: 'Lore', icon: '\u{1F4DC}', check: () => _checkBiomeLore('revelwood') },
    { id: 'lore_half', name: 'Halfway There',            description: 'Collect half of all lore (lifetime)',  category: 'Lore', icon: '\u{1F4DC}', check: () => _getLoreCount() >= Math.ceil(LORE_ENTRIES.length / 2) },
    { id: 'lore_master', name: 'Loremaster',             description: 'Collect every lore scroll (lifetime)', category: 'Lore', icon: '\u{1F4DC}', check: () => _getLoreCount() >= LORE_ENTRIES.length },

    // Biome (4)
    { id: 'biome_revelwood',  name: 'Into the Blackmire',    description: 'Reach Revelwood',            category: 'Biome', icon: '\u{1F332}', check: (s) => s.biomesReached.has('revelwood') },
    { id: 'biome_nomad',      name: 'Highland Bound',         description: 'Reach Nomad Highlands',      category: 'Biome', icon: '\u{1F332}', check: (s) => s.biomesReached.has('nomad_highlands') },
    { id: 'biome_kindle',     name: 'Scorched Earth',          description: 'Reach the Kindlewastes',     category: 'Biome', icon: '\u{1F332}', check: (s) => s.biomesReached.has('kindlewastes') },
    { id: 'biome_beyond',     name: 'Beyond the Wastes',       description: 'Travel 3,000m past Kindlewastes', category: 'Biome', icon: '\u{1F332}', check: (s) => s.distanceMeters >= 2100 },

    // Skills (3)
    { id: 'skill_1',   name: 'Awakening',              description: 'Acquire your first skill',     category: 'Skills',     icon: '\u{2B50}',  check: (s) => s.skillsAcquired >= 1 },
    { id: 'skill_3',   name: 'Growing Power',           description: 'Acquire 3 skills',             category: 'Skills',     icon: '\u{2B50}',  check: (s) => s.skillsAcquired >= 3 },
    { id: 'skill_5',   name: 'Fully Realized',          description: 'Acquire 5 skills',             category: 'Skills',     icon: '\u{2B50}',  check: (s) => s.skillsAcquired >= 5 },

    // Mechanics (4)
    { id: 'first_slam',       name: 'Ground Pounder',   description: 'Perform your first ground slam', category: 'Mechanics', icon: '\u{1F4A5}', check: (s) => s.slamCount >= 1 },
    { id: 'first_burst',      name: 'Flame Unleashed',  description: 'Use flame burst for the first time', category: 'Mechanics', icon: '\u{1F4A5}', check: (s) => s.burstCount >= 1 },
    { id: 'first_class_atk',  name: 'Class Mastery',    description: 'Use a class attack',               category: 'Mechanics', icon: '\u{1F4A5}', check: (s) => s.classAttackCount >= 1 },
    { id: 'wall_jump_3',      name: 'Wall Runner',      description: 'Perform 3 wall jumps in one run',  category: 'Mechanics', icon: '\u{1F4A5}', check: (s) => s.wallJumpCount >= 3 },

    // Meta (3)
    { id: 'first_death',      name: 'The Shroud Claims All', description: 'Die for the first time',     category: 'Meta', icon: '\u{1F480}', check: (s) => s.hasDied },
    { id: 'restarts_5',       name: 'Persistence',           description: 'Restart 5 times',             category: 'Meta', icon: '\u{1F480}', check: (s, state) => state.restartCount >= 5 },
    { id: 'achievements_15',  name: 'Completionist',          description: 'Unlock 15 achievements',      category: 'Meta', icon: '\u{1F480}', check: (s, state) => state.unlockedCount >= 15 },

    // Boss (Sprint 10 — 3)
    { id: 'boss_first',   name: 'First Blood',   description: 'Defeat any boss',                       category: 'Combat', icon: '\u{1F480}', check: (s) => s.bossKilled },
    { id: 'boss_all',     name: 'Boss Slayer',   description: 'Defeat all 5 bosses in one run',       category: 'Combat', icon: '\u{1F480}', check: (s) => s.bossesDefeated && s.bossesDefeated.size >= 5 },
    { id: 'boss_no_hit',  name: 'Untouchable',   description: 'Defeat a boss without taking damage',  category: 'Combat', icon: '\u{1F480}', check: (s) => s.bossKilledNoDamage },

    // Challenge (Sprint 10 — 2)
    { id: 'challenge_10',    name: 'Trial Master',    description: 'Complete 10 challenges',           category: 'Mechanics', icon: '\u{1F3C6}', check: (s) => (s.challengesCompleted || 0) >= 10 },
    { id: 'cursed_complete', name: 'Dark Blessing',   description: 'Complete a cursed trial',          category: 'Mechanics', icon: '\u{1F3C6}', check: (s) => s.cursedChallengeCompleted },

    // Prestige (Sprint 10 — 3) — checked via lifetime state
    { id: 'prestige_1', name: 'Ascending Flame', description: 'Achieve your first prestige',          category: 'Meta', icon: '\u2605', check: () => _getPrestigeCount() >= 1 },
    { id: 'prestige_2', name: 'Reborn',           description: 'Achieve your second prestige',        category: 'Meta', icon: '\u2605', check: () => _getPrestigeCount() >= 2 },
    { id: 'prestige_3', name: 'Eternal Flame',    description: 'Achieve your third prestige',         category: 'Meta', icon: '\u2605', check: () => _getPrestigeCount() >= 3 },

    // Relic / Combo (Sprint 10 — 2)
    { id: 'relic_synergy', name: 'Harmonic',    description: 'Trigger a relic synergy',               category: 'Meta',   icon: '\u{1F48E}', check: (s) => s.relicSynergyTriggered },
    { id: 'combo_10',      name: 'Annihilator', description: 'Reach a x10 combo',                    category: 'Combat', icon: '\u{2694}',  check: (s) => s.maxCombo >= 10 },

    // Phase C: Win Condition (1)
    { id: 'flameborn_legend', name: 'Flameborn Legend', description: 'Complete any win condition', category: 'Meta', icon: '\u2726', check: () => MetaProgression.hasWon() },
];

const CATEGORIES = [
    'Distance', 'Elixir', 'Combat', 'Collection', 'Survival',
    'Lore', 'Biome', 'Skills', 'Mechanics', 'Meta',
];

const CATEGORY_ICONS = {
    Distance:   '\u{1F463}',
    Elixir:     '\u{1F48E}',
    Combat:     '\u{2694}',
    Collection: '\u{2728}',
    Survival:   '\u{1F525}',
    Lore:       '\u{1F4DC}',
    Biome:      '\u{1F332}',
    Skills:     '\u{2B50}',
    Mechanics:  '\u{1F4A5}',
    Meta:       '\u{1F480}',
};

class _AchievementManager {
    constructor() {
        this._unlocked = new Set();
        this._restartCount = 0;
        this._scene = null;
        this._stats = null;
        this._toastQueue = [];
    }

    // ── Persistence ──

    load() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const data = JSON.parse(raw);
                this._unlocked = new Set(data.unlocked || []);
                this._restartCount = data.restartCount || 0;
            }
        } catch {
            // corrupted data — start fresh
            this._unlocked = new Set();
            this._restartCount = 0;
        }
    }

    save() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                unlocked: [...this._unlocked],
                restartCount: this._restartCount,
            }));
        } catch {
            // localStorage full or unavailable — silently fail
        }
    }

    // ── Scene binding ──

    bind(scene, stats) {
        this._scene = scene;
        this._stats = stats;
        this._toastQueue = [];
    }

    unbind() {
        this._scene = null;
        this._stats = null;
    }

    incrementRestart() {
        this._restartCount++;
        this.save();
    }

    // ── Frame update ──

    update() {
        if (!this._stats) return;

        const stats = this._stats;
        const state = {
            restartCount: this._restartCount,
            unlockedCount: this._unlocked.size,
        };

        for (const ach of ACHIEVEMENTS) {
            if (this._unlocked.has(ach.id)) continue;
            try {
                if (ach.check(stats, state)) {
                    this._unlocked.add(ach.id);
                    this._toastQueue.push(ach);
                    this.save();
                    if (this._scene) {
                        this._scene.events.emit('achievementUnlocked', ach);
                    }
                }
            } catch {
                // bad check function — skip
            }
        }
    }

    // ── Toast queue ──

    popNewlyUnlocked() {
        if (this._toastQueue.length === 0) return null;
        return this._toastQueue.shift();
    }

    // ── Query API ──

    isUnlocked(id) {
        return this._unlocked.has(id);
    }

    getAll() {
        return ACHIEVEMENTS;
    }

    getUnlockedCount() {
        return this._unlocked.size;
    }

    getTotalCount() {
        return ACHIEVEMENTS.length;
    }

    getCategories() {
        return CATEGORIES;
    }

    getCategoryIcon(cat) {
        return CATEGORY_ICONS[cat] || '';
    }

    getByCategory(cat) {
        return ACHIEVEMENTS.filter(a => a.category === cat);
    }

    getCategoryProgress(cat) {
        const all = this.getByCategory(cat);
        const done = all.filter(a => this._unlocked.has(a.id)).length;
        return { done, total: all.length };
    }
}

export const AchievementManager = new _AchievementManager();
