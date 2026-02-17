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
        enemies: ['fell_footsoldier', 'fell_critter', 'fell_vine'],
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
        enemies: ['vukah_warrior', 'fell_footsoldier', 'fell_ranger', 'vukah_shaman'],
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
        enemies: ['fell_ranger', 'vukah_warrior', 'scavenger_pyreblade', 'vukah_shaman'],
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
        enemies: ['hollow_skeleton', 'hollow_mage', 'hollow_reaper'],
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
        enemies: ['frost_fell', 'frost_scavenger', 'hollow_reaper'],
        scrollChance: 0.2,
        shrineChance: 0.03,
        coldDrain: 1,
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
    BASE_SPEED: 30,
    SPEED_RAMP: 3,
    SPEED_MAX: 80,
    RAMP_INTERVAL: 30,
    SURGE_AMOUNT: 80,
    ALPHA_MIN: 0.5,
    ALPHA_MAX: 0.85,
    PULSE_DURATION: 2000,
    WIDTH: 800,
    HIT_ZONE_WIDTH: 10,
});

export const FLAME = Object.freeze({
    MAX: 100,
    DRAIN_NORMAL: 2,
    DRAIN_SHROUD: 4,
    DRAIN_CORRUPTION: 3,
});

export const FLAME_WISP = Object.freeze({
    RESTORE: 12,
    WIDTH: 16,
    HEIGHT: 16,
    BOB_RANGE: 8,
    BOB_DURATION: 1500,
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
        damage: 8,
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
        damage: 12,
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
});

