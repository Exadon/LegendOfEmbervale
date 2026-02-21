/**
 * MetaProgression — persistent cross-run state for class unlocks, skill tree progress,
 * run history, and prestige system.
 * Stored in localStorage under 'elixirs-shadow-meta-progression'.
 */

import { FlameAltar } from './FlameAltar.js';
import { CLASS_MASTERIES, MASTERY_RANK_COSTS } from './ClassMasteries.js';
import { PRESTIGE, RELIC_UPGRADE_COST } from '../constants.js';

const STORAGE_KEY = 'elixirs-shadow-meta-progression';
const HISTORY_KEY = 'elixirs-shadow-run-history';
const MAX_HISTORY = 10;

/** Escalating unlock costs (index = how many non-free classes already unlocked) */
const UNLOCK_COSTS = [10, 25, 50, 80, 120, 160, 200, 250, 300];

/** All class IDs in display order */
export const ALL_CLASS_IDS = ['adventurer', 'barbarian', 'wizard', 'ranger', 'tank', 'healer', 'assassin', 'monk', 'duelist', 'pyromancer'];

class _MetaProgression {
    constructor() {
        this.version = 3;
        this.unlockedClasses = ['adventurer'];
        this.totalSpent = 0;
        this.classProgress = {};
        this.classMasteries = {};  // { classId: { masteryId: rank (0-3) } }
        this.prestigeCount = 0;
        this.prestigeRelics = [];  // permanent prestige relic IDs
        this.seenRelics = [];      // relic IDs acquired at least once
        this.upgradedRelics = [];  // relic IDs permanently upgraded to tier 2
        this._load();
    }

