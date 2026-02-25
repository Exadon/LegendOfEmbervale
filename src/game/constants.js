export const COLORS = Object.freeze({
    // Safe zones
    AMBER: 0xD4A04A,
    FOREST: 0x2D5A27,
    GOLD: 0xC9A834,

    // Shroud
    ELECTRIC_BLUE: 0x00BFFF,
    INDIGO: 0x1A0A2E,
    SHROUD_CORE: 0x0044AA,

    // UI
    FLAME_ORANGE: 0xFF6600,
    ELIXIR_CYAN: 0x00FFCC,

    // Entities
    WISP_YELLOW: 0xFFAA33,
    WISP_CORE: 0xFFDD88,
    CORRUPTION_PURPLE: 0x3A0055,
    CORRUPTION_SURFACE: 0x5500AA,

    // Fell
    FELL_FLESH: 0x4A2A4A,
    FELL_FUNGUS: 0x6B3A6B,
    FELL_EYES: 0xFF0044,
    // Scavenger
    SCAV_BROWN: 0x5A4030,
    SCAV_CLOTH: 0x887055,
    // Vukah
    VUKAH_FUR: 0x6B4A2A,
    VUKAH_TUSK: 0xDDCCAA,

    // Flame Shrine
    SHRINE_STONE: 0x8A7A6A,
    SHRINE_FLAME: 0xFF8833,

    // Lore Scroll
    SCROLL_PARCHMENT: 0xE8D8B0,
    SCROLL_INK: 0x3A2A1A,

    // Misc
    GROUND_BROWN: 0x3A2A1A,
    PLATFORM_STONE: 0x5A4A3A,
    PLAYER_AMBER: 0xD4A04A,
    SKY_DARK: 0x0D0D1A,
    VEIN_GLOW: 0x00FFCC,
    BAR_BG: 0x222222,
    BAR_FLAME_FULL: 0xFF6600,
    BAR_FLAME_LOW: 0xFF0000,
    DASH_COOLDOWN: 0x444444,
    DASH_READY: 0xFFCC00,
});

// ─── Biomes ───
// Each biome defines visuals, enemy pools, and ground tint.
// Distance thresholds in world pixels from player start.
export const BIOMES = Object.freeze([
    {
        id: 'springlands',
        name: 'The Springlands',
        subtitle: 'Ruins of the outer settlements',
        startDistance: 0,
        skyColor: 0x0D0D1A,
        groundTint: 0x3A2A1A,
        platformTint: 0x5A4A3A,
        treeTint: 0x2D5A27,
        enemies: ['fell_critter', 'scavenger'],
        scrollChance: 0.12,
        shrineChance: 0.06,
    },
    {
        id: 'revelwood',
        name: 'Revelwood',
        subtitle: 'The Blackmire stretches ahead',
        startDistance: 4000,
        skyColor: 0x0A0F0A,
        groundTint: 0x2A3A1A,
        platformTint: 0x4A5A3A,
        treeTint: 0x1A3A12,
        enemies: ['fell_footsoldier', 'fell_critter', 'fell_vine', 'vine_spitter'],
        scrollChance: 0.15,
        shrineChance: 0.05,
    },
    {
        id: 'nomad_highlands',
        name: 'Nomad Highlands',
        subtitle: 'Vukah territory — tread carefully',
        startDistance: 10000,
        skyColor: 0x1A1020,
        groundTint: 0x5A4A3A,
        platformTint: 0x7A6A5A,
        treeTint: 0x3A3A2A,
        enemies: ['vukah_warrior', 'fell_footsoldier', 'fell_ranger', 'vukah_shaman', 'vukah_berserker'],
        scrollChance: 0.15,
        shrineChance: 0.04,
    },
    {
        id: 'kindlewastes',
        name: 'The Kindlewastes',
        subtitle: 'Queen Jezmina\'s scorched domain',
        startDistance: 18000,
        skyColor: 0x1A0F05,
        groundTint: 0x6A5030,
        platformTint: 0x8A7050,
        treeTint: 0x5A4A20,
        enemies: ['fell_ranger', 'vukah_warrior', 'scavenger_pyreblade', 'vukah_shaman', 'skullflame', 'pyrebat'],
        scrollChance: 0.18,
        shrineChance: 0.04,
    },
    {
        id: 'hollow',
        name: 'The Hollow',
        subtitle: 'Restless dead stir in the deep',
        startDistance: 28000,
        skyColor: 0x0A0A15,
        groundTint: 0x2A2A3A,
        platformTint: 0x4A4A5A,
        treeTint: 0x3A3A4A,
        enemies: ['hollow_skeleton', 'hollow_mage', 'hollow_reaper', 'skullflame', 'soul_leech'],
        scrollChance: 0.18,
        shrineChance: 0.03,
    },
    {
        id: 'albaneve',
        name: 'Albaneve Summits',
        subtitle: 'The frozen peaks — warmth fades fast',
        startDistance: 38000,
        skyColor: 0x1A1A2A,
        groundTint: 0x8899AA,
        platformTint: 0x99AABB,
        treeTint: 0x6688AA,
        enemies: ['frost_fell', 'frost_scavenger', 'hollow_reaper', 'skullflame', 'frost_hulk'],
        scrollChance: 0.2,
        shrineChance: 0.03,
        coldDrain: 1,
    },
    {
        id: 'shroud_maw',
        name: "The Shroud's Maw",
        subtitle: 'Where the veil dissolves into void',
        startDistance: 50000,
        skyColor: 0x0A0010,
        groundTint: 0x330044,
        platformTint: 0x440055,
        treeTint: 0x220033,
        enemies: ['hollow_skeleton', 'corrupted_warrior', 'shroud_wraith', 'void_slime'],
        scrollChance: 0.2,
        shrineChance: 0.02,
        fogColor: 0x550066,
    },
]);

export const WORLD = Object.freeze({
    WIDTH: 50000,
    HEIGHT: 1080,
    GROUND_Y: 980,
    GROUND_HEIGHT: 100,
    SEGMENT_WIDTH: 600,
});

export const PLAYER = Object.freeze({
    SPEED: 200,
    JUMP_VELOCITY: -420,
    WIDTH: 28,
    HEIGHT: 48,
    START_X: 300,
    START_Y: 920,
});

export const FLAME_STEP = Object.freeze({
    SPEED: 600,
    DURATION: 200,
    COOLDOWN: 2500,
    INVINCIBLE_MS: 200,
});

export const SHROUD = Object.freeze({
    START_X: -200,
    BASE_SPEED: 65,
    SPEED_RAMP: 6,
    SPEED_MAX: 160,
    RAMP_INTERVAL: 25,
    SURGE_AMOUNT: 80,
    ALPHA_MIN: 0.5,
    ALPHA_MAX: 0.85,
    PULSE_DURATION: 2000,
    WIDTH: 800,
    HIT_ZONE_WIDTH: 10,
});

export const FLAME = Object.freeze({
    MAX: 100,
    DRAIN_NORMAL: 1.7,
    DRAIN_SHROUD: 4,
    DRAIN_CORRUPTION: 3,
});

export const FLAME_WISP = Object.freeze({
    RESTORE: 12,
    WIDTH: 16,
    HEIGHT: 16,
    BOB_RANGE: 8,
    BOB_DURATION: 1500,
    MAGNET_RANGE: 120,
    MAGNET_SPEED: 4,
    SHROUD_PUSH: 55,
});

export const FLAME_SHRINE = Object.freeze({
    RESTORE: 50,
    WIDTH: 64,
    HEIGHT: 64,
});

export const LORE_SCROLL = Object.freeze({
    WIDTH: 16,
    HEIGHT: 20,
    BOB_RANGE: 4,
    DISPLAY_DURATION: 6000, // ms to show lore text
});

