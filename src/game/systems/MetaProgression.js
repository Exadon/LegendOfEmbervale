/**
 * MetaProgression — persistent cross-run state for class unlocks and skill tree progress.
 * Stored in localStorage under 'elixirs-shadow-meta-progression'.
 */

import { FlameAltar } from './FlameAltar.js';

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

    getTotalSpent() {
        return this.totalSpent;
    }
}

export const MetaProgression = new _MetaProgression();
