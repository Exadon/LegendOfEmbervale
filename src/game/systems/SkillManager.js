import { CLASS_SKILL_TREES, LEVEL_THRESHOLDS } from './ClassSkillTrees.js';
import { CLASS_DEFS, DEFAULT_CLASS } from './ClassDefs.js';
import { MetaProgression } from './MetaProgression.js';

class _SkillManager {
    constructor() {
        this.selectedClassId = 'adventurer';
        this.reset();
    }

    /** Called by ClassSelect scene before starting a run */
    selectClass(classId) {
        this.selectedClassId = classId;
        this.activeClass = CLASS_DEFS[classId] || DEFAULT_CLASS;
    }

    reset() {
        this.level = 0;
        this.acquired = [];       // array of node ids acquired this run
        this._mults = {};         // key → multiplicative modifier
        this._flats = {};         // key → additive modifier
        this._flags = new Set();  // boolean flags
        // Preserve selected class across reset (set before run starts)
        this.activeClass = CLASS_DEFS[this.selectedClassId] || DEFAULT_CLASS;
    }

    setMult(key, value) {
        this._mults[key] = (this._mults[key] || 1) * value;
    }

    addFlat(key, value) {
        this._flats[key] = (this._flats[key] || 0) + value;
    }

    setFlag(key) {
        this._flags.add(key);
    }

    getValue(key, baseValue) {
        const mult = this._mults[key] || 1;
        const flat = this._flats[key] || 0;
        return baseValue * mult + flat;
    }

    getFlag(key) {
        return this._flags.has(key);
    }

    checkLevelUp(elixirCount) {
        if (this.level >= LEVEL_THRESHOLDS.length) return false;
        return elixirCount >= LEVEL_THRESHOLDS[this.level];
    }

    /**
     * Get available skill tree nodes for the active class.
     * Tier 0 always available. Tier N requires 2 nodes from tier N-1.
     * Returns up to `count` un-acquired, eligible nodes (shuffled).
     */
    getAvailableNodes(count) {
        const tree = CLASS_SKILL_TREES[this.selectedClassId];
        if (!tree) return [];

        // Count acquired nodes per tier
        const tierCounts = [0, 0, 0, 0];
        for (const nodeId of this.acquired) {
            const node = tree.find(n => n.id === nodeId);
            if (node) tierCounts[node.tier]++;
        }

        const available = tree.filter(node => {
            // Already acquired this run
            if (this.acquired.includes(node.id)) return false;
            // Tier 0 always available
            if (node.tier === 0) return true;
            // Tier N requires 2 from tier N-1
            return tierCounts[node.tier - 1] >= 2;
        });

        // Shuffle and return up to count
        const shuffled = available.sort(() => Math.random() - 0.5);
        return shuffled.slice(0, Math.min(count, shuffled.length));
    }

    acquireSkill(nodeId) {
        const tree = CLASS_SKILL_TREES[this.selectedClassId];
        if (!tree) return null;

        const node = tree.find(n => n.id === nodeId);
        if (!node || this.acquired.includes(nodeId)) return null;

        node.apply(this);
        this.acquired.push(nodeId);
        this.level++;

        // Record in meta-progression for persistent tracking
        MetaProgression.recordNodeUnlock(this.selectedClassId, nodeId);

        return node;
    }

    hasClassAttack() {
        return this.activeClass && this.activeClass.attackType !== null;
    }

    getClassAttackCooldown() {
        return this.activeClass ? this.activeClass.attackCooldown : 0;
    }
}

export const SkillManager = new _SkillManager();
