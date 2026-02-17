import { COLORS, PLAYER, ELIXIR, SHROUD, WORLD, CORRUPTION_POOL, ENEMIES, LORE_SCROLL } from '../constants.js';

export class TextureGenerator {
    /**
     * Generate all placeholder textures for the game.
     * Call once from Preloader scene.
     *
     * Note: ground, platform, background layers, flame_wisp, and flame_shrine
     * are now loaded from real art assets in Preloader.preload() and _extractGroundTexture().
     */
    static generateAll(scene) {
        this.generatePlayer(scene);
        this.generateShroudTile(scene);
        this.generateElixirVein(scene);
        this.generateFlameIcon(scene);
        this.generateElixirIcon(scene);
        this.generateCorruptionPool(scene);
        this.generateFellCreatures(scene);
        this.generateScavengers(scene);
        this.generateVukah(scene);
        this.generateLoreScroll(scene);
        this.generateGlider(scene);
    }

    static generatePlayer(scene) {
        const g = scene.make.graphics({ add: false });
        // Body
        g.fillStyle(COLORS.PLAYER_AMBER);
        g.fillRect(4, 8, 20, 32);
        // Head
        g.fillStyle(0xE8C080);
        g.fillRect(8, 0, 12, 12);
        // Eyes
        g.fillStyle(0x222222);
        g.fillRect(10, 3, 3, 3);
        g.fillRect(16, 3, 3, 3);
        // Legs
        g.fillStyle(0x8B6B3A);
        g.fillRect(6, 40, 7, 8);
        g.fillRect(16, 40, 7, 8);
        g.generateTexture('player', PLAYER.WIDTH, PLAYER.HEIGHT);
        g.destroy();
    }

    static generateShroudTile(scene) {
        const g = scene.make.graphics({ add: false });
        // Base indigo fill
        g.fillStyle(COLORS.INDIGO);
        g.fillRect(0, 0, 64, 64);
        // Swirling blue wisps
        g.fillStyle(COLORS.SHROUD_CORE);
        g.fillCircle(20, 15, 10);
        g.fillCircle(45, 40, 12);
        g.fillCircle(10, 50, 8);
        // Electric highlights
        g.fillStyle(COLORS.ELECTRIC_BLUE);
        g.fillCircle(30, 30, 5);
        g.fillCircle(50, 15, 4);
        g.fillCircle(15, 55, 3);
        g.generateTexture('shroud_tile', 64, 64);
        g.destroy();
    }

    static generateElixirVein(scene) {
        const g = scene.make.graphics({ add: false });
        // Crystal body
        g.fillStyle(COLORS.VEIN_GLOW);
        // Main crystal shape (diamond-ish)
        g.fillTriangle(16, 0, 0, 24, 32, 24);
        g.fillRect(4, 24, 24, 16);
        // Inner glow
        g.fillStyle(0x80FFE0);
        g.fillTriangle(16, 6, 8, 22, 24, 22);
        // Base
        g.fillStyle(COLORS.PLATFORM_STONE);
        g.fillRect(2, 36, 28, 4);
        g.generateTexture('elixir_vein', ELIXIR.VEIN_WIDTH, ELIXIR.VEIN_HEIGHT);
        g.destroy();
    }

    static generateFlameIcon(scene) {
        const g = scene.make.graphics({ add: false });
        g.fillStyle(COLORS.FLAME_ORANGE);
        g.fillTriangle(8, 0, 0, 16, 16, 16);
        g.fillStyle(0xFFAA00);
        g.fillTriangle(8, 4, 4, 14, 12, 14);
        g.generateTexture('flame_icon', 16, 16);
        g.destroy();
    }

    static generateElixirIcon(scene) {
        const g = scene.make.graphics({ add: false });
        g.fillStyle(COLORS.ELIXIR_CYAN);
        g.fillTriangle(8, 0, 2, 12, 14, 12);
        g.fillRect(4, 12, 8, 4);
        g.generateTexture('elixir_icon', 16, 16);
        g.destroy();
    }

