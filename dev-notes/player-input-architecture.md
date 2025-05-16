# Player Input Architecture for Phaser + bitECS

This document outlines a recommended structure for implementing player input in a Phaser + bitECS factory automation game.

## Directory Structure

```
frontend/src/game/
├── input/
│   ├── InputManager.ts       # Raw input capture from Phaser
│   ├── InputMappings.ts      # Key/button to action mappings
│   ├── InputActions.ts       # Defines available player actions
│   └── InputSystem.ts        # ECS system that processes inputs
└── ecs/
    ├── components/
    │   ├── input/
    │   │   ├── MovementIntent.ts  # Direction player wants to move
    │   │   ├── BuildIntent.ts     # Building player wants to place
    │   │   ├── InteractIntent.ts  # Entity player wants to interact with
    │   │   └── CursorPosition.ts  # World position of cursor
    └── systems/
        ├── MovementSystem.ts      # Processes movement intents
        ├── BuildingSystem.ts      # Processes building placement
        └── InteractionSystem.ts   # Processes entity interactions
```

## Stub Code Examples

### InputManager.ts

```typescript
import Phaser from 'phaser';

export class InputManager {
  private scene: Phaser.Scene;
  private keyboard: Phaser.Input.Keyboard.KeyboardPlugin;
  private pointer: Phaser.Input.Pointer;
  
  constructor(scene: Phaser.Scene) {
    // Initialize input handlers from Phaser scene
  }
  
  update(): void {
    // Poll input state each frame
  }
  
  isKeyDown(key: string): boolean {
    // Check if a specific key is pressed
  }
  
  getCursorWorldPosition(): { x: number, y: number } {
    // Convert screen coordinates to world coordinates
  }
  
  getMovementDirection(): { x: number, y: number } {
    // Convert WASD/arrows into direction vector
  }
}
```

### InputMappings.ts

```typescript
export enum GameAction {
  MOVE_UP,
  MOVE_DOWN,
  MOVE_LEFT,
  MOVE_RIGHT,
  PLACE_BUILDING,
  ROTATE_BUILDING,
  DEMOLISH,
  INTERACT,
  INVENTORY_OPEN,
  // etc.
}

export const KeyboardMappings: Record<string, GameAction> = {
  'W': GameAction.MOVE_UP,
  'A': GameAction.MOVE_LEFT,
  'S': GameAction.MOVE_DOWN,
  'D': GameAction.MOVE_RIGHT,
  'E': GameAction.INTERACT,
  'Q': GameAction.ROTATE_BUILDING,
  'R': GameAction.PLACE_BUILDING,
  'X': GameAction.DEMOLISH,
  'I': GameAction.INVENTORY_OPEN,
  // etc.
};
```

### InputSystem.ts

```typescript
import { defineQuery, defineSystem, enterQuery, exitQuery } from 'bitecs';
import { World } from '../world';
import { InputManager } from './InputManager';
import { PlayerControlled, MovementIntent, BuildIntent, InteractIntent, CursorPosition } from '../components';

export const createInputSystem = (world: World, inputManager: InputManager) => {
  const playerQuery = defineQuery([PlayerControlled]);
  
  return defineSystem((world) => {
    const playerEntities = playerQuery(world);
    
    for (const entity of playerEntities) {
      // Handle movement input
      const moveDir = inputManager.getMovementDirection();
      if (moveDir.x !== 0 || moveDir.y !== 0) {
        // Add MovementIntent component to entity
      }
      
      // Handle building placement
      if (inputManager.isKeyDown('R')) {
        // Add BuildIntent component to entity
      }
      
      // Handle interactions
      if (inputManager.isKeyDown('E')) {
        // Add InteractIntent component to entity
      }
      
      // Update cursor position
      const cursorPos = inputManager.getCursorWorldPosition();
      // Set CursorPosition component values
    }
    
    return world;
  });
};
```

### Components for Input

```typescript
import { defineComponent, Types } from 'bitecs';

// Flag component for player-controlled entities
export const PlayerControlled = defineComponent();

// Direction player wants to move
export const MovementIntent = defineComponent({
  x: Types.f32,
  y: Types.f32,
});

// Building player wants to place
export const BuildIntent = defineComponent({
  buildingType: Types.ui8,
  x: Types.i16,
  y: Types.i16,
  rotation: Types.ui8,
});

// Entity the player wants to interact with
export const InteractIntent = defineComponent({
  targetEntity: Types.eid,
});

// World position of cursor
export const CursorPosition = defineComponent({
  x: Types.f32,
  y: Types.f32,
  gridX: Types.i16, 
  gridY: Types.i16,
});
```

### Integration in Main Scene

```typescript
import { createWorld } from 'bitecs';
import { InputManager } from './input/InputManager';
import { createInputSystem } from './input/InputSystem';
import { createMovementSystem } from './ecs/systems/MovementSystem';
import { createBuildingSystem } from './ecs/systems/BuildingSystem';

export class MainScene extends Phaser.Scene {
  private world: any; // bitECS world
  private inputManager: InputManager;
  private systems: any[]; // Array of systems
  
  create() {
    // Create bitECS world
    this.world = createWorld();
    
    // Create input manager
    this.inputManager = new InputManager(this);
    
    // Create systems
    this.systems = [
      createInputSystem(this.world, this.inputManager),
      createMovementSystem(this.world),
      createBuildingSystem(this.world),
      // other systems...
    ];
    
    // Create player entity
    // ...
  }
  
  update(time: number, delta: number) {
    // Update input manager
    this.inputManager.update();
    
    // Run systems
    for (const system of this.systems) {
      system(this.world);
    }
  }
}
```

## Benefits of This Architecture

1. **Separation of Concerns**: Clear boundaries between input detection, intent specification, and action execution
2. **Flexibility**: Easy to reconfigure key bindings without changing core game logic
3. **Testability**: Can simulate inputs without needing actual keyboard/mouse events
4. **ECS Integration**: Works within the component/system pattern
5. **Extensibility**: Easy to add new input methods (gamepad, touch controls, etc.)