/**
 * Class Skill Trees — 7 classes × 12 nodes each = 84 total nodes.
 *
 * Each tree has 4 tiers × 3 nodes:
 *   Tier 0: always available
 *   Tier N: requires 2 nodes from tier N-1
 *
 * Node shape: { id, name, tier, position, color, description, apply(mgr) }
 */

export const LEVEL_THRESHOLDS = [2, 5, 9, 14, 20, 27, 35, 44, 54, 65, 77, 90];

// ── Barbarian (0xFF4444) — Kill-chaining, melee, self-sustain ──

const BARBARIAN_TREE = [
    // Tier 0
    {
        id: 'barb_blood_rage', name: 'Blood Rage', tier: 0, position: 0,
        color: 0xFF4444,
        description: '+15% damage for 5s after banish, stacks 3x.',
        apply(mgr) {
            mgr.setFlag('bloodRage.enabled');
            mgr.addFlat('bloodRage.damagePct', 0.15);
            mgr.addFlat('bloodRage.maxStacks', 3);
            mgr.addFlat('bloodRage.duration', 5000);
        }
    },
    {
        id: 'barb_battle_heal', name: 'Battle Heal', tier: 0, position: 1,
        color: 0xFF4444,
        description: '+5 flame per enemy banish.',
        apply(mgr) {
            mgr.addFlat('banish.flameRestore', 5);
        }
    },
    {
        id: 'barb_earthshatter', name: 'Earthshatter', tier: 0, position: 2,
        color: 0xFF4444,
        description: 'Slam stun radius +60%, duration +50%.',
        apply(mgr) {
            mgr.setMult('groundSlam.stunRadius', 1.6);
            mgr.setMult('groundSlam.stunDuration', 1.5);
        }
    },
    // Tier 1
    {
        id: 'barb_thick_skin', name: 'Thick Skin', tier: 1, position: 0,
        color: 0xFF4444,
        description: 'Enemy damage -30%.',
        apply(mgr) {
            mgr.setMult('enemyDamage', 0.7);
        }
    },
    {
        id: 'barb_flame_cleave', name: 'Flame Cleave', tier: 1, position: 1,
        color: 0xFF4444,
        description: 'Dash auto-banishes enemies within 50px.',
        apply(mgr) {
            mgr.setFlag('dash.autoBanish');
            mgr.addFlat('dash.autoBanishRadius', 50);
        }
    },
    {
        id: 'barb_berserker_fury', name: 'Berserker Fury', tier: 1, position: 2,
        color: 0xFF4444,
        description: 'Below 30% flame: speed +20%, Q cooldown -25%.',
        apply(mgr) {
            mgr.setFlag('berserkerFury.enabled');
            mgr.addFlat('berserkerFury.threshold', 0.3);
            mgr.addFlat('berserkerFury.speedBonus', 0.2);
            mgr.addFlat('berserkerFury.cdReduction', 0.25);
        }
    },
    // Tier 2
    {
        id: 'barb_merciless', name: 'Merciless Attack', tier: 2, position: 0,
        color: 0xFF4444,
        description: 'Stunned enemies are instant-banished on contact.',
        apply(mgr) {
            mgr.setFlag('merciless.instantBanish');
        }
    },
    {
        id: 'barb_war_cry', name: 'War Cry', tier: 2, position: 1,
        color: 0xFF4444,
        description: 'Q stun duration +50%, radius +30%.',
        apply(mgr) {
            mgr.setMult('classAttack.stunDuration', 1.5);
            mgr.setMult('classAttack.radius', 1.3);
        }
    },
    {
        id: 'barb_bloodlust', name: 'Bloodlust', tier: 2, position: 2,
        color: 0xFF4444,
        description: '+1 flame per on-screen enemy when Q used (max 5).',
        apply(mgr) {
            mgr.setFlag('bloodlust.enabled');
            mgr.addFlat('bloodlust.flamePerEnemy', 1);
            mgr.addFlat('bloodlust.maxFlame', 5);
        }
    },
    // Tier 3 (Keystones)
    {
        id: 'barb_undying_rage', name: 'Undying Rage', tier: 3, position: 0,
        color: 0xFF4444,
        description: 'Once/run: at 0 flame, restore 30 + 3s invincible.',
        apply(mgr) {
            mgr.setFlag('undyingRage.enabled');
            mgr.addFlat('undyingRage.flameRestore', 30);
            mgr.addFlat('undyingRage.invincibleMs', 3000);
        }
    },
    {
        id: 'barb_massacre', name: 'Massacre', tier: 3, position: 1,
        color: 0xFF4444,
        description: 'Q radius +40%, chain kills extend stun 500ms.',
        apply(mgr) {
            mgr.setMult('classAttack.radius', 1.4);
            mgr.setFlag('massacre.extendStun');
            mgr.addFlat('massacre.stunExtendMs', 500);
        }
    },
    {
        id: 'barb_warlord', name: 'Warlord', tier: 3, position: 2,
        color: 0xFF4444,
        description: 'Permanent +10% speed, shroud drain -20% during combo.',
        apply(mgr) {
            mgr.setMult('player.speed', 1.1);
            mgr.setFlag('warlord.comboShroudReduction');
            mgr.addFlat('warlord.shroudDrainReduction', 0.2);
        }
    },
];

