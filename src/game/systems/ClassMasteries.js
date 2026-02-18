/**
 * ClassMasteries — persistent class-specific upgrades purchasable outside of gameplay.
 * Each class has 5 masteries with 3 ranks each. Effects applied at run start via SkillManager.
 */

export const MASTERY_RANK_COSTS = [5, 10, 20];

export const CLASS_MASTERIES = Object.freeze({
    barbarian: [
        {
            id: 'barb_battle_hardened',
            name: 'Battle Hardened',
            description: 'Increases maximum flame',
            ranks: [
                { cost: 5,  label: 'Max flame +3',  apply(mgr) { mgr.addFlat('flame.maxBonus', 3); } },
                { cost: 10, label: 'Max flame +5',  apply(mgr) { mgr.addFlat('flame.maxBonus', 5); } },
                { cost: 20, label: 'Max flame +8',  apply(mgr) { mgr.addFlat('flame.maxBonus', 8); } },
            ]
        },
        {
            id: 'barb_bloodthirst',
            name: 'Bloodthirst',
            description: 'Banishing restores more flame',
            ranks: [
                { cost: 5,  label: 'Banish flame +1', apply(mgr) { mgr.addFlat('banish.flameRestore', 1); } },
                { cost: 10, label: 'Banish flame +2', apply(mgr) { mgr.addFlat('banish.flameRestore', 2); } },
                { cost: 20, label: 'Banish flame +3', apply(mgr) { mgr.addFlat('banish.flameRestore', 3); } },
            ]
        },
        {
            id: 'barb_savage_speed',
            name: 'Savage Speed',
            description: 'Increases movement speed',
            ranks: [
                { cost: 5,  label: 'Speed +3%',  apply(mgr) { mgr.setMult('player.speed', 1.03); } },
                { cost: 10, label: 'Speed +5%',  apply(mgr) { mgr.setMult('player.speed', 1.05); } },
                { cost: 20, label: 'Speed +8%',  apply(mgr) { mgr.setMult('player.speed', 1.08); } },
            ]
        },
        {
            id: 'barb_thick_skull',
            name: 'Thick Skull',
            description: 'Reduces enemy damage taken',
            ranks: [
                { cost: 5,  label: 'Enemy dmg -5%',  apply(mgr) { mgr.setMult('enemyDamage', 0.95); } },
                { cost: 10, label: 'Enemy dmg -10%', apply(mgr) { mgr.setMult('enemyDamage', 0.90); } },
                { cost: 20, label: 'Enemy dmg -15%', apply(mgr) { mgr.setMult('enemyDamage', 0.85); } },
            ]
        },
        {
            id: 'barb_war_veteran',
            name: 'War Veteran',
            description: 'Reduces Q ability cooldown',
            ranks: [
                { cost: 5,  label: 'Q CD -5%',  apply(mgr) { mgr.setMult('classAttack.cooldown', 0.95); } },
                { cost: 10, label: 'Q CD -10%', apply(mgr) { mgr.setMult('classAttack.cooldown', 0.90); } },
                { cost: 20, label: 'Q CD -15%', apply(mgr) { mgr.setMult('classAttack.cooldown', 0.85); } },
            ]
        },
    ],

    wizard: [
        {
            id: 'wiz_arcane_focus',
            name: 'Arcane Focus',
            description: 'Reduces Q ability cooldown',
            ranks: [
                { cost: 5,  label: 'Q CD -5%',  apply(mgr) { mgr.setMult('classAttack.cooldown', 0.95); } },
                { cost: 10, label: 'Q CD -10%', apply(mgr) { mgr.setMult('classAttack.cooldown', 0.90); } },
                { cost: 20, label: 'Q CD -15%', apply(mgr) { mgr.setMult('classAttack.cooldown', 0.85); } },
            ]
        },
        {
            id: 'wiz_mana_well',
            name: 'Mana Well',
            description: 'Increases maximum flame',
            ranks: [
                { cost: 5,  label: 'Max flame +3',  apply(mgr) { mgr.addFlat('flame.maxBonus', 3); } },
                { cost: 10, label: 'Max flame +5',  apply(mgr) { mgr.addFlat('flame.maxBonus', 5); } },
                { cost: 20, label: 'Max flame +8',  apply(mgr) { mgr.addFlat('flame.maxBonus', 8); } },
            ]
        },
        {
            id: 'wiz_elemental_affinity',
            name: 'Elemental Affinity',
            description: 'Increases flame burst radius',
            ranks: [
                { cost: 5,  label: 'Burst radius +10%', apply(mgr) { mgr.setMult('flameBurst.radius', 1.10); } },
                { cost: 10, label: 'Burst radius +15%', apply(mgr) { mgr.setMult('flameBurst.radius', 1.15); } },
                { cost: 20, label: 'Burst radius +20%', apply(mgr) { mgr.setMult('flameBurst.radius', 1.20); } },
            ]
        },
        {
            id: 'wiz_runic_shield',
            name: 'Runic Shield',
            description: 'Reduces enemy damage taken',
            ranks: [
                { cost: 5,  label: 'Enemy dmg -5%',  apply(mgr) { mgr.setMult('enemyDamage', 0.95); } },
                { cost: 10, label: 'Enemy dmg -8%',  apply(mgr) { mgr.setMult('enemyDamage', 0.92); } },
                { cost: 20, label: 'Enemy dmg -12%', apply(mgr) { mgr.setMult('enemyDamage', 0.88); } },
            ]
        },
        {
            id: 'wiz_studious',
            name: 'Studious',
            description: 'Increases elixir gain',
            ranks: [
                { cost: 5,  label: 'Elixir gain +5%',  apply(mgr) { mgr.setMult('elixir.gainMult', 1.05); } },
                { cost: 10, label: 'Elixir gain +8%',  apply(mgr) { mgr.setMult('elixir.gainMult', 1.08); } },
                { cost: 20, label: 'Elixir gain +12%', apply(mgr) { mgr.setMult('elixir.gainMult', 1.12); } },
            ]
        },
    ],

    ranger: [
        {
            id: 'rgr_light_footed',
            name: 'Light Footed',
            description: 'Increases movement speed',
            ranks: [
                { cost: 5,  label: 'Speed +5%',  apply(mgr) { mgr.setMult('player.speed', 1.05); } },
                { cost: 10, label: 'Speed +8%',  apply(mgr) { mgr.setMult('player.speed', 1.08); } },
                { cost: 20, label: 'Speed +12%', apply(mgr) { mgr.setMult('player.speed', 1.12); } },
            ]
        },
        {
            id: 'rgr_keen_senses',
            name: 'Keen Senses',
            description: 'Reduces flame drain rate',
            ranks: [
                { cost: 5,  label: 'Flame drain -3%', apply(mgr) { mgr.setMult('flameDrain', 0.97); } },
                { cost: 10, label: 'Flame drain -5%', apply(mgr) { mgr.setMult('flameDrain', 0.95); } },
                { cost: 20, label: 'Flame drain -8%', apply(mgr) { mgr.setMult('flameDrain', 0.92); } },
            ]
        },
        {
            id: 'rgr_survival_training',
            name: 'Survival Training',
            description: 'Increases maximum flame',
            ranks: [
                { cost: 5,  label: 'Max flame +3',  apply(mgr) { mgr.addFlat('flame.maxBonus', 3); } },
                { cost: 10, label: 'Max flame +5',  apply(mgr) { mgr.addFlat('flame.maxBonus', 5); } },
                { cost: 20, label: 'Max flame +8',  apply(mgr) { mgr.addFlat('flame.maxBonus', 8); } },
            ]
        },
        {
            id: 'rgr_quick_reflexes',
            name: 'Quick Reflexes',
            description: 'Reduces dash cooldown',
            ranks: [
                { cost: 5,  label: 'Dash CD -5%',  apply(mgr) { mgr.setMult('flameStep.cooldown', 0.95); } },
                { cost: 10, label: 'Dash CD -10%', apply(mgr) { mgr.setMult('flameStep.cooldown', 0.90); } },
                { cost: 20, label: 'Dash CD -15%', apply(mgr) { mgr.setMult('flameStep.cooldown', 0.85); } },
            ]
        },
        {
            id: 'rgr_marksman',
            name: 'Marksman',
            description: 'Reduces Q ability cooldown',
            ranks: [
                { cost: 5,  label: 'Q CD -5%',  apply(mgr) { mgr.setMult('classAttack.cooldown', 0.95); } },
                { cost: 10, label: 'Q CD -10%', apply(mgr) { mgr.setMult('classAttack.cooldown', 0.90); } },
                { cost: 20, label: 'Q CD -15%', apply(mgr) { mgr.setMult('classAttack.cooldown', 0.85); } },
            ]
        },
    ],

    tank: [
        {
            id: 'tank_iron_constitution',
            name: 'Iron Constitution',
            description: 'Increases maximum flame',
            ranks: [
                { cost: 5,  label: 'Max flame +5',  apply(mgr) { mgr.addFlat('flame.maxBonus', 5); } },
                { cost: 10, label: 'Max flame +8',  apply(mgr) { mgr.addFlat('flame.maxBonus', 8); } },
                { cost: 20, label: 'Max flame +12', apply(mgr) { mgr.addFlat('flame.maxBonus', 12); } },
            ]
        },
        {
            id: 'tank_armor_plating',
            name: 'Armor Plating',
            description: 'Reduces enemy damage taken',
            ranks: [
                { cost: 5,  label: 'Enemy dmg -5%',  apply(mgr) { mgr.setMult('enemyDamage', 0.95); } },
                { cost: 10, label: 'Enemy dmg -10%', apply(mgr) { mgr.setMult('enemyDamage', 0.90); } },
                { cost: 20, label: 'Enemy dmg -15%', apply(mgr) { mgr.setMult('enemyDamage', 0.85); } },
            ]
        },
        {
            id: 'tank_shield_training',
            name: 'Shield Training',
            description: 'Increases Q ability duration',
            ranks: [
                { cost: 5,  label: 'Q dur +10%', apply(mgr) { mgr.setMult('classAttack.duration', 1.10); } },
                { cost: 10, label: 'Q dur +15%', apply(mgr) { mgr.setMult('classAttack.duration', 1.15); } },
                { cost: 20, label: 'Q dur +20%', apply(mgr) { mgr.setMult('classAttack.duration', 1.20); } },
            ]
        },
        {
            id: 'tank_endurance',
            name: 'Endurance',
            description: 'Reduces flame drain rate',
            ranks: [
                { cost: 5,  label: 'Flame drain -3%', apply(mgr) { mgr.setMult('flameDrain', 0.97); } },
                { cost: 10, label: 'Flame drain -5%', apply(mgr) { mgr.setMult('flameDrain', 0.95); } },
                { cost: 20, label: 'Flame drain -8%', apply(mgr) { mgr.setMult('flameDrain', 0.92); } },
            ]
        },
        {
            id: 'tank_vigilance',
            name: 'Vigilance',
            description: 'Slows the shroud advance',
            ranks: [
                { cost: 5,  label: 'Shroud speed -3%', apply(mgr) { mgr.setMult('shroud.speed', 0.97); } },
                { cost: 10, label: 'Shroud speed -5%', apply(mgr) { mgr.setMult('shroud.speed', 0.95); } },
                { cost: 20, label: 'Shroud speed -8%', apply(mgr) { mgr.setMult('shroud.speed', 0.92); } },
            ]
        },
    ],

    healer: [
        {
            id: 'heal_inner_light',
            name: 'Inner Light',
            description: 'Passive flame regeneration',
            ranks: [
                { cost: 5,  label: 'Flame regen +0.3/s', apply(mgr) { mgr.addFlat('flame.regen', 0.3); } },
                { cost: 10, label: 'Flame regen +0.5/s', apply(mgr) { mgr.addFlat('flame.regen', 0.5); } },
                { cost: 20, label: 'Flame regen +0.8/s', apply(mgr) { mgr.addFlat('flame.regen', 0.8); } },
            ]
        },
        {
            id: 'heal_blessed_touch',
            name: 'Blessed Touch',
            description: 'Wisps restore more flame',
            ranks: [
                { cost: 5,  label: 'Wisp restore +10%', apply(mgr) { mgr.setMult('wisp.restoreAmount', 1.10); } },
                { cost: 10, label: 'Wisp restore +15%', apply(mgr) { mgr.setMult('wisp.restoreAmount', 1.15); } },
                { cost: 20, label: 'Wisp restore +20%', apply(mgr) { mgr.setMult('wisp.restoreAmount', 1.20); } },
            ]
        },
        {
            id: 'heal_vitality',
            name: 'Vitality',
            description: 'Increases maximum flame',
            ranks: [
                { cost: 5,  label: 'Max flame +3',  apply(mgr) { mgr.addFlat('flame.maxBonus', 3); } },
                { cost: 10, label: 'Max flame +5',  apply(mgr) { mgr.addFlat('flame.maxBonus', 5); } },
                { cost: 20, label: 'Max flame +8',  apply(mgr) { mgr.addFlat('flame.maxBonus', 8); } },
            ]
        },
        {
            id: 'heal_spirit_bond',
            name: 'Spirit Bond',
            description: 'Reduces Q ability cooldown',
            ranks: [
                { cost: 5,  label: 'Q CD -5%',  apply(mgr) { mgr.setMult('classAttack.cooldown', 0.95); } },
                { cost: 10, label: 'Q CD -10%', apply(mgr) { mgr.setMult('classAttack.cooldown', 0.90); } },
                { cost: 20, label: 'Q CD -15%', apply(mgr) { mgr.setMult('classAttack.cooldown', 0.85); } },
            ]
        },
        {
            id: 'heal_purification',
            name: 'Purification',
            description: 'Reduces flame drain rate',
            ranks: [
                { cost: 5,  label: 'Flame drain -5%',  apply(mgr) { mgr.setMult('flameDrain', 0.95); } },
                { cost: 10, label: 'Flame drain -8%',  apply(mgr) { mgr.setMult('flameDrain', 0.92); } },
                { cost: 20, label: 'Flame drain -12%', apply(mgr) { mgr.setMult('flameDrain', 0.88); } },
            ]
        },
    ],

    assassin: [
        {
            id: 'asn_shadow_step',
            name: 'Shadow Step',
            description: 'Increases movement speed',
            ranks: [
                { cost: 5,  label: 'Speed +5%',  apply(mgr) { mgr.setMult('player.speed', 1.05); } },
                { cost: 10, label: 'Speed +8%',  apply(mgr) { mgr.setMult('player.speed', 1.08); } },
                { cost: 20, label: 'Speed +12%', apply(mgr) { mgr.setMult('player.speed', 1.12); } },
            ]
        },
        {
            id: 'asn_lethal_precision',
            name: 'Lethal Precision',
            description: 'Banishing restores more flame',
            ranks: [
                { cost: 5,  label: 'Banish flame +1', apply(mgr) { mgr.addFlat('banish.flameRestore', 1); } },
                { cost: 10, label: 'Banish flame +2', apply(mgr) { mgr.addFlat('banish.flameRestore', 2); } },
                { cost: 20, label: 'Banish flame +3', apply(mgr) { mgr.addFlat('banish.flameRestore', 3); } },
            ]
        },
        {
            id: 'asn_evasion',
            name: 'Evasion',
            description: 'Reduces enemy damage taken',
            ranks: [
                { cost: 5,  label: 'Enemy dmg -5%',  apply(mgr) { mgr.setMult('enemyDamage', 0.95); } },
                { cost: 10, label: 'Enemy dmg -8%',  apply(mgr) { mgr.setMult('enemyDamage', 0.92); } },
                { cost: 20, label: 'Enemy dmg -12%', apply(mgr) { mgr.setMult('enemyDamage', 0.88); } },
            ]
        },
        {
            id: 'asn_swift_strikes',
            name: 'Swift Strikes',
            description: 'Reduces Q ability cooldown',
            ranks: [
                { cost: 5,  label: 'Q CD -5%',  apply(mgr) { mgr.setMult('classAttack.cooldown', 0.95); } },
                { cost: 10, label: 'Q CD -10%', apply(mgr) { mgr.setMult('classAttack.cooldown', 0.90); } },
                { cost: 20, label: 'Q CD -15%', apply(mgr) { mgr.setMult('classAttack.cooldown', 0.85); } },
            ]
        },
        {
            id: 'asn_cloak_of_shadows',
            name: 'Cloak of Shadows',
            description: 'Reduces flame drain rate',
            ranks: [
                { cost: 5,  label: 'Flame drain -3%', apply(mgr) { mgr.setMult('flameDrain', 0.97); } },
                { cost: 10, label: 'Flame drain -5%', apply(mgr) { mgr.setMult('flameDrain', 0.95); } },
                { cost: 20, label: 'Flame drain -8%', apply(mgr) { mgr.setMult('flameDrain', 0.92); } },
            ]
        },
    ],

    adventurer: [
        {
            id: 'adv_seasoned_explorer',
            name: 'Seasoned Explorer',
            description: 'Increases movement speed',
            ranks: [
                { cost: 5,  label: 'Speed +3%',  apply(mgr) { mgr.setMult('player.speed', 1.03); } },
                { cost: 10, label: 'Speed +5%',  apply(mgr) { mgr.setMult('player.speed', 1.05); } },
                { cost: 20, label: 'Speed +8%',  apply(mgr) { mgr.setMult('player.speed', 1.08); } },
            ]
        },
        {
            id: 'adv_resourceful',
            name: 'Resourceful',
            description: 'Wisps restore more flame',
            ranks: [
                { cost: 5,  label: 'Wisp restore +5%',  apply(mgr) { mgr.setMult('wisp.restoreAmount', 1.05); } },
                { cost: 10, label: 'Wisp restore +10%', apply(mgr) { mgr.setMult('wisp.restoreAmount', 1.10); } },
                { cost: 20, label: 'Wisp restore +15%', apply(mgr) { mgr.setMult('wisp.restoreAmount', 1.15); } },
            ]
        },
        {
            id: 'adv_fortitude',
            name: 'Fortitude',
            description: 'Increases maximum flame',
            ranks: [
                { cost: 5,  label: 'Max flame +3',  apply(mgr) { mgr.addFlat('flame.maxBonus', 3); } },
                { cost: 10, label: 'Max flame +5',  apply(mgr) { mgr.addFlat('flame.maxBonus', 5); } },
                { cost: 20, label: 'Max flame +8',  apply(mgr) { mgr.addFlat('flame.maxBonus', 8); } },
            ]
        },
        {
            id: 'adv_resilience',
            name: 'Resilience',
            description: 'Reduces enemy damage taken',
            ranks: [
                { cost: 5,  label: 'Enemy dmg -5%',  apply(mgr) { mgr.setMult('enemyDamage', 0.95); } },
                { cost: 10, label: 'Enemy dmg -8%',  apply(mgr) { mgr.setMult('enemyDamage', 0.92); } },
                { cost: 20, label: 'Enemy dmg -12%', apply(mgr) { mgr.setMult('enemyDamage', 0.88); } },
            ]
        },
        {
            id: 'adv_endurance',
            name: 'Endurance',
            description: 'Reduces flame drain rate',
            ranks: [
                { cost: 5,  label: 'Flame drain -3%', apply(mgr) { mgr.setMult('flameDrain', 0.97); } },
                { cost: 10, label: 'Flame drain -5%', apply(mgr) { mgr.setMult('flameDrain', 0.95); } },
                { cost: 20, label: 'Flame drain -8%', apply(mgr) { mgr.setMult('flameDrain', 0.92); } },
            ]
        },
    ],
});
