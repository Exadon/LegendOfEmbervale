const STORAGE_KEY = 'elixirs-shadow-settings';

const DEFAULTS = {
    resolution: [960, 600],
    volume: 1.0,
    particleDensity: 'high',   // 'high' | 'low'
    gamepadVibration: true,
    difficulty: 'standard',    // 'pilgrim' | 'standard' | 'torment'
    colorblindMode: false,
    showFps: false,
    keybinds: {},              // { action: 'KEYCODE' } overrides
};

function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

export class Settings {
    static data = deepClone(DEFAULTS);

    static load() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const saved = JSON.parse(raw);
                Settings.data = deepClone(DEFAULTS);
                if (saved.resolution) Settings.data.resolution = saved.resolution;
                if (saved.volume !== undefined) Settings.data.volume = saved.volume;
                if (saved.particleDensity) Settings.data.particleDensity = saved.particleDensity;
                if (saved.gamepadVibration !== undefined) Settings.data.gamepadVibration = saved.gamepadVibration;
                if (saved.difficulty) Settings.data.difficulty = saved.difficulty;
                if (saved.colorblindMode !== undefined) Settings.data.colorblindMode = saved.colorblindMode;
                if (saved.showFps !== undefined) Settings.data.showFps = saved.showFps;
                if (saved.keybinds) Settings.data.keybinds = saved.keybinds;
            }
        } catch (e) {
            console.warn('[Settings] Failed to load, using defaults:', e);
            Settings.data = deepClone(DEFAULTS);
        }
    }

    static save() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(Settings.data));
        } catch (e) {
            console.warn('[Settings] Failed to save:', e);
        }
    }
}