    static generateCorruptionPool(scene) {
        const w = CORRUPTION_POOL.WIDTH;
        const h = CORRUPTION_POOL.HEIGHT;
        const g = scene.make.graphics({ add: false });
        g.fillStyle(COLORS.CORRUPTION_PURPLE);
        g.fillRoundedRect(0, 0, w, h, h / 2);
        g.fillStyle(COLORS.CORRUPTION_SURFACE);
        g.fillRoundedRect(w * 0.2, h * 0.25, w * 0.6, h * 0.5, h * 0.2);
        g.fillStyle(0x8800DD);
        g.fillCircle(20, 5, 2);
        g.fillCircle(55, 7, 2);
        g.fillCircle(38, 4, 2);
        g.generateTexture('corruption_pool', w, h);
        g.destroy();
    }

    // ─── Fell Creatures (Shroud-corrupted) ───

    static generateFellCreatures(scene) {
        // Fell Critter — small scurrying fungal rat
        let g = scene.make.graphics({ add: false });
        g.fillStyle(COLORS.FELL_FLESH);
        g.fillRect(2, 6, 14, 8);
        g.fillStyle(COLORS.FELL_FUNGUS);
        g.fillCircle(5, 5, 4);  // fungal growth on back
        g.fillCircle(12, 4, 3);
        g.fillStyle(COLORS.FELL_EYES);
        g.fillRect(13, 8, 2, 2);
        g.fillStyle(0x3A1A3A);
        g.fillRect(2, 14, 4, 4); // legs
        g.fillRect(12, 14, 4, 4);
        g.generateTexture('fell_critter', 18, 18);
        g.destroy();

        // Fell Footsoldier — corrupted humanoid with fungal growths
        g = scene.make.graphics({ add: false });
        g.fillStyle(COLORS.FELL_FLESH);
        g.fillRect(4, 8, 16, 22);
        g.fillStyle(0x3A1A3A);
        g.fillRect(7, 0, 10, 12); // head
        g.fillStyle(COLORS.FELL_FUNGUS);
        g.fillCircle(8, 4, 5); // fungal hood
        g.fillCircle(16, 8, 4);
        g.fillStyle(COLORS.FELL_EYES);
        g.fillRect(9, 5, 2, 2);
        g.fillRect(14, 5, 2, 2);
        g.fillStyle(0x3A1A3A);
        g.fillRect(5, 30, 5, 6); // legs
        g.fillRect(14, 30, 5, 6);
        g.generateTexture('fell_footsoldier', 24, 36);
        g.destroy();

        // Fell Vicious Vine — stationary thorny plant
        g = scene.make.graphics({ add: false });
        g.fillStyle(0x2A4A1A);
        g.fillRect(8, 0, 4, 32); // stem
        g.fillStyle(COLORS.FELL_FUNGUS);
        g.fillTriangle(0, 10, 10, 6, 10, 14); // thorns
        g.fillTriangle(20, 16, 10, 12, 10, 20);
        g.fillTriangle(0, 22, 10, 18, 10, 26);
        g.fillStyle(COLORS.FELL_EYES);
        g.fillCircle(10, 2, 3); // flower-eye
        g.generateTexture('fell_vine', 20, 32);
        g.destroy();

        // Fell Ranger — hooded shroud archer
        g = scene.make.graphics({ add: false });
        g.fillStyle(COLORS.FELL_FLESH);
        g.fillTriangle(11, 0, 0, 26, 22, 26); // hooded cloak
        g.fillRect(2, 26, 18, 8);
        g.fillStyle(COLORS.FELL_FUNGUS);
        g.fillCircle(6, 10, 3);
        g.fillStyle(COLORS.FELL_EYES);
        g.fillRect(7, 10, 2, 2);
        g.fillRect(13, 10, 2, 2);
        g.fillStyle(COLORS.ELECTRIC_BLUE);
        g.fillCircle(11, 18, 2); // shroud core
        g.generateTexture('fell_ranger', 22, 34);
        g.destroy();
    }

    // ─── Scavengers (corrupted humans) ───

