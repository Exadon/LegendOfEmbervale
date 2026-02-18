import Phaser from 'phaser';
import { TextureGenerator } from '../utils/TextureGenerator.js';
import { COLORS } from '../constants.js';

export class Preloader extends Phaser.Scene {
    constructor() {
        super('Preloader');
    }

    preload() {
        // Backgrounds
        this.load.image('bg_layer0', 'assests/background/cloudySky_640x360px.png');
        this.load.image('bg_layer1', 'assests/background/par1_tileable_640x360px.png');
        this.load.image('bg_layer2', 'assests/background/par2_tileable_640x360px.png');
        this.load.image('bg_layer3', 'assests/background/par3_tileable_640x360px.png');

        // Bonfire frames
        this.load.image('bonfire_frm1', 'assests/bonfire/bonfire_frm1_64.png');
        this.load.image('bonfire_frm2', 'assests/bonfire/bonfire_frm2_64.png');
        this.load.image('bonfire_frm3', 'assests/bonfire/bonfire_frm3_64.png');

        // Pickup frames
        this.load.image('pickup_frm1', 'assests/pickup/frm1.png');
        this.load.image('pickup_frm2', 'assests/pickup/frm2.png');
        this.load.image('pickup_frm3', 'assests/pickup/frm3.png');
        this.load.image('pickup_frm4', 'assests/pickup/frm4.png');
        this.load.image('pickup_frm5', 'assests/pickup/frm5.png');

        // Ground tilemap spritesheet
        this.load.image('ground_tilemap', 'assests/platforms/groundTilemap_64px.png');

        // Decorations
        this.load.image('deco_tree_256', 'assests/decoration/tree_256px.png');
        this.load.image('deco_tree_128', 'assests/decoration/tree_128px.png');
        this.load.image('deco_tree_64', 'assests/decoration/tree_64px.png');
        this.load.image('deco_rockpile_128', 'assests/decoration/rockpile_128px.png');
        this.load.image('deco_rockpile_64', 'assests/decoration/rockpile_64px.png');
        this.load.image('deco_rockpile_32', 'assests/decoration/rockpile_32px.png');
        this.load.image('deco_fence1', 'assests/decoration/fence1_32px.png');
        this.load.image('deco_fence2', 'assests/decoration/fence2_32px.png');
        this.load.image('deco_grass1', 'assests/decoration/gras1_32px.png');

        // Fell Vine spritesheet (3x3 grid: idle, attack, death)
        this.load.spritesheet('fell_vine_sheet', 'assests/FellFine.png', {
            frameWidth: 301, frameHeight: 341
        });

        // Elixir Wells
        this.load.image('well', 'assests/well.png');
        this.load.image('driedwell', 'assests/driedwell.png');

        // Music
        this.load.audio('music_menu', 'assests/music/menu.ogg');
        this.load.audio('music_springlands', 'assests/music/springlands.ogg');
        this.load.audio('music_revelwood', 'assests/music/revelwood.ogg');
        this.load.audio('music_highlands', 'assests/music/highlands.ogg');
        this.load.audio('music_kindlewastes', 'assests/music/kindlewastes.ogg');
        this.load.audio('music_shroud', 'assests/music/shroud.ogg');
        this.load.audio('music_boss', 'assests/music/boss.ogg');
        this.load.audio('music_gameover', 'assests/music/gameover.ogg');

        // UI
        this.load.image('logo_color', 'assests/ui/logoColor_256x128px.png');

        // ─── Elthen Character Atlases (JSON + PNG) ───
        const E = 'assests/ethan/';
        this.load.atlas('barbarian',        E + 'Barbarian Sprite Sheet-Sheet.png',   E + 'Barbarian Sprite Sheet.json');
        this.load.atlas('elite_knight',     E + 'Elite Knight Sprite Sheet.png',       E + 'Elite Knight Sprite Sheet.json');
        this.load.atlas('elite_swordsman',  E + 'Elite Swordsman Sprite Sheet.png',    E + 'Elite Swordsman Sprite Sheet.json');
        this.load.atlas('monk',             E + 'Monk Sprite Sheet.png',               E + 'Monk Sprite Sheet.json');
        this.load.atlas('elite_mage',       E + 'Elite Mage Sprite Sheet.png',         E + 'Elite Mage Sprite Sheet.json');
        this.load.atlas('elven_archeress',  E + 'Elven Archeress Sprite Sheet.png',    E + 'Elven Archeress Sprite Sheet.json');
        this.load.atlas('elven_assassin',   E + 'Elven Assassin Sprite Sheet.png',     E + 'Elven Assassin Sprite Sheet.json');
        this.load.atlas('royal_mage',       E + 'Royal Mage Sprite Sheet.png',         E + 'Royal Mage Sprite Sheet.json');

        // ─── Elthen Character Spritesheets (no JSON) ───
        this.load.spritesheet('adventurer',  E + 'Adventurer Sprite Sheet v1.5.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('pyromancer',  E + 'Pyromancer Sprite Sheet.png',       { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('rogue',       E + 'Rogue Sprite Sheet.png',            { frameWidth: 32, frameHeight: 32 });

        // ─── Effect Sprites ───
        this.load.atlas('fx_blast',       E + 'Blast Spell Sprite Sheet.png', E + 'Blast Spell Sprite Sheet.json');
        this.load.spritesheet('fx_fireball',   E + 'Fireball Sprite Sheet.png',          { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('fx_spell_proj', E + 'Spell Projectile Sprite Sheet.png',  { frameWidth: 32, frameHeight: 32 });

        // ─── NPC Spritesheets (32x32) ───
        this.load.spritesheet('npc_blacksmith',  E + 'Blacksmith Sprite Sheet.png',        { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('npc_alchemist',   E + 'Alchemist Sprite Sheet.png',         { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('npc_hunter',      E + 'Archer Sprite Sheet.png',            { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('npc_bard',        E + 'Bard Sprite Sheet.png',              { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('npc_old_man',     E + 'Old Man Sprite Sheet.png',           { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('npc_farmer',      E + 'Farmer Sprite Sheet.png',            { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('npc_villager_f',  E + 'Villager Female Sprite Sheet.png',   { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('npc_healer',      E + 'Healer Sprite Sheet.png',            { frameWidth: 32, frameHeight: 32 });

        // ─── Enemy Spritesheets ───
        this.load.spritesheet('skeletal_warrior', E + 'SkeletalWarrior_Sprites.png',       { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('skeletal_mage',    E + 'Skeletal_Mage Sprite Sheet.png',    { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('death_sprite',     E + 'Death Sprite Sheet.png',            { frameWidth: 48, frameHeight: 48 });
        this.load.spritesheet('necromancer',      E + 'Necromancer Sprite Sheet.png',      { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('ice_elemental',    E + 'Ice Elemental Sprite Sheet.png',    { frameWidth: 32, frameHeight: 32 });
        this.load.atlas('rotting_soldier', E + 'Rotting Soldier Sprite Sheet.png', E + 'Rotting Soldier Sprite Sheet.json');

        // ─── Boss Sprites ───
        this.load.spritesheet('skeleton_king',      E + 'Skeleton King Sprite Sheet 96x96px.png',     { frameWidth: 96, frameHeight: 96 });
        this.load.spritesheet('skeleton_king_leap',  E + 'Skeleton King Leap Animation 96x128.png',   { frameWidth: 96, frameHeight: 128 });
        this.load.atlas('wind_elemental', E + 'Wind Elemental Sprite Sheet.png', E + 'Wind Elemental Sprite Sheet.json');

        // ─── Misc Entity Sprites ───
        this.load.spritesheet('wisp',       E + 'Wisp Sprite Sheet.png',       { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('skullflame', E + 'Skullflame Sprite Sheet.png', { frameWidth: 64, frameHeight: 64 });
        this.load.atlas('undead_hand', E + 'Undead Hand Sprite Sheet.png', E + 'Undead Hand Sprite Sheet.json');

    }

    create() {
        const { width, height } = this.scale;

        // Progress bar background
        const barBg = this.add.rectangle(width / 2, height / 2, 320, 24, COLORS.BAR_BG);
        const barFill = this.add.rectangle(width / 2 - 156, height / 2, 0, 18, COLORS.ELIXIR_CYAN);
        barFill.setOrigin(0, 0.5);

        const loadingText = this.add.text(width / 2, height / 2 - 40, 'Generating textures...', {
            fontSize: '18px',
            color: '#D4A04A',
            fontFamily: 'monospace'
        }).setOrigin(0.5);

        // Generate all textures (synchronous, but we fake progress)
        this.time.delayedCall(100, () => {
            barFill.width = 100;
            TextureGenerator.generateAll(this);
            this._extractGroundTexture();
            this._createAnimations();
            barFill.width = 312;

            this.time.delayedCall(300, () => {
                loadingText.setText('Ready.');
                this.time.delayedCall(500, () => {
                    this.scene.start('MainMenu');
                });
            });
        });
    }

    _extractGroundTexture() {
        // TileSprite can't use spritesheet frames directly.
        // Extract a 64x64 tile from the tilemap into a standalone texture.
        const sourceImage = this.textures.get('ground_tilemap').getSourceImage();
        const canvas = this.textures.createCanvas('ground', 64, 64);
        const ctx = canvas.getContext();
        // Use the top-left tile (flat ground top)
        ctx.drawImage(sourceImage, 0, 0, 64, 64, 0, 0, 64, 64);
        canvas.refresh();

        // Also extract a platform stone tile (second row, first column)
        const platCanvas = this.textures.createCanvas('platform', 128, 24);
        const platCtx = platCanvas.getContext();
        // Draw two 64x24 slices from the tilemap for a 128x24 platform
        platCtx.drawImage(sourceImage, 64, 0, 64, 24, 0, 0, 64, 24);
        platCtx.drawImage(sourceImage, 64, 0, 64, 24, 64, 0, 64, 24);
        platCanvas.refresh();
    }

    _createAnimations() {
        // Bonfire animation (3 frames, 6 fps)
        this.anims.create({
            key: 'bonfire_anim',
            frames: [
                { key: 'bonfire_frm1' },
                { key: 'bonfire_frm2' },
                { key: 'bonfire_frm3' },
            ],
            frameRate: 6,
            repeat: -1
        });

        // Pickup animation (5 frames, 8 fps)
        this.anims.create({
            key: 'pickup_anim',
            frames: [
                { key: 'pickup_frm1' },
                { key: 'pickup_frm2' },
                { key: 'pickup_frm3' },
                { key: 'pickup_frm4' },
                { key: 'pickup_frm5' },
            ],
            frameRate: 8,
            repeat: -1
        });

        // Fell Vine animations (3 frames each row)
        this.anims.create({ key: 'fell_vine_idle',   frames: this.anims.generateFrameNumbers('fell_vine_sheet', { start: 0, end: 2 }), frameRate: 4, repeat: -1 });
        this.anims.create({ key: 'fell_vine_attack', frames: this.anims.generateFrameNumbers('fell_vine_sheet', { start: 3, end: 5 }), frameRate: 6, repeat: 0 });
        this.anims.create({ key: 'fell_vine_death',  frames: this.anims.generateFrameNumbers('fell_vine_sheet', { start: 6, end: 8 }), frameRate: 6, repeat: 0 });

        // ─── Class Character Animations ───
        this._createAtlasAnims();
        this._createSpritesheetAnims();
        this._createEffectAnims();
        this._createNpcAnims();
        this._createEnemyAnims();
        this._createBossAnims();
        this._createMiscAnims();
    }

    /** Helper: create a single atlas animation */
    _atlasAnim(animKey, atlasKey, sheetName, animName, frameCount, rate, repeat) {
        this.anims.create({
            key: animKey,
            frames: this.anims.generateFrameNames(atlasKey, {
                prefix: `${sheetName} (${animName}) `,
                suffix: '.ase',
                start: 0,
                end: frameCount - 1,
            }),
            frameRate: rate,
            repeat: repeat,
        });
    }

    _createAtlasAnims() {
        // Barbarian (96x96, 8 frames each)
        const BS = 'Barbarian Sprite Sheet';
        this._atlasAnim('barbarian_idle',  'barbarian', BS, 'Idle',        8, 10, -1);
        this._atlasAnim('barbarian_move',  'barbarian', BS, 'Movement',    8, 10, -1);
        this._atlasAnim('barbarian_attack','barbarian', BS, 'Attack',      8, 12, 0);
        this._atlasAnim('barbarian_spin',  'barbarian', BS, 'Spin Attack', 8, 12, 0);

        // Elite Knight (96x96, 8 usable idle/move/block frames, 22 attack frames)
        const EK = 'Elite Knight Sprite Sheet';
        this._atlasAnim('elite_knight_idle',  'elite_knight', EK, 'Idle',     8,  10, -1);
        this._atlasAnim('elite_knight_move',  'elite_knight', EK, 'Movement', 8,  10, -1);
        this._atlasAnim('elite_knight_attack','elite_knight', EK, 'Attack',   22, 14, 0);
        this._atlasAnim('elite_knight_block', 'elite_knight', EK, 'Block',    8,  12, 0);

        // Elite Swordsman (96x96, 8 frames each)
        const ES = 'Elite Swordsman Sprite Sheet';
        this._atlasAnim('elite_swordsman_idle',    'elite_swordsman', ES, 'Idle',     8, 10, -1);
        this._atlasAnim('elite_swordsman_move',    'elite_swordsman', ES, 'Movement', 8, 10, -1);
        this._atlasAnim('elite_swordsman_attack1', 'elite_swordsman', ES, 'Attack1',  8, 12, 0);
        this._atlasAnim('elite_swordsman_attack2', 'elite_swordsman', ES, 'Attack2',  8, 12, 0);

        // Monk (96x96, varies: idle 8, move 6, attack 15, spin 16)
        const MK = 'Monk Sprite Sheet';
        this._atlasAnim('monk_idle',   'monk', MK, 'Idle',           8,  10, -1);
        this._atlasAnim('monk_move',   'monk', MK, 'Movement',       6,  10, -1);
        this._atlasAnim('monk_attack', 'monk', MK, 'Attack',         15, 14, 0);
        this._atlasAnim('monk_spin',   'monk', MK, 'Spin the Staff', 16, 14, 0);

        // Elite Mage (64x32, 8 frames each)
        const EM = 'Elite Mage Sprite Sheet';
        this._atlasAnim('elite_mage_idle',    'elite_mage', EM, 'Idle',     8, 10, -1);
        this._atlasAnim('elite_mage_move',    'elite_mage', EM, 'Movement', 8, 10, -1);
        this._atlasAnim('elite_mage_attack',  'elite_mage', EM, 'Attack',   8, 12, 0);
        this._atlasAnim('elite_mage_attack3', 'elite_mage', EM, 'Attack3',  8, 12, 0);

        // Elven Archeress (64x32, 8 frames each)
        const EA = 'Elven Archeress Sprite Sheet';
        this._atlasAnim('elven_archeress_idle',     'elven_archeress', EA, 'Idle',     8, 10, -1);
        this._atlasAnim('elven_archeress_move',     'elven_archeress', EA, 'Movement', 8, 10, -1);
        this._atlasAnim('elven_archeress_take_aim', 'elven_archeress', EA, 'Take Aim', 8, 12, 0);
        this._atlasAnim('elven_archeress_release',  'elven_archeress', EA, 'Release',  5, 14, 0);

        // Elven Assassin (64x32, 8 frames each)
        const EAs = 'Elven Assassin Sprite Sheet';
        this._atlasAnim('elven_assassin_idle',      'elven_assassin', EAs, 'Idle',      8, 10, -1);
        this._atlasAnim('elven_assassin_move',      'elven_assassin', EAs, 'Movement',  8, 10, -1);
        this._atlasAnim('elven_assassin_attack',    'elven_assassin', EAs, 'Attack',    6, 12, 0);
        this._atlasAnim('elven_assassin_disappear', 'elven_assassin', EAs, 'Disappear', 8, 12, 0);

        // Royal Mage (32x32, 8 frames each)
        const RM = 'Royal Mage Sprite Sheet';
        this._atlasAnim('royal_mage_idle',   'royal_mage', RM, 'Idle',     8, 10, -1);
        this._atlasAnim('royal_mage_move',   'royal_mage', RM, 'Movement', 8, 10, -1);
        this._atlasAnim('royal_mage_attack', 'royal_mage', RM, 'Attack',   8, 12, 0);
    }

    _createSpritesheetAnims() {
        // Adventurer (32x32, 13 cols × 15 rows)
        // Row 0 = Idle (13 frames), Row 1 = Run (8 frames), Row 3 = Attack1 (7 frames)
        this.anims.create({ key: 'adventurer_idle',   frames: this.anims.generateFrameNumbers('adventurer', { start: 0,  end: 12 }), frameRate: 10, repeat: -1 });
        this.anims.create({ key: 'adventurer_move',   frames: this.anims.generateFrameNumbers('adventurer', { start: 13, end: 20 }), frameRate: 10, repeat: -1 });
        this.anims.create({ key: 'adventurer_attack', frames: this.anims.generateFrameNumbers('adventurer', { start: 39, end: 45 }), frameRate: 14, repeat: 0 });

        // Pyromancer (32x32, 16 cols × 7 rows)
        // Row 0 = Idle (4 frames), Row 1 = Run (4 frames), Row 2 = Attack (5 frames)
        this.anims.create({ key: 'pyromancer_idle',   frames: this.anims.generateFrameNumbers('pyromancer', { start: 0,  end: 3  }), frameRate: 10, repeat: -1 });
        this.anims.create({ key: 'pyromancer_move',   frames: this.anims.generateFrameNumbers('pyromancer', { start: 16, end: 19 }), frameRate: 10, repeat: -1 });
        this.anims.create({ key: 'pyromancer_attack', frames: this.anims.generateFrameNumbers('pyromancer', { start: 32, end: 36 }), frameRate: 12, repeat: 0 });

        // Rogue (32x32, 8 cols × 8 rows)
        // Row 0 = Idle, Row 1 = Run, Row 2 = Attack
        this.anims.create({ key: 'rogue_idle',   frames: this.anims.generateFrameNumbers('rogue', { start: 0,  end: 3  }), frameRate: 10, repeat: -1 });
        this.anims.create({ key: 'rogue_move',   frames: this.anims.generateFrameNumbers('rogue', { start: 8,  end: 15 }), frameRate: 10, repeat: -1 });
        this.anims.create({ key: 'rogue_attack', frames: this.anims.generateFrameNumbers('rogue', { start: 16, end: 19 }), frameRate: 14, repeat: 0 });
    }

    _createNpcAnims() {
        // 8-column sheets: idle = row 0 (0-7), move = row 1 (8-15)
        const npc8 = ['npc_blacksmith', 'npc_alchemist', 'npc_hunter', 'npc_farmer', 'npc_villager_f'];
        for (const key of npc8) {
            this.anims.create({ key: `${key}_idle`, frames: this.anims.generateFrameNumbers(key, { start: 0, end: 7 }),  frameRate: 8, repeat: -1 });
            this.anims.create({ key: `${key}_move`, frames: this.anims.generateFrameNumbers(key, { start: 8, end: 15 }), frameRate: 8, repeat: -1 });
        }
        // 15-column sheets: idle = 0-14, move = 15-29
        this.anims.create({ key: 'npc_bard_idle',    frames: this.anims.generateFrameNumbers('npc_bard',    { start: 0,  end: 14 }), frameRate: 8, repeat: -1 });
        this.anims.create({ key: 'npc_bard_move',    frames: this.anims.generateFrameNumbers('npc_bard',    { start: 15, end: 29 }), frameRate: 8, repeat: -1 });
        this.anims.create({ key: 'npc_old_man_idle', frames: this.anims.generateFrameNumbers('npc_old_man', { start: 0,  end: 14 }), frameRate: 8, repeat: -1 });
        this.anims.create({ key: 'npc_old_man_move', frames: this.anims.generateFrameNumbers('npc_old_man', { start: 15, end: 29 }), frameRate: 8, repeat: -1 });
        // 16-column sheet: idle = 0-15, move = 16-31
        this.anims.create({ key: 'npc_healer_idle',  frames: this.anims.generateFrameNumbers('npc_healer',  { start: 0,  end: 15 }), frameRate: 8, repeat: -1 });
        this.anims.create({ key: 'npc_healer_move',  frames: this.anims.generateFrameNumbers('npc_healer',  { start: 16, end: 31 }), frameRate: 8, repeat: -1 });
    }

    _createEnemyAnims() {
        // Skeletal Warrior (10 cols): idle 0-9, move 10-19
        this.anims.create({ key: 'skeletal_warrior_idle', frames: this.anims.generateFrameNumbers('skeletal_warrior', { start: 0,  end: 9  }), frameRate: 10, repeat: -1 });
        this.anims.create({ key: 'skeletal_warrior_move', frames: this.anims.generateFrameNumbers('skeletal_warrior', { start: 10, end: 19 }), frameRate: 10, repeat: -1 });
        // Skeletal Mage (8 cols): idle 0-7, move 8-15
        this.anims.create({ key: 'skeletal_mage_idle', frames: this.anims.generateFrameNumbers('skeletal_mage', { start: 0, end: 7  }), frameRate: 10, repeat: -1 });
        this.anims.create({ key: 'skeletal_mage_move', frames: this.anims.generateFrameNumbers('skeletal_mage', { start: 8, end: 15 }), frameRate: 10, repeat: -1 });
        // Death Sprite (28 cols): idle 0-27, move 28-55
        this.anims.create({ key: 'death_sprite_idle', frames: this.anims.generateFrameNumbers('death_sprite', { start: 0,  end: 27 }), frameRate: 10, repeat: -1 });
        this.anims.create({ key: 'death_sprite_move', frames: this.anims.generateFrameNumbers('death_sprite', { start: 28, end: 55 }), frameRate: 10, repeat: -1 });
        // Necromancer (8 cols): idle 0-7, move 8-15
        this.anims.create({ key: 'necromancer_idle', frames: this.anims.generateFrameNumbers('necromancer', { start: 0, end: 7  }), frameRate: 10, repeat: -1 });
        this.anims.create({ key: 'necromancer_move', frames: this.anims.generateFrameNumbers('necromancer', { start: 8, end: 15 }), frameRate: 10, repeat: -1 });
        // Ice Elemental (9 cols): idle 0-8, move 9-17
        this.anims.create({ key: 'ice_elemental_idle', frames: this.anims.generateFrameNumbers('ice_elemental', { start: 0, end: 8  }), frameRate: 10, repeat: -1 });
        this.anims.create({ key: 'ice_elemental_move', frames: this.anims.generateFrameNumbers('ice_elemental', { start: 9, end: 17 }), frameRate: 10, repeat: -1 });
        // Rotting Soldier atlas (16 frames each)
        const RS = 'Rotting Soldier Sprite Sheet';
        this._atlasAnim('rotting_soldier_idle', 'rotting_soldier', RS, 'Idle',     16, 10, -1);
        this._atlasAnim('rotting_soldier_move', 'rotting_soldier', RS, 'Movement', 16, 10, -1);
    }

    _createBossAnims() {
        // Skeleton King (13 cols x 7 rows): idle row0 0-12, move row1 13-25, attack row2 26-38
        this.anims.create({ key: 'skeleton_king_idle',   frames: this.anims.generateFrameNumbers('skeleton_king', { start: 0,  end: 12 }), frameRate: 10, repeat: -1 });
        this.anims.create({ key: 'skeleton_king_move',   frames: this.anims.generateFrameNumbers('skeleton_king', { start: 13, end: 25 }), frameRate: 10, repeat: -1 });
        this.anims.create({ key: 'skeleton_king_attack', frames: this.anims.generateFrameNumbers('skeleton_king', { start: 26, end: 38 }), frameRate: 12, repeat: 0 });
        // Skeleton King Leap (13 cols x 1 row)
        this.anims.create({ key: 'skeleton_king_leap', frames: this.anims.generateFrameNumbers('skeleton_king_leap', { start: 0, end: 12 }), frameRate: 12, repeat: 0 });
        // Wind Elemental atlas (8 frames each)
        const WE = 'Wind Elemental Sprite Sheet';
        this._atlasAnim('wind_elemental_idle',   'wind_elemental', WE, 'Idle',     8, 10, -1);
        this._atlasAnim('wind_elemental_move',   'wind_elemental', WE, 'Movement', 8, 10, -1);
        this._atlasAnim('wind_elemental_attack', 'wind_elemental', WE, 'Attack',   8, 12, 0);
    }

    _createMiscAnims() {
        // Wisp: use only the clearly-visible frames (0-4) to avoid flicker
        this.anims.create({ key: 'wisp_idle', frames: this.anims.generateFrameNumbers('wisp', { start: 0, end: 4 }), frameRate: 6, repeat: -1 });
        // Skullflame (8 cols): idle 0-7
        this.anims.create({ key: 'skullflame_idle', frames: this.anims.generateFrameNumbers('skullflame', { start: 0, end: 7 }), frameRate: 8, repeat: -1 });
        // Undead Hand atlas (16 frames idle)
        const UH = 'Undead Hand Sprite Sheet';
        this._atlasAnim('undead_hand_idle', 'undead_hand', UH, 'Idle', 16, 8, -1);
    }

    _createEffectAnims() {
        // Blast Spell (128x128, 6 frames)
        this._atlasAnim('fx_blast_anim', 'fx_blast', 'Blast Spell Sprite Sheet', 'Blast Spell', 6, 12, 0);

        // Fireball (32x32, 4 cols × 3 rows = 12 frames)
        this.anims.create({ key: 'fx_fireball_anim', frames: this.anims.generateFrameNumbers('fx_fireball', { start: 0, end: 3 }), frameRate: 10, repeat: -1 });

        // Spell Projectile (32x32, 8 cols × 3 rows)
        this.anims.create({ key: 'fx_spell_proj_anim', frames: this.anims.generateFrameNumbers('fx_spell_proj', { start: 0, end: 7 }), frameRate: 10, repeat: -1 });
    }

}
