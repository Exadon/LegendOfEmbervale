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
        // Phase B2: new enemy textures
        this.generateVineSpitter(scene);
        this.generateVukahBerserker(scene);
        this.generatePyrebat(scene);
        this.generateSoulLeech(scene);
        this.generateFrostHulk(scene);
        // Phase J: hazard zone textures
        this._genLavaPool(scene);
        this._genFrostGround(scene);
        this._genSpikeTrap(scene);
        // Phase O: foreground decoration textures
        this._genBones(scene);
        this._genTorch(scene);
        this._genRubble(scene);
        // Phase S: biome particle textures
        this._genParticleLeaf(scene);
        this._genParticleSnowflake(scene);
        this._genParticleEmber(scene);
    }

    static _genLavaPool(scene) {
        const g = scene.make.graphics({ x: 0, y: 0, add: false });
        g.fillGradientStyle(0xFF6600, 0xFF2200, 0xFF4400, 0xFF0000, 1);
        g.fillRect(0, 0, 32, 16);
        g.generateTexture('hazard_lava', 32, 16);
        g.destroy();
    }

    static _genFrostGround(scene) {
        const g = scene.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0xAADDFF, 0.8);
        g.fillRect(0, 0, 32, 12);
        g.generateTexture('hazard_frost', 32, 12);
        g.destroy();
    }

    static _genSpikeTrap(scene) {
        const g = scene.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0x886644, 1);
        for (let i = 0; i < 5; i++) {
            g.fillTriangle(i * 8, 16, i * 8 + 4, 0, i * 8 + 8, 16);
        }
        g.generateTexture('hazard_spike', 40, 16);
        g.destroy();
    }

    static _genBones(scene) {
        const g = scene.make.graphics({ x: 0, y: 0, add: false });
        // Scattered bone fragments — cream/white shards
        g.fillStyle(0xDDCCBB, 1);
        g.fillRect(0, 8, 14, 4);   // horizontal long bone
        g.fillRect(18, 10, 10, 3); // shorter fragment
        g.fillStyle(0xCCBBAA, 1);
        g.fillRect(4, 4, 3, 8);    // vertical shard
        g.fillRect(22, 6, 3, 6);   // second shard
        g.generateTexture('deco_bones', 32, 16);
        g.destroy();
    }

    static _genTorch(scene) {
        const g = scene.make.graphics({ x: 0, y: 0, add: false });
        // Torch post
        g.fillStyle(0x4A3A2A, 1);
        g.fillRect(6, 20, 4, 28);
        // Bracket
        g.fillStyle(0x3A2A1A, 1);
        g.fillRect(4, 20, 8, 4);
        // Flame glow (warm orange circle at top)
        g.fillStyle(0xFF8800, 0.9);
        g.fillCircle(8, 12, 7);
        g.fillStyle(0xFFDD44, 0.7);
        g.fillCircle(8, 10, 4);
        g.generateTexture('deco_torch', 16, 48);
        g.destroy();
    }

    static _genRubble(scene) {
        const g = scene.make.graphics({ x: 0, y: 0, add: false });
        // Irregular stone rubble chunks
        g.fillStyle(0x7A6A5A, 1);
        g.fillRect(0, 10, 18, 14);  // large chunk
        g.fillStyle(0x6A5A4A, 1);
        g.fillRect(20, 14, 14, 10); // medium chunk
        g.fillStyle(0x5A4A3A, 1);
        g.fillRect(10, 6, 10, 8);   // top piece
        g.fillStyle(0x8A7A6A, 1);
        g.fillRect(2, 8, 8, 4);     // small highlight
        g.generateTexture('deco_rubble', 48, 24);
        g.destroy();
    }

    static _genParticleLeaf(scene) {
        const g = scene.make.graphics({ add: false });
        g.fillStyle(0x2D5A1B, 1);
        g.fillEllipse(4, 2, 8, 4);
        g.generateTexture('particle_leaf', 8, 4);
        g.destroy();
    }

    static _genParticleSnowflake(scene) {
        const g = scene.make.graphics({ add: false });
        g.fillStyle(0xDDEEFF, 1);
        g.fillRect(3, 0, 1, 7);
        g.fillRect(0, 3, 7, 1);
        g.generateTexture('particle_snowflake', 7, 7);
        g.destroy();
    }

    static _genParticleEmber(scene) {
        const g = scene.make.graphics({ add: false });
        g.fillStyle(0xFF6600, 1);
        g.fillEllipse(2, 3, 4, 6);
        g.fillStyle(0xFFAA00, 1);
        g.fillRect(1, 0, 2, 2);
        g.generateTexture('particle_ember', 4, 6);
        g.destroy();
    }

    static generateVineSpitter(scene) {
        const g = scene.make.graphics({ add: false });
        // Dark green blob body
        g.fillStyle(0x1A5C1A);
        g.fillEllipse(11, 14, 22, 28);
        // Vine tendrils
        g.lineStyle(2, 0x2D8C2D);
        g.strokeRect(2, 2, 4, 10);
        g.strokeRect(16, 2, 4, 10);
        // Eye glow
        g.fillStyle(0xFF4400);
        g.fillCircle(8, 12, 3);
        g.fillCircle(14, 12, 3);
        g.generateTexture('vine_spitter', 22, 28);
        g.destroy();
    }

    static generateVukahBerserker(scene) {
        const g = scene.make.graphics({ add: false });
        // Dark red body — bigger than warrior
        g.fillStyle(0x8B1A1A);
        g.fillRect(4, 8, 20, 24);
        // Head
        g.fillStyle(0xCC3333);
        g.fillRect(6, 0, 16, 12);
        // Tusks
        g.fillStyle(0xDDCCAA);
        g.fillRect(4, 6, 4, 6);
        g.fillRect(20, 6, 4, 6);
        // Enrage marks
        g.fillStyle(0xFF0000);
        g.fillRect(8, 3, 3, 2);
        g.fillRect(17, 3, 3, 2);
        g.generateTexture('vukah_berserker', 28, 32);
        g.destroy();
    }

    static generatePyrebat(scene) {
        const g = scene.make.graphics({ add: false });
        // Orange wedge body
        g.fillStyle(0xFF6600);
        g.fillTriangle(12, 0, 0, 16, 24, 16);
        // Wing tips
        g.fillStyle(0xFF8833);
        g.fillTriangle(0, 8, 0, 16, 8, 16);
        g.fillTriangle(24, 8, 16, 16, 24, 16);
        // Eyes
        g.fillStyle(0xFF0000);
        g.fillCircle(9, 6, 2);
        g.fillCircle(15, 6, 2);
        g.generateTexture('pyrebat', 24, 16);
        g.destroy();
    }

    static generateSoulLeech(scene) {
        const g = scene.make.graphics({ add: false });
        // Purple oval
        g.fillStyle(0x6600AA);
        g.fillEllipse(10, 12, 20, 24);
        // Pale underbelly
        g.fillStyle(0xAA44CC);
        g.fillEllipse(10, 14, 12, 14);
        // Eyes (white with red pupil)
        g.fillStyle(0xFFFFFF);
        g.fillCircle(7, 9, 3);
        g.fillCircle(13, 9, 3);
        g.fillStyle(0xFF0000);
        g.fillCircle(7, 9, 1);
        g.fillCircle(13, 9, 1);
        g.generateTexture('soul_leech', 20, 24);
        g.destroy();
    }

    static generateFrostHulk(scene) {
        const g = scene.make.graphics({ add: false });
        // Icy blue bulk
        g.fillStyle(0x4488BB);
        g.fillRect(4, 8, 24, 32);
        // Head — blocky
        g.fillStyle(0x66AACC);
        g.fillRect(6, 0, 20, 12);
        // Ice crystals on shoulders
        g.fillStyle(0xAADDEE);
        g.fillTriangle(4, 8, 0, 0, 8, 8);
        g.fillTriangle(28, 8, 24, 8, 32, 0);
        // Eyes
        g.fillStyle(0xCCEEFF);
        g.fillCircle(12, 6, 3);
        g.fillCircle(20, 6, 3);
        g.generateTexture('frost_hulk', 32, 40);
        g.destroy();
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
