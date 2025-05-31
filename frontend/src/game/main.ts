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
    // previously only needed to check for `game`
    // not sure why but I think upgrading Phaser to 3.90, I needed the extra check
    if (game && game?.scale?.baseSize?.snapTo) {
      const width = window.innerWidth;
      const height = window.innerHeight;
      console.log(`Resizing game to fit window: ${width}x${height}`);
      game.scale.resize(width, height);
    }
  };
  
  // Wait for game to be ready before setting up resize handlers
  game.events.once('ready', () => {
    console.log('Game is ready, setting up resize handlers.');
    window.addEventListener('resize', resizeToFit);
    resizeToFit(); // Initial resize
  });
  
  // Make game available globally for debugging
  (window as any).game = game;
  
  // Initialize development tools
  initDevTools();
  
  console.log('Game initialized.');
  
  return game;
};

export { StartGame };
