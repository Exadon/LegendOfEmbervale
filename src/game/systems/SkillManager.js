import { SKILLS, LEVEL_THRESHOLDS } from './SkillDefs.js';
import { CLASS_DEFS, DEFAULT_CLASS } from './ClassDefs.js';

class _SkillManager {
    constructor() {
        this.reset();
    }

    reset() {
        this.level = 0;
        this.acquired = [];       // array of skill ids
        this._mults = {};         // key → multiplicative modifier
        this._flats = {};         // key → additive modifier
        this._flags = new Set();  // boolean flags
        this.activeClass = DEFAULT_CLASS;
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

    getRandomChoices(count) {
        const available = SKILLS.filter(s => !this.acquired.includes(s.id));
        // Shuffle and take up to count
        const shuffled = available.sort(() => Math.random() - 0.5);
        return shuffled.slice(0, Math.min(count, shuffled.length));
    }

    acquireSkill(id) {
        const skill = SKILLS.find(s => s.id === id);
        if (!skill || this.acquired.includes(id)) return null;
        skill.apply(this);
        this.acquired.push(id);
        this.level++;

        // First skill with a class definition sets the active class
        if (this.acquired.length === 1 && CLASS_DEFS[id]) {
            this.activeClass = CLASS_DEFS[id];
        }

        return skill;
    }

    hasClassAttack() {
        return this.activeClass && this.activeClass.attackType !== null;
    }

    getClassAttackCooldown() {
        return this.activeClass ? this.activeClass.attackCooldown : 0;
    }
}

export const SkillManager = new _SkillManager();