    _load() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const data = JSON.parse(raw);
                if (data.version >= 1) {
                    this.unlockedClasses = data.unlockedClasses || ['adventurer'];
                    this.totalSpent = data.totalSpent || 0;
                    this.classProgress = data.classProgress || {};
                    this.classMasteries = data.classMasteries || {};
                }
                if (data.version >= 2) {
                    this.prestigeCount = data.prestigeCount || 0;
                    this.prestigeRelics = data.prestigeRelics || [];
                }
                if (data.version >= 3) {
                    this.seenRelics = data.seenRelics || [];
                    this.upgradedRelics = data.upgradedRelics || [];
                }
            }
        } catch {}
    }

    _save() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                version: this.version,
                unlockedClasses: this.unlockedClasses,
                totalSpent: this.totalSpent,
                classProgress: this.classProgress,
                classMasteries: this.classMasteries,
                prestigeCount: this.prestigeCount,
                prestigeRelics: this.prestigeRelics,
                seenRelics: this.seenRelics,
                upgradedRelics: this.upgradedRelics,
            }));
        } catch {}
    }

    isClassUnlocked(classId) {
        return this.unlockedClasses.includes(classId);
    }

    /** How many non-free classes have been unlocked */
    _paidUnlockCount() {
        return Math.max(0, this.unlockedClasses.length - 1); // subtract adventurer
    }

    /** Cost to unlock the next class */
    getUnlockCost() {
        const idx = this._paidUnlockCount();
        if (idx >= UNLOCK_COSTS.length) return Infinity;
        return UNLOCK_COSTS[idx];
    }

    /** Available elixir = lifetime earned - already spent */
    getAvailableElixir() {
        return FlameAltar.lifetimeElixir - this.totalSpent;
    }

    /** Attempt to unlock a class. Returns true on success. */
    unlockClass(classId) {
        if (this.isClassUnlocked(classId)) return false;
        const cost = this.getUnlockCost();
        if (this.getAvailableElixir() < cost) return false;
        this.totalSpent += cost;
        this.unlockedClasses.push(classId);
        this._save();
        return true;
    }

    /** Record a node as ever-unlocked for a class (for future tree visualization) */
    recordNodeUnlock(classId, nodeId) {
        if (!this.classProgress[classId]) {
            this.classProgress[classId] = [];
        }
        if (!this.classProgress[classId].includes(nodeId)) {
            this.classProgress[classId].push(nodeId);
        }
        this._save();
    }

    /** Get the current rank (0-3) of a mastery for a class */
    getMasteryRank(classId, masteryId) {
        return (this.classMasteries[classId] && this.classMasteries[classId][masteryId]) || 0;
    }

    /** Get the cost for the next rank of a mastery, or null if maxed */
    getMasteryCost(classId, masteryId) {
        const rank = this.getMasteryRank(classId, masteryId);
        if (rank >= MASTERY_RANK_COSTS.length) return null;
        return MASTERY_RANK_COSTS[rank];
    }

    /** Attempt to upgrade a mastery. Returns true on success. */
    upgradeMastery(classId, masteryId) {
        const cost = this.getMasteryCost(classId, masteryId);
        if (cost === null) return false;
        if (this.getAvailableElixir() < cost) return false;

        if (!this.classMasteries[classId]) {
            this.classMasteries[classId] = {};
        }
        this.classMasteries[classId][masteryId] = this.getMasteryRank(classId, masteryId) + 1;
        this.totalSpent += cost;
        this._save();
        return true;
    }

    /** Sum of all mastery ranks for a class (0-15) */
    getTotalMasteryRanks(classId) {
        const classData = this.classMasteries[classId];
        if (!classData) return 0;
        let total = 0;
        for (const mid of Object.keys(classData)) {
            total += classData[mid];
        }
        return total;
    }

    getTotalSpent() {
        return this.totalSpent;
    }

    /** How many unique nodes have ever been unlocked for a class */
    getClassNodeCount(classId) {
        return (this.classProgress[classId] || []).length;
    }

    // ─── Sprint 10: Prestige System ───

    canPrestige() {
        return this.prestigeCount < PRESTIGE.MAX &&
               FlameAltar.level >= FlameAltar.maxLevel &&
               this.getAvailableElixir() >= PRESTIGE.COST;
    }

    prestige() {
        if (!this.canPrestige()) return false;
        this.totalSpent += PRESTIGE.COST;
        this.prestigeCount++;

        // Grant prestige relic (one per prestige, up to 3)
        const relicDef = PRESTIGE.RELICS[this.prestigeCount - 1];
        if (relicDef && !this.prestigeRelics.includes(relicDef.id)) {
            this.prestigeRelics.push(relicDef.id);
        }

        // Reset Flame Altar level (but not lifetime elixir)
        FlameAltar.prestigeReset();
        this._save();
        return true;
    }

    getPrestigeRelics() {
        return this.prestigeRelics.map(id => PRESTIGE.RELICS.find(r => r.id === id)).filter(Boolean);
    }

    getStartingFlameBonus() {
        let bonus = 0;
        for (const relicId of this.prestigeRelics) {
            const def = PRESTIGE.RELICS.find(r => r.id === relicId);
            if (def && def.startFlame) bonus += def.startFlame;
        }
        return bonus;
    }

    getCooldownMult() {
        let mult = 1;
        for (const relicId of this.prestigeRelics) {
            const def = PRESTIGE.RELICS.find(r => r.id === relicId);
            if (def && def.cooldownMult) mult *= def.cooldownMult;
        }
        return mult;
    }

    getWispDropMult() {
        let mult = 1;
        for (const relicId of this.prestigeRelics) {
            const def = PRESTIGE.RELICS.find(r => r.id === relicId);
            if (def && def.wispDropMult) mult *= def.wispDropMult;
        }
        return mult;
    }

    // ─── Phase A3: Relic Crafting ───

    recordRelic(id) {
        if (!this.seenRelics.includes(id)) {
            this.seenRelics.push(id);
            this._save();
        }
    }

    hasUpgrade(id) {
        return this.upgradedRelics.includes(id);
    }

    canUpgradeRelic(id) {
        return this.seenRelics.includes(id) &&
               !this.hasUpgrade(id) &&
               this.getAvailableElixir() >= RELIC_UPGRADE_COST;
    }

    upgradeRelic(id) {
        if (!this.canUpgradeRelic(id)) return false;
        this.totalSpent += RELIC_UPGRADE_COST;
        this.upgradedRelics.push(id);
        this._save();
        return true;
    }

    // ─── Sprint 10: Run History ───

    saveRunHistory(runData) {
        try {
            const raw = localStorage.getItem(HISTORY_KEY);
            let history = raw ? JSON.parse(raw) : [];
            history.unshift({
                class: runData.className || 'adventurer',
                distance: runData.distanceMeters || 0,
                time: runData.survivalTime || 0,
                kills: runData.enemiesBanished || 0,
                elixir: runData.elixirMined || 0,
                wisps: runData.wispsCollected || 0,
                combo: runData.maxCombo || 0,
                relics: runData.relics || [],
                bossesDefeated: runData.bossesDefeated ? [...runData.bossesDefeated] : [],
                date: Date.now(),
                win: false,
            });
            if (history.length > MAX_HISTORY) history = history.slice(0, MAX_HISTORY);
            localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
        } catch {}
    }

    getRunHistory() {
        try {
            const raw = localStorage.getItem(HISTORY_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch { return []; }
    }

    getPersonalBest(className) {
        const history = this.getRunHistory();
        const classRuns = history.filter(r => r.class === className);
        if (classRuns.length === 0) return null;
        return classRuns.reduce((best, r) => r.distance > best.distance ? r : best, classRuns[0]);
    }

    getOverallBest() {
        const history = this.getRunHistory();
        if (history.length === 0) return null;
        return history.reduce((best, r) => r.distance > best.distance ? r : best, history[0]);
    }
}

export const MetaProgression = new _MetaProgression();
