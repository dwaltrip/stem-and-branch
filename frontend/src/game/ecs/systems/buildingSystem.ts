import { defineQuery, IWorld, addEntity, addComponent, removeEntity, hasComponent } from 'bitecs';
import { 
  Building, 
  BuildingType, 
  BuildIntent,
  RemoveIntent
} from '../components/components';
import { TerrainProvider } from '../../types';

// Query for all buildings with production capability
export const buildingQuery = defineQuery([Building]);

// Intent queries
export const buildIntentQuery = defineQuery([BuildIntent]);
export const removeIntentQuery = defineQuery([RemoveIntent]);

export function processBuildIntents(world: IWorld, terrainProvider: TerrainProvider): IWorld {
  // Process build intents
  const buildEntities = buildIntentQuery(world);
  
  for (let i = 0; i < buildEntities.length; i++) {
    const entity = buildEntities[i];
    
    const type = BuildIntent.type[entity];
    const gridX = BuildIntent.gridX[entity];
    const gridY = BuildIntent.gridY[entity];
    
    // Validate position if possible
    if (terrainProvider.isValidBuildPosition && 
        !terrainProvider.isValidBuildPosition(world, gridX, gridY, type)) {
      continue;
    }
    
    // Check if there's already a building at this position
    if (getBuildingAt(world, gridX, gridY) !== -1) {
      continue;
    }
    
    // Add the building
    addBuilding(world, type, gridX, gridY);
  }
  
  return world;
}

export function processRemoveIntents(world: IWorld): IWorld {
  // Process remove intents
  const removeEntities = removeIntentQuery(world);
  
  for (let i = 0; i < removeEntities.length; i++) {
    const entity = removeEntities[i];
    
    const gridX = RemoveIntent.gridX[entity];
    const gridY = RemoveIntent.gridY[entity];
    
    // Remove building at the position
    removeBuilding(world, gridX, gridY);
  }
  
  return world;
}

export function addBuilding(world: IWorld, type: BuildingType, gridX: number, gridY: number): number {
  // Create the building entity
  const entity = addEntity(world);
  
  // Add building component
  addComponent(world, Building, entity);
  Building.type[entity] = type;
  Building.gridX[entity] = gridX;
  Building.gridY[entity] = gridY;
  
  return entity;
}

export function removeBuilding(world: IWorld, gridX: number, gridY: number): boolean {
  const buildings = buildingQuery(world);
  
  for (let i = 0; i < buildings.length; i++) {
    const entity = buildings[i];
    
    if (Building.gridX[entity] === gridX && Building.gridY[entity] === gridY) {
      removeEntity(world, entity);
      return true;
    }
  }
  
  return false;
}

export function getBuildingAt(world: IWorld, gridX: number, gridY: number): number {
  const buildings = buildingQuery(world);
  
  for (let i = 0; i < buildings.length; i++) {
    const entity = buildings[i];
    
    if (Building.gridX[entity] === gridX && Building.gridY[entity] === gridY) {
      return entity;
    }
  }
  
  return -1;
}
