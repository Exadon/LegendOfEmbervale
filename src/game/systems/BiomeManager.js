import { BIOMES, PLAYER, BIOME_LORE, ENDLESS } from '../constants.js';

export class BiomeManager {
    constructor(scene) {
        this.scene = scene;
        this.currentBiomeIndex = 0;
        this.onBiomeChange = null; // callback(biome)
        this.loopCount = 0;
        this._loopTriggeredAt = 0;
        this.onLoop = null; // callback(loopCount)

        // Biome name banner (center screen, fades in/out)
        this.bannerTitle = scene.add.text(scene.scale.width / 2, scene.scale.height / 2 - 20, '', {
            fontSize: '28px',
            color: '#D4A04A',
            fontFamily: 'monospace',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5).setScrollFactor(0).setDepth(150).setAlpha(0);

        this.bannerSub = scene.add.text(scene.scale.width / 2, scene.scale.height / 2 + 15, '', {
            fontSize: '14px',
            color: '#888888',
            fontFamily: 'monospace',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5).setScrollFactor(0).setDepth(150).setAlpha(0);
    }

    getCurrentBiome() {
        return BIOMES[this.currentBiomeIndex];
    }

    getBiomeAt(worldX) {
        const dist = worldX - PLAYER.START_X;
        let biome = BIOMES[0];
        for (let i = BIOMES.length - 1; i >= 0; i--) {
            if (dist >= BIOMES[i].startDistance) {
                biome = BIOMES[i];
                break;
            }
        }
        return biome;
    }

    update(playerX) {
        const dist = playerX - PLAYER.START_X;

        // Check for endless loop trigger
        const loopThreshold = ENDLESS.LOOP_TRIGGER_DISTANCE + this.loopCount * ENDLESS.LOOP_TRIGGER_DISTANCE;
        if (dist > loopThreshold && dist > this._loopTriggeredAt) {
            this.loopCount++;
            this._loopTriggeredAt = dist;
            this.currentBiomeIndex = 0;
            this._showLoopBanner('LOOP ' + this.loopCount, 'THE SHROUD REMEMBERS');
            if (this.onLoop) this.onLoop(this.loopCount);
            return;
        }

        let newIndex = 0;
        for (let i = BIOMES.length - 1; i >= 0; i--) {
            if (dist >= BIOMES[i].startDistance) {
                newIndex = i;
                break;
            }
        }

        if (newIndex !== this.currentBiomeIndex) {
            this.currentBiomeIndex = newIndex;
            const biome = BIOMES[newIndex];
            this._showBanner(biome);
            if (this.onBiomeChange) this.onBiomeChange(biome);
        }
    }

    getLoopCount() { return this.loopCount; }

    _showLoopBanner(title, subtitle) {
        this.bannerTitle.setText(title);
        this.bannerTitle.setStyle({ color: '#FF44FF' });
        this.bannerSub.setText(subtitle);

        this.scene.tweens.add({
            targets: [this.bannerTitle, this.bannerSub],
            alpha: 1,
            duration: 600,
            ease: 'Power2'
        });
        this.scene.time.delayedCall(3000, () => {
            this.scene.tweens.add({
                targets: [this.bannerTitle, this.bannerSub],
                alpha: 0,
                duration: 1200,
                ease: 'Power2',
                onComplete: () => {
                    // Reset title color for future biome banners
                    this.bannerTitle.setStyle({ color: '#D4A04A' });
                }
            });
        });
    }

    _showBanner(biome) {
        this.bannerTitle.setText(biome.name);
        this.bannerSub.setText(biome.subtitle);

        // Fade in
        this.scene.tweens.add({
            targets: [this.bannerTitle, this.bannerSub],
            alpha: 1,
            duration: 800,
            ease: 'Power2'
        });

        // Fade out after delay
        this.scene.time.delayedCall(3000, () => {
            this.scene.tweens.add({
                targets: [this.bannerTitle, this.bannerSub],
                alpha: 0,
                duration: 1200,
                ease: 'Power2'
            });
        });

        // Show biome lore excerpt 2s after banner
        const loreEntry = BIOME_LORE[biome.id];
        if (loreEntry && this.scene.hud) {
            this.scene.time.delayedCall(2000, () => {
                this.scene.hud.showLoreScroll(loreEntry);
            });
        }
    }
}
