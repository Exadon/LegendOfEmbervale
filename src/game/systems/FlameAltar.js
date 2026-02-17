import { FLAME_ALTAR } from '../constants.js';

const STORAGE_KEY = 'elixirs-shadow-flame-altar';

class _FlameAltar {
    constructor() {
        this.level = 0;
        this.lifetimeElixir = 0;
        this._load();
    }

    _load() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const data = JSON.parse(raw);
                this.level = data.level || 0;
                this.lifetimeElixir = data.lifetimeElixir || 0;
            }
        } catch {}
    }

    _save() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                level: this.level,
                lifetimeElixir: this.lifetimeElixir,
            }));
        } catch {}
    }

    addElixir(amount = 1) {
        this.lifetimeElixir += amount;
        // Check for level up
        while (this.level < FLAME_ALTAR.MAX_LEVEL) {
            const threshold = FLAME_ALTAR.ELIXIR_PER_LEVEL[this.level];
            if (this.lifetimeElixir >= threshold) {
                this.level++;
            } else {
                break;
            }
        }
        this._save();
    }

    getMaxFlameBonus() {
        let bonus = 0;
        for (let i = 0; i < this.level; i++) {
            bonus += FLAME_ALTAR.BONUSES[i].maxFlame || 0;
        }
        return bonus;
    }

    getSpeedMult() {
        let mult = 0;
        for (let i = 0; i < this.level; i++) {
            mult += FLAME_ALTAR.BONUSES[i].speedMult || 0;
        }
        return 1 + mult;
    }

    getShroudSlowMult() {
        let slow = 0;
        for (let i = 0; i < this.level; i++) {
            slow += FLAME_ALTAR.BONUSES[i].shroudSlow || 0;
        }
        return 1 - slow;
    }

    getWispBonus() {
        let bonus = 0;
        for (let i = 0; i < this.level; i++) {
            bonus += FLAME_ALTAR.BONUSES[i].wispBonus || 0;
        }
        return 1 + bonus;
    }

    get maxLevel() { return FLAME_ALTAR.MAX_LEVEL; }

    startsWithVessel() {
        for (let i = 0; i < this.level; i++) {
            if (FLAME_ALTAR.BONUSES[i].freeVessel) return true;
        }
        return false;
    }

    getProgressToNext() {
        if (this.level >= FLAME_ALTAR.MAX_LEVEL) return { current: 0, needed: 0, pct: 1 };
        const needed = FLAME_ALTAR.ELIXIR_PER_LEVEL[this.level];
        const prevNeeded = this.level > 0 ? FLAME_ALTAR.ELIXIR_PER_LEVEL[this.level - 1] : 0;
        const current = this.lifetimeElixir - prevNeeded;
        const range = needed - prevNeeded;
        return { current, needed: range, pct: Math.min(1, current / range) };
    }
}

export const FlameAltar = new _FlameAltar();
