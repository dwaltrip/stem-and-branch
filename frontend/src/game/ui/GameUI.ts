import Phaser from 'phaser';
import { DebugUI } from './DebugUI';
import { InputManager } from '../input/InputManager';
import { TerrainType } from '../terrain/TerrainTypes';

export class GameUI {
  private scene: Phaser.Scene;
  private debugUI: DebugUI;
  
  // Game UI elements
  private positionText!: Phaser.GameObjects.Text;
  private terrainText!: Phaser.GameObjects.Text;
  private resourcesText!: Phaser.GameObjects.Text;
  private saveLoadText!: Phaser.GameObjects.Text;
  
  constructor(scene: Phaser.Scene, inputManager: InputManager) {
    this.scene = scene;
    this.debugUI = new DebugUI(scene, inputManager);
    this.createUIElements();
  }
  
  private createUIElements(): void {
    // Display player position
    this.positionText = this.scene.add.text(10, 10, 'Position: 0,0', { 
      fontSize: '16px', 
      color: '#fff',
      backgroundColor: '#000'
    });
    this.positionText.setScrollFactor(0); // Fix to camera
    
    // Display terrain info
    this.terrainText = this.scene.add.text(10, 40, 'Terrain: Grass', {
      fontSize: '16px',
      color: '#fff',
      backgroundColor: '#000'
    });
    this.terrainText.setScrollFactor(0);
    
    // Display player resources
    this.resourcesText = this.scene.add.text(10, 130, 'Resources: Iron Ore: 0', {
      fontSize: '16px',
      color: '#fff',
      backgroundColor: '#000'
    });
    this.resourcesText.setScrollFactor(0);
    
    // Add save/load UI text
    this.saveLoadText = this.scene.add.text(10, this.scene.game.canvas.height - 100, 
      'Press Z to save map\nPress X to load map\nPress N for new map', { 
      fontSize: '14px', 
      color: '#fff',
      backgroundColor: '#000'
    });
    this.saveLoadText.setScrollFactor(0);
  }
  
  updatePositionDisplay(gridX: number, gridY: number): void {
    this.positionText.setText(`Position: ${gridX},${gridY}`);
  }
  
  updateTerrainInfo(terrainType: TerrainType): void {
    let terrainName = "Unknown";
    
    switch (terrainType) {
      case TerrainType.WATER:
        terrainName = "Water";
        break;
      case TerrainType.SAND:
        terrainName = "Sand";
        break;
      case TerrainType.GRASS:
        terrainName = "Grass";
        break;
      case TerrainType.MOUNTAIN:
        terrainName = "Mountain";
        break;
      case TerrainType.IRON_ORE:
        terrainName = "Iron Ore";
        break;
    }

    this.terrainText.setText(`Terrain: ${terrainName}`);
  }
  
  updateResourcesDisplay(resources: { ironOre: number }): void {
    this.resourcesText.setText(`Resources: Iron Ore: ${resources.ironOre}`);
  }
  
  showTemporaryMessage(message: string): void {
    const messageText = this.scene.add.text(this.scene.cameras.main.centerX, 100, message, {
      fontSize: '18px',
      backgroundColor: '#000',
      color: '#fff',
      padding: { x: 10, y: 5 }
    });
    messageText.setOrigin(0.5);
    messageText.setScrollFactor(0);
    messageText.setDepth(100);
    
    // Fade out and destroy after delay
    this.scene.tweens.add({
      targets: messageText,
      alpha: 0,
      duration: 2000,
      ease: 'Power2',
      onComplete: () => {
        messageText.destroy();
      }
    });
  }
  
  updateDebugUI(): void {
    this.debugUI.update();
  }
  
  setupSaveLoadHandlers(
    onSave: () => void,
    onLoad: () => void,
    onNew: () => void
  ): void {
    if (this.scene.input.keyboard) {
      this.scene.input.keyboard.on('keydown-Z', onSave);
      this.scene.input.keyboard.on('keydown-X', onLoad);
      this.scene.input.keyboard.on('keydown-N', onNew);
    } else {
      console.error('Keyboard input not available');
    }
  }
}