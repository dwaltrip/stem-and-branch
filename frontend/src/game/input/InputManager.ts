import Phaser from 'phaser';

export enum InputAction {
  MOVE_UP,
  MOVE_DOWN,
  MOVE_LEFT,
  MOVE_RIGHT,
  INTERACT,
  TOGGLE_INVENTORY,
  BUILD_MODE,
  CANCEL
}

export interface InputBindings {
  [InputAction.MOVE_UP]: number[];
  [InputAction.MOVE_DOWN]: number[];
  [InputAction.MOVE_LEFT]: number[];
  [InputAction.MOVE_RIGHT]: number[];
  [InputAction.INTERACT]: number[];
  [InputAction.TOGGLE_INVENTORY]: number[];
  [InputAction.BUILD_MODE]: number[];
  [InputAction.CANCEL]: number[];
}

export const DEFAULT_BINDINGS: InputBindings = {
  [InputAction.MOVE_UP]: [
    Phaser.Input.Keyboard.KeyCodes.UP,
    Phaser.Input.Keyboard.KeyCodes.W
  ],
  [InputAction.MOVE_DOWN]: [
    Phaser.Input.Keyboard.KeyCodes.DOWN,
    Phaser.Input.Keyboard.KeyCodes.S
  ],
  [InputAction.MOVE_LEFT]: [
    Phaser.Input.Keyboard.KeyCodes.LEFT,
    Phaser.Input.Keyboard.KeyCodes.A
  ],
  [InputAction.MOVE_RIGHT]: [
    Phaser.Input.Keyboard.KeyCodes.RIGHT,
    Phaser.Input.Keyboard.KeyCodes.D
  ],
  [InputAction.INTERACT]: [
    Phaser.Input.Keyboard.KeyCodes.E,
    Phaser.Input.Keyboard.KeyCodes.SPACE
  ],
  [InputAction.TOGGLE_INVENTORY]: [
    Phaser.Input.Keyboard.KeyCodes.I
  ],
  [InputAction.BUILD_MODE]: [
    Phaser.Input.Keyboard.KeyCodes.B
  ],
  [InputAction.CANCEL]: [
    Phaser.Input.Keyboard.KeyCodes.ESC
  ]
};

export class InputManager {
  private scene: Phaser.Scene;
  private keyMap: Map<InputAction, Phaser.Input.Keyboard.Key[]> = new Map();
  private bindings: InputBindings;
  
  // scene: Reference to the scene this input manager belongs to
  // bindings: Optional custom key bindings
  constructor(scene: Phaser.Scene, bindings: InputBindings = DEFAULT_BINDINGS) {
    this.scene = scene;
    this.bindings = bindings;
    this.initialize();
  }
  
  private initialize(): void {
    if (!this.scene.input.keyboard) {
      console.error('Keyboard input not available');
      return;
    }
    
    Object.values(InputAction)
      .filter(action => typeof action === 'number')
      .forEach(action => {
        const numericAction = action as number;
        const keys: Phaser.Input.Keyboard.Key[] = [];
        
        // Create keys for all bindings of this action
        const actionKey = numericAction as InputAction;
        if (this.bindings[actionKey]) {
          this.bindings[actionKey].forEach(keyCode => {
            const key = this.scene.input.keyboard!.addKey(keyCode);
            keys.push(key);
          });
        }
        
        // Store the key array for this action
        this.keyMap.set(numericAction, keys);
      });
  }
  
  // Check if an action is currently active (any of its keys are pressed)
  isActionActive(action: InputAction): boolean {
    const keys = this.keyMap.get(action);
    if (!keys || keys.length === 0) {
      return false;
    }
    return keys.some(key => key.isDown);
  }
  
  // Check if an action was just pressed this frame
  wasActionJustPressed(action: InputAction): boolean {
    const keys = this.keyMap.get(action);
    if (!keys || keys.length === 0) {
      return false;
    }
    return keys.some(key => Phaser.Input.Keyboard.JustDown(key));
  }
  
  // Get all active movement as a vector
  getMovementVector(): { x: number, y: number } {
    const movement = { x: 0, y: 0 };
    
    if (this.isActionActive(InputAction.MOVE_LEFT)) {
      movement.x = -1;
    } else if (this.isActionActive(InputAction.MOVE_RIGHT)) {
      movement.x = 1;
    }
    
    if (this.isActionActive(InputAction.MOVE_UP)) {
      movement.y = -1;
    } else if (this.isActionActive(InputAction.MOVE_DOWN)) {
      movement.y = 1;
    }
    
    // Normalize diagonal movement to maintain consistent speed
    if (movement.x !== 0 && movement.y !== 0) {
      // Use approx. 0.7071 (1/√2) to normalize the vector
      movement.x *= 0.7071;
      movement.y *= 0.7071;
    }
    
    return movement;
  }
  
  // Update bindings at runtime (e.g. user changes settings)
  // ### NOT IN USE ### -- may be used in the future....
  updateBindings(newBindings: InputBindings): void {
    // Clean up existing key bindings
    this.keyMap.forEach(keys => {
      keys.forEach(key => {
        this.scene.input.keyboard!.removeKey(key);
      });
    });
    
    this.keyMap.clear();
    this.bindings = newBindings;
    // Re-initialize with new bindings
    this.initialize();
  }
}
