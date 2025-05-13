import { TerrainType } from '../terrain/TerrainTypes';
import { GRID } from '../GameConstants';
import { BuildingType } from '../ecs/components/components';

// Building data for serialization
export interface BuildingData {
  type: number; // BuildingType enum value
  gridX: number;
  gridY: number;
}

// Data shape for maps in the game
export interface MapData {
  width: number;
  height: number;
  terrainGrid: TerrainType[][];
  buildings: BuildingData[];
  seed: number;
  generationParameters: {
    noiseScale: number;
    noiseOctaves: number;
    noisePersistence: number;
    terrainThresholds: {
      WATER: number;
      SAND: number;
      GRASS: number;
      MOUNTAIN: number;
    }
  };
}

export class MapStorage {
  private static readonly STORAGE_KEY = 'stem-and-branch--map-data';

  public static saveMap(mapData: MapData): boolean {
    try {
      const serialized = JSON.stringify(mapData);
      localStorage.setItem(this.STORAGE_KEY, serialized);
      console.log('Map saved to localStorage');
      return true;
    } catch (error) {
      console.error('Failed to save map:', error);
      return false;
    }
  }

  // returns Map data or null if no saved map
  public static loadMap(): MapData | null {
    try {
      const serialized = localStorage.getItem(this.STORAGE_KEY);
      if (!serialized) {
        console.log('No saved map found');
        return null;
      }

      const mapData = JSON.parse(serialized) as MapData;
      console.log('Map loaded from localStorage');
      return mapData;
    } catch (error) {
      console.error('Failed to load map:', error);
      return null;
    }
  }

  public static hasSavedMap(): boolean {
    return localStorage.getItem(this.STORAGE_KEY) !== null;
  }

  public static deleteSavedMap(): boolean {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      console.log('Saved map deleted');
      return true;
    } catch (error) {
      console.error('Failed to delete saved map:', error);
      return false;
    }
  }

  public static createEmptyMap(): MapData {
    const terrainGrid: TerrainType[][] = Array(GRID.MAP_HEIGHT)
      .fill(0)
      .map(() => Array(GRID.MAP_WIDTH).fill(TerrainType.GRASS));

    return {
      width: GRID.MAP_WIDTH,
      height: GRID.MAP_HEIGHT,
      terrainGrid,
      buildings: [],
      seed: Math.random() * 1000,
      generationParameters: {
        noiseScale: 0.1,
        noiseOctaves: 4,
        noisePersistence: 0.5,
        terrainThresholds: {
          WATER: 0.3,
          SAND: 0.4,
          GRASS: 0.8,
          MOUNTAIN: 1.0
        }
      }
    };
  }
}
