// TypeScript test for Phaser.js
import Phaser from 'phaser';

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 }
        }
    },
    scene: {
        preload: function() {},
        create: function() {},
        update: function() {}
    }
};

const game = new Phaser.Game(config);