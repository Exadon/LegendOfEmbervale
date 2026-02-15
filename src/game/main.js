import Phaser from 'phaser';
import { Boot } from './scenes/Boot.js';
import { Preloader } from './scenes/Preloader.js';
import { MainMenu } from './scenes/MainMenu.js';
import { Level1 } from './scenes/Level1.js';

const config = {
    type: Phaser.AUTO,
    width: 1280,
    height: 720,
    parent: 'game-container',
    backgroundColor: '#1A0A2E',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 800 },
            debug: false
        }
    },
    scene: [Boot, Preloader, MainMenu, Level1]
};

export function StartGame(containerId) {
    config.parent = containerId;
    return new Phaser.Game(config);
}
