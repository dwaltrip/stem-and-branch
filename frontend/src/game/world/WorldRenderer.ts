import Phaser from 'phaser';
import { TerrainParams, TerrainType, BuildingTileIndex } from '../terrain/TerrainTypes';
import { GRID } from '../GameConstants';
import { terrainExperiments as terrainExperimentsModule } from '../terrain/TerrainExperiments';
import { PerlinNoise } from '../../utils/PerlinNoise';
import { BuildingType } from '../ecs/components/components';
import { productionBuildingQuery } from '../ecs/systems/buildingSystem';

/**
 * WorldRenderer is responsible for rendering the game world,
 * including terrain tiles and building sprites.
 */
export class WorldRenderer {
  // Tilemap components
  private scene: Phaser.Scene;
  private map!: Phaser.Tilemaps.Tilemap;
  private tileset!: Phaser.Tilemaps.Tileset;
  private terrainLayer!: Phaser.Tilemaps.TilemapLayer;
  
  // Map data
  private mapData: TerrainType[][] = [];
  
  // Building objects
  private buildingSprites: Map<number, Phaser.GameObjects.Sprite> = new Map();
  
  // Terrain experiments for UI and parameter tweaking
  private _terrainExperiments = terrainExperimentsModule;
  
  // Public accessor for terrain experiments
  get terrainExperiments() {
    return this._terrainExperiments;
  }
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }
  
  /**
   * Initialize the renderer and create the tilemap
   */
  initialize(): void {
    // Create tilemap
    this.map = this.scene.make.tilemap({
      tileWidth: GRID.SIZE,
      tileHeight: GRID.SIZE,
      width: GRID.MAP_WIDTH,
      height: GRID.MAP_HEIGHT
    });
    
    // Add tileset
    const tileset = this.map.addTilesetImage('terrain_tiles', undefined, GRID.SIZE, GRID.SIZE, 0, 0, 0);
    if (!tileset) {
      console.error('Failed to load tileset');
      return;
    }
    this.tileset = tileset;
    
    // Create terrain layer
    const layer = this.map.createBlankLayer('terrain', this.tileset, 0, 0, GRID.MAP_WIDTH, GRID.MAP_HEIGHT);
    if (!layer) {
      console.error('Failed to create tilemap layer');
      return;
    }
    this.terrainLayer = layer;
    
    // Set depth to ensure terrain is behind other objects
    this.terrainLayer.setDepth(-1);
    
    // Add grid overlay for debugging (semi-transparent)
    this.scene.add.grid(
      0, 
      0,
      GRID.MAP_WIDTH * GRID.SIZE, 
      GRID.MAP_HEIGHT * GRID.SIZE,
      GRID.SIZE, 
      GRID.SIZE,
      0x000000, 
      0, 
      0x000000, 
      0.1
    ).setOrigin(0, 0);
  }
  
  /**
   * Initialize the terrain experiments module
   * @param initialParams Initial terrain parameters
   * @returns The terrain parameters used
   */
  initTerrainExperiments(initialParams: Partial<TerrainParams> = {}): TerrainParams {
    return this._terrainExperiments.init(
      this.scene,
      initialParams,
      this.generateTerrain.bind(this),
      this.renderTerrainTiles.bind(this)
    );
  }
  
  /**
   * Load map data
   * @param mapData 2D array of terrain types
   */
  loadMapData(mapData: TerrainType[][]): void {
    this.mapData = mapData;
    this.renderTerrainTiles();
  }
  
  /**
   * Generate terrain using Perlin noise
   * @param params Terrain generation parameters
   */
  generateTerrain(params: TerrainParams): void {
    // Get parameters from passed object or use defaults
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
    } = params || {};
    
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
          }
          else {
            terrainType = TerrainType.GRASS;
          }
        } else {
          terrainType = TerrainType.MOUNTAIN;
        }
        
        mapData[y][x] = terrainType;
      }
    }

    this.mapData = mapData;
  }
  
  /**
   * Render terrain tiles based on the current map data
   */
  renderTerrainTiles(): void {
    if (!this.terrainLayer || !this.tileset) {
      console.error('Tilemap components not initialized');
      return;
    }
    
    // Map TerrainType to tilemap indices
    const typeToTileIndex = {
      [TerrainType.WATER]: 0,
      [TerrainType.SAND]: 1,
      [TerrainType.IRON_ORE]: 2,
      [TerrainType.GRASS]: 3,
      [TerrainType.MOUNTAIN]: 4,
      [5]: 5,
    };
    
    for (let y = 0; y < GRID.MAP_HEIGHT; y++) {
      for (let x = 0; x < GRID.MAP_WIDTH; x++) {
        const terrainType = this.mapData[y][x];
        const tileIndex = typeToTileIndex[terrainType];
        this.terrainLayer.putTileAt(tileIndex, x, y);
      }
    }
  }
  
  /**
   * Get terrain type at the specified grid coordinates
   * @param gridX X grid coordinate
   * @param gridY Y grid coordinate
   * @returns The terrain type at the specified location
   */
  getTerrainTypeAt(gridX: number, gridY: number): TerrainType {
    // Check if position is within map bounds
    if (gridX >= 0 && gridX < GRID.MAP_WIDTH && gridY >= 0 && gridY < GRID.MAP_HEIGHT) {
      return this.mapData[gridY][gridX];
    }
    return TerrainType.GRASS; // Default
  }
  
  /**
   * Check if a position is valid for movement (within bounds and not impassable)
   * @param gridX X grid coordinate
   * @param gridY Y grid coordinate
   * @returns True if the position is valid, false otherwise
   */
  isValidPosition(gridX: number, gridY: number): boolean {
    // Check bounds
    if (gridX < 0 || gridX >= GRID.MAP_WIDTH || gridY < 0 || gridY >= GRID.MAP_HEIGHT) {
      return false;
    }
    
    const terrainType = this.mapData[gridY][gridX];
    return terrainType !== TerrainType.WATER && terrainType !== TerrainType.MOUNTAIN;
  }
  
  /**
   * Update building sprites based on ECS world
   * @param world ECS world
   */
  updateBuildingSprites(world: any): void {
    // Get all buildings from ECS
    const buildings = productionBuildingQuery(world);
    const entitySet = new Set(buildings);
    
    // Remove sprites for entities that no longer exist
    for (const [entity, sprite] of this.buildingSprites.entries()) {
      if (!entitySet.has(entity)) {
        sprite.destroy();
        this.buildingSprites.delete(entity);
      }
    }
    
    // Update or create sprites for all buildings
    for (let i = 0; i < buildings.length; i++) {
      const entity = buildings[i];
      const Building = world.components.Building;
      
      const gridX = Building.gridX[entity];
      const gridY = Building.gridY[entity];
      const buildingType = Building.type[entity];
      
      // Position in pixels
      const pixelX = gridX * GRID.SIZE + GRID.SIZE / 2;
      const pixelY = gridY * GRID.SIZE + GRID.SIZE / 2;
      
      let sprite = this.buildingSprites.get(entity);
      
      // Create sprite if it doesn't exist
      if (!sprite) {
        // Use tileset frame based on building type
        let frame: number;
        switch (buildingType) {
          case BuildingType.MINING_DRILL:
            frame = BuildingTileIndex.MINING_DRILL;
            break;
          default:
            frame = BuildingTileIndex.MINING_DRILL; // Default frame
        }
        
        sprite = this.scene.add.sprite(pixelX, pixelY, 'terrain_tiles', frame);
        sprite.setOrigin(0.5, 0.5);
        sprite.setDepth(1); // Above terrain, below UI
        this.buildingSprites.set(entity, sprite);
      } else {
        // Update sprite position if needed
        sprite.x = pixelX;
        sprite.y = pixelY;
      }
    }
  }
  
  /**
   * Get the current map data
   * @returns 2D array of terrain types
   */
  getMapData(): TerrainType[][] {
    return this.mapData;
  }
  
  /**
   * Check if a position is valid for building placement
   * @param world ECS world
   * @param gridX X grid coordinate
   * @param gridY Y grid coordinate
   * @param type Building type
   * @returns True if the position is valid for building, false otherwise
   */
  isValidBuildPosition(world: any, gridX: number, gridY: number, type: BuildingType): boolean {
    // Check if position is passable
    if (!this.isValidPosition(gridX, gridY)) {
      return false;
    }
    
    // Get building system
    const getBuildingAt = (world.getBuildingAt || 
      ((world: any, x: number, y: number) => -1)); // Default if not available
    
    // Check if there's already a building here
    if (getBuildingAt(world, gridX, gridY) !== -1) {
      return false;
    }
    
    // For mining drills, check if they're on correct resource
    const terrainType = this.getTerrainTypeAt(gridX, gridY);
    
    // Mining drills should only be placed on iron ore
    return terrainType === TerrainType.IRON_ORE;
  }
}