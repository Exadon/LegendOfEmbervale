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

    // Misc
    GROUND_BROWN: 0x3A2A1A,
    PLATFORM_STONE: 0x5A4A3A,
    PLAYER_AMBER: 0xD4A04A,
    SKY_DARK: 0x0D0D1A,
    VEIN_GLOW: 0x00FFCC,
    BAR_BG: 0x222222,
    BAR_FLAME_FULL: 0xFF6600,
    BAR_FLAME_LOW: 0xFF0000,
});

export const WORLD = Object.freeze({
    WIDTH: 3000,
    HEIGHT: 720,
    GROUND_Y: 620,
    GROUND_HEIGHT: 100,
});

export const PLAYER = Object.freeze({
    SPEED: 200,
    JUMP_VELOCITY: -420,
    WIDTH: 28,
    HEIGHT: 48,
    START_X: 300,
    START_Y: 560,
});

export const SHROUD = Object.freeze({
    START_X: -200,
    SPEED: 30,           // px/sec
    SURGE_AMOUNT: 80,    // px per elixir mine
    ALPHA_MIN: 0.5,
    ALPHA_MAX: 0.85,
    PULSE_DURATION: 2000, // ms
    WIDTH: 800,
    HIT_ZONE_WIDTH: 10,
});

export const FLAME = Object.freeze({
    MAX: 100,
    DRAIN_NORMAL: 2,     // per second
    DRAIN_SHROUD: 4,     // per second inside shroud
});

export const ELIXIR = Object.freeze({
    MINE_TIME: 1.5,      // seconds to mine
    VEIN_WIDTH: 32,
    VEIN_HEIGHT: 40,
});

export const PARALLAX = Object.freeze({
    SPEEDS: [0.05, 0.15, 0.3, 0.5],
});

export const AUDIO = Object.freeze({
    SHROUD_HUM_FREQ: 60,
    FLAME_CRACKLE_DURATION: 0.08,
});
