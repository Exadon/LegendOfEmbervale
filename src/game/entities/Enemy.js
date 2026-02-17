import Phaser from 'phaser';
import { ENEMIES, ENEMY_SPRITES } from '../constants.js';

/**
 * Data-driven enemy. Constructed from an ENEMIES config entry.
 * Uses Elthen character sprites (tinted) when available, falls back to procedural textures.
 */
export class Enemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, typeId) {
        const def = ENEMIES[typeId];
        const spriteCfg = ENEMY_SPRITES[typeId];
        const hasSprite = spriteCfg && scene.textures.exists(spriteCfg.spriteKey);
        const textureKey = hasSprite ? spriteCfg.spriteKey : def.texture;
        const startFrame = hasSprite && !spriteCfg.isAtlas ? 0 : undefined;
        super(scene, x, y, textureKey, startFrame);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.def = def;
        this.typeId = typeId;
        this.alive = true;
        this.stunned = false;
        this.stunTimer = 0;
        this._hasSprite = hasSprite;
        this._spriteCfg = spriteCfg;
        this._enemyTint = hasSprite ? spriteCfg.tint : null;

        this.body.setAllowGravity(!def.stationary);
        this.body.setSize(def.width - 4, def.height - 4);
        this.setDepth(4);

        if (hasSprite) {
            this.setDisplaySize(spriteCfg.displaySize, spriteCfg.displaySize);
            // Center physics body within the sprite frame
            const fw = this.frame.width;
            const fh = this.frame.height;
            const bodyOffX = (fw - (def.width - 4)) / 2;
            const bodyOffY = fh - (def.height - 4) - 2;
            this.body.setOffset(bodyOffX, bodyOffY);
            // Apply enemy tint and start idle animation
            this.setTint(spriteCfg.tint);
            this.play(spriteCfg.idleAnim);
        }

        if (def.stationary) {
            this.body.setImmovable(true);
            this.body.setAllowGravity(false);
            // Vines sway
            scene.tweens.add({
                targets: this,
                scaleX: { from: 0.95, to: 1.05 },
                duration: 1500,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        } else {
            // Ghostly hover for Fell, stomping bob for Vukah
            scene.tweens.add({
                targets: this,
                y: y - (typeId.startsWith('vukah') ? 3 : 6),
                duration: typeId.startsWith('vukah') ? 800 : 1200,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }

        // Fell enemies flicker; others don't
        if (typeId.startsWith('fell_') && !hasSprite) {
            scene.tweens.add({
                targets: this,
                alpha: { from: 0.6, to: 0.9 },
                duration: 400,
                yoyo: true,
                repeat: -1
            });
        }
    }

    stun(duration) {
        if (!this.alive || this.stunned) return;
        this.stunned = true;
        this.stunTimer = duration;
        this.setTint(0xFFFF00);
        this.setVelocity(0, 0);

        // Pulsing alpha while stunned
        this._stunTween = this.scene.tweens.add({
            targets: this,
            alpha: { from: 1, to: 0.4 },
            duration: 200,
            yoyo: true,
            repeat: -1
        });

        this.scene.time.delayedCall(duration, () => {
            if (this._stunTween) {
                this._stunTween.destroy();
                this._stunTween = null;
            }
            if (this.active && this.alive) {
                this.stunned = false;
                this.setAlpha(1);
                // Restore enemy tint or clear
                if (this._enemyTint) {
                    this.setTint(this._enemyTint);
                } else {
                    this.clearTint();
                }
            }
        });
    }

    chasePlayer(playerX, playerY) {
        if (!this.alive || this.def.stationary || this.stunned) return;

        const angle = Phaser.Math.Angle.Between(this.x, this.y, playerX, playerY);
        this.setVelocityX(Math.cos(angle) * this.def.speed);
        this.setVelocityY(Math.sin(angle) * this.def.speed * 0.3);
        this.setFlipX(this.body.velocity.x > 0);

        if (this._hasSprite) {
            const moveKey = this._spriteCfg.moveAnim;
            const currentKey = this.anims.currentAnim ? this.anims.currentAnim.key : null;
            if (currentKey !== moveKey) {
                this.play(moveKey, true);
            }
        }
    }

    banish() {
        if (!this.alive) return;
        this.alive = false;
        this.body.enable = false;
        if (this._stunTween) {
            this._stunTween.destroy();
            this._stunTween = null;
        }
        this.scene.tweens.killTweensOf(this);

        this.scene.tweens.add({
            targets: this,
            scaleX: 2.5,
            scaleY: 2.5,
            alpha: 0,
            duration: 300,
            ease: 'Power2',
            onComplete: () => this.destroy()
        });
    }
}
