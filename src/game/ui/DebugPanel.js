import Phaser from 'phaser';
import { CLASS_DEFS } from '../systems/ClassDefs.js';
import { SkillManager } from '../systems/SkillManager.js';
import { GlobalState } from '../GlobalState.js';

export class DebugPanel {
    constructor(scene) {
        this.scene = scene;
        this.visible = false;
        this.godMode = false;
        this.classIndex = -1;
        this.classKeys = Object.keys(CLASS_DEFS);

        // Convert screen position to zoom-adjusted coords
        const u = (sx, sy) => this._uiXY(sx, sy);

        // Info text (top-left, fixed to camera)
        const ip = u(10, 10);
        this.infoText = scene.add.text(ip.x, ip.y, '', {
            fontFamily: 'monospace',
            fontSize: '13px',
            color: '#00FF00',
            backgroundColor: '#000000aa',
            padding: { x: 6, y: 4 },
        }).setScrollFactor(0).setDepth(500).setVisible(false);

        // Help text (bottom-left, fixed to camera)
        const hp = u(10, scene.scale.height - 180);
        this.helpText = scene.add.text(hp.x, hp.y, [
            'DEBUG KEYS',
            '`  Toggle panel',
            'F1 Physics debug',
            'F2 Force level up',
            'F3 Cycle class sprite',
            'F4 God mode (no drain)',
            'F5 Zoom out (-0.25)',
            'F6 Zoom in (+0.25)',
            'F7 Add 10 elixir',
        ].join('\n'), {
            fontFamily: 'monospace',
            fontSize: '12px',
            color: '#AAFFAA',
            backgroundColor: '#000000aa',
            padding: { x: 6, y: 4 },
        }).setScrollFactor(0).setDepth(500).setVisible(false);

        // Listen for debug keys
        scene.input.keyboard.on('keydown', (event) => {
            this._onKey(event);
        });
    }

    /** Convert desired screen position to zoom-adjusted object coords for scrollFactor(0) */
    _uiXY(sx, sy) {
        const z = this.scene.cameras.main.zoom;
        const cx = this.scene.scale.width / 2;
        const cy = this.scene.scale.height / 2;
        return { x: (sx - cx) / z + cx, y: (sy - cy) / z + cy };
    }

    _onKey(event) {
        switch (event.key) {
            case '`':
                this.visible = !this.visible;
                this._repositionTexts();
                this.infoText.setVisible(this.visible);
                this.helpText.setVisible(this.visible);
                break;
            case 'F1':
                event.preventDefault();
                this._togglePhysicsDebug();
                break;
            case 'F2':
                event.preventDefault();
                this._forceLevelUp();
                break;
            case 'F3':
                event.preventDefault();
                this._cycleClass();
                break;
            case 'F4':
                event.preventDefault();
                this.godMode = !this.godMode;
                break;
            case 'F5':
                event.preventDefault();
                this._adjustZoom(-0.25);
                break;
            case 'F6':
                event.preventDefault();
                this._adjustZoom(0.25);
                break;
            case 'F7':
                event.preventDefault();
                GlobalState.addElixir(10);
                break;
        }
    }

    /** Reposition texts for current zoom level */
    _repositionTexts() {
        const ip = this._uiXY(10, 10);
        this.infoText.setPosition(ip.x, ip.y);
        const hp = this._uiXY(10, this.scene.scale.height - 180);
        this.helpText.setPosition(hp.x, hp.y);
    }

    _togglePhysicsDebug() {
        const world = this.scene.physics.world;
        if (world.debugGraphic) {
            world.debugGraphic.setVisible(!world.debugGraphic.visible);
        } else {
            world.createDebugGraphic();
            world.drawDebug = true;
        }
    }

    _forceLevelUp() {
        if (this.scene.levelUpOverlay && !this.scene.levelUpOverlay.active) {
            this.scene.levelUpOverlay.show();
        }
    }

    _cycleClass() {
        this.classIndex = (this.classIndex + 1) % this.classKeys.length;
        const skillId = this.classKeys[this.classIndex];
        const classDef = CLASS_DEFS[skillId];
        SkillManager.activeClass = classDef;
        if (this.scene.player) {
            this.scene.player.swapClassSprite(classDef);
        }
        // Update HUD Q-bar
        if (this.scene.hud && this.scene.hud.updateSkills) {
            this.scene.hud.updateSkills();
        }
    }

    _adjustZoom(delta) {
        const cam = this.scene.cameras.main;
        const newZoom = Phaser.Math.Clamp(cam.zoom + delta, 0.5, 3);
        cam.setZoom(newZoom);
        // Reposition debug texts for new zoom
        this._repositionTexts();
    }

    update(player) {
        if (this.godMode) {
            GlobalState.flame = 100;
        }

        if (!this.visible) return;

        const cam = this.scene.cameras.main;
        const fps = Math.round(this.scene.game.loop.actualFps);
        const cls = SkillManager.activeClass;
        const body = player.body;

        this.infoText.setText([
            `FPS: ${fps}`,
            `Pos: ${Math.round(player.x)}, ${Math.round(player.y)}`,
            `Class: ${cls.className || 'None'} (${cls.spriteKey})`,
            `Zoom: ${cam.zoom.toFixed(2)}`,
            `God: ${this.godMode ? 'ON' : 'off'}`,
            `Body: off(${Math.round(body.offset.x)},${Math.round(body.offset.y)}) sz(${body.width}x${body.height})`,
            `Scale: ${player.scaleX.toFixed(3)}, ${player.scaleY.toFixed(3)}`,
            `Frame: ${player.frame.width}x${player.frame.height}`,
            `Elixir: ${GlobalState.elixir}  Flame: ${Math.round(GlobalState.flame)}`,
            `Skills: ${SkillManager.acquired.length} (Lv${SkillManager.level})`,
            `Gliding: ${player.isGliding ? 'YES' : 'no'}`,
        ].join('\n'));
    }
}
