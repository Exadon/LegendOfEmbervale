import Phaser from 'phaser';
import { WORLD, COLORS, PLAYER, FLAME, ELIXIR, SHROUD } from '../constants.js';
import { GlobalState } from '../GlobalState.js';
import { Player } from '../entities/Player.js';
import { Shroud } from '../entities/Shroud.js';
import { ElixirVein } from '../entities/ElixirVein.js';
import { InputManager } from '../systems/InputManager.js';
import { ParallaxBackground } from '../systems/ParallaxBackground.js';
import { AudioManager } from '../systems/AudioManager.js';
import { HUD } from '../ui/HUD.js';

export class Level1 extends Phaser.Scene {
    constructor() {
        super('Level1');
    }

    create() {
        GlobalState.reset();

        // World bounds
        this.physics.world.setBounds(0, 0, WORLD.WIDTH, WORLD.HEIGHT);

        // Parallax background
        this.parallax = new ParallaxBackground(this);

        // Audio
        this.audio = new AudioManager();
        this.input.once('pointerdown', () => this.audio.init());
        this.input.keyboard.once('keydown', () => this.audio.init());

        // Ground - tileSprite across full world
        this.ground = this.add.tileSprite(
            WORLD.WIDTH / 2, WORLD.GROUND_Y + WORLD.GROUND_HEIGHT / 2,
            WORLD.WIDTH, WORLD.GROUND_HEIGHT,
            'ground'
        );
        this.physics.add.existing(this.ground, true);

        // Platforms
        this.platforms = this.physics.add.staticGroup();
        const platformData = [
            { x: 600, y: 500 },
            { x: 1100, y: 450 },
            { x: 1700, y: 480 },
            { x: 2200, y: 420 },
            { x: 2700, y: 500 },
        ];
        for (const p of platformData) {
            this.platforms.create(p.x, p.y, 'platform');
        }

        // Player
        this.player = new Player(this, PLAYER.START_X, PLAYER.START_Y);

        // Input
        this.inputManager = new InputManager(this);

        // Colliders
        this.physics.add.collider(this.player, this.ground);
        this.physics.add.collider(this.player, this.platforms);

        // Shroud
        this.shroud = new Shroud(this);

        // Elixir veins
        this.elixirVeins = this.add.group();
        const veinData = [
            { x: 500, y: WORLD.GROUND_Y - ELIXIR.VEIN_HEIGHT / 2 },
            { x: 1100, y: 450 - 12 - ELIXIR.VEIN_HEIGHT / 2 },
            { x: 1400, y: WORLD.GROUND_Y - ELIXIR.VEIN_HEIGHT / 2 },
            { x: 2200, y: 420 - 12 - ELIXIR.VEIN_HEIGHT / 2 },
            { x: 2500, y: WORLD.GROUND_Y - ELIXIR.VEIN_HEIGHT / 2 },
        ];
        for (const v of veinData) {
            const vein = new ElixirVein(this, v.x, v.y);
            this.elixirVeins.add(vein);
        }

        // Player<->Shroud overlap
        this.playerInShroud = false;
        this.physics.add.overlap(this.player, this.shroud.hitZone, () => {
            this.playerInShroud = true;
        });

        // Player<->ElixirVein overlap tracking
        this.currentMiningVein = null;

        // Camera
        this.cameras.main.setBounds(0, 0, WORLD.WIDTH, WORLD.HEIGHT);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cameras.main.fadeIn(500, 0, 0, 0);

        // HUD
        this.hud = new HUD(this);

        // Game over flag
        this.isGameOver = false;

        // Flame crackle timer
        this.flameCrackleTimer = 0;
    }

    update(time, delta) {
        if (this.isGameOver) {
            if (Phaser.Input.Keyboard.JustDown(this.inputManager.keys.jump)) {
                this.scene.restart();
            }
            return;
        }

        // Input
        this.player.handleInput(this.inputManager);

        // Shroud advance
        this.shroud.update(delta);

        // Parallax
        this.parallax.update(this.cameras.main.scrollX);

        // Shroud overlap detection (reset each frame, set by overlap callback)
        this.playerInShroud = false;
        this.physics.overlap(this.player, this.shroud.hitZone, () => {
            this.playerInShroud = true;
        });

        // Also check if player x is behind shroud leading edge
        if (this.player.x < this.shroud.getLeadingX()) {
            this.playerInShroud = true;
        }

        // Flame drain
        const drainRate = this.playerInShroud ? FLAME.DRAIN_SHROUD : FLAME.DRAIN_NORMAL;
        GlobalState.drainFlame(drainRate * (delta / 1000));

        // Shroud warning
        this.hud.showShroudWarning(this.playerInShroud);

        // Audio: shroud proximity
        if (this.audio.initialized) {
            const dist = this.player.x - this.shroud.getLeadingX();
            const intensity = Phaser.Math.Clamp(1 - dist / 400, 0, 1);
            this.audio.setShroudIntensity(intensity);
        }

        // Flame crackle sound
        this.flameCrackleTimer += delta;
        if (this.flameCrackleTimer > 3000) {
            this.flameCrackleTimer = 0;
            this.audio.playFlameCrackle();
        }

        // Mining logic
        this._updateMining(delta);

        // Screen shake when in shroud
        if (this.playerInShroud) {
            this.cameras.main.shake(100, 0.003);
        }

        // HUD update
        this.hud.update();

        // Game over check
        if (GlobalState.gameOver) {
            this._triggerGameOver();
        }
    }

    _updateMining(delta) {
        let overlappingVein = null;

        // Check overlap with each vein
        for (const vein of this.elixirVeins.getChildren()) {
            if (vein.depleted) continue;
            if (this.physics.overlap(this.player, vein)) {
                overlappingVein = vein;
                break;
            }
        }

        if (overlappingVein) {
            if (this.currentMiningVein !== overlappingVein) {
                // Started overlapping a new vein
                if (this.currentMiningVein) this.currentMiningVein.stopMining();
                this.currentMiningVein = overlappingVein;
                overlappingVein.startMining();
            }

            // Update mining progress
            const complete = overlappingVein.updateMining(delta);
            if (complete) {
                // Harvest!
                GlobalState.addElixir(1);
                this.shroud.surge();
                this.hud.popElixir();
                this.audio.playMineComplete();
                this.currentMiningVein = null;

                // Camera zoom pulse
                this.cameras.main.shake(200, 0.005);
            }
        } else {
            // Not overlapping any vein
            if (this.currentMiningVein) {
                this.currentMiningVein.stopMining();
                this.currentMiningVein = null;
            }
        }
    }

    _triggerGameOver() {
        this.isGameOver = true;
        this.player.setVelocity(0, 0);
        this.player.body.enable = false;

        // Tint the screen
        this.cameras.main.shake(500, 0.01);

        this.hud.showGameOver();

        // Stop shroud hum
        if (this.audio.initialized) {
            this.audio.setShroudIntensity(0);
        }
    }
}
