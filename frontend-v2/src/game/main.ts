import { AUTO, Game } from 'phaser';

const config: Phaser.Types.Core.GameConfig = {
  type: AUTO,
  width: 800,
  height: 600,
  parent: 'game-container',
  pixelArt: true,
  scene: []
};

const StartGame = (parent: string) => {
  return new Game({ ...config, parent });
};

export { StartGame };
