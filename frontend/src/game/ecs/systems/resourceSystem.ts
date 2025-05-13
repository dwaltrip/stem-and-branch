import { defineQuery, IWorld } from 'bitecs';
import { PlayerControlled, Resources } from '../components/components';

export const playerResourceQuery = defineQuery([PlayerControlled, Resources]);

// Get the player's resources (assumes single player for now)
export function getPlayerResources(world: IWorld): { ironOre: number } {
  const playerEntities = playerResourceQuery(world);
  
  if (playerEntities.length === 0) {
    return { ironOre: 0 };
  }
  
  // For now we're assuming only one player
  const entity = playerEntities[0];
  
  return {
    ironOre: Resources.ironOre[entity]
  };
}

// Set a specific value for player resources
export function setPlayerResources(world: IWorld, resources: { ironOre?: number }): void {
  const playerEntities = playerResourceQuery(world);
  
  if (playerEntities.length === 0) {
    return;
  }
  
  // For now we're assuming only one player
  const entity = playerEntities[0];
  
  // Update only the resources that are provided
  if (resources.ironOre !== undefined) {
    Resources.ironOre[entity] = resources.ironOre;
  }
}

// Modify (add or subtract) player resources
export function modifyPlayerResources(world: IWorld, resources: { ironOre?: number }): void {
  const playerEntities = playerResourceQuery(world);
  
  if (playerEntities.length === 0) {
    return;
  }
  
  // For now we're assuming only one player
  const entity = playerEntities[0];
  
  // Modify the resources that are provided
  if (resources.ironOre !== undefined) {
    Resources.ironOre[entity] += resources.ironOre;
    // Ensure non-negative values
    if (Resources.ironOre[entity] < 0) {
      Resources.ironOre[entity] = 0;
    }
  }
}