// ── Wizard (0x4488FF) — AoE damage, cooldowns, elemental ──

const WIZARD_TREE = [
    // Tier 0
    {
        id: 'wiz_inferno_nova', name: 'Inferno Nova', tier: 0, position: 0,
        color: 0x4488FF,
        description: 'Burst radius +50%, banish radius +40%.',
        apply(mgr) {
            mgr.setMult('flameBurst.radius', 1.5);
            mgr.setMult('flameBurst.banishRadius', 1.4);
        }
    },
    {
        id: 'wiz_quick_charge', name: 'Quick Charge', tier: 0, position: 1,
        color: 0x4488FF,
        description: 'Q cooldown -25%, burst cooldown -20%.',
        apply(mgr) {
            mgr.setMult('classAttack.cooldown', 0.75);
            mgr.setMult('flameBurst.cooldown', 0.8);
        }
    },
    {
        id: 'wiz_radiant_aura', name: 'Radiant Aura', tier: 0, position: 2,
        color: 0x4488FF,
        description: 'Enemies within 80px take 2 damage/s.',
        apply(mgr) {
            mgr.setFlag('radiantAura.enabled');
            mgr.addFlat('radiantAura.radius', 80);
            mgr.addFlat('radiantAura.dps', 2);
        }
    },
    // Tier 1
    {
        id: 'wiz_chain_hit', name: 'Chain Hit', tier: 1, position: 0,
        color: 0x4488FF,
        description: '30% chance banish chains to nearest enemy (100px).',
        apply(mgr) {
            mgr.setFlag('chainHit.enabled');
            mgr.addFlat('chainHit.chance', 0.3);
            mgr.addFlat('chainHit.range', 100);
        }
    },
    {
        id: 'wiz_mana_shield', name: 'Mana Shield', tier: 1, position: 1,
        color: 0x4488FF,
        description: 'Burst grants 3s invincibility.',
        apply(mgr) {
            mgr.setFlag('flameBurst.grantInvincibility');
            mgr.addFlat('flameBurst.invincibilityMs', 3000);
        }
    },
    {
        id: 'wiz_elixir_bolt', name: 'Elixir Bolt', tier: 1, position: 2,
        color: 0x4488FF,
        description: 'Mining speed +40%, stun nearby enemies on complete.',
        apply(mgr) {
            mgr.setMult('mining.mineTime', 0.6);
            mgr.setFlag('mining.stunOnComplete');
            mgr.addFlat('mining.stunRadius', 150);
            mgr.addFlat('mining.stunDuration', 3000);
        }
    },
    // Tier 2
    {
        id: 'wiz_arcane_storm', name: 'Arcane Storm', tier: 2, position: 0,
        color: 0x4488FF,
        description: 'Q hits twice (2nd pulse at 60% radius, 500ms delay).',
        apply(mgr) {
            mgr.setFlag('arcaneStorm.doublePulse');
            mgr.addFlat('arcaneStorm.secondPulseRadiusMult', 0.6);
            mgr.addFlat('arcaneStorm.secondPulseDelay', 500);
        }
    },
    {
        id: 'wiz_elemental_mastery', name: 'Elemental Mastery', tier: 2, position: 1,
        color: 0x4488FF,
        description: 'All AoE +20% radius, combo window +30%.',
        apply(mgr) {
            mgr.setMult('aoe.globalRadius', 1.2);
            mgr.setMult('combo.window', 1.3);
        }
    },
    {
        id: 'wiz_flame_conduit', name: 'Flame Conduit', tier: 2, position: 2,
        color: 0x4488FF,
        description: 'Wisps +50% restore, shrines grant 4s halved drain.',
        apply(mgr) {
            mgr.setMult('wisp.restoreAmount', 1.5);
            mgr.setFlag('shrine.drainBuff');
            mgr.addFlat('shrine.drainBuffDuration', 4000);
        }
    },
    // Tier 3 (Keystones)
    {
        id: 'wiz_meteor_strike', name: 'Meteor Strike', tier: 3, position: 0,
        color: 0x4488FF,
        description: 'Q also triggers ground slam at blast center.',
        apply(mgr) {
            mgr.setFlag('meteorStrike.slamOnQ');
        }
    },
    {
        id: 'wiz_archmage', name: 'Archmage', tier: 3, position: 1,
        color: 0x4488FF,
        description: 'Q cooldown reduced 1s per enemy banished in blast.',
        apply(mgr) {
            mgr.setFlag('archmage.cdRefund');
            mgr.addFlat('archmage.cdRefundPerKill', 1000);
        }
    },
    {
        id: 'wiz_spellweave', name: 'Spellweave', tier: 3, position: 2,
        color: 0x4488FF,
        description: 'Burst within 2s of Q deals 2x damage/radius.',
        apply(mgr) {
            mgr.setFlag('spellweave.enabled');
            mgr.addFlat('spellweave.windowMs', 2000);
            mgr.addFlat('spellweave.multiplier', 2);
        }
    },
];