// ─── Enemy Types ───
// Biome-specific enemies with different stats.
export const ENEMIES = Object.freeze({
    fell_critter: {
        name: 'Fell Critter',
        speed: 100,
        damage: 6,
        width: 18,
        height: 18,
        texture: 'fell_critter',
        flying: false,
    },
    fell_footsoldier: {
        name: 'Fell Footsoldier',
        speed: 70,
        damage: 18,
        width: 24,
        height: 36,
        texture: 'fell_footsoldier',
        flying: false,
    },
    fell_vine: {
        name: 'Fell Vicious Vine',
        speed: 0,       // stationary
        damage: 10,
        width: 20,
        height: 32,
        texture: 'fell_vine',
        flying: false,
        stationary: true,
    },
    fell_ranger: {
        name: 'Fell Ranger',
        speed: 55,
        damage: 12,
        width: 22,
        height: 34,
        texture: 'fell_ranger',
        flying: false,
    },
    scavenger: {
        name: 'Scavenger Scalper',
        speed: 90,
        damage: 6,
        width: 22,
        height: 36,
        texture: 'scavenger',
        flying: false,
    },
    scavenger_pyreblade: {
        name: 'Scavenger Pyreblade',
        speed: 75,
        damage: 20,
        width: 24,
        height: 36,
        texture: 'scav_pyreblade',
        flying: false,
    },
    vukah_warrior: {
        name: 'Vukah Warrior',
        speed: 65,
        damage: 22,
        width: 28,
        height: 40,
        texture: 'vukah_warrior',
        flying: false,
    },
    vukah_shaman: {
        name: 'Vukah Shaman',
        speed: 40,
        damage: 8,
        width: 24,
        height: 38,
        texture: 'vukah_shaman',
        flying: false,
        shaman: true,
    },
    hollow_skeleton: {
        name: 'Hollow Skeleton',
        speed: 85,
        damage: 10,
        width: 22,
        height: 36,
        texture: 'hollow_skeleton',
        flying: false,
        reassemble: true,
    },
    hollow_mage: {
        name: 'Hollow Mage',
        speed: 35,
        damage: 6,
        width: 20,
        height: 34,
        texture: 'hollow_mage',
        flying: false,
        shroudPocket: true,
    },
    hollow_reaper: {
        name: 'Hollow Reaper',
        speed: 110,
        damage: 25,
        width: 26,
        height: 40,
        texture: 'hollow_reaper',
        flying: false,
        teleport: true,
    },
    frost_fell: {
        name: 'Frost Fell',
        speed: 60,
        damage: 14,
        width: 22,
        height: 34,
        texture: 'frost_fell',
        flying: false,
        freezeAura: true,
    },
    frost_scavenger: {
        name: 'Frost Scavenger',
        speed: 75,
        damage: 16,
        width: 24,
        height: 36,
        texture: 'frost_scavenger',
        flying: false,
    },
    skullflame: {
        name: 'Skullflame',
        speed: 120,
        damage: 18,
        width: 32,
        height: 32,
        texture: 'skullflame',
        flying: false,
        elite: true,
        hitsToKill: 2,
        elixirDrop: true,
    },
    shroud_wraith: {
        name: 'Shroud Wraith',
        speed: 180,
        damage: 8,
        width: 22,
        height: 36,
        texture: 'hollow_reaper',
        flying: false,
        hitsToKill: 1,
        phaseThrough: true,
    },
    corrupted_warrior: {
        name: 'Corrupted Warrior',
        speed: 50,
        damage: 20,
        width: 28,
        height: 42,
        texture: 'hollow_skeleton',
        flying: false,
        hitsToKill: 4,
        elixirDrop: true,
        shields: true,
    },
    void_slime: {
        name: 'Void Slime',
        speed: 40,
        damage: 12,
        width: 24,
        height: 24,
        texture: 'fell_critter',
        flying: false,
        hitsToKill: 1,
        splits: true,
        flameDrainOnContact: 5,
    },
    // ─── Phase B2: 5 new enemy types ───
    vine_spitter: {
        name: 'Vine Spitter',
        speed: 0,
        damage: 10,
        width: 22,
        height: 28,
        texture: 'vine_spitter',
        flying: false,
        stationary: true,
        ranged: true,
        fireInterval: 2500,
    },
    vukah_berserker: {
        name: 'Vukah Berserker',
        speed: 65,
        damage: 20,
        width: 28,
        height: 32,
        texture: 'vukah_berserker',
        flying: false,
        berserker: true,
    },
    pyrebat: {
        name: 'Pyrebat',
        speed: 90,
        damage: 14,
        width: 24,
        height: 16,
        texture: 'pyrebat',
        flying: true,
        diveBomb: true,
    },
    soul_leech: {
        name: 'Soul Leech',
        speed: 35,
        damage: 6,
        width: 20,
        height: 24,
        texture: 'soul_leech',
        flying: false,
        flameDrainOnContact: 10,
    },
    frost_hulk: {
        name: 'Frost Hulk',
        speed: 28,
        damage: 18,
        width: 32,
        height: 40,
        texture: 'frost_hulk',
        flying: false,
        hitsToKill: 3,
        freezeAura: true,
    },
});

// ─── Enemy Sprites (reuse Elthen character sprites with tints) ───
export const ENEMY_SPRITES = Object.freeze({
    fell_critter: {
        spriteKey: 'rogue',
        isAtlas: false,
        idleAnim: 'rogue_idle',
        moveAnim: 'rogue_move',
        displaySize: 44,
        tint: 0xAA44CC,
    },
    fell_footsoldier: {
        spriteKey: 'barbarian',
        isAtlas: true,
        idleAnim: 'barbarian_idle',
        moveAnim: 'barbarian_move',
        displaySize: 62,
        tint: 0x8844AA,
    },
    fell_vine: {
        spriteKey: 'fell_vine_sheet',
        isAtlas: false,
        idleAnim: 'fell_vine_idle',
        moveAnim: 'fell_vine_idle',
        displaySize: 76,
        tint: null,
    },
    fell_ranger: {
        spriteKey: 'elven_archeress',
        isAtlas: true,
        idleAnim: 'elven_archeress_idle',
        moveAnim: 'elven_archeress_move',
        displaySize: 56,
        tint: 0x6633AA,
    },
    scavenger: {
        spriteKey: 'elite_swordsman',
        isAtlas: true,
        idleAnim: 'elite_swordsman_idle',
        moveAnim: 'elite_swordsman_move',
        displaySize: 62,
        tint: 0xBB6644,
    },
    scavenger_pyreblade: {
        spriteKey: 'pyromancer',
        isAtlas: false,
        idleAnim: 'pyromancer_idle',
        moveAnim: 'pyromancer_move',
        displaySize: 56,
        tint: 0xFF4422,
    },
    vukah_warrior: {
        spriteKey: 'monk',
        isAtlas: true,
        idleAnim: 'monk_idle',
        moveAnim: 'monk_move',
        displaySize: 68,
        tint: 0xCC4433,
    },
    vukah_shaman: {
        spriteKey: 'necromancer',
        isAtlas: false,
        idleAnim: 'necromancer_idle',
        moveAnim: 'necromancer_move',
        displaySize: 64,
        tint: 0x44AA44,
    },
    hollow_skeleton: {
        spriteKey: 'skeletal_warrior',
        isAtlas: false,
        idleAnim: 'skeletal_warrior_idle',
        moveAnim: 'skeletal_warrior_move',
        displaySize: 62,
        tint: null,
    },
    hollow_mage: {
        spriteKey: 'skeletal_mage',
        isAtlas: false,
        idleAnim: 'skeletal_mage_idle',
        moveAnim: 'skeletal_mage_move',
        displaySize: 58,
        tint: 0x6644AA,
    },
    hollow_reaper: {
        spriteKey: 'death_sprite',
        isAtlas: false,
        idleAnim: 'death_sprite_idle',
        moveAnim: 'death_sprite_move',
        displaySize: 68,
        tint: 0x4444AA,
    },
    frost_fell: {
        spriteKey: 'ice_elemental',
        isAtlas: false,
        idleAnim: 'ice_elemental_idle',
        moveAnim: 'ice_elemental_move',
        displaySize: 58,
        tint: null,
    },
    frost_scavenger: {
        spriteKey: 'rotting_soldier',
        isAtlas: true,
        idleAnim: 'rotting_soldier_idle',
        moveAnim: 'rotting_soldier_move',
        displaySize: 62,
        tint: 0x88CCFF,
    },
    skullflame: {
        spriteKey: 'skullflame',
        isAtlas: false,
        idleAnim: 'skullflame_idle',
        moveAnim: 'skullflame_idle',
        displaySize: 76,
        tint: null,
    },
});

export const WRAITH = Object.freeze({
    SPAWN_DISTANCE: 40,
    BASE_INTERVAL: 12,
    MIN_INTERVAL: 4,
});

export const CORRUPTION_POOL = Object.freeze({
    WIDTH: 80,
    HEIGHT: 12,
    SLOW_FACTOR: 0.5,
});

export const ELIXIR = Object.freeze({
    MINE_TIME: 1.5,
    VEIN_WIDTH: 32,
    VEIN_HEIGHT: 40,
});

export const CINDER_VESSEL = Object.freeze({
    CHANCE: 0.008,
    RESTORE: 30,
    INVINCIBLE_MS: 3000,
});

export const PARALLAX = Object.freeze({
    SPEEDS: [0.05, 0.15, 0.3, 0.5],
});

