/**
 * Class Definitions — maps each class ID to its sprite, animations, and Q attack config.
 *
 * spriteKey    – texture key loaded in Preloader
 * isAtlas      – true if loaded via this.load.atlas (JSON), false if spritesheet
 * frameSize    – native frame pixel width (for display scaling)
 * frameHeight  – (optional) native frame pixel height if non-square; defaults to frameSize
 * displaySize  – (optional) override display size in pixels; default = max(48, frameSize*0.75)
 * feetRatio    – (optional) 0-1 ratio of where the character's feet sit in the frame (0=top, 1=bottom)
 * idleAnim     – animation key for idle
 * moveAnim     – animation key for movement
 * attackAnim   – animation key for the Q special attack (null = no class attack)
 * attackName   – display name for HUD
 * attackCooldown – ms cooldown
 * attackType   – dispatcher key used in Level1._handleClassAttack()
 * ... extra params per attack type
 */

export const CLASS_DEFS = Object.freeze({
    barbarian: {
        id: 'barbarian',
        className: 'Barbarian',
        color: 0xFF4444,
        description: 'Kill-chaining, melee, self-sustain',
        spriteKey: 'barbarian',
        isAtlas: true,
        frameSize: 96,
        displaySize: 112,
        feetRatio: 0.58,
        idleAnim: 'barbarian_idle',
        moveAnim: 'barbarian_move',
        attackAnim: 'barbarian_spin',
        attackName: 'Spin Attack',
        attackCooldown: 8000,
        attackType: 'aoe_banish',
        attackRadius: 120,
        stunRadius: 180,
        stunDuration: 2000,
    },

    wizard: {
        id: 'wizard',
        className: 'Wizard',
        color: 0x4488FF,
        description: 'AoE damage, cooldowns, elemental',
        spriteKey: 'elite_mage',
        isAtlas: true,
        frameSize: 64,
        frameHeight: 32,
        displaySize: 104,
        feetRatio: 0.90,
        idleAnim: 'elite_mage_idle',
        moveAnim: 'elite_mage_move',
        attackAnim: 'elite_mage_attack3',
        attackName: 'Arcane Blast',
        attackCooldown: 10000,
        attackType: 'aoe_banish',
        attackRadius: 200,
        stunRadius: 0,
        stunDuration: 0,
        useBlastVFX: true,
    },

    ranger: {
        id: 'ranger',
        className: 'Ranger',
        color: 0x44DD66,
        description: 'Mobility, ranged, evasion',
        spriteKey: 'elven_archeress',
        isAtlas: true,
        frameSize: 64,
        frameHeight: 32,
        displaySize: 104,
        feetRatio: 0.90,
        idleAnim: 'elven_archeress_idle',
        moveAnim: 'elven_archeress_move',
        attackAnim: 'elven_archeress_take_aim',
        attackName: 'Arrow Rain',
        attackCooldown: 8000,
        attackType: 'screen_stun',
        stunDuration: 3000,
    },

    tank: {
        id: 'tank',
        className: 'Tank',
        color: 0xCCCCCC,
        description: 'Defense, damage reduction, parry',
        spriteKey: 'elite_knight',
        isAtlas: true,
        frameSize: 96,
        displaySize: 108,
        feetRatio: 0.60,
        idleAnim: 'elite_knight_idle',
        moveAnim: 'elite_knight_move',
        attackAnim: 'elite_knight_block',
        attackName: 'Shield Block',
        attackCooldown: 12000,
        attackType: 'shield',
        shieldDuration: 4000,
    },

    healer: {
        id: 'healer',
        className: 'Healer',
        color: 0x88DDFF,
        description: 'Flame sustain, wisps, auras',
        spriteKey: 'royal_mage',
        isAtlas: true,
        frameSize: 32,
        idleAnim: 'royal_mage_idle',
        moveAnim: 'royal_mage_move',
        attackAnim: 'royal_mage_attack',
        attackName: 'Heal Pulse',
        attackCooldown: 15000,
        attackType: 'heal',
        healAmount: 30,
        drainReduction: 0.5,
        drainReductionDuration: 5000,
    },

    assassin: {
        id: 'assassin',
        className: 'Assassin',
        color: 0xAA44FF,
        description: 'Speed, positioning, burst',
        spriteKey: 'elven_assassin',
        isAtlas: true,
        frameSize: 64,
        frameHeight: 32,
        displaySize: 104,
        feetRatio: 0.90,
        idleAnim: 'elven_assassin_idle',
        moveAnim: 'elven_assassin_move',
        attackAnim: 'elven_assassin_disappear',
        attackName: 'Shadow Blink',
        attackCooldown: 7000,
        attackType: 'blink',
        blinkDistance: 150,
    },

    adventurer: {
        id: 'adventurer',
        className: 'Adventurer',
        color: 0xFFCC00,
        description: 'Jack of all trades — generic survival',
        spriteKey: 'adventurer',
        isAtlas: false,
        frameSize: 32,
        idleAnim: 'adventurer_idle',
        moveAnim: 'adventurer_move',
        attackAnim: null,
        attackName: null,
        attackCooldown: 0,
        attackType: null,
    },
});

/** Default class before any class is selected — uses the adventurer sprite */
export const DEFAULT_CLASS = CLASS_DEFS.adventurer;
