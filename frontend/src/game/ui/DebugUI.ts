import Phaser from 'phaser';
import { InputManager, InputAction } from '../input/InputManager';

// Debug helper for displaying input state and other useful information
export class DebugUI {
  private scene: Phaser.Scene;
  private inputManager: InputManager;
  private debugContainer!: Phaser.GameObjects.Container;
  private actionTexts: Map<InputAction, Phaser.GameObjects.Text> = new Map();
  private fpsText!: Phaser.GameObjects.Text;
  private isVisible: boolean = false;
  
  // scene = The scene this debug UI belongs to
  // inputManager  = The input manager to monitor
  constructor(scene: Phaser.Scene, inputManager: InputManager) {
    this.scene = scene;
    this.inputManager = inputManager;
    this.initialize();
  }
  
  private initialize(): void {
    this.debugContainer = this.scene.add.container(10, 70);
    
    const background = this.scene.add.rectangle(
      0, 0, 200, 250, 0x000000, 0.7
    );
    background.setOrigin(0, 0);
    this.debugContainer.add(background);
    
    // Add title and FPS counter
    const title = this.scene.add.text(10, 10, 'Debug UI', { 
      fontSize: '16px', 
      color: '#fff',
      fontStyle: 'bold'
    });
    this.debugContainer.add(title);
    this.fpsText = this.scene.add.text(10, 40, 'FPS: 0', { 
      fontSize: '12px', 
      color: '#fff'
    });
    this.debugContainer.add(this.fpsText);
    
    // Add input detection for each action
    let y = 70;
    Object.values(InputAction)
      .filter(action => typeof action === 'number')
      .forEach(action => {
        const actionName = InputAction[action as number];
        const text = this.scene.add.text(10, y, `${actionName}: inactive`, { 
          fontSize: '12px', 
          color: '#aaa'
        });
        this.actionTexts.set(action as InputAction, text);
        this.debugContainer.add(text);
        y += 20;
      });
    
    this.debugContainer.setScrollFactor(0);
    
    // Add F1 key to toggle debug UI. Hide by default
    this.debugContainer.setVisible(false);
    if (this.scene.input.keyboard) {
      const f1Key = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F1);
      f1Key.on('down', () => {
        this.isVisible = !this.isVisible;
        this.debugContainer.setVisible(this.isVisible);
      });
    }
  }
  
  update(): void {
    if (!this.isVisible) return;
    
    this.fpsText.setText(`FPS: ${Math.round(this.scene.game.loop.actualFps)}`);
    
    this.actionTexts.forEach((text, action) => {
      const isActive = this.inputManager.isActionActive(action);
      const wasJustPressed = this.inputManager.wasActionJustPressed(action);
      const color = isActive ? '#ff0' : wasJustPressed ? '#0f0' : '#aaa';
      const state = isActive ? 'active' : wasJustPressed ? 'just pressed' : 'inactive';
      
      text.setText(`${InputAction[action]}: ${state}`);
      text.setColor(color);
    });
  }
  
  setVisible(visible: boolean): void {
    this.isVisible = visible;
    this.debugContainer.setVisible(visible);
  }
  
  toggle(): void {
    this.setVisible(!this.isVisible);
  }
}