export const DECORATION = Object.freeze({
    CHANCE: 0.7,
    MIN_PER_SEGMENT: 1,
    MAX_PER_SEGMENT: 4,
    TYPES: [
        { key: 'deco_tree_256', weight: 3, width: 64, height: 256, groundLevel: true },
        { key: 'deco_tree_128', weight: 4, width: 64, height: 128, groundLevel: true },
        { key: 'deco_tree_64', weight: 4, width: 32, height: 64, groundLevel: true },
        { key: 'deco_rockpile_128', weight: 2, width: 64, height: 128, groundLevel: true },
        { key: 'deco_rockpile_64', weight: 3, width: 32, height: 64, groundLevel: true },
        { key: 'deco_rockpile_32', weight: 3, width: 16, height: 32, groundLevel: true },
        { key: 'deco_fence1', weight: 2, width: 32, height: 32, groundLevel: true },
        { key: 'deco_fence2', weight: 2, width: 32, height: 32, groundLevel: true },
        { key: 'deco_grass1', weight: 5, width: 32, height: 32, groundLevel: true },
        { key: 'deco_bones',  weight: 3, width: 32, height: 16, groundLevel: true },
        { key: 'deco_torch',  weight: 2, width: 16, height: 48, groundLevel: true },
        { key: 'deco_rubble', weight: 3, width: 48, height: 24, groundLevel: true },
    ],
});

export const DOUBLE_JUMP = Object.freeze({
    MAX_AIR_JUMPS: 1,
    VELOCITY: -380,
});

export const WALL_SLIDE = Object.freeze({
    MAX_FALL_SPEED: 60,
    JUMP_VELOCITY_X: 250,
    JUMP_VELOCITY_Y: -380,
});

export const GLIDER = Object.freeze({
    MAX_FALL_SPEED: 60,
    HORIZONTAL_BOOST: 1.3,
});

export const GROUND_SLAM = Object.freeze({
    VELOCITY: 800,
    STUN_RADIUS: 180,
    STUN_DURATION: 2000,
});

export const FLAME_BURST = Object.freeze({
    COST: 15,
    COOLDOWN: 5000,
    RADIUS: 160,
    PUSH_FORCE: 300,
    BANISH_RADIUS: 80,
});

export const COMBO = Object.freeze({
    WINDOW: 3000,
    BONUS_ELIXIR_THRESHOLD: 5,
});

export const CRUMBLING_PLATFORM = Object.freeze({
    STAND_TIME: 1500,
    REGEN_TIME: 8000,
    SHAKE_THRESHOLD: 0.5,
    CHANCE: 0.15,
});

export const ENEMY_AI = Object.freeze({
    PATROL_RANGE: 60,
    PATROL_SPEED_MULT: 0.3,
    CHASE_RANGE: 300,
    TELEGRAPH_DURATION: 200,
    RANGER_KITE_DISTANCE: 150,
    VUKAH_BURST_MULT: 1.5,
    VUKAH_BURST_DURATION: 500,
});

export const FELL_MUTATION = Object.freeze({
    TIME_TO_MUTATE: 8000,
    SPEED_MULT: 1.4,
});

export const ELIXIR_CORRUPTION = Object.freeze({
    PER_MINE: 15,
    PER_ELIXIR_BONUS: 10,
    DECAY_RATE: 2,
    THRESHOLD_MEDIUM: 40,
    THRESHOLD_HIGH: 70,
    SPEED_BONUS: 0.2,
    DRAIN_PENALTY: 0.3,
});

export const CRAFTSPERSON = Object.freeze({
    CHANCE: 0.012,
    RESCUE_RADIUS: 200,
    RESCUE_TIME: 10000,
    TYPES: [
        { id: 'blacksmith', name: 'Blacksmith', reward: 'dash_damage', desc: '+10% dash damage permanently' },
        { id: 'alchemist', name: 'Alchemist', reward: 'full_flame', desc: 'Full flame + 5s shroud immunity' },
        { id: 'hunter', name: 'Hunter', reward: 'banish_all', desc: 'Banish all on-screen enemies' },
        { id: 'bard', name: 'Bard', reward: 'bard_blessing', desc: 'Shroud slowed 50% + flame regen for 30s' },
    ],
});

export const OBELISK = Object.freeze({
    CHANCE: 0.015,
    CORRECT_REWARD_FLAME: 20,
    CORRECT_REWARD_ELIXIR: 1,
    RIDDLES: [
        {
            question: 'Who warned that the Elixir cravings never cease?',
            correct: 'Balthazar',
            wrong: ['Jezmina', 'Elin'],
        },
        {
            question: 'Who scattered the Cinder Vessels across Embervale?',
            correct: 'Queen Jezmina',
            wrong: ['Balthazar', 'Vorgoth'],
        },
        {
            question: 'What does the Shroud spring from?',
            correct: 'Elixir Wells',
            wrong: ['The Flame', 'Ancient Obelisks'],
        },
        {
            question: 'Who poisoned the King with Elixir-laced wine?',
            correct: 'Vorgoth',
            wrong: ['Jezmina', 'Balthazar'],
        },
        {
            question: 'What do the Vukah worship?',
            correct: 'A stone pillar',
            wrong: ['The Flame', 'The Elixir'],
        },
        {
            question: 'Who said "After Me, The Flood"?',
            correct: 'The Mysterious Wanderer',
            wrong: ['Balthazar', 'Queen Jezmina'],
        },
        {
            question: 'What did the Ancients leave behind when they expired?',
            correct: 'A Spark',
            wrong: ['An Elixir Well', 'A Cinder Vessel'],
        },
        {
            question: 'Who is flame-touched and has walked the Hollow Halls for centuries?',
            correct: 'Alden Crowley',
            wrong: ['Athalan Skree', 'Balthazar'],
        },
        {
            question: 'What was the first Elixir Well built to create?',
            correct: 'Salvation',
            wrong: ['Weapons', 'The Shroud'],
        },
        {
            question: 'How long did the first Elixir Well take to construct?',
            correct: 'Seven years',
            wrong: ['Three years', 'One year'],
        },
        {
            question: 'Where does the Cinder Vault lie?',
            correct: 'Beneath the Pillars of Creation',
            wrong: ['In the Springlands', 'Atop Albaneve'],
        },
        {
            question: 'What happened to Pikemead\'s Reach?',
            correct: 'It has fallen',
            wrong: ['It was rebuilt', 'It still stands'],
        },
        {
            question: 'Who renounced all authority and called himself Sameth?',
            correct: 'Samuel the Thief',
            wrong: ['Vorgoth', 'Alden Crowley'],
        },
        {
            question: 'What did the Drak call humans?',
            correct: 'Soft ones with weak skulls',
            wrong: ['Fire walkers', 'Stone breakers'],
        },
        {
            question: 'Who cried out and was answered by the Void?',
            correct: 'Sorcerer Ikora',
            wrong: ['Queen Jezmina', 'Balthazar'],
        },
        // ─── Sprint 11 additions ───
        {
            question: 'What lies beyond Albaneve Summits?',
            correct: "The Shroud's Maw",
            wrong: ['The Cinder Vault', 'The Hollow Halls'],
        },
        {
            question: "According to the Ancient Obelisk, what was the Elixir's true function inside the Wells?",
            correct: 'A sedative to keep something ancient below from waking',
            wrong: ['A reward for those who dug deepest', 'Proof of Ancient mercy toward humanity'],
        },
        {
            question: 'What did Elin, Watchkeeper say the Shroud hunts by?',
            correct: 'The warmth of living blood',
            wrong: ['Sound and movement', 'The light of the Flame'],
        },
        {
            question: 'What did Vorgoth believe the Elixir Wells truly were?',
            correct: 'Cages for humanity',
            wrong: ['Beacons of salvation', 'Fonts of the Void'],
        },
        {
            question: 'What did Alden Crowley fail to do that the new Flameborn must achieve?',
            correct: 'Seal the final Well',
            wrong: ['Defeat Vorgoth', "Reach the Shroud's Maw"],
        },
        {
            question: "What does the Unknown addict's journal claim they became by the final, dateless entry?",
            correct: 'The Well itself',
            wrong: ['A servant of the Void', 'Lost beyond all finding'],
        },
        {
            question: 'What did Alden Crowley do upon hearing what sleeps beneath the lowest chamber?',
            correct: 'He turned and ran',
            wrong: ['He sealed it and wept', 'He called out to it and received no answer'],
        },
        {
            question: 'Who is the Stonefist?',
            correct: 'The first Vukah chieftain',
            wrong: ['An Ancient', 'Vorgoth'],
        },
        {
            question: 'What did Sorcerer Ikora pay for power?',
            correct: 'A terrible price of flesh',
            wrong: ['Her name', 'The Flame itself'],
        },
        {
            question: 'What lies beneath the deepest Elixir Well?',
            correct: 'Something older than the Ancients',
            wrong: ['The Cinder Vault', 'A second Shroud'],
        },
        {
            question: 'What did the Wanderer leave behind at the deepest Well?',
            correct: 'A warning for the next Flameborn',
            wrong: ['Their weapon', 'An unsealed door'],
        },
        {
            question: 'What did the Ancients seal inside the Elixir Wells?',
            correct: 'Something older than themselves',
            wrong: ['Limitless elixir', 'The last Void spark'],
        },
        {
            question: 'What happened to the Ancient Sentinel when the Wells broke?',
            correct: 'It watched too long — something watched back',
            wrong: ['It was destroyed', 'It joined the survivors'],
        },
        {
            question: 'What did Sorcerer Ikora say the Void truly was, beyond mere darkness?',
            correct: 'A silence that remembered being alone',
            wrong: ['A hunger older than the Flame', 'A mirror of everything the world had lost'],
        },
        {
            question: 'What does the Vukah War Chant say makes a new chieftain?',
            correct: 'The lone survivor of the stone pillar ritual',
            wrong: ['The warrior who drinks the most Elixir', 'The one who slays an Ancient'],
        },
        // ─── Phase O additions ───
        {
            question: 'What did Vorgoth walk into willingly, believing he would master it?',
            correct: 'The Void',
            wrong: ['The Shroud', 'The deepest Elixir Well'],
        },
        {
            question: 'According to the Revelwood Chronicle, what happened to Mire-Captain Calyx in the Blackmire?',
            correct: 'He drank Shroud-tainted flame and forgot his name',
            wrong: ['He sealed the Blackmire and perished', 'He led the survivors south'],
        },
        {
            question: 'What did Elin, Watchkeeper say the thing at the Shroud\'s Maw truly was?',
            correct: 'A wound in the world',
            wrong: ['A creature older than the Ancients', 'The last Void spark'],
        },
        {
            question: 'What does Alden Crowley say he cannot collect, despite centuries of trying?',
            correct: 'An ending',
            wrong: ['Peace', 'The truth about the Ancients'],
        },
        {
            question: 'What did Balthazar confess he cannot make himself believe?',
            correct: 'That someone else would have built the first Well anyway',
            wrong: ['That the Elixir was ever truly safe', 'That Vorgoth acted alone'],
        },
        {
            question: 'What does the Flame Shrine promise to remember even after the Flameborn is gone?',
            correct: 'Their name',
            wrong: ['Their deeds', 'Their sacrifice'],
        },
    ],
});

