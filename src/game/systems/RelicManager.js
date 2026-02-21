import { RELIC, RELIC_SYNERGIES } from '../constants.js';
import { MetaProgression } from './MetaProgression.js';

export class RelicManager {
    constructor() {
        this.active = [];
        this.activeSynergies = new Set();
        this._synergyCallbacks = [];
    }

    getAvailableChoices(count = 2, includeLegendary = false) {
        const hasLegendary = this.active.some(r => r.legendary);
        const available = RELIC.DEFINITIONS.filter(
            def => !this.active.some(r => r.id === def.id) &&
                   (!def.legendary || (includeLegendary && !hasLegendary))
        );
        // Shuffle and pick
        const shuffled = available.sort(() => Math.random() - 0.5);
        return shuffled.slice(0, count);
    }

    acquire(def) {
        if (this.active.length >= RELIC.MAX_ACTIVE) return false;
        if (this.active.some(r => r.id === def.id)) return false;
        // Only 1 legendary allowed
        if (def.legendary && this.active.some(r => r.legendary)) return false;
        this.active.push(def);
        this.checkSynergies();
        return true;
    }

    /** Check for active synergy combos — Sprint 10 */
    checkSynergies() {
        const prevCount = this.activeSynergies.size;
        this.activeSynergies.clear();
        const ids = new Set(this.active.map(r => r.id));
        for (const syn of RELIC_SYNERGIES) {
            if (syn.requires.every(id => ids.has(id))) {
                this.activeSynergies.add(syn.id);
            }
        }
        // Notify if new synergy activated
        if (this.activeSynergies.size > prevCount) {
            for (const cb of this._synergyCallbacks) {
                cb([...this.activeSynergies]);
            }
        }
    }

    onSynergyActivated(cb) {
        this._synergyCallbacks.push(cb);
    }

    getSynergyDefs() {
        return RELIC_SYNERGIES.filter(s => this.activeSynergies.has(s.id));
    }

    /** Get effective apply value for a relic (tier2 if upgraded, else base) */
    _getApplyValue(relic, key) {
        if (MetaProgression.hasUpgrade(relic.id) && relic.tier2 && relic.tier2[key] !== undefined) {
            return relic.tier2[key];
        }
        return relic.apply && relic.apply[key] !== undefined ? relic.apply[key] : undefined;
    }

    /** Multiply all matching multiplier values from active relics (both apply and drawbackApply) */
    getMult(key) {
        let result = 1;
        for (const relic of this.active) {
            const applyVal = this._getApplyValue(relic, key);
            if (applyVal !== undefined) {
                result *= applyVal;
            }
            if (relic.drawbackApply && relic.drawbackApply[key] !== undefined) {
                result *= relic.drawbackApply[key];
            }
        }
        // Synergy multipliers
        for (const syn of this.getSynergyDefs()) {
            if (syn.apply && syn.apply[key] !== undefined) {
                result *= syn.apply[key];
            }
        }
        return result;
    }

    /** Sum all matching flat values from active relics */
    getFlat(key, defaultVal = 0) {
        let result = defaultVal;
        for (const relic of this.active) {
            const applyVal = this._getApplyValue(relic, key);
            if (applyVal !== undefined) {
                result += applyVal;
            }
            if (relic.drawbackApply && relic.drawbackApply[key] !== undefined) {
                result += relic.drawbackApply[key];
            }
        }
        return result;
    }

    /** Check if any active relic or synergy has a flag */
    getFlag(key) {
        for (const relic of this.active) {
            if (relic.apply && relic.apply[key]) return true;
            if (relic.drawbackApply && relic.drawbackApply[key]) return true;
        }
        for (const syn of this.getSynergyDefs()) {
            if (syn.apply && syn.apply[key]) return true;
        }
        return false;
    }

    canDrop() {
        return this.active.length < RELIC.MAX_ACTIVE;
    }

    reset() {
        this.active = [];
        this.activeSynergies.clear();
    }
}
