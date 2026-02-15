import { COLORS, PLAYER, ELIXIR, SHROUD, WORLD } from '../constants.js';

export class TextureGenerator {
    /**
     * Generate all placeholder textures for the game.
     * Call once from Preloader scene.
     */
    static generateAll(scene) {
        this.generatePlayer(scene);
        this.generateGround(scene);
        this.generatePlatform(scene);
        this.generateShroudTile(scene);
        this.generateElixirVein(scene);
        this.generateBackgroundLayers(scene);
        this.generateFlameIcon(scene);
        this.generateElixirIcon(scene);
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

    static generateGround(scene) {
        const g = scene.make.graphics({ add: false });
        g.fillStyle(COLORS.GROUND_BROWN);
        g.fillRect(0, 0, 64, 64);
        // Surface detail
        g.fillStyle(COLORS.FOREST);
        g.fillRect(0, 0, 64, 4);
        // Texture noise
        g.fillStyle(0x2A1A0A);
        for (let i = 0; i < 8; i++) {
            const x = (i * 7 + 3) % 60;
            const y = 10 + (i * 11) % 50;
            g.fillRect(x, y, 3, 2);
        }
        g.generateTexture('ground', 64, 64);
        g.destroy();
    }

    static generatePlatform(scene) {
        const g = scene.make.graphics({ add: false });
        g.fillStyle(COLORS.PLATFORM_STONE);
        g.fillRect(0, 0, 128, 24);
        // Top edge highlight
        g.fillStyle(0x7A6A5A);
        g.fillRect(0, 0, 128, 3);
        // Bottom shadow
        g.fillStyle(0x3A2A1A);
        g.fillRect(0, 21, 128, 3);
        g.generateTexture('platform', 128, 24);
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

    static generateBackgroundLayers(scene) {
        // Layer 0: Far sky with stars
        let g = scene.make.graphics({ add: false });
        g.fillStyle(COLORS.SKY_DARK);
        g.fillRect(0, 0, 512, 720);
        g.fillStyle(0x444466);
        for (let i = 0; i < 30; i++) {
            const x = (i * 37 + 13) % 510;
            const y = (i * 23 + 7) % 400;
            g.fillRect(x, y, 2, 2);
        }
        g.generateTexture('bg_layer0', 512, 720);
        g.destroy();

        // Layer 1: Distant mountains
        g = scene.make.graphics({ add: false });
        g.fillStyle(0x0F0F2A);
        g.fillRect(0, 0, 512, 720);
        g.fillStyle(0x1A1A3A);
        g.fillTriangle(0, 500, 128, 300, 256, 500);
        g.fillTriangle(200, 500, 350, 250, 512, 500);
        g.fillRect(0, 500, 512, 220);
        g.generateTexture('bg_layer1', 512, 720);
        g.destroy();

        // Layer 2: Mid-ground hills / dead forest
        g = scene.make.graphics({ add: false });
        g.clear();
        g.fillStyle(0x1A2A1A);
        g.fillRect(0, 550, 512, 170);
        // Tree silhouettes
        g.fillStyle(0x152015);
        for (let i = 0; i < 6; i++) {
            const x = 20 + i * 85;
            g.fillRect(x + 8, 480, 6, 70);
            g.fillTriangle(x, 510, x + 11, 440, x + 22, 510);
        }
        g.generateTexture('bg_layer2', 512, 720);
        g.destroy();

        // Layer 3: Near foreground foliage
        g = scene.make.graphics({ add: false });
        g.fillStyle(COLORS.FOREST);
        g.fillRect(0, 600, 512, 120);
        g.fillStyle(0x1D3A17);
        for (let i = 0; i < 8; i++) {
            const x = i * 65;
            g.fillCircle(x + 30, 600, 20 + (i % 3) * 5);
        }
        g.generateTexture('bg_layer3', 512, 720);
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
}