export const FLAME_ALTAR = Object.freeze({
    ELIXIR_PER_LEVEL: [5, 12, 22, 35, 50, 70, 95, 125],
    MAX_LEVEL: 8,
    BONUSES: [
        { desc: '+2 max flame', maxFlame: 2 },
        { desc: '+5% base speed', speedMult: 0.05 },
        { desc: 'Shroud starts 5% slower', shroudSlow: 0.05 },
        { desc: '+3 max flame', maxFlame: 3 },
        { desc: '+10% wisp restore', wispBonus: 0.10 },
        { desc: 'Shroud starts 5% slower', shroudSlow: 0.05 },
        { desc: '+5 max flame', maxFlame: 5 },
        { desc: 'Start with a free Cinder Vessel', freeVessel: true },
    ],
});

export const DEADLY_SHROUD = Object.freeze({
    CHANCE: 0.03,
    DRAIN_MULT: 3,
    WIDTH: 80,
    HEIGHT: 60,
    DURATION: 12000,
});

export const UNDEAD_HAND = Object.freeze({
    CHANCE: 0.04,
    WIDTH: 32,
    HEIGHT: 32,
    GRAB_DURATION: 1500,
    SLOW_MULT: 0.3,
    FLAME_DRAIN: 5,
});

export const PROGRESSION_BAR = Object.freeze({
    HEIGHT: 4,
    DEPTH: 250,
    BIOME_COLORS: [0x44AA44, 0x6B4A2A, 0xBBAA88, 0xFF4422, 0x6666AA, 0x88CCFF],
    SHROUD_WARN_DISTANCE: 250,
    SHROUD_WARN_MAX_ALPHA: 0.4,
});

export const AUDIO = Object.freeze({
    SHROUD_HUM_FREQ: 60,
    FLAME_CRACKLE_DURATION: 0.08,
});

export const MUSIC = Object.freeze({
    MENU_VOLUME: 0.5,
    GAME_VOLUME: 0.4,
    SHROUD_MAX_VOLUME: 0.6,
    CROSSFADE_MS: 2000,
    BIOME_TRACKS: {
        springlands: 'music_springlands',
        revelwood: 'music_revelwood',
        nomad_highlands: 'music_highlands',
        kindlewastes: 'music_kindlewastes',
        hollow: 'music_kindlewastes',
        albaneve: 'music_highlands',
        shroud_maw: 'music_shroud',
    },
});

export const NEAR_DEATH = Object.freeze({
    FLAME_THRESHOLD: 5,
    SLOWMO_DURATION: 500,
    SLOWMO_SCALE: 0.3,
    COOLDOWN: 5000,
});

export const GHOST_RUN = Object.freeze({
    RECORD_INTERVAL: 1000,
    GHOST_ALPHA: 0.2,
    GHOST_TINT: 0x4488FF,
});

export const SURVIVOR = Object.freeze({
    CHANCE: 0.03,
    INTERACTION_RANGE: 60,
    BUFF_DURATION: 10000,
    BUFFS: [
        { id: 'flame_regen', name: 'Flame Regen', desc: '+5 flame/s', value: 5 },
        { id: 'speed', name: 'Swiftness', desc: '+30% speed', value: 0.3 },
        { id: 'shroud_slow', name: 'Shroud Ward', desc: '-20% shroud speed', value: 0.2 },
    ],
    DIALOGUES: [
        '"The Flame still burns... barely. Take this blessing, wanderer."',
        '"I thought I was the last one. Here, this will help you survive."',
        '"My campfire will not last the night. Please, carry this ward."',
        '"The Shroud took everything. But hope? Hope is harder to kill."',
    ],
});

export const SHROUD_MUTATION = Object.freeze({
    INTERVAL: 60000,
    WARNING_LEAD: 3000,
    TYPES: [
        { id: 'spectral_wave', name: 'Spectral Wave', desc: 'Enemies surge from the Shroud' },
        { id: 'tendril_reach', name: 'Tendril Reach', desc: 'Damage zones ahead of the wall' },
        { id: 'speed_surge', name: 'Speed Surge', desc: 'Shroud accelerates briefly' },
        { id: 'deadly_tendrils', name: 'Deadly Tendrils', desc: 'Red shroud zones ahead' },
    ],
});

export const RELIC_UPGRADE_COST = 20;