// ── Ranger (0x44DD66) — Mobility, ranged, evasion ──

const RANGER_TREE = [
    // Tier 0
    {
        id: 'rang_wind_runner', name: 'Wind Runner', tier: 0, position: 0,
        color: 0x44DD66,
        description: 'Speed +25%, wall slide fall -40%.',
        apply(mgr) {
            mgr.setMult('player.speed', 1.25);
            mgr.setMult('wallSlide.maxFallSpeed', 0.6);
        }
    },
    {
        id: 'rang_eagle_eye', name: 'Eagle Eye', tier: 0, position: 1,
        color: 0x44DD66,
        description: 'Detection range +50% (wisps, shrines, enemies).',
        apply(mgr) {
            mgr.setFlag('eagleEye.enabled');
            mgr.setMult('detection.range', 1.5);
        }
    },
    {
        id: 'rang_aerial_fury', name: 'Aerial Fury', tier: 0, position: 2,
        color: 0x44DD66,
        description: '+1 air jump (triple), slam velocity +25%.',
        apply(mgr) {
            mgr.addFlat('doubleJump.maxAirJumps', 1);
            mgr.setMult('groundSlam.velocity', 1.25);
        }
    },
    // Tier 1
    {
        id: 'rang_multi_shot', name: 'Multi-Shot', tier: 1, position: 0,
        color: 0x44DD66,
        description: 'Q stun: 25% chance spawn projectile banishing 1 enemy.',
        apply(mgr) {
            mgr.setFlag('multiShot.enabled');
            mgr.addFlat('multiShot.chance', 0.25);
        }
    },
    {
        id: 'rang_nimble_dodge', name: 'Nimble Dodge', tier: 1, position: 1,
        color: 0x44DD66,
        description: '15% auto-dodge enemy contact.',
        apply(mgr) {
            mgr.setFlag('nimbleDodge.enabled');
            mgr.addFlat('nimbleDodge.chance', 0.15);
        }
    },
    {
        id: 'rang_pathfinder', name: 'Pathfinder', tier: 1, position: 2,
        color: 0x44DD66,
        description: 'Corruption immune slow, normal drain -15%.',
        apply(mgr) {
            mgr.setFlag('corruption.immuneSlow');
            mgr.setMult('flameDrain.normal', 0.85);
        }
    },
    // Tier 2
    {
        id: 'rang_emergency_blink', name: 'Emergency Blink', tier: 2, position: 0,
        color: 0x44DD66,
        description: 'Below 20 flame + hit: auto-teleport 100px (10s CD).',
        apply(mgr) {
            mgr.setFlag('emergencyBlink.enabled');
            mgr.addFlat('emergencyBlink.distance', 100);
            mgr.addFlat('emergencyBlink.cooldown', 10000);
        }
    },
    {
        id: 'rang_arrow_storm', name: 'Arrow Storm', tier: 2, position: 1,
        color: 0x44DD66,
        description: 'Q stun +40%, stunned enemies 15% chance drop wisp.',
        apply(mgr) {
            mgr.setMult('classAttack.stunDuration', 1.4);
            mgr.setFlag('arrowStorm.wispDrop');
            mgr.addFlat('arrowStorm.wispDropChance', 0.15);
        }
    },
    {
        id: 'rang_fleet_foot', name: 'Fleet Foot', tier: 2, position: 2,
        color: 0x44DD66,
        description: 'Dash CD -30%, dash distance +20%.',
        apply(mgr) {
            mgr.setMult('flameStep.cooldown', 0.7);
            mgr.setMult('flameStep.speed', 1.2);
        }
    },
    // Tier 3 (Keystones)
    {
        id: 'rang_phantom_arrow', name: 'Phantom Arrow', tier: 3, position: 0,
        color: 0x44DD66,
        description: 'Q also fires piercing projectile (400px line banish).',
        apply(mgr) {
            mgr.setFlag('phantomArrow.enabled');
            mgr.addFlat('phantomArrow.range', 400);
        }
    },
    {
        id: 'rang_evasion_mastery', name: 'Evasion Mastery', tier: 3, position: 1,
        color: 0x44DD66,
        description: 'Dodge chance +15% (total 30%), dodge restores 3 flame.',
        apply(mgr) {
            mgr.addFlat('nimbleDodge.chance', 0.15);
            mgr.addFlat('nimbleDodge.flameRestore', 3);
        }
    },
    {
        id: 'rang_wind_walker', name: 'Wind Walker', tier: 3, position: 2,
        color: 0x44DD66,
        description: 'Glider: horiz speed +50%, fall speed -30%.',
        apply(mgr) {
            mgr.setMult('glider.horizontalBoost', 1.5);
            mgr.setMult('glider.maxFallSpeed', 0.7);
        }
    },
];

