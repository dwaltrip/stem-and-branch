import { TerrainType } from '../terrain/TerrainTypes';
import { GRID } from '../GameConstants';

/**
 * Interface defining map data structure for storage
 */
export interface MapData {
  width: number;
  height: number;
  terrainGrid: TerrainType[][];
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

/**
 * Class to handle map data persistence
 */
export class MapStorage {
  private static readonly STORAGE_KEY = 'stem-and-branch--map-data';

  /**
   * Save map data to localStorage
   * @param mapData Map data to save
   * @returns True if save was successful
   */
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

  /**
   * Load map data from localStorage
   * @returns Map data or null if no saved map
   */
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

  /**
   * Check if a saved map exists
   * @returns True if a saved map exists
   */
  public static hasSavedMap(): boolean {
    return localStorage.getItem(this.STORAGE_KEY) !== null;
  }

  /**
   * Delete saved map
   * @returns True if delete was successful
   */
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

  /**
   * Create an empty map data structure
   * @returns Empty map data
   */
  public static createEmptyMap(): MapData {
    const terrainGrid: TerrainType[][] = Array(GRID.MAP_HEIGHT)
      .fill(0)
      .map(() => Array(GRID.MAP_WIDTH).fill(TerrainType.GRASS));

    return {
      width: GRID.MAP_WIDTH,
      height: GRID.MAP_HEIGHT,
      terrainGrid,
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