// ─── Enemy Sprites (reuse Elthen character sprites with tints) ───
export const ENEMY_SPRITES = Object.freeze({
    fell_critter: {
        spriteKey: 'rogue',
        isAtlas: false,
        idleAnim: 'rogue_idle',
        moveAnim: 'rogue_move',
        displaySize: 24,
        tint: 0xAA44CC,
    },
    fell_footsoldier: {
        spriteKey: 'barbarian',
        isAtlas: true,
        idleAnim: 'barbarian_idle',
        moveAnim: 'barbarian_move',
        displaySize: 36,
        tint: 0x8844AA,
    },
    fell_vine: {
        spriteKey: 'fell_vine_sheet',
        isAtlas: false,
        idleAnim: 'fell_vine_idle',
        moveAnim: 'fell_vine_idle',
        displaySize: 48,
        tint: null,
    },
    fell_ranger: {
        spriteKey: 'elven_archeress',
        isAtlas: true,
        idleAnim: 'elven_archeress_idle',
        moveAnim: 'elven_archeress_move',
        displaySize: 32,
        tint: 0x6633AA,
    },
    scavenger: {
        spriteKey: 'elite_swordsman',
        isAtlas: true,
        idleAnim: 'elite_swordsman_idle',
        moveAnim: 'elite_swordsman_move',
        displaySize: 36,
        tint: 0xBB6644,
    },
    scav_pyreblade: {
        spriteKey: 'pyromancer',
        isAtlas: false,
        idleAnim: 'pyromancer_idle',
        moveAnim: 'pyromancer_move',
        displaySize: 32,
        tint: 0xFF4422,
    },
    vukah_warrior: {
        spriteKey: 'monk',
        isAtlas: true,
        idleAnim: 'monk_idle',
        moveAnim: 'monk_move',
        displaySize: 40,
        tint: 0xCC4433,
    },
    vukah_shaman: {
        spriteKey: 'monk',
        isAtlas: true,
        idleAnim: 'monk_idle',
        moveAnim: 'monk_move',
        displaySize: 38,
        tint: 0x44AA44,
    },
    hollow_skeleton: {
        spriteKey: 'elite_swordsman',
        isAtlas: true,
        idleAnim: 'elite_swordsman_idle',
        moveAnim: 'elite_swordsman_move',
        displaySize: 36,
        tint: 0x8888AA,
    },
    hollow_mage: {
        spriteKey: 'pyromancer',
        isAtlas: false,
        idleAnim: 'pyromancer_idle',
        moveAnim: 'pyromancer_move',
        displaySize: 34,
        tint: 0x6644AA,
    },
    hollow_reaper: {
        spriteKey: 'rogue',
        isAtlas: false,
        idleAnim: 'rogue_idle',
        moveAnim: 'rogue_move',
        displaySize: 40,
        tint: 0x4444AA,
    },
    frost_fell: {
        spriteKey: 'barbarian',
        isAtlas: true,
        idleAnim: 'barbarian_idle',
        moveAnim: 'barbarian_move',
        displaySize: 34,
        tint: 0x88BBFF,
    },
    frost_scavenger: {
        spriteKey: 'elite_swordsman',
        isAtlas: true,
        idleAnim: 'elite_swordsman_idle',
        moveAnim: 'elite_swordsman_move',
        displaySize: 36,
        tint: 0x6699CC,
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

export const TILE_FRAMES = Object.freeze({
    GROUND_TOP: 0,
    PLATFORM_STONE: 16,
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
    STUN_RADIUS: 150,
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

export const WINDOW_DEFS = Object.freeze({
    flame:     { w: 256, h: 24 },
    cooldowns: { w: 220, h: 34 },
    stats:     { w: 170, h: 50 },
    distance:  { w: 80,  h: 22 },
});

export const GRID = Object.freeze({
    DEFAULT_SIZE: 8,
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
        },
        {
            id: 'shroud_pact', name: 'Shroud Pact', icon: '\u{1F311}',
            desc: 'Double elixir from mining', drawback: 'Shroud 30% faster',
            color: 0x4488FF,
            apply: { elixirMult: 2 },
            drawbackApply: { shroudSpeedMult: 1.3 },
        },
        {
            id: 'glass_flame', name: 'Glass Flame', icon: '\u{1F4A0}',
            desc: '+50% dash speed', drawback: 'Enemy damage +50%',
            color: 0xFF4444,
            apply: { dashSpeedMult: 1.5 },
            drawbackApply: { enemyDamageMult: 1.5 },
        },
        {
            id: 'flame_siphon', name: 'Flame Siphon', icon: '\u{1F525}',
            desc: '+8 flame per banish', drawback: 'Flame drains 30% faster',
            color: 0xFFAA33,
            apply: { banishFlameFlat: 8 },
            drawbackApply: { flameDrainMult: 1.3 },
        },
        {
            id: 'elixir_lens', name: 'Elixir Lens', icon: '\u{1F48E}',
            desc: 'Wisps restore 50% more', drawback: 'Shroud 15% faster',
            color: 0x00FFCC,
            apply: { wispRestoreMult: 1.5 },
            drawbackApply: { shroudSpeedMult: 1.15 },
        },
        {
            id: 'iron_will', name: 'Iron Will', icon: '\u{2694}',
            desc: 'Enemy damage halved', drawback: 'Flame drains 50% faster',
            color: 0xCCCCCC,
            apply: { enemyDamageMult: 0.5 },
            drawbackApply: { flameDrainMult: 1.5 },
        },
        {
            id: 'wind_runner', name: 'Wind Runner', icon: '\u{1F4A8}',
            desc: '+40% movement speed', drawback: 'Wisps restore 30% less',
            color: 0x88DDFF,
            apply: { moveSpeedMult: 1.4 },
            drawbackApply: { wispRestoreMult: 0.7 },
        },
        {
            id: 'void_echo', name: 'Void Echo', icon: '\u{1F30C}',
            desc: 'Dash cooldown 40% faster', drawback: 'Combo window halved',
            color: 0xAA44FF,
            apply: { dashCooldownMult: 0.6 },
            drawbackApply: { comboWindowMult: 0.5 },
        },
    ],
});

export const CHALLENGE_SHRINE = Object.freeze({
    CHANCE: 0.02,
    ARENA_DURATION: 15000,
    TYPES: [
        { id: 'survive', name: 'Endurance Trial', desc: 'Survive for 15 seconds', target: 0 },
        { id: 'kill', name: 'Slaughter Trial', desc: 'Banish 5 enemies in 15 seconds', target: 5 },
    ],
    REWARDS: { flame: 30, elixir: 1 },
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
        vineSpawnCount: 2,
        vineSweepWidth: 200,
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
        chargeSpeed: 350,
        groundPoundRadius: 180,
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
        projectileSpeed: 300,
        dashSpeed: 400,
    },
    hollow: {
        id: 'hollow',
        name: 'Hollow Cyclops',
        health: 22,
        spriteKey: 'barbarian',
        scale: 2.5,
        tint: 0x6666AA,
        attackInterval: 2200,
        phase2SpeedMult: 1.3,
        groundPoundRadius: 220,
        summonCount: 2,
    },
    albaneve: {
        id: 'albaneve',
        name: 'Frost Wyvern',
        health: 25,
        spriteKey: 'fell_vine_sheet',
        scale: 2.5,
        tint: 0x88CCFF,
        attackInterval: 2000,
        phase2SpeedMult: 1.5,
        breathWidth: 250,
        diveBombSpeed: 400,
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
    ENEMY_CHANCE: 0.25,
    ENEMY_RAMP: 0.02,
    ENEMY_DISTANCE_RAMP: 0.00003,
    MAX_ENEMIES_PER_SEGMENT: 3,
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
});
