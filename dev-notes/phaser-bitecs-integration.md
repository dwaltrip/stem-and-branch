# Phaser.js + bitECS Integration for Factory Automation Games

This document provides guidance on integrating Phaser.js with bitECS for a 2D factory automation game.

## Core Architecture

```
frontend/src/
├── game/
│   ├── ecs/
│   │   ├── components/        # bitECS component definitions
│   │   ├── systems/           # Systems that process components
│   │   └── world.ts           # World creation and management
│   ├── scenes/
│   │   ├── MainScene.ts       # Primary game scene - runs ECS systems
│   │   └── UIScene.ts         # Overlay UI scene
│   ├── render/
│   │   ├── SpriteManager.ts   # Manages connection between ECS and Phaser sprites
│   │   └── RenderSystem.ts    # Syncs ECS components to Phaser objects
│   └── factories/             # Entity creation functions
│       ├── buildingFactory.ts # Creates different building types
│       ├── resourceFactory.ts # Creates resources
│       └── playerFactory.ts   # Creates player entity
└── index.ts                   # Game initialization
```

## Integration Patterns

### 1. Phaser as Render/Input Layer

Phaser primarily serves as a rendering and input layer, while bitECS handles game state and logic:

```typescript
// MainScene.ts example
export class MainScene extends Phaser.Scene {
  private world: IWorld;
  private systems: System[];
  private spriteManager: SpriteManager;
  
  create() {
    // Create bitECS world
    this.world = createWorld();
    
    // Initialize systems
    this.systems = [
      movementSystem(),
      factorySystem(),
      beltSystem(),
      renderSystem(this, this.spriteManager)
    ];
    
    // Create sprite manager to handle Phaser sprites
    this.spriteManager = new SpriteManager(this);
    
    // Initialize game entities
    createPlayer(this.world);
    createInitialBuildings(this.world);
    createResources(this.world);
  }
  
  update(time: number, delta: number) {
    // Run all ECS systems
    for (const system of this.systems) {
      system(this.world);
    }
  }
}
```

### 2. SpriteManager for ECS-Phaser Connection

Use a SpriteManager as the bridge between ECS entities and Phaser sprites:

```typescript
// SpriteManager.ts
export class SpriteManager {
  private scene: Phaser.Scene;
  private sprites: Map<number, Phaser.GameObjects.Sprite> = new Map();
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }
  
  createSprite(entity: number, texture: string, x: number, y: number): void {
    const sprite = this.scene.add.sprite(x, y, texture);
    this.sprites.set(entity, sprite);
  }
  
  removeSprite(entity: number): void {
    const sprite = this.sprites.get(entity);
    if (sprite) {
      sprite.destroy();
      this.sprites.delete(entity);
    }
  }
  
  updateSprite(entity: number, x: number, y: number, rotation?: number): void {
    const sprite = this.sprites.get(entity);
    if (sprite) {
      sprite.setPosition(x, y);
      if (rotation !== undefined) {
        sprite.setRotation(rotation);
      }
    }
  }
}
```

### 3. Render System

Create a render system that updates Phaser objects based on ECS component data:

```typescript
// RenderSystem.ts
import { defineQuery, exitQuery } from 'bitecs';
import { Position, Sprite, Rotation } from './components';

export const createRenderSystem = (scene: Phaser.Scene, spriteManager: SpriteManager) => {
  // Query for entities with position and sprite components
  const renderQuery = defineQuery([Position, Sprite]);
  const renderExitQuery = exitQuery(renderQuery);
  
  return (world) => {
    // Handle entities that lost either Position or Sprite
    const exitEntities = renderExitQuery(world);
    for (const entity of exitEntities) {
      spriteManager.removeSprite(entity);
    }
    
    // Update or create sprites for entities
    const entities = renderQuery(world);
    for (const entity of entities) {
      // If sprite doesn't exist yet, create it
      if (!spriteManager.hasSprite(entity)) {
        spriteManager.createSprite(
          entity, 
          Sprite.textureId[entity], 
          Position.x[entity], 
          Position.y[entity]
        );
      } else {
        // Update existing sprite
        spriteManager.updateSprite(
          entity,
          Position.x[entity],
          Position.y[entity],
          Rotation.angle[entity]
        );
      }
    }
    
    return world;
  };
};
```

