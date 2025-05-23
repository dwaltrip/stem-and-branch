// Game configuration settings
// Centralized place for asset paths, constants, and other configurable values

export const GAME_CONFIG = {
  // Asset paths
  ASSETS: {
    TERRAIN_TILESHEET: 'assets/sprites/terrain_tileset_v2.png',
    BUILDING_TILESHEET: 'assets/sprites/terrain_tileset_v2.png',
    // Future: separate building tilesheet when art is split
    // BUILDING_TILESHEET: 'assets/sprites/building_tileset.png',
  },
  
  // Tileset configuration
  TILESET: {
    TILE_SIZE: 32,  // Should match GRID.SIZE
    FRAMES_PER_ROW: 5,  // Useful for debugging/validation
  },
  
  // Game settings
  WORLD: {
    MAP_WIDTH: 400,  // Should match GRID.MAP_WIDTH  
    MAP_HEIGHT: 400, // Should match GRID.MAP_HEIGHT
  },
  
  // Development flags
  DEBUG: {
    SHOW_GRID: true,
    GRID_OPACITY: 0.1,
  }
} as const;

// Type-safe asset path getter
export function getAssetPath(assetKey: keyof typeof GAME_CONFIG.ASSETS): string {
  return GAME_CONFIG.ASSETS[assetKey];
}