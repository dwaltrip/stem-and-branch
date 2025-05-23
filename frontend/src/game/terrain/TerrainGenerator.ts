import { TerrainType, TerrainParams } from './TerrainTypes';
import { GRID } from '../GameConstants';
import { PerlinNoise } from '../../utils/PerlinNoise';

/**
 * Pure terrain generation function - no side effects, just returns terrain data
 */
export function generateTerrainData(params: TerrainParams): TerrainType[][] {
  const {
    noiseSeed = Math.random() * 1000,
    noiseScale = 0.1,
    noiseOctaves = 4,
    noisePersistence = 0.5,
    terrainThresholds = {
      WATER: 0.3,
      SAND: 0.4,
      GRASS: 0.8,
      MOUNTAIN: 1.0
    }
  } = params;
  
  const perlin = new PerlinNoise(noiseSeed);
  const mapData = Array(GRID.MAP_HEIGHT).fill(0).map(() => 
    Array(GRID.MAP_WIDTH).fill(TerrainType.GRASS)
  );
  
  for (let y = 0; y < GRID.MAP_HEIGHT; y++) {
    for (let x = 0; x < GRID.MAP_WIDTH; x++) {
      const nx = x * noiseScale;
      const ny = y * noiseScale;
      const noiseValue = perlin.normalized(nx, ny, noiseOctaves, noisePersistence);
      
      let terrainType: TerrainType;
      if (noiseValue < terrainThresholds.WATER) {
        terrainType = TerrainType.WATER;
      } else if (noiseValue < terrainThresholds.SAND) {
        terrainType = TerrainType.SAND;
      } else if (noiseValue < terrainThresholds.GRASS) {
        if (Math.random() < 0.05) {
          terrainType = TerrainType.IRON_ORE;
        } else {
          terrainType = TerrainType.GRASS;
        }
      } else {
        terrainType = TerrainType.MOUNTAIN;
      }
      
      mapData[y][x] = terrainType;
    }
  }

  return mapData;
}