// ── Tank (0xCCCCCC) — Defense, damage reduction, parry ──

const TANK_TREE = [
    // Tier 0
    {
        id: 'tank_ember_ward', name: 'Ember Ward', tier: 0, position: 0,
        color: 0xCCCCCC,
        description: 'Enemy damage -40%, shroud drain -30%.',
        apply(mgr) {
            mgr.setMult('enemyDamage', 0.6);
            mgr.setMult('flameDrain.shroud', 0.7);
        }
    },
    {
        id: 'tank_iron_body', name: 'Iron Body', tier: 0, position: 1,
        color: 0xCCCCCC,
        description: 'Max flame +15.',
        apply(mgr) {
            mgr.addFlat('flame.maxBonus', 15);
        }
    },
    {
        id: 'tank_steadfast', name: 'Steadfast', tier: 0, position: 2,
        color: 0xCCCCCC,
        description: 'Knockback immunity.',
        apply(mgr) {
            mgr.setFlag('steadfast.knockbackImmune');
        }
    },
    // Tier 1
    {
        id: 'tank_parry_power', name: 'Parry Power', tier: 1, position: 0,
        color: 0xCCCCCC,
        description: 'Dodge enemy within 50px during dash: Q CD -2s.',
        apply(mgr) {
            mgr.setFlag('parryPower.enabled');
            mgr.addFlat('parryPower.range', 50);
            mgr.addFlat('parryPower.cdReduction', 2000);
        }
    },
    {
        id: 'tank_fortify', name: 'Fortify', tier: 1, position: 1,
        color: 0xCCCCCC,
        description: 'Standing still: damage -50%, drain -25%.',
        apply(mgr) {
            mgr.setFlag('fortify.enabled');
            mgr.addFlat('fortify.damageMult', 0.5);
            mgr.addFlat('fortify.drainMult', 0.75);
        }
    },
    {
        id: 'tank_shield_bash', name: 'Shield Bash', tier: 1, position: 2,
        color: 0xCCCCCC,
        description: 'During shield, contacting enemies banishes them (max 3).',
        apply(mgr) {
            mgr.setFlag('shieldBash.enabled');
            mgr.addFlat('shieldBash.maxBanish', 3);
        }
    },
    // Tier 2
    {
        id: 'tank_power_parry', name: 'Power Parry', tier: 2, position: 0,
        color: 0xCCCCCC,
        description: 'Enemies hitting during shield reflect 10 damage.',
        apply(mgr) {
            mgr.setFlag('powerParry.reflect');
            mgr.addFlat('powerParry.reflectDamage', 10);
        }
    },
    {
        id: 'tank_constitution', name: 'Constitution', tier: 2, position: 1,
        color: 0xCCCCCC,
        description: '+10 max flame, drain -10% per 25 max flame.',
        apply(mgr) {
            mgr.addFlat('flame.maxBonus', 10);
            mgr.setFlag('constitution.scalingDrain');
        }
    },
    {
        id: 'tank_bulwark', name: 'Bulwark', tier: 2, position: 2,
        color: 0xCCCCCC,
        description: 'Shield +2s duration, shroud paused during shield.',
        apply(mgr) {
            mgr.addFlat('shield.durationBonus', 2000);
            mgr.setFlag('bulwark.shroudPause');
        }
    },
    // Tier 3 (Keystones)
    {
        id: 'tank_unbreakable', name: 'Unbreakable', tier: 3, position: 0,
        color: 0xCCCCCC,
        description: 'Shield CD -30%, shield restores 15 flame.',
        apply(mgr) {
            mgr.setMult('classAttack.cooldown', 0.7);
            mgr.addFlat('shield.flameRestore', 15);
        }
    },
    {
        id: 'tank_living_fortress', name: 'Living Fortress', tier: 3, position: 1,
        color: 0xCCCCCC,
        description: 'All damage -50%, +20 max flame, speed -10%.',
        apply(mgr) {
            mgr.setMult('enemyDamage', 0.5);
            mgr.addFlat('flame.maxBonus', 20);
            mgr.setMult('player.speed', 0.9);
        }
    },
    {
        id: 'tank_aegis_of_flame', name: 'Aegis of Flame', tier: 3, position: 2,
        color: 0xCCCCCC,
        description: 'Shield expiry: AoE blast radius 120, stun 2s.',
        apply(mgr) {
            mgr.setFlag('aegisOfFlame.enabled');
            mgr.addFlat('aegisOfFlame.radius', 120);
            mgr.addFlat('aegisOfFlame.stunDuration', 2000);
        }
    },
];

