/**
 * Elixir Level-Up Skill Definitions
 * 14 skills inspired by Enshrouded's skill trees, adapted for 2D side-scroller.
 */

export const LEVEL_THRESHOLDS = [2, 5, 9, 14, 20, 27];

// Skill tree color constants
const RED = 0xFF4444;
const BLUE = 0x4488FF;
const GREEN = 0x44DD66;
const GOLD = 0xFFCC00;

export const SKILLS = [
    // ── Red (Combat) ──
    {
        id: 'earthshatter',
        name: 'Earthshatter',
        className: 'Barbarian',
        tree: 'red',
        color: RED,
        description: 'Slam stun radius +60% and stun duration +50%. Crush all who stand near.',
        apply(mgr) {
            mgr.setMult('groundSlam.stunRadius', 1.6);
            mgr.setMult('groundSlam.stunDuration', 1.5);
        }
    },
    {
        id: 'flameCleave',
        name: 'Flame Cleave',
        className: 'Warrior',
        tree: 'red',
        color: RED,
        description: 'During dash, enemies within 50px of your path are auto-banished.',
        apply(mgr) {
            mgr.setFlag('dash.autoBanish');
            mgr.addFlat('dash.autoBanishRadius', 50);
        }
    },
    {
        id: 'aerialFury',
        name: 'Aerial Fury',
        className: 'Athlete',
        tree: 'red',
        color: RED,
        description: '+1 extra air jump (triple jump) and slam velocity +25%.',
        apply(mgr) {
            mgr.addFlat('doubleJump.maxAirJumps', 1);
            mgr.setMult('groundSlam.velocity', 1.25);
        }
    },
    {
        id: 'emberWard',
        name: 'Ember Ward',
        className: 'Tank',
        tree: 'red',
        color: RED,
        description: 'Enemy contact damage -40%. Shroud flame drain -30%.',
        apply(mgr) {
            mgr.setMult('enemyDamage', 0.6);
            mgr.setMult('flameDrain.shroud', 0.7);
        }
    },

    // ── Blue (Flame/Magic) ──
    {
        id: 'infernoNova',
        name: 'Inferno Nova',
        className: 'Wizard',
        tree: 'blue',
        color: BLUE,
        description: 'Burst radius +50%, banish radius +40%, cooldown -30%.',
        apply(mgr) {
            mgr.setMult('flameBurst.radius', 1.5);
            mgr.setMult('flameBurst.banishRadius', 1.4);
            mgr.setMult('flameBurst.cooldown', 0.7);
        }
    },
    {
        id: 'wardingFlame',
        name: 'Warding Flame',
        className: 'Battlemage',
        tree: 'blue',
        color: BLUE,
        description: 'Flame Burst grants 3s of invincibility after use.',
        apply(mgr) {
            mgr.setFlag('flameBurst.grantInvincibility');
            mgr.addFlat('flameBurst.invincibilityMs', 3000);
        }
    },
    {
        id: 'kindlingSpirit',
        name: 'Kindling Spirit',
        className: 'Healer',
        tree: 'blue',
        color: BLUE,
        description: 'Wisps restore +50% flame. Shrines grant 4s of halved drain.',
        apply(mgr) {
            mgr.setMult('wisp.restoreAmount', 1.5);
            mgr.setFlag('shrine.drainBuff');
            mgr.addFlat('shrine.drainBuffDuration', 4000);
        }
    },
    {
        id: 'riposteDash',
        name: 'Riposte Dash',
        className: 'Trickster',
        tree: 'blue',
        color: BLUE,
        description: 'Dash cooldown -40%. Each enemy banished during dash restores 8 flame.',
        apply(mgr) {
            mgr.setMult('flameStep.cooldown', 0.6);
            mgr.setFlag('dash.flameRestore');
            mgr.addFlat('dash.flameRestoreAmount', 8);
        }
    },
    {
        id: 'elixirBolt',
        name: 'Elixir Bolt',
        className: 'Arcane Archer',
        tree: 'blue',
        color: BLUE,
        description: 'Mining speed +40%. Enemies near veins stunned for 3s on mine complete.',
        apply(mgr) {
            mgr.setMult('mining.mineTime', 0.6);
            mgr.setFlag('mining.stunOnComplete');
            mgr.addFlat('mining.stunRadius', 150);
            mgr.addFlat('mining.stunDuration', 3000);
        }
    },

    // ── Green (Mobility/Survival) ──
    {
        id: 'windRunner',
        name: 'Wind Runner',
        className: 'Ranger',
        tree: 'green',
        color: GREEN,
        description: 'Movement speed +25%. Wall slide fall speed -40%.',
        apply(mgr) {
            mgr.setMult('player.speed', 1.25);
            mgr.setMult('wallSlide.maxFallSpeed', 0.6);
        }
    },
    {
        id: 'shadowStep',
        name: 'Shadow Step',
        className: 'Assassin',
        tree: 'green',
        color: GREEN,
        description: 'Dash speed +30%, duration +50ms, invincibility 200 to 400ms.',
        apply(mgr) {
            mgr.setMult('flameStep.speed', 1.3);
            mgr.addFlat('flameStep.duration', 50);
            mgr.addFlat('flameStep.invincibleMs', 200);
        }
    },
    {
        id: 'spiritCompanion',
        name: 'Spirit Companion',
        className: 'Beast Master',
        tree: 'green',
        color: GREEN,
        description: 'An orbiting wisp auto-banishes 1 enemy every 8s, restores 3 flame.',
        apply(mgr) {
            mgr.setFlag('companion.enabled');
            mgr.addFlat('companion.interval', 8000);
            mgr.addFlat('companion.flameRestore', 3);
        }
    },
    {
        id: 'emberveil',
        name: 'Emberveil',
        className: 'Survivor',
        tree: 'green',
        color: GREEN,
        description: 'Normal flame drain -35%. Corruption pools no longer slow movement.',
        apply(mgr) {
            mgr.setMult('flameDrain.normal', 0.65);
            mgr.setFlag('corruption.immuneSlow');
        }
    },

    // ── Gold (Core) ──
    {
        id: 'elixirSiphon',
        name: 'Elixir Siphon',
        className: 'Core',
        tree: 'gold',
        color: GOLD,
        description: 'Bonus elixir at x3 combo (was x5). Combo window +50%.',
        apply(mgr) {
            mgr.setMult('combo.window', 1.5);
            mgr.addFlat('combo.bonusThreshold', -2);
        }
    },
];
