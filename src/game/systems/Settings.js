const STORAGE_KEY = 'elixirs-shadow-settings';

const DEFAULTS = {
    resolution: [960, 600],
    gridSnap: true,
    gridSize: 8,
    windows: {
        flame:     { x: 370, y: 4 },
        cooldowns: { x: 6, y: 4 },
        stats:     { x: 790, y: 4 },
        distance:  { x: 440, y: 28 },
    }
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
                // Merge saved values over defaults (preserving any new defaults)
                Settings.data = deepClone(DEFAULTS);
                if (saved.resolution) Settings.data.resolution = saved.resolution;
                if (saved.gridSnap !== undefined) Settings.data.gridSnap = saved.gridSnap;
                if (saved.gridSize !== undefined) Settings.data.gridSize = saved.gridSize;
                if (saved.windows) {
                    for (const key of Object.keys(DEFAULTS.windows)) {
                        if (saved.windows[key]) {
                            Settings.data.windows[key] = saved.windows[key];
                        }
                    }
                }
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

    static reset() {
        Settings.data.windows = deepClone(DEFAULTS.windows);
        Settings.save();
    }

    static setWindowPos(id, x, y) {
        Settings.data.windows[id] = { x, y };
        Settings.save();
    }
}
