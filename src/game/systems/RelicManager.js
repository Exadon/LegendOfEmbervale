import { RELIC } from '../constants.js';

export class RelicManager {
    constructor() {
        this.active = [];
    }

    getAvailableChoices(count = 2) {
        const available = RELIC.DEFINITIONS.filter(
            def => !this.active.some(r => r.id === def.id)
        );
        // Shuffle and pick
        const shuffled = available.sort(() => Math.random() - 0.5);
        return shuffled.slice(0, count);
    }

    acquire(def) {
        if (this.active.length >= RELIC.MAX_ACTIVE) return false;
        if (this.active.some(r => r.id === def.id)) return false;
        this.active.push(def);
        return true;
    }

    /** Multiply all matching multiplier values from active relics (both apply and drawbackApply) */
    getMult(key) {
        let result = 1;
        for (const relic of this.active) {
            if (relic.apply && relic.apply[key] !== undefined) {
                result *= relic.apply[key];
            }
            if (relic.drawbackApply && relic.drawbackApply[key] !== undefined) {
                result *= relic.drawbackApply[key];
            }
        }
        return result;
    }

    /** Sum all matching flat values from active relics */
    getFlat(key, defaultVal = 0) {
        let result = defaultVal;
        for (const relic of this.active) {
            if (relic.apply && relic.apply[key] !== undefined) {
                result += relic.apply[key];
            }
            if (relic.drawbackApply && relic.drawbackApply[key] !== undefined) {
                result += relic.drawbackApply[key];
            }
        }
        return result;
    }

    /** Check if any active relic has a flag */
    getFlag(key) {
        for (const relic of this.active) {
            if (relic.apply && relic.apply[key]) return true;
            if (relic.drawbackApply && relic.drawbackApply[key]) return true;
        }
        return false;
    }

    canDrop() {
        return this.active.length < RELIC.MAX_ACTIVE;
    }

    reset() {
        this.active = [];
    }
}
