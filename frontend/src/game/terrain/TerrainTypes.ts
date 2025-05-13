export enum TerrainType {
  WATER = 0,
  SAND = 1,
  IRON_ORE = 2,
  GRASS = 3,
  MOUNTAIN = 4,
}

// Tile indices for buildings in the spritesheet
export enum BuildingTileIndex {
  MINING_DRILL = 5, // Row 2, Col 2 (0-indexed)
}

export interface TerrainThresholds {
  WATER: number;
  SAND: number;
  GRASS: number;
  MOUNTAIN: number;
}

export interface TerrainParams {
  noiseScale: number;
  noiseOctaves: number;
  noisePersistence: number;
  noiseSeed: number;
  terrainThresholds: TerrainThresholds;
}

export const TERRAIN_COLORS: Record<TerrainType, number> = {
  [TerrainType.WATER]: 0x1a75ff,    // Bright blue
  [TerrainType.SAND]: 0xffd700,     // Gold/yellow
  [TerrainType.GRASS]: 0x32cd32,    // Lime green
  [TerrainType.MOUNTAIN]: 0x696969,  // Dim gray,
  [TerrainType.IRON_ORE]: 0xffffff,  // White
};