export const RELIC = Object.freeze({
    MAX_ACTIVE: 3,
    SHRINE_DROP_CHANCE: 0.25,
    BANISH_DROP_CHANCE: 0.02,
    DEFINITIONS: [
        {
            id: 'ember_ward', name: 'Ember Ward', icon: '\u{1F6E1}',
            desc: 'Flame drains 40% slower', drawback: 'Enemies 25% faster',
            color: 0xFF8833,
            apply: { flameDrainMult: 0.6 },
            drawbackApply: { enemySpeedMult: 1.25 },
            tier2: { flameDrainMult: 0.45 },
        },
        {
            id: 'shroud_pact', name: 'Shroud Pact', icon: '\u{1F311}',
            desc: 'Double elixir from mining', drawback: 'Shroud 30% faster',
            color: 0x4488FF,
            apply: { elixirMult: 2 },
            drawbackApply: { shroudSpeedMult: 1.3 },
            tier2: { elixirMult: 3 },
        },
        {
            id: 'glass_flame', name: 'Glass Flame', icon: '\u{1F4A0}',
            desc: '+50% dash speed', drawback: 'Enemy damage +50%',
            color: 0xFF4444,
            apply: { dashSpeedMult: 1.5 },
            drawbackApply: { enemyDamageMult: 1.5 },
            tier2: { dashSpeedMult: 2.0 },
        },
        {
            id: 'flame_siphon', name: 'Flame Siphon', icon: '\u{1F525}',
            desc: '+8 flame per banish', drawback: 'Flame drains 30% faster',
            color: 0xFFAA33,
            apply: { banishFlameFlat: 8 },
            drawbackApply: { flameDrainMult: 1.3 },
            tier2: { banishFlameFlat: 14 },
        },
        {
            id: 'elixir_lens', name: 'Elixir Lens', icon: '\u{1F48E}',
            desc: 'Wisps restore 50% more', drawback: 'Shroud 15% faster',
            color: 0x00FFCC,
            apply: { wispRestoreMult: 1.5 },
            drawbackApply: { shroudSpeedMult: 1.15 },
            tier2: { wispRestoreMult: 2.0 },
        },
        {
            id: 'iron_will', name: 'Iron Will', icon: '\u{2694}',
            desc: 'Enemy damage halved', drawback: 'Flame drains 50% faster',
            color: 0xCCCCCC,
            apply: { enemyDamageMult: 0.5 },
            drawbackApply: { flameDrainMult: 1.5 },
            tier2: { enemyDamageMult: 0.35 },
        },
        {
            id: 'wind_runner', name: 'Wind Runner', icon: '\u{1F4A8}',
            desc: '+40% movement speed', drawback: 'Wisps restore 30% less',
            color: 0x88DDFF,
            apply: { moveSpeedMult: 1.4 },
            drawbackApply: { wispRestoreMult: 0.7 },
            tier2: { moveSpeedMult: 1.7 },
        },
        {
            id: 'void_echo', name: 'Void Echo', icon: '\u{1F30C}',
            desc: 'Dash cooldown 40% faster', drawback: 'Combo window halved',
            color: 0xAA44FF,
            apply: { dashCooldownMult: 0.6 },
            drawbackApply: { comboWindowMult: 0.5 },
            tier2: { dashCooldownMult: 0.35 },
        },
        // ─── Legendary Relics (Sprint 11) — no tier2 ───
        {
            id: 'shroud_heart', name: 'Shroud Heart', icon: '\u{1F49C}',
            desc: 'Shroud heals you (+3 flame/s in shroud)', drawback: 'Enemies +100% HP',
            color: 0xAA00FF,
            legendary: true,
            apply: { shroudHeal: 3 },
            drawbackApply: { enemyHpMult: 2 },
        },
        {
            id: 'time_fracture', name: 'Time Fracture', icon: '\u23F3',
            desc: 'Ground slam freezes all enemies for 2s', drawback: 'Dash disabled',
            color: 0x00CCFF,
            legendary: true,
            apply: { slamFreeze: true },
            drawbackApply: { dashDisabled: true },
        },
        {
            id: 'elixir_bloom', name: 'Elixir Bloom', icon: '\u{1F338}',
            desc: 'Every 10 elixir mined spawns a free wisp', drawback: 'Flame drain 2x',
            color: 0xFF88CC,
            legendary: true,
            apply: { elixirWispSpawn: 10 },
            drawbackApply: { flameDrainMult: 2 },
        },
        // ─── Phase B1: 6 new standard relics ───
        {
            id: 'crimson_pyre', name: 'Crimson Pyre', icon: '\u{1F525}',
            desc: 'Banishing creates a 2s fire zone', drawback: 'Flame drains 20% faster',
            color: 0xFF2200,
            apply: { pyreOnBanish: true },
            drawbackApply: { flameDrainMult: 1.2 },
            tier2: { pyreOnBanish: true, pyreDuration: 3000 },
        },
        {
            id: 'soul_anchor', name: 'Soul Anchor', icon: '\u2693',
            desc: 'Once per run, survive lethal drain at 1 flame', drawback: 'Max flame -20',
            color: 0x8888FF,
            apply: { deathSave: true },
            drawbackApply: { maxFlamePenalty: 20 },
            tier2: { deathSave: true, deathSaveFlame: 10 },
        },
        {
            id: 'wraithbane', name: 'Wraithbane', icon: '\u{1F5E1}',
            desc: 'Dashing through enemy slows it 60% for 3s', drawback: 'Dash cooldown +50%',
            color: 0xAAFF88,
            apply: { dashSlow: true },
            drawbackApply: { dashCooldownMult: 1.5 },
            tier2: { dashSlow: true, dashSlowDuration: 5000 },
        },
        {
            id: 'mirrored_spark', name: 'Mirrored Spark', icon: '\u{1FA9E}',
            desc: 'Combo window doubled', drawback: 'Wisps restore 40% less',
            color: 0xCCDDFF,
            apply: { comboWindowMult: 2.0 },
            drawbackApply: { wispRestoreMult: 0.6 },
            tier2: { comboWindowMult: 3.0 },
        },
        {
            id: 'ember_crown', name: 'Ember Crown', icon: '\u{1F451}',
            desc: 'Class Q cooldown -40%', drawback: 'Enemies +50% HP',
            color: 0xFFDD00,
            apply: { attackCooldownMult: 0.6 },
            drawbackApply: { enemyHpMult: 1.5 },
            tier2: { attackCooldownMult: 0.4 },
        },
        {
            id: 'chain_banish', name: 'Chain Banish', icon: '\u{1F517}',
            desc: 'Banish splashes 8 dmg to enemies within 80px', drawback: 'Elixir gain -1 per pickup (min 1)',
            color: 0xFF8844,
            apply: { chainBanish: true, chainRadius: 80 },
            drawbackApply: { elixirPickupPenalty: 1 },
            tier2: { chainBanish: true, chainRadius: 120 },
        },
    ],
});

export const CHALLENGE_SHRINE = Object.freeze({
    CHANCE: 0.02,
    ARENA_DURATION: 15000,
    TYPES: [
        { id: 'survive', name: 'Endurance Trial', desc: 'Survive for 15 seconds', target: 0, timer: 15000, difficulty: 'easy' },
        { id: 'kill', name: 'Slaughter Trial', desc: 'Banish 5 enemies in 15 seconds', target: 5, timer: 15000, difficulty: 'easy' },
        { id: 'gauntlet', name: 'Gauntlet Trial', desc: 'Survive 3 waves of enemies', target: 3, timer: 45000, difficulty: 'medium' },
        { id: 'elite_hunt', name: 'Elite Hunt', desc: 'Slay the skullflame elite', target: 1, timer: 25000, difficulty: 'medium' },
        { id: 'flame_keeper', name: 'Flame Keeper', desc: 'Keep flame above 30 for 15 seconds', target: 0, timer: 15000, difficulty: 'medium' },
        { id: 'speed_kill', name: 'Speed Kill', desc: 'Banish 10 enemies in 10 seconds', target: 10, timer: 10000, difficulty: 'hard' },
        { id: 'no_escape', name: 'No Escape', desc: 'Survive shroud creeping inward', target: 0, timer: 20000, difficulty: 'hard' },
        { id: 'boss_skirmish', name: 'Boss Skirmish', desc: 'Defeat a weakened boss', target: 1, timer: 30000, difficulty: 'hard' },
    ],
    REWARDS: { flame: 30, elixir: 1 },
    REWARD_TIERS: {
        easy:   { flame: 30, elixir: 1, relicChance: 0 },
        medium: { flame: 50, elixir: 2, relicChance: 0.5 },
        hard:   { flame: 80, elixir: 3, relicChance: 1.0 },
    },
    CURSED_CHANCE: 0.10,
    CURSED_MODIFIERS: [
        { id: 'flame_drain_cursed', name: 'Cursed Drain', desc: '+10 flame/s drain', bonusElixir: 0.5 },
        { id: 'no_dash_cursed', name: 'Cursed Stillness', desc: 'Dash disabled', bonusElixir: 0.5 },
        { id: 'half_flame_cursed', name: 'Cursed Ember', desc: 'Start at 50% flame', bonusElixir: 0.5 },
    ],
});

export const BOSS = Object.freeze({
    revelwood: {
        id: 'revelwood',
        name: 'Fell Vine Queen',
        health: 15,
        spriteKey: 'fell_vine_sheet',
        scale: 2,
        tint: null,
        attackInterval: 2000,
        phase2SpeedMult: 1.5,
        phase3SpeedMult: 2.0,
        vineSpawnCount: 2,
        vineSweepWidth: 200,
        vineBombCount: 3,
        combos: [['vineSweep', 'vineSpawn', 'vineBomb'], ['vineSpawn', 'vineBomb']],
    },
    nomad_highlands: {
        id: 'nomad_highlands',
        name: 'Vukah Chieftain',
        health: 20,
        spriteKey: 'monk',
        scale: 2,
        tint: 0xCC4433,
        attackInterval: 2500,
        phase2SpeedMult: 1.4,
        phase3SpeedMult: 2.0,
        chargeSpeed: 350,
        groundPoundRadius: 180,
        warCryDuration: 800,
        combos: [['charge', 'groundPound', 'warCry'], ['groundPound', 'warCry']],
    },
    kindlewastes: {
        id: 'kindlewastes',
        name: 'Scavenger Pyrelord',
        health: 18,
        spriteKey: 'pyromancer',
        scale: 2,
        tint: 0xFF4422,
        attackInterval: 1800,
        phase2SpeedMult: 1.6,
        phase3SpeedMult: 2.2,
        projectileSpeed: 300,
        dashSpeed: 400,
        flamePillarCount: 3,
        combos: [['dash', 'projectile', 'flamePillar'], ['projectile', 'flamePillar']],
    },
    hollow: {
        id: 'hollow',
        name: 'Hollow Cyclops',
        health: 22,
        spriteKey: 'skeleton_king',
        scale: 1.3,
        tint: 0x6666AA,
        attackInterval: 2200,
        phase2SpeedMult: 1.3,
        phase3SpeedMult: 1.8,
        groundPoundRadius: 220,
        summonCount: 2,
        eyeBeamWidth: 150,
        idleAnim: 'skeleton_king_idle',
        moveAnim: 'skeleton_king_move',
        attackAnim: 'skeleton_king_attack',
        combos: [['summon', 'groundPound', 'eyeBeam'], ['groundPound', 'eyeBeam']],
    },
    albaneve: {
        id: 'albaneve',
        name: 'Frost Wyvern',
        health: 25,
        spriteKey: 'wind_elemental',
        scale: 3,
        tint: 0x88CCFF,
        attackInterval: 2000,
        phase2SpeedMult: 1.5,
        phase3SpeedMult: 2.1,
        breathWidth: 250,
        diveBombSpeed: 400,
        iceRainCount: 5,
        idleAnim: 'wind_elemental_idle',
        moveAnim: 'wind_elemental_move',
        attackAnim: 'wind_elemental_attack',
        combos: [['breath', 'diveBomb', 'iceRain'], ['diveBomb', 'iceRain']],
    },
    shroud_maw: {
        id: 'shroud_maw',
        name: 'The Corrupted Sentinel',
        health: 30,
        spriteKey: 'necromancer',
        scale: 2.5,
        tint: 0x660088,
        attackInterval: 1600,
        phase2SpeedMult: 1.8,
        phase3SpeedMult: 2.2,
        shroudPulseRadius: 200,
        cloneCount: 2,
        combos: [['shroudPulse', 'corruptionTether', 'cloneStrike'], ['corruptionTether', 'cloneStrike']],
    },
});

