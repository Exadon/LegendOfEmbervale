/**
 * DailyRun — deterministic daily run seed, modifier, and class selection.
 * Stored in localStorage under 'elixirs-shadow-daily'.
 */

import { RUN_MODIFIERS } from '../constants.js';
import { ALL_CLASS_IDS } from './MetaProgression.js';

const STORAGE_KEY = 'elixirs-shadow-daily';

/** Simple LCG random (Park-Miller) seeded with a numeric seed */
function lcg(seed) {
    let s = seed;
    return () => {
        s = (s * 16807 + 0) % 2147483647;
        return (s - 1) / 2147483646;
    };
}

export class DailyRun {
    static getTodayKey() {
        const d = new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    }

    static getSeed() {
        const d = new Date();
        return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
    }

    static _rng() {
        return lcg(DailyRun.getSeed());
    }

    static getTodayModifier() {
        const rng = DailyRun._rng();
        const idx = Math.floor(rng() * RUN_MODIFIERS.length);
        return RUN_MODIFIERS[idx];
    }

    static getTodayClass() {
        const rng = DailyRun._rng();
        rng(); // consume one value (same rng sequence, offset by 1 pick)
        const idx = Math.floor(rng() * ALL_CLASS_IDS.length);
        return ALL_CLASS_IDS[idx];
    }

    static saveDailyResult(data) {
        try {
            const key = DailyRun.getTodayKey();
            const raw = localStorage.getItem(STORAGE_KEY);
            const stored = raw ? JSON.parse(raw) : {};
            // Only save if better distance
            if (!stored[key] || (data.distance || 0) > (stored[key].distance || 0)) {
                stored[key] = {
                    distance: data.distance || 0,
                    className: data.className || 'adventurer',
                    kills: data.kills || 0,
                    time: data.time || 0,
                    relics: data.relics || [],
                };
                localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
            }
        } catch {}
    }

    static getTodayResult() {
        try {
            const key = DailyRun.getTodayKey();
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return null;
            const stored = JSON.parse(raw);
            return stored[key] || null;
        } catch { return null; }
    }

    static generateShareText(data) {
        const key = DailyRun.getTodayKey();
        const mod = DailyRun.getTodayModifier();
        const dist = Math.round(data.distance || 0).toLocaleString();
        const kills = data.kills || 0;
        const mins = Math.floor((data.time || 0) / 60);
        const secs = String(Math.floor((data.time || 0) % 60)).padStart(2, '0');
        const className = data.className || 'Adventurer';
        // Death/relics as emoji
        const deathDots = data.hasDied ? '💀' : '';
        const relicDots = '\u{1F52E}'.repeat(Math.min(data.relics?.length || 0, 3));

        return [
            `🔥 Legacy of Embervale · Daily ${key}`,
            `📏 ${dist}m · ⚔️ ${kills} · ⏱️ ${mins}:${secs}`,
            `Modifier: ${mod.icon} ${mod.name} · Class: ${className}`,
            `${deathDots} ${relicDots}`,
        ].join('\n').trim();
    }
}
