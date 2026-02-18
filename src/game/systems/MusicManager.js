import { MUSIC } from '../constants.js';

/**
 * Singleton music manager using Phaser's built-in sound system.
 * Handles menu, biome, shroud, boss, and game-over tracks with crossfading.
 */
const MusicManager = {
    _soundManager: null,
    _currentTrack: null,
    _currentKey: null,
    _shroudTrack: null,
    _biomeKey: null,
    _fadingOut: null,
    _muted: false,
    _volume: 1.0,

    init(soundManager) {
        if (this._soundManager) return;
        this._soundManager = soundManager;
    },

    // ─── Menu ───

    playMenu() {
        if (!this._soundManager) return;
        this._crossfadeTo('music_menu', MUSIC.MENU_VOLUME);
    },

    stopMenu() {
        if (!this._soundManager) return;
        this._fadeOutCurrent(MUSIC.CROSSFADE_MS);
    },

    // ─── Biome ───

    playBiome(biomeId) {
        if (!this._soundManager) return;
        const key = MUSIC.BIOME_TRACKS[biomeId];
        if (!key) return;
        this._biomeKey = key;
        this._crossfadeTo(key, MUSIC.GAME_VOLUME);
        this._startShroudTrack();
    },

    // ─── Boss ───

    playBoss() {
        if (!this._soundManager) return;
        this._crossfadeTo('music_boss', MUSIC.GAME_VOLUME);
    },

    stopBoss() {
        if (!this._soundManager || !this._biomeKey) return;
        this._crossfadeTo(this._biomeKey, MUSIC.GAME_VOLUME);
    },

    // ─── Shroud proximity layer ───

    playShroud(intensity) {
        if (!this._shroudTrack || !this._shroudTrack.isPlaying) return;
        const vol = Math.max(0, Math.min(1, intensity)) * MUSIC.SHROUD_MAX_VOLUME;
        this._shroudTrack.setVolume(vol);
    },

    _startShroudTrack() {
        if (this._shroudTrack) return;
        if (!this._soundManager) return;
        this._shroudTrack = this._soundManager.add('music_shroud', {
            loop: true,
            volume: 0,
        });
        this._shroudTrack.play();
    },

    // ─── Game Over ───

    playGameOver() {
        if (!this._soundManager) return;
        // Stop shroud layer
        if (this._shroudTrack && this._shroudTrack.isPlaying) {
            this._shroudTrack.stop();
        }
        this._shroudTrack = null;
        this._crossfadeTo('music_gameover', MUSIC.GAME_VOLUME);
    },

    // ─── Cleanup ───

    stopAll() {
        if (!this._soundManager) return;
        if (this._currentTrack && this._currentTrack.isPlaying) {
            this._currentTrack.stop();
        }
        if (this._fadingOut && this._fadingOut.isPlaying) {
            this._fadingOut.stop();
        }
        if (this._shroudTrack && this._shroudTrack.isPlaying) {
            this._shroudTrack.stop();
        }
        this._currentTrack = null;
        this._currentKey = null;
        this._fadingOut = null;
        this._shroudTrack = null;
        this._biomeKey = null;
    },

    // ─── Volume/Mute sync (called from AudioManager) ───

    setVolume(vol) {
        this._volume = vol;
        if (this._soundManager) {
            this._soundManager.volume = vol;
        }
    },

    setMute(muted) {
        this._muted = muted;
        if (this._soundManager) {
            this._soundManager.mute = muted;
        }
    },

    // ─── Internal crossfade ───

    _crossfadeTo(key, targetVolume) {
        if (this._currentKey === key) return;

        const duration = MUSIC.CROSSFADE_MS;

        // Fade out current track
        this._fadeOutCurrent(duration);

        // Start new track at volume 0, ramp up
        this._currentKey = key;
        this._currentTrack = this._soundManager.add(key, {
            loop: key !== 'music_gameover',
            volume: 0,
        });
        this._currentTrack.play();

        // Fade in
        const track = this._currentTrack;
        const steps = 20;
        const stepTime = duration / steps;
        let step = 0;
        const fadeIn = setInterval(() => {
            step++;
            if (!track.isPlaying || step >= steps) {
                clearInterval(fadeIn);
                if (track.isPlaying) track.setVolume(targetVolume);
                return;
            }
            track.setVolume(targetVolume * (step / steps));
        }, stepTime);
    },

    _fadeOutCurrent(duration) {
        if (!this._currentTrack || !this._currentTrack.isPlaying) return;

        // Stop any previous fade-out
        if (this._fadingOut && this._fadingOut.isPlaying) {
            this._fadingOut.stop();
        }

        const track = this._currentTrack;
        this._fadingOut = track;
        this._currentTrack = null;
        this._currentKey = null;

        const startVol = track.volume;
        const steps = 20;
        const stepTime = duration / steps;
        let step = 0;
        const fadeOut = setInterval(() => {
            step++;
            if (!track.isPlaying || step >= steps) {
                clearInterval(fadeOut);
                if (track.isPlaying) track.stop();
                if (this._fadingOut === track) this._fadingOut = null;
                return;
            }
            track.setVolume(startVol * (1 - step / steps));
        }, stepTime);
    },
};

export { MusicManager };
