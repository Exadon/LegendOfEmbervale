const STORAGE_KEY = 'elixirs-shadow-settings';

const DEFAULTS = {
    resolution: [960, 600],
    volume: 1.0,
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