export const GENERATION = Object.freeze({
    PLATFORM_CHANCE: 0.6,
    VEIN_CHANCE: 0.4,
    WISP_CHANCE: 0.5,
    CORRUPTION_CHANCE: 0.0,
    CORRUPTION_RAMP: 0.03,
    MAX_PLATFORMS_PER_SEGMENT: 2,
    LOOKAHEAD_SEGMENTS: 4,
    ENEMY_CHANCE: 0.60,
    ENEMY_RAMP: 0.02,
    ENEMY_DISTANCE_RAMP: 0.00003,
    MAX_ENEMIES_PER_SEGMENT: 3,
    ENEMY_CAP: 40,
});

// ─── Lore Fragments ───
// Actual quotes / paraphrases from Enshrouded canon.
export const LORE_ENTRIES = Object.freeze([
    { author: 'Balthazar, Alchemist', text: 'We awoke a slumbering malady at the earth\'s core when we built the first Elixir Well, and distilled the first Elixir.' },
    { author: 'Balthazar, Alchemist', text: 'One mustn\'t drink it, despite its benefits. The cravings never cease. Must have more... always more.' },
    { author: 'Balthazar, Alchemist', text: 'The subject slept yet could be awakened, dead yet alive, untouched by time — a Flame\'s soul in a mortal body.' },
    { author: 'Queen Jezmina', text: 'My brother Vorgoth poisoned the King with Elixir-laced wine. His mind fell to the Shroud. Now his army marches south.' },
    { author: 'Queen Jezmina', text: 'I must scatter the Cinder Vessels across Embervale — for every soul who cannot reach the Springlands in time.' },
    { author: 'The Mysterious Wanderer', text: 'After Me, The Flood.' },
    { author: 'Unknown Scribe', text: 'The Shroud springs from the Elixir Wells. It flows toward civilization like a nebula from the abyss.' },
    { author: 'Elin, Watchkeeper', text: 'The walls are alive. I saw them move — tendrils reaching, grasping. The Shroud is not merely fog. It hungers.' },
    { author: 'Ancient Obelisk', text: 'When an Ancient expires, it leaves behind a Spark. Its light joins the Flame, imbuing it with all knowledge.' },
    { author: 'Vukah War Chant', text: 'VUKARRRRRR!!! The tusked ones worship their stone pillar. The lone survivor is crowned the Brawler.' },
    { author: 'Alden Crowley, The Collector', text: 'I am flame-touched. I have walked the Hollow Halls for longer than I care to remember. The curse binds me still.' },
    { author: 'Athalan Skree, Hunter', text: 'The Vukah came from nowhere. Christophe never saw the blow. His head — clean off. I am haunted by it.' },
    { author: 'Unknown Miner', text: 'The fumes from the Well make my head spin and my eyes water. But the foreman says we must dig deeper.' },
    { author: 'Captain\'s Journal', text: 'The younger Ancients feel responsible for humanity. They opposed the elders to forge the Cinder Vault — our last hope.' },
    { author: 'Revelwood Chronicle', text: 'Pikemead\'s Reach has fallen. Lord Vorgoth\'s army of sickly soldiers barely lifted their feet as they marched.' },
    { author: 'Drak Scripture', text: 'The Ancients chose humans as the new gods. Weak skulls, break easily! Squishy bellies, soft and flabby!' },
    { author: 'Sophie, Moth\'s Grove', text: 'Dear sister, the Shroud has cut us apart. I pray the Flame still burns where you are. Do not lose hope.' },
    { author: 'Samuel the Thief', text: 'The Elixir made me a new man. I renounce all authority. Call me Sameth. The Age of Sameth begins.' },
    { author: 'Sorcerer Ikora', text: 'I cried out. The Void answered. It offered power through flesh — a terrible price I paid willingly.' },
    { author: 'Flame Shrine Inscription', text: 'The Flame watches over the fallen land and provides the Flameborn with the power to defy the Shroud.' },
    // ─── Expanded Lore (entries 21–38) ───
    { author: 'Balthazar, Alchemist', text: 'The first Elixir Well took seven years to construct. We believed we were building salvation. We were building our tomb.' },
    { author: 'Balthazar, Alchemist', text: 'The Flameborn are both our greatest hope and our deepest shame — mortal vessels carrying a fire that was never meant for human hands.' },
    { author: 'Queen Jezmina', text: 'The Cinder Vessels contain the essence of the Flame itself. I scatter them so that even in the darkest hour, the Flame may be rekindled.' },
    { author: 'Queen Jezmina', text: 'The Shroud reached the palace gates at dawn. My guard fell one by one. I write this so the world remembers we did not go quietly.' },
    { author: 'Captain\'s Journal', text: 'The Ancients were not born of this world. They came from beyond the stars, drawn by the spark of life in Embervale\'s soil.' },
    { author: 'Captain\'s Journal', text: 'The Cinder Vault lies beneath the Pillars of Creation. It was forged to outlast even the Ancients themselves — our final contingency.' },
    { author: 'Elin, Watchkeeper', text: 'The Hollow Halls stretch deeper than any map records. Those who venture past the third chamber never return with their minds intact.' },
    { author: 'Elin, Watchkeeper', text: 'The Shroud does not merely spread — it hunts. It moves faster toward the living, as if drawn by the warmth of their blood.' },
    { author: 'Alden Crowley, The Collector', text: 'I have walked this land for centuries, flame-touched and undying. Immortality is not a gift — it is a sentence without end.' },
    { author: 'Athalan Skree, Hunter', text: 'The Vukah worship a great stone pillar in the highlands. They believe it holds the spirit of their first chieftain, the Stonefist.' },
    { author: 'Drak Scripture', text: 'Before the soft ones came, the land was ours. Stone and tusk, fire and fury — this is the way of the Vukah, now and always.' },
    { author: 'Sorcerer Ikora', text: 'The Void does not speak in words. It speaks in visions — terrible, beautiful visions of a world unmade and reborn in silence.' },
    { author: 'Sorcerer Ikora', text: 'The Shroud is the Void\'s breath made manifest. Through it, the Void whispers promises to those desperate enough to listen.' },
    { author: 'Unknown Miner', text: 'We broke through to a cavern beneath the deepest Well. Something was already there — older than the Ancients, older than the Flame.' },
    { author: 'Revelwood Chronicle', text: 'The night Revelwood fell, the trees wept black sap. By morning, the Blackmire had swallowed everything south of Pikemead\'s Reach.' },
    { author: 'Sophie, Moth\'s Grove', text: 'We survive by rationing Flame-infused water and keeping the lanterns lit. If the light dies, we die with it. It is that simple.' },
    { author: 'Flame Shrine Inscription', text: 'The Ancients gave their lives to forge the Flame — a sacrifice of light against eternal darkness. Remember them.' },
    { author: 'Ancient Obelisk', text: 'When the Shroud devours the last ember, the Flameborn shall rise from the ashes of the old world and kindle the new.' },
    // ─── Phase G1: New Lore Entries ───
    { author: 'Vorgoth', text: 'The Wells were not built for salvation. They were built as cages — for us.' },
    { author: 'Vorgoth', text: 'The Void does not consume. It clarifies. What remains is truth.' },
    { author: 'The Mysterious Wanderer', text: 'I carried the Flame before you. I reached the deepest Well and could not seal it. I left a warning instead.' },
    { author: 'Sorcerer Ikora', text: 'When the Void answered, I saw not the future — only the absence of it. A silence that stretched to the end of all things.' },
    { author: 'Ancient Obelisk', text: 'The Wells were built to hold something down. The Ancients sealed it with their own essence — and it has been waiting ever since.' },
    { author: 'Alden Crowley, The Collector', text: 'I was chosen, as you are chosen now. My flame guttered at the final threshold. I could not cross it. Perhaps you can.' },
    { author: 'Unknown', text: 'Day 1: sharper than I have ever been. Day 7: one more vein, one more drop. Day — : I am the Well now.' },
    { author: 'Vukah War Chant', text: 'The soft ones flee the black fog. The Vukah do not flee. We do not run. We are the stone that the Shroud breaks upon.' },
    { author: 'Captain\'s Journal', text: 'When the Wells broke, the Sentinel watched too long. Something watched back. Now it wears the Sentinel\'s face.' },
    { author: 'Flame Shrine Inscription', text: 'She was the Revelwood herself — spirit of root and canopy. The Shroud did not kill her. It recruited her.' },
    // ─── Phase L: Lore Completion ───
    { author: 'Vorgoth', text: 'I walked into the Void willingly. I thought I would master it. I was wrong. Something else answered first.' },
    { author: 'The Mysterious Wanderer', text: 'The first Flameborn was not chosen by the Vault. She chose herself. She burned the brighter for it. I was the second. There was no third — until you.' },
    { author: 'Ancient Obelisk', text: 'The Void predates the Ancients. It predates the Flame. It is not darkness — darkness is merely its shadow. It is the silence before the first word.' },
    { author: 'Revelwood Chronicle', text: 'Mire-Captain Calyx survived the Blackmire by drinking Shroud-tainted flame. When he emerged, he had forgotten his name — but the fire obeyed him.' },
    { author: 'Drak Scripture', text: 'Gorruk Ironhide called no council and named no heir. He fought the Shroud alone for three dawns and three nights. On the fourth morning only the Shroud remained.' },
    { author: 'Elin, Watchkeeper', text: 'The thing at the Maw is not a creature. It is a wound — a place where the boundary between the world and the Void tore clean through.' },
    // ─── Phase N: Narrative Lore Pass ───
    { author: 'Vorgoth', text: 'I did not betray Embervale. I freed it. The Ancients dressed our chains as gifts. The Elixir was always ours — they simply convinced us to tend the lock.' },
    { author: 'Vorgoth', text: 'The Void spoke first through the Elixir, then through the cracks in the stone. By the time I understood what I had opened, I was already part of it. I did not lose myself to the Void. I walked in willingly.' },
    { author: 'The Mysterious Wanderer', text: 'They called me the First Flameborn. I refused the title then. I cannot refuse it now. I reached the deepest Well and flinched at what endured below. What waits there does not sleep. It endures.' },
    { author: 'Sorcerer Ikora', text: 'The Void did not show me the future. It showed me before the beginning — a silence so absolute that the concept of sound had never occurred to it. It was not cruel. It simply remembered being alone, and did not understand why that should have changed.' },
    { author: 'Ancient Obelisk', text: 'The Elixir was the sedative. We built the Wells to drive something downward — something that had been here long before us and would remain long after. The Elixir kept it dreaming. We trusted that would hold.' },
    { author: 'Captain\'s Journal', text: 'He was a shaft-digger before the breaking. Three days afterward, he crawled from the rubble — eyes alight, hands radiating heat that would not cool. He called it a gift. We recognised it as a wound.' },
    { author: 'Captain\'s Journal', text: 'The heat from the shattered Well fused to him. He radiates still. The Shroud follows him as a hound follows a scent — not because he commands it, but because it claimed him first. He has not realised this.' },
    { author: 'Alden Crowley, The Collector', text: 'I stood where you stand now, centuries past. The Flame burned in my chest as it burns in yours. When I reached the lowest chamber I heard what sleeps beneath it. I turned and ran. I am still running.' },
    { author: 'Unknown', text: 'Vorgoth shared the Elixir freely and called it liberation. By month two I would have harmed anyone for more. By month three I had. He never used the word addiction. I think that was deliberate.' },
    { author: 'Vukah War Chant', text: 'They sent runners south begging us to follow. I sent the runners back wearing the Shroud\'s own fog around their shoulders. The Vukah do not retreat from stone. We become the stone.' },
    // ─── Phase O: Final Lore Pass ───
    { author: 'Queen Jezmina', text: 'The Flameborn burns cold and steady — not the wild fire of Elixir, but something older. A controlled flame, patient as starlight. I do not know if they feel warmth or only give it.' },
    { author: 'Balthazar, Alchemist', text: 'If I had refused the commission to build the first Well, none of this would have happened. I tell myself that someone else would have built it. I am not sure I believe myself.' },
    { author: 'Unknown Survivor', text: 'My sister ran south three days ago. She said the Flame was still lit in Springlands. I am going north instead. Someone has to see what the Shroud is actually doing at the Wells.' },
    { author: 'Drak Scripture', text: 'The Vukah Chieftain does not fear the soft ones. He does not fear the Shroud. He fears only one thing — that the stone pillar will fall before he does. The stone outlasts all things.' },
    { author: 'Flame Shrine Inscription', text: 'Kneel here and give your name to the Flame. It will remember. When you are gone, when the world forgets you, the Flame will not.' },
    { author: 'Alden Crowley, The Collector', text: 'I have collected many things. Relics, scrolls, centuries. But the one thing I cannot collect is an ending. You carry that, Flameborn. I would trade everything I own for what you carry.' },
]);

