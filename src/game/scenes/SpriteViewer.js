import Phaser from 'phaser';
import { CLASS_DEFS } from '../systems/ClassDefs.js';

/**
 * Debug scene: shows each class sprite with its animations frame-by-frame.
 * Access via [V] from MainMenu.
 *
 * Controls:
 *   LEFT / RIGHT — cycle classes
 *   SPACE        — pause / resume animations
 *   ESC          — return to MainMenu
 */
export class SpriteViewer extends Phaser.Scene {
    constructor() {
        super('SpriteViewer');
    }

    create() {
        const { width, height } = this.scale;

        // Build ordered list of class entries
        this._entries = Object.entries(CLASS_DEFS).map(([id, def]) => ({ id, def }));
        this._index = 0;
        this._paused = false;
        this._sprites = [];
        this._elements = [];

        // Dark background
        this.add.rectangle(width / 2, height / 2, width, height, 0x0D0D1A).setDepth(0);

        // Title
        this._titleText = this.add.text(width / 2, 24, '', {
            fontSize: '20px', color: '#FFCC00', fontFamily: 'monospace', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(1);

        // Subtitle (sprite key, frame dims, scale)
        this._subtitleText = this.add.text(width / 2, 48, '', {
            fontSize: '12px', color: '#888888', fontFamily: 'monospace'
        }).setOrigin(0.5).setDepth(1);

        // Controls hint
        this.add.text(width / 2, height - 16, '[LEFT/RIGHT] Class   [SPACE] Pause   [ESC] Back', {
            fontSize: '11px', color: '#555555', fontFamily: 'monospace'
        }).setOrigin(0.5).setDepth(1);

        // Input
        this.input.keyboard.on('keydown-LEFT', () => this._changeClass(-1));
        this.input.keyboard.on('keydown-RIGHT', () => this._changeClass(1));
        this.input.keyboard.on('keydown-SPACE', () => this._togglePause());
        this.input.keyboard.on('keydown-ESC', () => {
            this.input.keyboard.removeAllListeners();
            this.scene.start('MainMenu');
        });

        this._showClass(0);
    }

    _changeClass(dir) {
        const next = (this._index + dir + this._entries.length) % this._entries.length;
        this._showClass(next);
    }

    _togglePause() {
        this._paused = !this._paused;
        for (const s of this._sprites) {
            if (this._paused) {
                s.sprite.anims.pause();
            } else {
                s.sprite.anims.resume();
            }
        }
    }

    _showClass(index) {
        this._index = index;
        const { id, def } = this._entries[index];

        // Clean up previous sprites and labels
        for (const s of this._sprites) {
            s.sprite.destroy();
        }
        for (const el of this._elements) {
            el.destroy();
        }
        this._sprites = [];
        this._elements = [];

        const { width, height } = this.scale;

        // Title
        const className = def.className || 'Default (Adventurer)';
        this._titleText.setText(`${className}  [${index + 1}/${this._entries.length}]`);

        const fw = def.frameSize;
        const fh = def.frameHeight || fw;
        const displaySize = def.displaySize || Math.max(48, Math.round(fw * 0.75));
        const scale = displaySize / fw;
        this._subtitleText.setText(
            `id: ${id}  |  sprite: ${def.spriteKey}  |  frame: ${fw}x${fh}  |  display: ${displaySize}px  |  scale: ${scale.toFixed(3)}`
        );

        // Collect animations to show
        const anims = [];
        if (def.idleAnim) anims.push({ key: def.idleAnim, label: 'IDLE' });
        if (def.moveAnim) anims.push({ key: def.moveAnim, label: 'MOVE' });
        if (def.attackAnim) anims.push({ key: def.attackAnim, label: 'ATTACK' });

        if (anims.length === 0) {
            const noAnimText = this.add.text(width / 2, height / 2, 'No animations defined', {
                fontSize: '16px', color: '#666666', fontFamily: 'monospace'
            }).setOrigin(0.5).setDepth(1);
            this._elements.push(noAnimText);
            return;
        }

        // Layout: distribute animations horizontally
        const sectionW = width / anims.length;
        const spriteY = height * 0.38;

        // Preview scale: show sprites large enough to see detail
        // Use a magnified scale so small frames are visible (at least 3x native or fill ~120px)
        const previewScale = Math.max(3, 120 / Math.max(fw, fh));

        for (let i = 0; i < anims.length; i++) {
            const anim = anims[i];
            const cx = sectionW * i + sectionW / 2;

            // Create sprite
            const sprite = this.add.sprite(cx, spriteY, def.spriteKey);
            sprite.setDepth(2);
            sprite.setScale(previewScale);

            // Try to play animation
            const animData = this.anims.get(anim.key);
            if (animData) {
                sprite.play(anim.key);
                if (this._paused) sprite.anims.pause();
            } else {
                // Animation doesn't exist — show frame 0
                if (!def.isAtlas) {
                    sprite.setFrame(0);
                }
            }

            // Draw border around the sprite area
            const boxW = fw * previewScale + 8;
            const boxH = fh * previewScale + 8;
            const border = this.add.rectangle(cx, spriteY, boxW, boxH)
                .setStrokeStyle(1, 0x444444).setFillStyle(0x000000, 0.3).setDepth(1);
            this._elements.push(border);

            // Animation label
            const labelText = this.add.text(cx, spriteY - boxH / 2 - 18, anim.label, {
                fontSize: '14px', color: '#FFCC00', fontFamily: 'monospace', fontStyle: 'bold'
            }).setOrigin(0.5).setDepth(3);
            this._elements.push(labelText);

            // Animation key
            const keyText = this.add.text(cx, spriteY + boxH / 2 + 12, anim.key, {
                fontSize: '10px', color: '#666666', fontFamily: 'monospace'
            }).setOrigin(0.5).setDepth(3);
            this._elements.push(keyText);

            // Frame info (updated in update())
            const frameText = this.add.text(cx, spriteY + boxH / 2 + 28, '', {
                fontSize: '12px', color: '#00FF88', fontFamily: 'monospace'
            }).setOrigin(0.5).setDepth(3);
            this._elements.push(frameText);

            // Total frames
            const totalFrames = animData ? animData.frames.length : '?';
            const totalText = this.add.text(cx, spriteY + boxH / 2 + 44, `${totalFrames} frames`, {
                fontSize: '10px', color: '#555555', fontFamily: 'monospace'
            }).setOrigin(0.5).setDepth(3);
            this._elements.push(totalText);

            this._sprites.push({ sprite, frameText, animKey: anim.key, label: anim.label });
        }

        // ── Frame strip section: show all individual frames below ──
        this._buildFrameStrip(anims, spriteY + 100);
    }

    /** Render a scrollable strip of every frame for each animation */
    _buildFrameStrip(anims, startY) {
        const { width } = this.scale;
        const def = this._entries[this._index].def;
        const fw = def.frameSize;
        const fh = def.frameHeight || fw;

        // Scale frames to ~32px tall for the strip
        const stripScale = Math.min(2, 48 / fh);
        const thumbW = fw * stripScale;
        const thumbH = fh * stripScale;

        let yPos = startY;

        for (const anim of anims) {
            const animData = this.anims.get(anim.key);
            if (!animData) continue;

            const frames = animData.frames;
            const numFrames = frames.length;

            // Row label
            const rowLabel = this.add.text(8, yPos, `${anim.label} (${numFrames}f):`, {
                fontSize: '10px', color: '#AAAAAA', fontFamily: 'monospace'
            }).setDepth(3);
            this._elements.push(rowLabel);

            yPos += 16;

            // Calculate how many frames fit per row
            const padding = 4;
            const maxPerRow = Math.floor((width - 16) / (thumbW + padding));
            const totalRows = Math.ceil(numFrames / maxPerRow);

            for (let row = 0; row < totalRows; row++) {
                const startIdx = row * maxPerRow;
                const endIdx = Math.min(startIdx + maxPerRow, numFrames);

                for (let fi = startIdx; fi < endIdx; fi++) {
                    const frame = frames[fi];
                    const col = fi - startIdx;
                    const fx = 12 + col * (thumbW + padding) + thumbW / 2;
                    const fy = yPos + thumbH / 2;

                    // Frame background
                    const bg = this.add.rectangle(fx, fy, thumbW + 2, thumbH + 2)
                        .setStrokeStyle(1, 0x333333).setFillStyle(0x111111, 0.8).setDepth(1);
                    this._elements.push(bg);

                    // Frame sprite
                    const thumb = this.add.sprite(fx, fy, frame.textureKey, frame.textureFrame);
                    thumb.setScale(stripScale).setDepth(2);
                    this._elements.push(thumb);

                    // Frame number
                    const numText = this.add.text(fx, fy + thumbH / 2 + 8, `${fi}`, {
                        fontSize: '9px', color: '#00FF88', fontFamily: 'monospace'
                    }).setOrigin(0.5).setDepth(3);
                    this._elements.push(numText);
                }

                yPos += thumbH + 22;
            }

            yPos += 6;
        }
    }

    update() {
        // Update frame counters on animated sprites
        for (const s of this._sprites) {
            if (!s.sprite.anims.currentAnim) continue;
            const current = s.sprite.anims.currentFrame;
            if (current) {
                const idx = current.index;
                const total = s.sprite.anims.currentAnim.frames.length;
                s.frameText.setText(`Frame: ${idx} / ${total - 1}`);
            }
        }
    }
}
