// Game configuration settings
// Centralized place for asset paths, constants, and other configurable values

export const GAME_CONFIG = {
  // Asset paths
  ASSETS: {
    TERRAIN_TILESHEET: 'assets/sprites/tileset.png',
    BUILDING_TILESHEET: 'assets/sprites/tileset.png',
    // Future: separate building tilesheet when art is split
    // BUILDING_TILESHEET: 'assets/sprites/building_tileset.png',
  },
} as const;

// Type-safe asset path getter
export function getAssetPath(assetKey: keyof typeof GAME_CONFIG.ASSETS): string {
  return GAME_CONFIG.ASSETS[assetKey];
}