export const SHRINE_INSCRIPTIONS = Object.freeze([
    'The Flame remembers what the Shroud devours.',
    'Rest here, Flameborn. The darkness cannot reach the light.',
    'In flame, we endure. In shadow, we are unmade.',
    'A thousand souls gave their light so this shrine might burn.',
    'The warmth you feel is the echo of the Ancients\' sacrifice.',
    'Even the longest night ends where the Flame still burns.',
    'Tend this fire well, wanderer. It is all that stands between you and the Void.',
    'The Shroud fears only two things: the Flame, and those who carry it.',
]);

export const BIOME_LORE = Object.freeze({
    springlands: { author: 'Elin, Watchkeeper', text: 'The Springlands were the last bastion of the old world — outer settlements clinging to the Flame\'s fading warmth.' },
    revelwood:   { author: 'Revelwood Chronicle', text: 'The Blackmire crept in overnight. By dawn, Revelwood was a graveyard of twisted roots and poisoned earth.' },
    nomad_highlands: { author: 'Athalan Skree, Hunter', text: 'Vukah drums echo across the highland peaks. They do not fear the Shroud — they worship the stone, and the stone endures.' },
    kindlewastes: { author: 'Queen Jezmina', text: 'My kingdom burns, yet the Flame endures. Let the Kindlewastes be a monument to what we sacrificed.' },
    hollow: { author: 'Alden Crowley, The Collector', text: 'The Hollow Halls stretch deeper than any map records. The restless dead do not sleep — they wait, and they remember.' },
    albaneve: { author: 'Elin, Watchkeeper', text: 'The Albaneve Summits are a frozen tomb. The cold seeps into your bones and steals the Flame from your very soul.' },
    shroud_maw: { author: 'Unknown Scribe', text: 'Beyond Albaneve lies the Shroud\'s Maw — where the veil between worlds grows thin, and the Corrupted Sentinel stands eternal watch.' },
});

// ─── Sprint 10: Prestige System ───
export const PRESTIGE = Object.freeze({
    MAX: 3,
    COST: 100,
    RELICS: [
        { id: 'ember_heart', name: 'Ember Heart', icon: '\u2665', desc: '+5 starting flame', startFlame: 5 },
        { id: 'void_mastery', name: 'Void Mastery', icon: '\u221E', desc: '-10% all cooldowns', cooldownMult: 0.9 },
        { id: 'shroud_touched', name: 'Shroud Touched', icon: '\u{1F300}', desc: 'Enemies drop 50% more wisps', wispDropMult: 1.5 },
    ],
});

// ─── Phase A: World Modifiers ───
export const RUN_MODIFIERS = Object.freeze([
    { id: 'glass_run',     name: 'Glass Run',      icon: '\u{1F48E}', tier: 'hard',   reward: 12, desc: 'Flame drains 2x faster',          apply: { flameDrainMult: 2.0 } },
    { id: 'no_altar',      name: 'No Altar',        icon: '\u{1F6AB}', tier: 'hard',   reward: 10, desc: 'Flame Altar bonuses disabled',     apply: { altarDisabled: true } },
    { id: 'no_dash',       name: 'No Flame Step',   icon: '\u{1F512}', tier: 'hard',   reward: 8,  desc: 'Dash is disabled this run',        apply: { dashDisabled: true } },
    { id: 'fast_shroud',   name: 'Fast Shroud',     icon: '\u{1F4A8}', tier: 'medium', reward: 7,  desc: 'Shroud moves 40% faster',          apply: { shroudSpeedMult: 1.4 } },
    { id: 'elite_surge',   name: 'Elite Surge',     icon: '\u{1F480}', tier: 'medium', reward: 7,  desc: 'Elites spawn 3x more often',       apply: { eliteSpawnMult: 3.0 } },
    { id: 'cursed_relics', name: 'Cursed Relics',   icon: '\u26E7',    tier: 'medium', reward: 6,  desc: 'Relics only drop from bosses',     apply: { relicsBossOnly: true } },
    { id: 'low_flame',     name: 'Low Flame',       icon: '\u{1F56F}', tier: 'easy',   reward: 4,  desc: 'Max flame capped at 50',           apply: { maxFlameCap: 50 } },
    { id: 'no_wisps',      name: 'No Wisps',        icon: '\u{1F311}', tier: 'easy',   reward: 4,  desc: 'Wisps restore no flame this run',  apply: { wispRestoreMult: 0 } },
    { id: 'slow_start',    name: 'Slow Start',      icon: '\u{1F422}', tier: 'easy',   reward: 3,  desc: 'Speed -20% for the first 1000m',  apply: { slowStartDist: 10000 } },
]);

