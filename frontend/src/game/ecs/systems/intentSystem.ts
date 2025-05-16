import { IWorld, defineQuery, hasComponent, addComponent, removeComponent } from 'bitecs';
import { 
  PlayerControlled, 
  MoveIntent, 
  BuildIntent, 
  RemoveIntent, 
  InteractIntent, 
  ToggleInventoryIntent,
  BuildingType
} from '../components/components';
import { InputManager, InputAction, GameMode } from '../../input/InputManager';

// Query to find entities that can have intents (currently only player)
const playerQuery = defineQuery([PlayerControlled]);

// System that translates raw input into intent components.
// This creates a separation between input and game state changes.
// Returns the updated world.
export function intentSystem(world: IWorld, inputManager: InputManager): IWorld {
  const players = playerQuery(world);
  
  // Process player input to create intents
  for (let i = 0; i < players.length; i++) {
    const entity = players[i];
    
    // Handle movement intent
    processMovementIntent(world, entity, inputManager);
    
    // Handle other intents based on just-pressed actions
    processBuildIntent(world, entity, inputManager);
    processRemoveIntent(world, entity, inputManager);
    processInteractIntent(world, entity, inputManager);
    processToggleInventoryIntent(world, entity, inputManager);
  }
  
  return world;
}

function processMovementIntent(world: IWorld, entity: number, inputManager: InputManager): void {
  const movement = inputManager.getMovementVector();
  
  // If there's no movement, remove any existing MoveIntent
  if (movement.x === 0 && movement.y === 0) {
    if (hasComponent(world, MoveIntent, entity)) {
      removeComponent(world, MoveIntent, entity);
    }
    return;
  }
  
  // Add or update MoveIntent
  if (!hasComponent(world, MoveIntent, entity)) {
    addComponent(world, MoveIntent, entity);
  }
  
  // Set the movement values in the intent
  MoveIntent.x[entity] = movement.x;
  MoveIntent.y[entity] = movement.y;
  MoveIntent.duration[entity] = 0; // Continuous movement while key is held
}

function processBuildIntent(world: IWorld, entity: number, inputManager: InputManager): void {
  // Only valid in build mode and when place action is pressed
  if (inputManager.getGameMode() !== GameMode.BUILD || 
      !inputManager.wasActionJustPressed(InputAction.PLACE_BUILDING)) {
    return;
  }
  
  const { x, y } = inputManager.getMouseGridPosition();
  
  // Add BuildIntent component with position
  if (!hasComponent(world, BuildIntent, entity)) {
    addComponent(world, BuildIntent, entity);
  }
  
  // For now, always place a mining drill - this could be expanded later
  // to support different building types based on selection
  BuildIntent.type[entity] = BuildingType.MINING_DRILL;
  BuildIntent.gridX[entity] = x;
  BuildIntent.gridY[entity] = y;
}

function processRemoveIntent(world: IWorld, entity: number, inputManager: InputManager): void {
  // Only valid in build mode and when remove action is pressed
  if (inputManager.getGameMode() !== GameMode.BUILD || 
      !inputManager.wasActionJustPressed(InputAction.REMOVE_BUILDING)) {
    return;
  }
  
  const { x, y } = inputManager.getMouseGridPosition();
  
  // Add RemoveIntent component with position
  if (!hasComponent(world, RemoveIntent, entity)) {
    addComponent(world, RemoveIntent, entity);
  }
  
  RemoveIntent.gridX[entity] = x;
  RemoveIntent.gridY[entity] = y;
}

function processInteractIntent(world: IWorld, entity: number, inputManager: InputManager): void {
  // Only valid when interact action is just pressed
  if (!inputManager.wasActionJustPressed(InputAction.INTERACT)) {
    return;
  }
  
  const { x, y } = inputManager.getMouseGridPosition();
  
  // Add InteractIntent component with position
  if (!hasComponent(world, InteractIntent, entity)) {
    addComponent(world, InteractIntent, entity);
  }
  
  InteractIntent.gridX[entity] = x;
  InteractIntent.gridY[entity] = y;
}

function processToggleInventoryIntent(world: IWorld, entity: number, inputManager: InputManager): void {
  // Only valid when toggle inventory action is just pressed
  if (!inputManager.wasActionJustPressed(InputAction.TOGGLE_INVENTORY)) {
    return;
  }
  
  // Add ToggleInventoryIntent component (it's just a flag, no data)
  if (!hasComponent(world, ToggleInventoryIntent, entity)) {
    addComponent(world, ToggleInventoryIntent, entity);
  }
}

// Cleans up one-time intents after they've been processed
// This should be called after all execution systems have run
export function cleanupIntents(world: IWorld): IWorld {
  const players = playerQuery(world);
  
  for (let i = 0; i < players.length; i++) {
    const entity = players[i];
    
    // Remove one-time intents
    // MoveIntent is not removed as it's continuous while keys are held
    if (hasComponent(world, BuildIntent, entity)) {
      removeComponent(world, BuildIntent, entity);
    }
    
    if (hasComponent(world, RemoveIntent, entity)) {
      removeComponent(world, RemoveIntent, entity);
    }
    
    if (hasComponent(world, InteractIntent, entity)) {
      removeComponent(world, InteractIntent, entity);
    }
    
    if (hasComponent(world, ToggleInventoryIntent, entity)) {
      removeComponent(world, ToggleInventoryIntent, entity);
    }
  }
  
  return world;
}
