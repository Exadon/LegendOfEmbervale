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
        enemies: ['vukah_warrior', 'fell_footsoldier', 'fell_ranger'],
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
        enemies: ['fell_ranger', 'vukah_warrior', 'scavenger_pyreblade'],
        scrollChance: 0.18,
        shrineChance: 0.04,
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
    fell_vine: null,  // stays procedural (plant enemy)
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
});

export const WRAITH = Object.freeze({
    SPAWN_DISTANCE: 40,
    BASE_INTERVAL: 12,
    MIN_INTERVAL: 4,
});

export const CORRUPTION = Object.freeze({
    WIDTH: 80,
    HEIGHT: 12,
    SLOW_FACTOR: 0.5,
});

export const ELIXIR = Object.freeze({
    MINE_TIME: 1.5,
    VEIN_WIDTH: 32,
    VEIN_HEIGHT: 40,
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

export const AUDIO = Object.freeze({
    SHROUD_HUM_FREQ: 60,
    FLAME_CRACKLE_DURATION: 0.08,
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
]);