// ── Healer (0x88DDFF) — Flame sustain, wisps, auras ──

const HEALER_TREE = [
    // Tier 0
    {
        id: 'heal_kindling_spirit', name: 'Kindling Spirit', tier: 0, position: 0,
        color: 0x88DDFF,
        description: 'Wisps +50% restore, shrines grant 4s halved drain.',
        apply(mgr) {
            mgr.setMult('wisp.restoreAmount', 1.5);
            mgr.setFlag('shrine.drainBuff');
            mgr.addFlat('shrine.drainBuffDuration', 4000);
        }
    },
    {
        id: 'heal_water_aura', name: 'Water Aura', tier: 0, position: 1,
        color: 0x88DDFF,
        description: 'Passive +1 flame/s regen.',
        apply(mgr) {
            mgr.setFlag('waterAura.enabled');
            mgr.addFlat('waterAura.regenPerSec', 1);
        }
    },
    {
        id: 'heal_emberveil', name: 'Emberveil', tier: 0, position: 2,
        color: 0x88DDFF,
        description: 'Normal drain -35%, corruption immune slow.',
        apply(mgr) {
            mgr.setMult('flameDrain.normal', 0.65);
            mgr.setFlag('corruption.immuneSlow');
        }
    },
    // Tier 1
    {
        id: 'heal_chain_heal', name: 'Chain Heal', tier: 1, position: 0,
        color: 0x88DDFF,
        description: 'Wisp collected: 30% chance spawn second wisp.',
        apply(mgr) {
            mgr.setFlag('chainHeal.enabled');
            mgr.addFlat('chainHeal.chance', 0.3);
        }
    },
    {
        id: 'heal_healing_boost', name: 'Healing Boost', tier: 1, position: 1,
        color: 0x88DDFF,
        description: 'Q heal +15 (total 45), drain reduction +3s.',
        apply(mgr) {
            mgr.addFlat('classAttack.healBonus', 15);
            mgr.addFlat('classAttack.drainReductionBonus', 3000);
        }
    },
    {
        id: 'heal_sanctuary', name: 'Sanctuary', tier: 1, position: 2,
        color: 0x88DDFF,
        description: 'Near shrines (100px): damage -30%.',
        apply(mgr) {
            mgr.setFlag('sanctuary.enabled');
            mgr.addFlat('sanctuary.range', 100);
            mgr.addFlat('sanctuary.damageMult', 0.7);
        }
    },
    // Tier 2
    {
        id: 'heal_purify', name: 'Purify', tier: 2, position: 0,
        color: 0x88DDFF,
        description: 'Q cleanses corruption to 0.',
        apply(mgr) {
            mgr.setFlag('purify.cleanse');
        }
    },
    {
        id: 'heal_rejuvenation', name: 'Rejuvenation', tier: 2, position: 1,
        color: 0x88DDFF,
        description: 'After Q: +3 flame/s regen for 8s.',
        apply(mgr) {
            mgr.setFlag('rejuvenation.enabled');
            mgr.addFlat('rejuvenation.regenPerSec', 3);
            mgr.addFlat('rejuvenation.duration', 8000);
        }
    },
    {
        id: 'heal_spirit_companion', name: 'Spirit Companion', tier: 2, position: 2,
        color: 0x88DDFF,
        description: 'Orbiting wisp banishes 1 enemy/8s, +3 flame.',
        apply(mgr) {
            mgr.setFlag('companion.enabled');
            mgr.addFlat('companion.interval', 8000);
            mgr.addFlat('companion.flameRestore', 3);
        }
    },
    // Tier 3 (Keystones)
    {
        id: 'heal_divine_intervention', name: 'Divine Intervention', tier: 3, position: 0,
        color: 0x88DDFF,
        description: 'Once/run: at 0 flame, auto-trigger Q heal.',
        apply(mgr) {
            mgr.setFlag('divineIntervention.enabled');
        }
    },
    {
        id: 'heal_wellspring', name: 'Wellspring', tier: 3, position: 1,
        color: 0x88DDFF,
        description: '+25 max flame, +1 regen/s per 25 max flame above base.',
        apply(mgr) {
            mgr.addFlat('flame.maxBonus', 25);
            mgr.setFlag('wellspring.scalingRegen');
        }
    },
    {
        id: 'heal_ascendance', name: 'Ascendance', tier: 3, position: 2,
        color: 0x88DDFF,
        description: 'Q CD -40%, each wisp reduces Q CD by 1s.',
        apply(mgr) {
            mgr.setMult('classAttack.cooldown', 0.6);
            mgr.setFlag('ascendance.wispCdReduction');
            mgr.addFlat('ascendance.cdPerWisp', 1000);
        }
    },
];

