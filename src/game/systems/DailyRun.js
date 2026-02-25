/**
 * DailyRun — deterministic daily run seed, modifier, and class selection.
 * Stored in localStorage under 'elixirs-shadow-daily'.
 */

import { RUN_MODIFIERS } from '../constants.js';
import { ALL_CLASS_IDS, MetaProgression } from './MetaProgression.js';

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
        // Advance the sequence by one step so the class pick is independent
        // of the modifier pick (both share the same seed, different positions).
        rng();
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
        const deathDots = data.hasDied ? '\u{1F480}' : '\u2714\uFE0F';
        const relicDots = '\u{1F52E}'.repeat(Math.min(data.relics?.length || 0, 3));
        // Prestige stars
        const prestigeCount = MetaProgression.prestigeCount;
        const prestigeStr = prestigeCount > 0 ? ' ' + '\u2605'.repeat(prestigeCount) : '';

        return [
            `\uD83D\uDD25 Legacy of Embervale \u00B7 Daily ${key}`,
            `${mod.icon} ${mod.name} \u00B7 ${className}${prestigeStr}`,
            `\uD83D\uDCCF ${dist}m \u00B7 \u2694\uFE0F ${kills} \u00B7 \u23F1\uFE0F ${mins}:${secs}`,
            `${deathDots} ${relicDots}`.trim(),
        ].join('\n').trim();
    }
}
