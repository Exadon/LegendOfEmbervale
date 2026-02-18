/**
 * MetaProgression — persistent cross-run state for class unlocks and skill tree progress.
 * Stored in localStorage under 'elixirs-shadow-meta-progression'.
 */

import { FlameAltar } from './FlameAltar.js';
import { CLASS_MASTERIES, MASTERY_RANK_COSTS } from './ClassMasteries.js';

const STORAGE_KEY = 'elixirs-shadow-meta-progression';

/** Escalating unlock costs (index = how many non-free classes already unlocked) */
const UNLOCK_COSTS = [10, 25, 50, 80, 120];

/** All class IDs in display order */
export const ALL_CLASS_IDS = ['adventurer', 'barbarian', 'wizard', 'ranger', 'tank', 'healer', 'assassin'];

class _MetaProgression {
    constructor() {
        this.version = 1;
        this.unlockedClasses = ['adventurer'];
        this.totalSpent = 0;
        this.classProgress = {};
        this.classMasteries = {};  // { classId: { masteryId: rank (0-3) } }
        this._load();
    }

    _load() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const data = JSON.parse(raw);
                if (data.version === 1) {
                    this.unlockedClasses = data.unlockedClasses || ['adventurer'];
                    this.totalSpent = data.totalSpent || 0;
                    this.classProgress = data.classProgress || {};
                    this.classMasteries = data.classMasteries || {};
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
}

export const MetaProgression = new _MetaProgression();
