import { defineQuery, IWorld, addEntity, addComponent, removeEntity, hasComponent } from 'bitecs';
import { 
  Building, 
  BuildingType, 
  BUILDING_DEFINITIONS, 
  Production, 
  BuildIntent,
  RemoveIntent
} from '../components/components';
import { modifyPlayerResources } from './resourceSystem';
import { TerrainType } from '../../terrain/TerrainTypes';

// Query for all buildings with production capability
export const productionBuildingQuery = defineQuery([Building, Production]);

// Intent queries
export const buildIntentQuery = defineQuery([BuildIntent]);
export const removeIntentQuery = defineQuery([RemoveIntent]);

// Interface for terrain information needed by the building system
export interface TerrainProvider {
  getTerrainAt: (gridX: number, gridY: number) => TerrainType;
  isValidBuildPosition?: (world: IWorld, gridX: number, gridY: number, type: BuildingType) => boolean;
}

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

export function buildingProductionSystem(world: IWorld, deltaTime: number, terrainProvider: TerrainProvider): IWorld {
  const buildings = productionBuildingQuery(world);

  for (let i = 0; i < buildings.length; i++) {
    const entity = buildings[i];
    
    // Only process active buildings
    if (Production.active[entity] !== 1) {
      continue;
    }

    const buildingType = Building.type[entity];
    const gridX = Building.gridX[entity];
    const gridY = Building.gridY[entity];
    
    // Get building definition
    const definition = BUILDING_DEFINITIONS[buildingType as BuildingType];
    
    // Mining drills should only work on appropriate terrain
    if (buildingType === BuildingType.MINING_DRILL) {
      const terrainType = terrainProvider.getTerrainAt(gridX, gridY);
      
      // Only produce iron from iron ore deposits
      if (definition.resourceType === 'ironOre' && terrainType !== TerrainType.IRON_ORE) {
        continue;
      }
    }
    
    // Update production progress
    Production.progress[entity] += Production.rate[entity] * deltaTime;
    
    // If a production cycle is complete
    if (Production.progress[entity] >= 1) {
      // Reset progress
      Production.progress[entity] = 0;
      
      // Add resources to player inventory
      if (definition.resourceType === 'ironOre') {
        modifyPlayerResources(world, { ironOre: definition.productionAmount });
      }
    }
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
  
  // Add production component for buildings that produce resources
  const definition = BUILDING_DEFINITIONS[type];
  if (definition) {
    addComponent(world, Production, entity);
    Production.rate[entity] = definition.productionRate;
    Production.progress[entity] = 0;
    Production.active[entity] = 1; // Start active by default
  }
  
  return entity;
}

export function removeBuilding(world: IWorld, gridX: number, gridY: number): boolean {
  const buildings = productionBuildingQuery(world);
  
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
  const buildings = productionBuildingQuery(world);
  
  for (let i = 0; i < buildings.length; i++) {
    const entity = buildings[i];
    
    if (Building.gridX[entity] === gridX && Building.gridY[entity] === gridY) {
      return entity;
    }
  }
  
  return -1;
}