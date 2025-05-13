import { world } from '../game/ecs/world';
import { modifyPlayerResources, setPlayerResources } from '../game/ecs/systems/resourceSystem';
import { BuildingType, Building } from '../game/ecs/components/components';
import { addBuilding, removeBuilding, getBuildingAt, productionBuildingQuery } from '../game/ecs/systems/buildingSystem';

// Reference to MainScene instance for terrain access
let mainSceneInstance: any = null;

// Set reference to the active MainScene instance
export function setMainSceneInstance(scene: any): void {
  mainSceneInstance = scene;
  console.log('MainScene instance set for DevTools');
}

export function initDevTools(): void {
  // Throwaway global functions for manipulating resources
  (window as any).setIronOre = (amount: number) => {
    setPlayerResources(world, { ironOre: amount });
    console.log(`Set iron ore to ${amount}`);
  };

  (window as any).addIronOre = (amount: number) => {
    modifyPlayerResources(world, { ironOre: amount });
    console.log(`Added ${amount} iron ore`);
  };

  // Building manipulation tools
  (window as any).placeMiningDrill = (gridX: number, gridY: number) => {
    if (!mainSceneInstance) {
      console.error('MainScene not available. Building functionality unavailable.');
      return false;
    }

    // Get terrain at location
    const terrainType = mainSceneInstance._getTerrainTypeAt(gridX, gridY);
    
    // Place the building entity
    const entityId = addBuilding(world, BuildingType.MINING_DRILL, gridX, gridY);
    
    if (entityId !== -1) {
      console.log(`Created mining drill at (${gridX}, ${gridY})`);
      return true;
    } else {
      console.error(`Failed to create mining drill at (${gridX}, ${gridY})`);
      return false;
    }
  };

  (window as any).removeBuilding = (gridX: number, gridY: number) => {
    const result = removeBuilding(world, gridX, gridY);
    
    if (result) {
      console.log(`Removed building at (${gridX}, ${gridY})`);
    } else {
      console.log(`No building found at (${gridX}, ${gridY})`);
    }
    
    return result;
  };

  (window as any).getBuildingAt = (gridX: number, gridY: number) => {
    const entity = getBuildingAt(world, gridX, gridY);
    
    if (entity !== -1) {
      console.log(`Found building (entity ID: ${entity}) at (${gridX}, ${gridY})`);
    } else {
      console.log(`No building found at (${gridX}, ${gridY})`);
    }
    
    return entity;
  };

  (window as any).listAllBuildings = () => {
    const buildings = productionBuildingQuery(world);
    
    if (buildings.length === 0) {
      console.log('No buildings found in the world');
      return [];
    }
    
    const buildingList = buildings.map(entity => {
      return {
        entity,
        type: Building.type[entity],
        gridX: Building.gridX[entity],
        gridY: Building.gridY[entity]
      };
    });
    
    console.table(buildingList);
    return buildingList;
  };

  console.log('Dev tools initialized. Available console functions:');
  console.log('  window.setIronOre(amount) - Set iron ore to specific amount');
  console.log('  window.addIronOre(amount) - Add/subtract iron ore (negative values subtract)');
  console.log('  window.placeMiningDrill(gridX, gridY) - Place a mining drill at grid coordinates');
  console.log('  window.removeBuilding(gridX, gridY) - Remove a building at grid coordinates');
  console.log('  window.getBuildingAt(gridX, gridY) - Get entity ID of building at grid coordinates');
  console.log('  window.listAllBuildings() - List all buildings in the world');
}
