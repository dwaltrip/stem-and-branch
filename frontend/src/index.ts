import Phaser from 'phaser';
import { TerrainExperiments } from './game/terrain/TerrainExperiments';
import { PerlinNoise } from './utils/PerlinNoise';
import { TerrainType } from './game/terrain/TerrainTypes';
import { MainScene } from './game/scenes/MainScene';
import { initDevTools } from './utils/DevTools';

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

window.addEventListener('resize', () => {
  resizeToFit();
});
window.document.addEventListener('DOMContentLoaded', () => {
  resizeToFit();
});

function resizeToFit() {
  if (game) {
    // Adjust the game size to fit the window
    const width = window.innerWidth;
    const height = window.innerHeight;
    game.scale.resize(width, height);
  }
}

// Make game available globally for debugging
(window as any).game = game;

// Initialize development tools (throwaway functions for testing)
initDevTools();

console.log('Game initialized.');