// ── Assassin (0xAA44FF) — Speed, positioning, burst ──

const ASSASSIN_TREE = [
    // Tier 0
    {
        id: 'asin_shadow_step', name: 'Shadow Step', tier: 0, position: 0,
        color: 0xAA44FF,
        description: 'Dash speed +30%, duration +50ms, invincibility +200ms.',
        apply(mgr) {
            mgr.setMult('flameStep.speed', 1.3);
            mgr.addFlat('flameStep.duration', 50);
            mgr.addFlat('flameStep.invincibleMs', 200);
        }
    },
    {
        id: 'asin_backstab', name: 'Backstab', tier: 0, position: 1,
        color: 0xAA44FF,
        description: 'Dash through enemies banishes them from behind.',
        apply(mgr) {
            mgr.setFlag('backstab.enabled');
        }
    },
    {
        id: 'asin_quick_reflexes', name: 'Quick Reflexes', tier: 0, position: 2,
        color: 0xAA44FF,
        description: 'Dash CD -35%, combo window +25%.',
        apply(mgr) {
            mgr.setMult('flameStep.cooldown', 0.65);
            mgr.setMult('combo.window', 1.25);
        }
    },
    // Tier 1
    {
        id: 'asin_poison_blade', name: 'Poison Blade', tier: 1, position: 0,
        color: 0xAA44FF,
        description: 'Banished enemies leave a 3s poison cloud (40px, 2 dmg/s).',
        apply(mgr) {
            mgr.setFlag('poisonBlade.enabled');
            mgr.addFlat('poisonBlade.duration', 3000);
            mgr.addFlat('poisonBlade.radius', 40);
            mgr.addFlat('poisonBlade.dps', 2);
        }
    },
    {
        id: 'asin_shadow_cloak', name: 'Shadow Cloak', tier: 1, position: 1,
        color: 0xAA44FF,
        description: 'After Q blink: 2s stealth (enemies ignore you).',
        apply(mgr) {
            mgr.setFlag('shadowCloak.enabled');
            mgr.addFlat('shadowCloak.duration', 2000);
        }
    },
    {
        id: 'asin_agility', name: 'Agility', tier: 1, position: 2,
        color: 0xAA44FF,
        description: 'Speed +20%, +1 air jump.',
        apply(mgr) {
            mgr.setMult('player.speed', 1.2);
            mgr.addFlat('doubleJump.maxAirJumps', 1);
        }
    },
    // Tier 2
    {
        id: 'asin_mark_for_death', name: 'Mark for Death', tier: 2, position: 0,
        color: 0xAA44FF,
        description: 'Q blink marks enemies within 60px — next hit banishes.',
        apply(mgr) {
            mgr.setFlag('markForDeath.enabled');
            mgr.addFlat('markForDeath.radius', 60);
        }
    },
    {
        id: 'asin_exploit_weakness', name: 'Exploit Weakness', tier: 2, position: 1,
        color: 0xAA44FF,
        description: 'Stunned enemies take 2x banish flame restore.',
        apply(mgr) {
            mgr.setFlag('exploitWeakness.enabled');
            mgr.addFlat('exploitWeakness.restoreMult', 2);
        }
    },
    {
        id: 'asin_smoke_bomb', name: 'Smoke Bomb', tier: 2, position: 2,
        color: 0xAA44FF,
        description: 'Q blink leaves smoke cloud: enemies in 80px stunned 2s.',
        apply(mgr) {
            mgr.setFlag('smokeBomb.enabled');
            mgr.addFlat('smokeBomb.radius', 80);
            mgr.addFlat('smokeBomb.stunDuration', 2000);
        }
    },
    // Tier 3 (Keystones)
    {
        id: 'asin_death_mark', name: 'Death Mark', tier: 3, position: 0,
        color: 0xAA44FF,
        description: 'Marked enemies explode on banish (60px AoE banish).',
        apply(mgr) {
            mgr.setFlag('deathMark.explode');
            mgr.addFlat('deathMark.explosionRadius', 60);
        }
    },
    {
        id: 'asin_phantom_dance', name: 'Phantom Dance', tier: 3, position: 1,
        color: 0xAA44FF,
        description: 'Q blink resets on banish within 2s. +5 flame per blink-banish.',
        apply(mgr) {
            mgr.setFlag('phantomDance.resetOnBanish');
            mgr.addFlat('phantomDance.windowMs', 2000);
            mgr.addFlat('phantomDance.flameRestore', 5);
        }
    },
    {
        id: 'asin_shadow_master', name: 'Shadow Master', tier: 3, position: 2,
        color: 0xAA44FF,
        description: 'Blink distance +50%, stealth duration +3s, drain -20%.',
        apply(mgr) {
            mgr.setMult('blink.distance', 1.5);
            mgr.addFlat('shadowCloak.duration', 3000);
            mgr.setMult('flameDrain.normal', 0.8);
        }
    },
];

