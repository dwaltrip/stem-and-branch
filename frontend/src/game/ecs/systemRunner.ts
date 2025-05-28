import { IWorld } from 'bitecs';
import { InputManager } from '../input/InputManager';
import { movementSystem, processMovementIntents } from './systems/movementSystem';
import { processBuildIntents, processRemoveIntents } from './systems/buildingSystem';
import { intentSystem, cleanupIntents } from './systems/intentSystem';
import { TerrainProvider } from '../types';

/**
 * Central system runner that manages the execution order of all ECS systems.
 * This defines the high-level execution flow of the game's ECS architecture.
 */
export function runSystems(
  world: IWorld, 
  deltaTime: number, 
  inputManager: InputManager, 
  terrainProvider: TerrainProvider
): void {
  // STEP 1: Process input and create intents
  intentSystem(world, inputManager);
  
  // STEP 2: Process intents and update game state
  processMovementIntents(world);
  processBuildIntents(world, terrainProvider);
  processRemoveIntents(world);
  
  // STEP 3: Run regular systems
  movementSystem(world, deltaTime, terrainProvider);
  
  // STEP 4: Cleanup one-time intents
  cleanupIntents(world);
}