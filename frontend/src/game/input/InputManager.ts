import Phaser from 'phaser';

export enum InputAction {
  MOVE_UP,
  MOVE_DOWN,
  MOVE_LEFT,
  MOVE_RIGHT,
  INTERACT,
  TOGGLE_INVENTORY,
  BUILD_MODE,
  CANCEL,
  PLACE_BUILDING,
  REMOVE_BUILDING
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
  [InputAction.PLACE_BUILDING]: number[];
  [InputAction.REMOVE_BUILDING]: number[];
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
  ],
  [InputAction.PLACE_BUILDING]: [
    Phaser.Input.Keyboard.KeyCodes.SPACE
  ],
  [InputAction.REMOVE_BUILDING]: [
    Phaser.Input.Keyboard.KeyCodes.R
  ]
};

// Game states/modes to control input context
export enum GameMode {
  NORMAL,
  BUILD,
  INVENTORY
}

export class InputManager {
  private scene: Phaser.Scene;
  private keyMap: Map<InputAction, Phaser.Input.Keyboard.Key[]> = new Map();
  private bindings: InputBindings;
  private currentMode: GameMode = GameMode.NORMAL;
  
  // Cursor position in grid coordinates
  private cursorGridX: number = 0;
  private cursorGridY: number = 0;
  
  // Mouse position tracking
  private mouseGridX: number = 0;
  private mouseGridY: number = 0;
  
  // Custom event handlers
  private eventHandlers: { [key: string]: Function[] } = {};
  
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
    
    // Set up keyboard input
    Object.values(InputAction)
      .filter(action => typeof action === 'number')
      .forEach(action => {
        const numericAction = action as number;
        const keys: Phaser.Input.Keyboard.Key[] = [];
        
        const actionKey = numericAction as InputAction;
        if (this.bindings[actionKey]) {
          this.bindings[actionKey].forEach(keyCode => {
            const key = this.scene.input.keyboard!.addKey(keyCode);
            keys.push(key);
          });
        }
        
        this.keyMap.set(numericAction, keys);
      });
    
    // Set up mouse handling for grid coordinates
    this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      const { x, y } = this.screenToGridCoordinates(pointer.worldX, pointer.worldY);
      this.mouseGridX = x;
      this.mouseGridY = y;
      
      this.emit('mousemove', { gridX: x, gridY: y });
    });
    
    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const { x, y } = this.screenToGridCoordinates(pointer.worldX, pointer.worldY);
      
      this.emit('click', {
        gridX: x,
        gridY: y,
        button: pointer.button // 0 = left, 1 = middle, 2 = right
      });
    });
  }
  
  private screenToGridCoordinates(screenX: number, screenY: number): { x: number, y: number } {
    const GRID_SIZE = 32; // Should be imported from GameConstants
    return {
      x: Math.floor(screenX / GRID_SIZE),
      y: Math.floor(screenY / GRID_SIZE)
    };
  }
  
  isActionActive(action: InputAction): boolean {
    // Check if action is valid in current mode
    if (!this.isActionValidInCurrentMode(action)) {
      return false;
    }
    
    const keys = this.keyMap.get(action);
    if (!keys || keys.length === 0) {
      return false;
    }
    return keys.some(key => key.isDown);
  }
  
  wasActionJustPressed(action: InputAction): boolean {
    // Check if action is valid in current mode
    if (!this.isActionValidInCurrentMode(action)) {
      return false;
    }
    
    const keys = this.keyMap.get(action);
    if (!keys || keys.length === 0) {
      return false;
    }
    return keys.some(key => Phaser.Input.Keyboard.JustDown(key));
  }
  
  private isActionValidInCurrentMode(action: InputAction): boolean {
    const buildModeActions = [
      InputAction.MOVE_UP,
      InputAction.MOVE_DOWN,
      InputAction.MOVE_LEFT,
      InputAction.MOVE_RIGHT,
      InputAction.CANCEL,
      InputAction.PLACE_BUILDING,
      InputAction.REMOVE_BUILDING
    ];
    
    const inventoryModeActions = [
      InputAction.TOGGLE_INVENTORY,
      InputAction.CANCEL
    ];
    
    switch (this.currentMode) {
      case GameMode.BUILD:
        return buildModeActions.includes(action);
        
      case GameMode.INVENTORY:
        return inventoryModeActions.includes(action);
        
      case GameMode.NORMAL:
      default:
        // All actions are valid in normal mode except BUILD-specific ones
        return action !== InputAction.PLACE_BUILDING && action !== InputAction.REMOVE_BUILDING;
    }
  }
  
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
      movement.x *= 0.7071; // 1/√2
      movement.y *= 0.7071;
    }
    
    return movement;
  }
  
  updateBindings(newBindings: InputBindings): void {
    this.keyMap.forEach(keys => {
      keys.forEach(key => {
        this.scene.input.keyboard!.removeKey(key);
      });
    });
    
    this.keyMap.clear();
    this.bindings = newBindings;
    this.initialize();
  }
  
  setGameMode(mode: GameMode): void {
    this.currentMode = mode;
    this.emit('modechange', mode);
  }
  
  getGameMode(): GameMode {
    return this.currentMode;
  }
  
  getCursorGridPosition(): { x: number, y: number } {
    return { x: this.cursorGridX, y: this.cursorGridY };
  }
  
  getMouseGridPosition(): { x: number, y: number } {
    return { x: this.mouseGridX, y: this.mouseGridY };
  }
  
  on(event: string, handler: Function): void {
    if (!this.eventHandlers[event]) {
      this.eventHandlers[event] = [];
    }
    this.eventHandlers[event].push(handler);
  }
  
  private emit(event: string, data: any): void {
    const handlers = this.eventHandlers[event];
    if (handlers) {
      handlers.forEach(handler => handler(data));
    }
  }
}