// ─── Phase A: Endless Mode ───
export const ENDLESS = Object.freeze({
    LOOP_TRIGGER_DISTANCE: 55000,  // px, triggers loop after clearing shroud_maw
    HP_MULT_PER_LOOP:      0.25,   // +25% enemy HP per loop
    SPEED_MULT_PER_LOOP:   0.15,   // +15% enemy speed per loop
    SHROUD_RAMP_PER_LOOP:  0.20,   // +20% shroud base speed per loop
    ELIXIR_BONUS_PER_LOOP: 3,      // +3 lifetime elixir awarded on each loop
});

// ─── Sprint 10: Relic Synergies ───
export const RELIC_SYNERGIES = Object.freeze([
    {
        id: 'ironclad_ember',
        name: 'Ironclad Ember',
        requires: ['ember_ward', 'iron_will'],
        desc: '+15% max flame',
        apply: { maxFlameMult: 1.15 },
    },
    {
        id: 'siphon_dash',
        name: 'Siphon Dash',
        requires: ['flame_siphon', 'glass_flame'],
        desc: 'Each dash banishes nearest enemy',
        apply: { dashBanish: true },
    },
    {
        id: 'phantom_speed',
        name: 'Phantom Speed',
        requires: ['wind_runner', 'void_echo'],
        desc: 'Dash has no cooldown for 5s after kill',
        apply: { killDashRefresh: true },
    },
]);

// ─── Phase C3: Ending Narrative ───
export const ENDING_NARRATIVE = Object.freeze([
    {
        title: 'The Truth of the Wells',
        text: 'Long before the Shroud consumed Embervale, the Ancients built the Elixir Wells not for power — but to contain the Void. Each Well was a seal, a prison of light holding back the darkness that hungered beneath the world.',
    },
    {
        title: 'The Flood',
        text: 'Then came Vorgoth. Poisoned by ambition, he shattered the first Well. The Shroud poured forth like a black tide — the Void\'s breath freed at last. "After Me, The Flood," the Mysterious Wanderer had warned. No one listened.',
    },
    {
        title: 'The Cinder Vault',
        text: 'The youngest Ancients, desperate and defiant, forged the Cinder Vault beneath the Pillars of Creation. Within it, they kindled a Flameborn — a mortal vessel carrying a fire ancient enough to re-seal the broken Wells.',
    },
    {
        title: 'You Were the Key',
        text: 'Every run was not a desperate escape — it was a gathering. Each step you took, each ember you carried, each enemy you banished fed the Flame. The Shroud drove you forward because it feared what you were becoming.',
    },
    {
        title: 'The Flame Endures',
        text: 'The last Well is sealed. The Shroud recedes like a tide finding its shore. From the ruins of Embervale, survivors emerge into pale, trembling light. The Ancients are gone. But the Flame endures — carried now in mortal hands, where it was always meant to be.',
    },
]);

// ─── Phase E1: Difficulty Presets ───
export const DIFFICULTIES = Object.freeze({
    pilgrim:  { label: 'Pilgrim',  flameDrainMult: 0.65, enemySpeedMult: 0.80, enemyDamageMult: 0.70, enemyHpMult: 0.80 },
    standard: { label: 'Standard', flameDrainMult: 1.00, enemySpeedMult: 1.00, enemyDamageMult: 1.00, enemyHpMult: 1.00 },
    torment:  { label: 'Torment',  flameDrainMult: 1.60, enemySpeedMult: 1.30, enemyDamageMult: 1.50, enemyHpMult: 1.40 },
});

// ─── Phase J: Hazard Zones ───
export const HAZARD_ZONES = Object.freeze({
    lava_pool: {
        id: 'lava_pool',
        label: 'Lava Pool',
        color: 0xFF4400,
        alpha: 0.55,
        width: 160,
        height: 24,
        drainMult: 2.5,
        shroudPush: -40,
        elixirBonus: 15,
        description: 'Massive drain, but enemies slain here drop bonus elixir',
        biomes: ['kindlewastes', 'shroud_maw'],
        spawnChance: 0.10,
        minSegment: 8,
    },
    frost_ground: {
        id: 'frost_ground',
        label: 'Frost Ground',
        color: 0x88CCFF,
        alpha: 0.35,
        width: 200,
        height: 20,
        drainMult: 0.5,
        slideMult: 1.8,
        enemySpawnBonus: 0.3,
        description: 'Cold reduces drain, but more enemies are drawn to the ice',
        biomes: ['albaneve', 'hollow'],
        spawnChance: 0.12,
        minSegment: 10,
    },
    spike_trap: {
        id: 'spike_trap',
        label: 'Spike Field',
        color: 0x886644,
        alpha: 0.7,
        width: 100,
        height: 18,
        contactDrain: 12,
        contactCooldown: 1200,
        elixirBonus: 8,
        description: 'Painful to cross, but rewards those who survive',
        biomes: ['springlands', 'revelwood', 'nomad_highlands'],
        spawnChance: 0.08,
        minSegment: 4,
    },
});

export const PIT = Object.freeze({
    WIDTH: 110,
    SPIKE_CHANCE: 0.45,
    MIN_SEGMENT: 5,
    PIT_CHANCE: 0.22,
    SPIKE_DRAIN: 18,
    BOUNCE_VELOCITY: -700,
    FALL_THRESHOLD: 50,    // px below WORLD.GROUND_Y before bounce triggers
});

export const WATER = Object.freeze({
    PIT_CHANCE: 0.45,         // % of non-spike pits that become water pits
    BIOMES: ['springlands', 'revelwood', 'hollow', 'albaneve'],
    DEPTH: 80,                // px below WORLD.GROUND_Y for water floor
    SLOW_MULT: 0.55,          // velocity.x multiplier per frame while in water
    SURFACE_COLOR: 0x44AAFF,
    FILL_COLOR: 0x1A4E8A,
    FILL_ALPHA: 0.65,
});

export const BIRDS = Object.freeze({
    // Per-biome config. Omitted biomes get no birds.
    BIOMES: {
        springlands:     { color: 0x111111, count: 5, speedMin: 55,  speedMax: 100, bat: false },
        revelwood:       { color: 0x1A2A0A, count: 6, speedMin: 45,  speedMax: 85,  bat: false },
        nomad_highlands: { color: 0x221A0A, count: 4, speedMin: 70,  speedMax: 140, bat: false },
        kindlewastes:    { color: 0x3A1005, count: 4, speedMin: 80,  speedMax: 150, bat: true  },
        hollow:          { color: 0x2A0A3A, count: 4, speedMin: 60,  speedMax: 120, bat: true  },
        albaneve:        { color: 0xCCDDEE, count: 3, speedMin: 40,  speedMax: 80,  bat: false },
    },
    Y_MIN: 80,       // min screen Y (px from top of viewport)
    Y_MAX: 320,      // max screen Y
    WING_HALF: 9,    // base half-wingspan in px
    FLAP_MS: 380,    // ms per flap half-cycle
});

// ─── Phase J: Weather ───
export const WEATHER = Object.freeze({
    rain: {
        id: 'rain',
        label: 'Rain',
        drainBonus: 0,
        biomes: ['springlands', 'revelwood'],
        chance: 0.75,
        particle: { tint: 0x88AAFF, angle: { min: 260, max: 280 }, speed: 350, lifespan: 600, quantity: 2, alpha: { start: 0.5, end: 0 }, scaleX: 0.5, scaleY: 3 },
    },
    volcanic_ash: {
        id: 'volcanic_ash',
        label: 'Volcanic Ash',
        drainBonus: 0.5,
        biomes: ['kindlewastes'],
        chance: 0.40,
        particle: { tint: 0xFF5500, angle: { min: 240, max: 300 }, speed: 120, lifespan: 1200, quantity: 1, alpha: { start: 0.6, end: 0 }, scale: { start: 2, end: 0 } },
    },
    shadow_fog: {
        id: 'shadow_fog',
        label: 'Shadow Fog',
        drainBonus: 0.0,
        visibilityAlpha: 0.45,
        biomes: ['shroud_maw'],
        chance: 0.60,
        particle: { tint: 0x220044, speed: 20, lifespan: 3000, quantity: 1, alpha: { start: 0.3, end: 0 }, scale: { start: 6, end: 0 } },
    },
});
