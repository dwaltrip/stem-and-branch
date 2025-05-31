import { AUTO, Game } from 'phaser';
import { MainScene } from './scenes/MainScene';
import { initDevTools } from '../utils/DevTools';

const config: Phaser.Types.Core.GameConfig = {
  type: AUTO,
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

const StartGame = (parent: string) => {
  const game = new Game({ ...config, parent });
  
  // Window resize handling
  const resizeToFit = () => {
    if (game) {
      const width = window.innerWidth;
      const height = window.innerHeight;
      game.scale.resize(width, height);
    }
  };
  
  window.addEventListener('resize', resizeToFit);
  window.document.addEventListener('DOMContentLoaded', resizeToFit);
  
  // Make game available globally for debugging
  (window as any).game = game;
  
  // Initialize development tools
  initDevTools();
  
  console.log('Game initialized.');
  
  return game;
};

export { StartGame };
