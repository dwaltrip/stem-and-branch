// Define terrain types enum
export enum TerrainType {
  WATER = 0,
  SAND = 1,
  GRASS = 2,
  MOUNTAIN = 3
}

// Define terrain thresholds interface
export interface TerrainThresholds {
  WATER: number;
  SAND: number;
  GRASS: number;
  MOUNTAIN: number;
}

// Define terrain parameters interface
export interface TerrainParams {
  noiseScale: number;
  noiseOctaves: number;
  noisePersistence: number;
  noiseSeed: number;
  terrainThresholds: TerrainThresholds;
}

// Define terrain colors
export const TERRAIN_COLORS: Record<TerrainType, number> = {
  [TerrainType.WATER]: 0x1a75ff,    // Bright blue
  [TerrainType.SAND]: 0xffd700,     // Gold/yellow
  [TerrainType.GRASS]: 0x32cd32,    // Lime green
  [TerrainType.MOUNTAIN]: 0x696969  // Dim gray
};