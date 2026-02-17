import Phaser from 'phaser';
import { Settings } from './systems/Settings.js';
import { Boot } from './scenes/Boot.js';
import { Preloader } from './scenes/Preloader.js';
import { MainMenu } from './scenes/MainMenu.js';
import { ClassSelect } from './scenes/ClassSelect.js';
import { Level1 } from './scenes/Level1.js';
import { DevGuide } from './scenes/DevGuide.js';
import { SpriteViewer } from './scenes/SpriteViewer.js';

Settings.load();

const [w, h] = Settings.data.resolution;

const config = {
    type: Phaser.AUTO,
    width: w,
    height: h,
    parent: 'game-container',
    backgroundColor: '#1A0A2E',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 800 },
            debug: false
        }
    },
    scene: [Boot, Preloader, MainMenu, ClassSelect, Level1, DevGuide, SpriteViewer]
};

export function StartGame(containerId) {
    config.parent = containerId;
    return new Phaser.Game(config);
}
