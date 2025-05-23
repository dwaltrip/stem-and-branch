// Centralized tile mapping configuration for terrain and building tilesheets
// Based on terrain_tileset_v2.png with terrain variants and improved building tiles

import { TerrainType } from '../terrain/TerrainTypes';
import { BuildingType } from '../ecs/components/components';

// Terrain tile indices - supports multiple variants per terrain type
// Based on terrain_tileset_v2.json mapping
export const TERRAIN_TILES = {
  [TerrainType.WATER]: [3],
  [TerrainType.SAND]: [2], 
  [TerrainType.IRON_ORE]: [1],
  [TerrainType.GRASS]: [8, 9, 10, 11],  // 4 grass variants for visual variety
  [TerrainType.MOUNTAIN]: [0, 4, 5, 6, 7]  // 5 mountain variants including sandy mountains
} as const;

// Building tile indices - from terrain_tileset_v2.json
export const BUILDING_TILES = {
  [BuildingType.MINING_DRILL]: 15,  // "mining-drill-round" from v2 tileset
  // Future buildings ready:
  // TRANSPORT_TUBE: 17,
  // SMELTER: 12 (machine-with-funnel-2) or 13 (machine-sleek-1)
} as const;

// Helper function to get terrain tile index with variant support
export function getTerrainTileIndex(terrainType: TerrainType, x: number, y: number): number {
  const variants = TERRAIN_TILES[terrainType];
  if (variants.length === 1) {
    return variants[0];
  }
  
  // Use position-based hash for consistent variant selection
  const hash = (x * 73 + y * 31) % variants.length;
  return variants[hash];
}

// Helper function to get building tile index
export function getBuildingTileIndex(buildingType: BuildingType): number {
  return BUILDING_TILES[buildingType];
}

// Note: Asset paths moved to GameConfig.ts for centralized configuration