## Factory Automation Specific Patterns

### 1. Grid-Based Systems

Implement a grid system for placement and movement:

```typescript
// Grid.ts
export interface GridCell {
  x: number;
  y: number;
  entities: Set<number>; // Entities in this cell
}

export class Grid {
  private cellSize: number;
  private cells: Map<string, GridCell> = new Map();
  
  constructor(cellSize: number) {
    this.cellSize = cellSize;
  }
  
  // Get grid coordinates from world coordinates
  worldToGrid(x: number, y: number): { gridX: number, gridY: number } {
    return {
      gridX: Math.floor(x / this.cellSize),
      gridY: Math.floor(y / this.cellSize)
    };
  }
  
  // Get world coordinates (center of cell) from grid coordinates
  gridToWorld(gridX: number, gridY: number): { x: number, y: number } {
    return {
      x: (gridX + 0.5) * this.cellSize,
      y: (gridY + 0.5) * this.cellSize
    };
  }
  
  // Register entity in a grid cell
  addEntity(entity: number, gridX: number, gridY: number): void {
    const key = `${gridX},${gridY}`;
    if (!this.cells.has(key)) {
      this.cells.set(key, { x: gridX, y: gridY, entities: new Set() });
    }
    this.cells.get(key).entities.add(entity);
  }
  
  // Remove entity from a grid cell
  removeEntity(entity: number, gridX: number, gridY: number): void {
    const key = `${gridX},${gridY}`;
    const cell = this.cells.get(key);
    if (cell) {
      cell.entities.delete(entity);
    }
  }
  
  // Get all entities in a grid cell
  getEntities(gridX: number, gridY: number): number[] {
    const key = `${gridX},${gridY}`;
    const cell = this.cells.get(key);
    return cell ? Array.from(cell.entities) : [];
  }
}
```

### 2. Conveyor Belt System

For item movement on belts:

```typescript
// Factory components
export const ConveyorBelt = defineComponent({
  direction: Types.ui8, // 0=N, 1=E, 2=S, 3=W
  speed: Types.f32
});

export const Item = defineComponent({
  type: Types.ui8,
  quantity: Types.ui16
});

export const OnBelt = defineComponent({
  beltEntity: Types.eid,
  progress: Types.f32 // 0.0 to 1.0 position along belt
});

// Belt system
export const createBeltSystem = () => {
  const beltQuery = defineQuery([ConveyorBelt, Position, GridPosition]);
  const itemQuery = defineQuery([Item, OnBelt, Position]);
  
  return (world) => {
    const belts = beltQuery(world);
    const items = itemQuery(world);
    
    // Process all items on belts
    for (const item of items) {
      const beltEntity = OnBelt.beltEntity[item];
      const speed = ConveyorBelt.speed[beltEntity];
      const direction = ConveyorBelt.direction[beltEntity];
      
      // Update progress
      OnBelt.progress[item] += speed * world.delta / 1000;
      
      // Transfer to next belt if reached end
      if (OnBelt.progress[item] >= 1.0) {
        // Handle transfer to next belt
        // ...
      }
      
      // Update item position based on belt position, direction and item progress
      updateItemPosition(world, item, beltEntity);
    }
    
    return world;
  };
};
```

### 3. Resource Processing System

For buildings that process resources:

```typescript
export const Processor = defineComponent({
  inputType: Types.ui8,
  outputType: Types.ui8,
  processingTime: Types.f32,
  currentProgress: Types.f32
});

export const Inventory = defineComponent({
  // Using array types for multiple slots
  itemTypes: [Types.ui8, 4],     // 4 slots
  itemQuantities: [Types.ui16, 4] // 4 slots
});

export const createProcessingSystem = () => {
  const processorQuery = defineQuery([Processor, Inventory]);
  
  return (world) => {
    const processors = processorQuery(world);
    
    for (const entity of processors) {
      const hasInput = hasResourceInInventory(entity, Processor.inputType[entity]);
      
      if (hasInput) {
        // Update processing progress
        Processor.currentProgress[entity] += world.delta / 1000;
        
        // Check if processing complete
        if (Processor.currentProgress[entity] >= Processor.processingTime[entity]) {
          // Remove input
          removeResourceFromInventory(entity, Processor.inputType[entity], 1);
          
          // Add output
          addResourceToInventory(entity, Processor.outputType[entity], 1);
          
          // Reset progress
          Processor.currentProgress[entity] = 0;
        }
      }
    }
    
    return world;
  };
};
```

