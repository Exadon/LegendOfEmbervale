import { FLAME, SHROUD } from './constants.js';
import { SkillManager } from './systems/SkillManager.js';
import { FlameAltar } from './systems/FlameAltar.js';

class _GlobalState {
    constructor() {
        this.reset();
    }

    reset() {
        this._elixir = 0;
        this._maxFlame = FLAME.MAX + FlameAltar.getMaxFlameBonus();
        this._flame = this._maxFlame;
        this._shroudX = SHROUD.START_X;
        this._gameOver = false;
        this._corruption = 0;
        SkillManager.reset();
    }

    get maxFlame() { return this._maxFlame; }

    get elixir() { return this._elixir; }
    set elixir(val) { this._elixir = Math.max(0, val); }

    get flame() { return this._flame; }
    set flame(val) {
        this._flame = Math.max(0, Math.min(val, this._maxFlame));
        if (this._flame <= 0) this._gameOver = true;
    }

    get shroudX() { return this._shroudX; }
    set shroudX(val) { this._shroudX = val; }

    get gameOver() { return this._gameOver; }
    set gameOver(val) { this._gameOver = val; }

    get corruption() { return this._corruption; }

    addCorruption(amount) {
        this._corruption = Math.min(100, this._corruption + amount);
    }

    decayCorruption(delta) {
        if (this._corruption > 0) {
            this._corruption = Math.max(0, this._corruption - delta);
        }
    }

    addElixir(amount = 1) {
        this._elixir += amount;
        FlameAltar.addElixir(amount);
    }

    drainFlame(amount) {
        this.flame = this._flame - amount;
    }

    surgeShroud() {
        this._shroudX += SHROUD.SURGE_AMOUNT;
    }
}

export const GlobalState = new _GlobalState();
