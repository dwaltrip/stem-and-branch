// Centralized tile mapping configuration for terrain and building tilesheets
// Based on current terrain_tileset.png and test1__tile_mapping.json

import { TerrainType } from '../terrain/TerrainTypes';
import { BuildingType } from '../ecs/components/components';

// Terrain tile indices - supports multiple variants per terrain type
export const TERRAIN_TILES = {
  [TerrainType.WATER]: [0],
  [TerrainType.SAND]: [1], 
  [TerrainType.IRON_ORE]: [2],
  [TerrainType.GRASS]: [3],  // TODO: Add variants [3, 8, 9] when separate terrain tilesheet ready
  [TerrainType.MOUNTAIN]: [4]
} as const;

// Building tile indices - from test1__tile_mapping.json
export const BUILDING_TILES = {
  [BuildingType.MINING_DRILL]: 5,  // Current index in terrain_tileset.png
  // Future buildings from test1 mapping:
  // TRANSPORT_TUBE: 17,
  // SMELTER: 12 or 13 (funnel2 or sleek1)
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

// Asset paths - centralized for easy updates
export const ASSET_PATHS = {
  TERRAIN_TILESHEET: 'assets/sprites/terrain_tileset.png',  // TODO: Split to terrain-only
  BUILDING_TILESHEET: 'assets/sprites/terrain_tileset.png'  // TODO: Change to building-only tilesheet
} as const;