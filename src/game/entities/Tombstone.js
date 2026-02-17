import Phaser from 'phaser';
import { WORLD } from '../constants.js';

const STORAGE_KEY = 'elixirs-shadow-tombstones';
const MAX_TOMBSTONES = 5;

export class Tombstone extends Phaser.GameObjects.Container {
    constructor(scene, worldX, distanceMeters) {
        super(scene, worldX, WORLD.GROUND_Y);
        scene.add.existing(this);

        this.setDepth(1).setAlpha(0.6);

        // Gravestone body
        const stone = scene.add.rectangle(0, -20, 20, 32, 0x888888)
            .setOrigin(0.5, 1);
        const top = scene.add.rectangle(0, -50, 14, 6, 0x999999)
            .setOrigin(0.5, 1);
        this.add([stone, top]);

        // Distance label
        const label = scene.add.text(0, -56, `${Math.floor(distanceMeters)}m`, {
            fontSize: '9px', color: '#AAAAAA', fontFamily: 'monospace',
            stroke: '#000000', strokeThickness: 1
        }).setOrigin(0.5, 1);
        this.add(label);
    }

    static loadDeaths() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) return JSON.parse(raw);
        } catch {}
        return [];
    }

    static saveDeath(worldX, distanceMeters) {
        const deaths = Tombstone.loadDeaths();
        deaths.push({ x: worldX, dist: distanceMeters });
        // Keep only the most recent MAX_TOMBSTONES entries
        while (deaths.length > MAX_TOMBSTONES) deaths.shift();
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(deaths));
        } catch {}
    }
}