// ── Adventurer (0xFFCC00) — Generic survival tree (free class) ──

const ADVENTURER_TREE = [
    // Tier 0
    {
        id: 'adv_survivors_instinct', name: "Survivor's Instinct", tier: 0, position: 0,
        color: 0xFFCC00,
        description: 'Normal flame drain -20%.',
        apply(mgr) {
            mgr.setMult('flameDrain.normal', 0.8);
        }
    },
    {
        id: 'adv_scavenger', name: 'Scavenger', tier: 0, position: 1,
        color: 0xFFCC00,
        description: 'Wisp restore +25%.',
        apply(mgr) {
            mgr.setMult('wisp.restoreAmount', 1.25);
        }
    },
    {
        id: 'adv_fleet_feet', name: 'Fleet Feet', tier: 0, position: 2,
        color: 0xFFCC00,
        description: 'Movement speed +15%.',
        apply(mgr) {
            mgr.setMult('player.speed', 1.15);
        }
    },
    // Tier 1
    {
        id: 'adv_tough_hide', name: 'Tough Hide', tier: 1, position: 0,
        color: 0xFFCC00,
        description: 'Enemy damage -25%.',
        apply(mgr) {
            mgr.setMult('enemyDamage', 0.75);
        }
    },
    {
        id: 'adv_combo_fighter', name: 'Combo Fighter', tier: 1, position: 1,
        color: 0xFFCC00,
        description: 'Combo window +40%, bonus elixir at x3 (was x5).',
        apply(mgr) {
            mgr.setMult('combo.window', 1.4);
            mgr.addFlat('combo.bonusThreshold', -2);
        }
    },
    {
        id: 'adv_quick_dash', name: 'Quick Dash', tier: 1, position: 2,
        color: 0xFFCC00,
        description: 'Dash CD -25%, speed +15%.',
        apply(mgr) {
            mgr.setMult('flameStep.cooldown', 0.75);
            mgr.setMult('flameStep.speed', 1.15);
        }
    },
    // Tier 2
    {
        id: 'adv_wall_master', name: 'Wall Master', tier: 2, position: 0,
        color: 0xFFCC00,
        description: 'Wall slide -40% fall, +1 air jump.',
        apply(mgr) {
            mgr.setMult('wallSlide.maxFallSpeed', 0.6);
            mgr.addFlat('doubleJump.maxAirJumps', 1);
        }
    },
    {
        id: 'adv_flame_saver', name: 'Flame Saver', tier: 2, position: 1,
        color: 0xFFCC00,
        description: 'Shroud drain -25%, corruption immune slow.',
        apply(mgr) {
            mgr.setMult('flameDrain.shroud', 0.75);
            mgr.setFlag('corruption.immuneSlow');
        }
    },
    {
        id: 'adv_mining_expert', name: 'Mining Expert', tier: 2, position: 2,
        color: 0xFFCC00,
        description: 'Mining speed +30%, stun on complete.',
        apply(mgr) {
            mgr.setMult('mining.mineTime', 0.7);
            mgr.setFlag('mining.stunOnComplete');
            mgr.addFlat('mining.stunRadius', 120);
            mgr.addFlat('mining.stunDuration', 2000);
        }
    },
    // Tier 3 (Keystones)
    {
        id: 'adv_second_wind', name: 'Second Wind', tier: 3, position: 0,
        color: 0xFFCC00,
        description: 'Once/run: at 0 flame, restore 20.',
        apply(mgr) {
            mgr.setFlag('secondWind.enabled');
            mgr.addFlat('secondWind.flameRestore', 20);
        }
    },
    {
        id: 'adv_elixir_mastery', name: 'Elixir Mastery', tier: 3, position: 1,
        color: 0xFFCC00,
        description: '+10% all elixir gains, +10 max flame.',
        apply(mgr) {
            mgr.setMult('elixir.gainMult', 1.1);
            mgr.addFlat('flame.maxBonus', 10);
        }
    },
    {
        id: 'adv_adapt_overcome', name: 'Adapt & Overcome', tier: 3, position: 2,
        color: 0xFFCC00,
        description: '+10% speed, +10% wisp restore, -10% all drain.',
        apply(mgr) {
            mgr.setMult('player.speed', 1.1);
            mgr.setMult('wisp.restoreAmount', 1.1);
            mgr.setMult('flameDrain.normal', 0.9);
            mgr.setMult('flameDrain.shroud', 0.9);
        }
    },
];

// ── Export all trees keyed by class ID ──

export const CLASS_SKILL_TREES = Object.freeze({
    adventurer: ADVENTURER_TREE,
    barbarian:  BARBARIAN_TREE,
    wizard:     WIZARD_TREE,
    ranger:     RANGER_TREE,
    tank:       TANK_TREE,
    healer:     HEALER_TREE,
    assassin:   ASSASSIN_TREE,
});
