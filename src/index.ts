import Phaser from 'phaser';
import { TerrainExperiments } from './utils/TerrainExperiments';
import { PerlinNoise } from './utils/PerlinNoise';
import { TerrainType } from './utils/TerrainTypes';
import { MainScene } from './scenes/MainScene';

// Game configuration
const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    pixelArt: true,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { x: 0, y: 0 },
            debug: false
        }
    },
    scene: [MainScene]
};

// Initialize the game with our configuration
const game = new Phaser.Game(config);

// Add event listeners for window resizing
window.addEventListener('resize', () => {
    if (game) {
        // Adjust the game size to fit the window
        const width = window.innerWidth;
        const height = window.innerHeight;
        game.scale.resize(width, height);
    }
});

// Make terrain generation available globally for debugging
(window as any).game = game;