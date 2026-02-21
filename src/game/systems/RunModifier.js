/**
 * RunModifier — singleton that holds the active run modifier for the current run.
 * Set from ModifierSelect, cleared on game-over or boss rush end.
 */
export class RunModifier {
    static active = null;

    static set(mod) { this.active = mod; }
    static clear()  { this.active = null; }

    static getFlag(key)          { return !!this.active?.apply?.[key]; }
    static getFlat(key, def = 0) { return this.active?.apply?.[key] ?? def; }
}