    static generateScavengers(scene) {
        // Scavenger Scalper
        let g = scene.make.graphics({ add: false });
        g.fillStyle(COLORS.SCAV_CLOTH);
        g.fillRect(3, 6, 16, 24);
        g.fillStyle(COLORS.SCAV_BROWN);
        g.fillRect(6, 0, 10, 10); // head with hood
        g.fillTriangle(6, 0, 11, -4, 16, 0); // hood peak
        g.fillStyle(0xDDBB99);
        g.fillRect(8, 3, 6, 5); // face
        g.fillStyle(0x222222);
        g.fillRect(9, 4, 2, 2); // eyes
        g.fillRect(13, 4, 2, 2);
        g.fillStyle(0x666666);
        g.fillRect(18, 12, 3, 14); // weapon (blade)
        g.fillStyle(COLORS.SCAV_BROWN);
        g.fillRect(4, 30, 6, 6); // legs
        g.fillRect(13, 30, 6, 6);
        g.generateTexture('scavenger', 22, 36);
        g.destroy();

        // Scavenger Pyreblade — heavier, fire-wielding
        g = scene.make.graphics({ add: false });
        g.fillStyle(COLORS.SCAV_BROWN);
        g.fillRect(3, 6, 18, 24);
        g.fillRect(6, 0, 12, 10);
        g.fillStyle(0xDDBB99);
        g.fillRect(8, 3, 8, 5);
        g.fillStyle(0xFF4400); // fire blade
        g.fillRect(20, 8, 3, 18);
        g.fillStyle(COLORS.FLAME_ORANGE);
        g.fillCircle(21, 7, 3);
        g.fillStyle(COLORS.SCAV_BROWN);
        g.fillRect(5, 30, 6, 6);
        g.fillRect(14, 30, 6, 6);
        g.generateTexture('scav_pyreblade', 24, 36);
        g.destroy();
    }

    // ─── Vukah (tusked beast-warriors) ───

    static generateVukah(scene) {
        const g = scene.make.graphics({ add: false });
        // Massive furred body
        g.fillStyle(COLORS.VUKAH_FUR);
        g.fillRect(3, 6, 22, 26);
        // Head
        g.fillRect(5, 0, 18, 12);
        // Tusks!
        g.fillStyle(COLORS.VUKAH_TUSK);
        g.fillRect(4, 8, 3, 8);
        g.fillRect(21, 8, 3, 8);
        // Eyes (aggressive red)
        g.fillStyle(0xFF2200);
        g.fillRect(9, 3, 3, 3);
        g.fillRect(16, 3, 3, 3);
        // Fur detail
        g.fillStyle(0x5A3A1A);
        g.fillRect(8, 14, 12, 4);
        // Thick legs
        g.fillStyle(COLORS.VUKAH_FUR);
        g.fillRect(5, 32, 7, 8);
        g.fillRect(16, 32, 7, 8);
        g.generateTexture('vukah_warrior', 28, 40);
        g.destroy();
    }

    // ─── Glider ───

    static generateGlider(scene) {
        const g = scene.make.graphics({ add: false });
        // Wing fabric (warm amber)
        g.fillStyle(0xD4A04A);
        g.fillTriangle(30, 0, 0, 18, 60, 18);
        // Inner highlight
        g.fillStyle(0xE8C080);
        g.fillTriangle(30, 4, 10, 16, 50, 16);
        // Center strut
        g.fillStyle(0x8B6B3A);
        g.fillRect(28, 0, 4, 18);
        g.generateTexture('glider', 60, 20);
        g.destroy();
    }

    // ─── Lore Scroll ───

    static generateLoreScroll(scene) {
        const g = scene.make.graphics({ add: false });
        // Parchment roll
        g.fillStyle(COLORS.SCROLL_PARCHMENT);
        g.fillRect(2, 3, 12, 14);
        // Top/bottom roll caps
        g.fillStyle(0xC8B890);
        g.fillRect(1, 2, 14, 3);
        g.fillRect(1, 15, 14, 3);
        // Ink lines (text hint)
        g.fillStyle(COLORS.SCROLL_INK);
        g.fillRect(4, 7, 8, 1);
        g.fillRect(4, 9, 6, 1);
        g.fillRect(4, 11, 7, 1);
        // Glow aura
        g.fillStyle(0xD4A04A);
        g.fillCircle(8, 10, 2);
        g.generateTexture('lore_scroll', LORE_SCROLL.WIDTH, LORE_SCROLL.HEIGHT);
        g.destroy();
    }
}
