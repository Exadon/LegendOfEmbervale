import { FLAME, SHROUD } from './constants.js';

class _GlobalState {
    constructor() {
        this.reset();
    }

    reset() {
        this._elixir = 0;
        this._flame = FLAME.MAX;
        this._shroudX = SHROUD.START_X;
        this._gameOver = false;
    }

    get elixir() { return this._elixir; }
    set elixir(val) { this._elixir = Math.max(0, val); }

    get flame() { return this._flame; }
    set flame(val) {
        this._flame = Math.max(0, Math.min(val, FLAME.MAX));
        if (this._flame <= 0) this._gameOver = true;
    }

    get shroudX() { return this._shroudX; }
    set shroudX(val) { this._shroudX = val; }

    get gameOver() { return this._gameOver; }
    set gameOver(val) { this._gameOver = val; }

    addElixir(amount = 1) {
        this._elixir += amount;
    }

    drainFlame(amount) {
        this.flame = this._flame - amount;
    }

    surgeShroud() {
        this._shroudX += SHROUD.SURGE_AMOUNT;
    }
}

export const GlobalState = new _GlobalState();