## Performance Considerations

1. **Spatial Partitioning**: Use grid cells to limit entity queries to relevant areas.
2. **Batched Rendering**: Group similar entities for render batching.
3. **System Scheduling**: Not all systems need to run every frame.
4. **Component Access Patterns**: Access components in a consistent order to improve cache usage.
5. **Sparse Component Storage**: bitECS is efficient for sparse components.

## Debugging Tools

Implement debugging helpers for your ECS + Phaser game:

```typescript
export class DebugUI {
  private scene: Phaser.Scene;
  private debugText: Phaser.GameObjects.Text;
  private debugGraphics: Phaser.GameObjects.Graphics;
  private visible: boolean = false;
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.debugText = this.scene.add.text(10, 10, "", { color: '#00ff00' });
    this.debugGraphics = this.scene.add.graphics();
    this.toggle(); // Start hidden
  }
  
  toggle(): void {
    this.visible = !this.visible;
    this.debugText.setVisible(this.visible);
    this.debugGraphics.setVisible(this.visible);
  }
  
  // Draw grid overlay
  drawGrid(cellSize: number): void {
    if (!this.visible) return;
    
    this.debugGraphics.clear();
    this.debugGraphics.lineStyle(1, 0x00ff00, 0.3);
    
    // Draw vertical lines
    for (let x = 0; x < this.scene.cameras.main.width; x += cellSize) {
      this.debugGraphics.lineBetween(
        x, 0, 
        x, this.scene.cameras.main.height
      );
    }
    
    // Draw horizontal lines
    for (let y = 0; y < this.scene.cameras.main.height; y += cellSize) {
      this.debugGraphics.lineBetween(
        0, y, 
        this.scene.cameras.main.width, y
      );
    }
  }
  
  // Show entity stats
  showEntityStats(world): void {
    if (!this.visible) return;
    
    const entityCount = world.entityCount;
    const stats = {
      entities: entityCount,
      buildings: defineQuery([Building])(world).length,
      items: defineQuery([Item])(world).length,
      belts: defineQuery([ConveyorBelt])(world).length
    };
    
    this.debugText.setText(
      `Entities: ${stats.entities}\n` +
      `Buildings: ${stats.buildings}\n` +
      `Items: ${stats.items}\n` +
      `Belts: ${stats.belts}`
    );
  }
}
```

## Event System

Implement an event system to handle communication between systems:

```typescript
export type GameEvent = {
  type: string;
  data: any;
};

export class EventBus {
  private listeners: Map<string, ((event: GameEvent) => void)[]> = new Map();
  
  subscribe(type: string, callback: (event: GameEvent) => void): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    
    this.listeners.get(type).push(callback);
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(type);
      const index = callbacks.indexOf(callback);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
    };
  }
  
  publish(event: GameEvent): void {
    const { type } = event;
    if (this.listeners.has(type)) {
      for (const callback of this.listeners.get(type)) {
        callback(event);
      }
    }
  }
}
```

## Conclusion and Best Practices

1. **Keep Components Small**: Each component should contain related data only.
2. **Use Archetype Queries**: bitECS optimization for entity queries. 
3. **Minimize Component Changes**: Changing a component's data is cheaper than adding/removing components.
4. **Phaser for What It's Good At**: Use Phaser for rendering, animation, input, and asset loading.
5. **bitECS for Game Logic**: Keep game rules and state in the ECS layer.
6. **Grid-Based Design**: For factory games, a grid system simplifies many algorithms.
7. **Separate UI from Game Logic**: Consider a separate Phaser scene for UI elements.