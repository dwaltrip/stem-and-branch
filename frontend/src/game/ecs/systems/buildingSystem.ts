import { defineQuery, IWorld, addEntity, addComponent, removeEntity } from 'bitecs';
import { Building, BuildingType, BUILDING_DEFINITIONS, Production } from '../components/components';
import { modifyPlayerResources } from './resourceSystem';
import { TerrainType } from '../../terrain/TerrainTypes';

// Query for all buildings with production capability
export const productionBuildingQuery = defineQuery([Building, Production]);

// Interface for terrain information needed by the building system
export interface TerrainProvider {
  getTerrainAt: (gridX: number, gridY: number) => TerrainType;
}

/**
 * Processes all production buildings and generates resources
 * @param world The ECS world
 * @param deltaTime Time in seconds since last update
 * @param terrainProvider Interface to access terrain information
 */
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
    const definition = BUILDING_DEFINITIONS[buildingType];
    
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

/**
 * Adds a building to the world at the specified grid position
 * @param world The ECS world
 * @param type Building type to create
 * @param gridX Grid X position
 * @param gridY Grid Y position
 * @returns The entity ID of the created building, or -1 if creation failed
 */
export function addBuilding(world: IWorld, type: BuildingType, gridX: number, gridY: number): number {
  // Here you would typically validate the position, check for collisions, etc.
  // For now, we'll keep it simple
  
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

/**
 * Removes a building at the specified grid position
 * @param world The ECS world
 * @param gridX Grid X position
 * @param gridY Grid Y position
 * @returns True if a building was removed, false otherwise
 */
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

/**
 * Gets a building at the specified grid position
 * @param world The ECS world
 * @param gridX Grid X position
 * @param gridY Grid Y position
 * @returns The entity ID of the building, or -1 if no building exists at that position
 */
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