import Phaser from 'phaser';
import { terrainExperiments } from '../terrain/TerrainExperiments';
import { PerlinNoise } from '../../utils/PerlinNoise';
import { TerrainParams, TerrainType, TERRAIN_COLORS } from '../terrain/TerrainTypes';
import { GRID, PLAYER } from '../GameConstants';
import { InputManager, InputAction } from '../input/InputManager';
import { DebugUI } from '../ui/DebugUI';
import { MapStorage, MapData } from '../world/MapStorage';
import { setMainSceneInstance } from '../../utils/DevTools';

import { world as ecsWorld, createPlayerEntity } from '../ecs/world';
import { movementSystem, playerInputSystem } from '../ecs/systems/movementSystem';
import { getPlayerResources, modifyPlayerResources } from '../ecs/systems/resourceSystem';
import { removeEntity } from 'bitecs';
import { 
  Position, 
  PlayerControlled, 
  Resources, 
  Building, 
  BuildingType, 
  BUILDING_DEFINITIONS 
} from '../ecs/components/components';
import { 
  buildingProductionSystem, 
  addBuilding, 
  removeBuilding, 
  getBuildingAt,
  productionBuildingQuery
} from '../ecs/systems/buildingSystem';
import { BuildingData } from '../world/MapStorage';

export class MainScene extends Phaser.Scene {

  // Game objects
  private player!: Phaser.Physics.Arcade.Sprite;
  private positionText!: Phaser.GameObjects.Text;
  private terrainText!: Phaser.GameObjects.Text;
  private resourcesText!: Phaser.GameObjects.Text;
  private inputManager!: InputManager;
  private debugUI!: DebugUI;
  private saveLoadText!: Phaser.GameObjects.Text;
  
  // ECS properties
  private world = ecsWorld;
  private playerEntity: number = -1;

  // Map data
  private mapData: TerrainType[][] = [];
  private currentMapData: MapData | null = null;
  
  // TileMap objects
  private map!: Phaser.Tilemaps.Tilemap;
  private tileset!: Phaser.Tilemaps.Tileset;
  private terrainLayer!: Phaser.Tilemaps.TilemapLayer;
  
  // Building objects
  private buildingSprites: Map<number, Phaser.GameObjects.Sprite> = new Map();

  constructor() {
    super({ key: 'MainScene' });
  }

  preload(): void {
    this.load.image('terrain_tiles', 'assets/sprites/terrain_tileset.png');
    
    // Create a simple player rectangle
    const playerSize = Math.floor(GRID.SIZE / 3);
    const playerGraphics = this.make.graphics({ x: 0, y: 0 });
    playerGraphics.fillStyle(0xff0000); // Red color
    playerGraphics.fillRect(0, 0, playerSize, playerSize);
    playerGraphics.generateTexture('player', playerSize, playerSize);
  }

  create(): void {
    // Set this instance for DevTools to access
    setMainSceneInstance(this);
    
    const savedMap = MapStorage.loadMap();
    
    const defaultParams: TerrainParams = {
      noiseScale: 0.1,
      noiseOctaves: 4,
      noisePersistence: 0.5,
      noiseSeed: Math.random() * 1000,
      terrainThresholds: {
        WATER: 0.3,
        SAND: 0.4,
        GRASS: 0.8,
        MOUNTAIN: 1.0
      }
    };
    
    // Use saved parameters if available
    const terrainParams = savedMap ? {
      ...savedMap.generationParameters,
      noiseSeed: savedMap.seed
    } : defaultParams;
    this.currentMapData = savedMap || MapStorage.createEmptyMap();
    
    // Initialize terrain experiments
    terrainExperiments.init(
      this,
      terrainParams,
      this.generateTerrain.bind(this),
      this.renderTerrainTiles.bind(this)
    );
    
    this.map = this.make.tilemap({
      tileWidth: GRID.SIZE,
      tileHeight: GRID.SIZE,
      width: GRID.MAP_WIDTH,
      height: GRID.MAP_HEIGHT
    });
    
    const tileset = this.map.addTilesetImage('terrain_tiles', undefined, GRID.SIZE, GRID.SIZE, 0, 0, 0);
    if (!tileset) {
      console.error('Failed to load tileset');
      return;
    }
    this.tileset = tileset;
    
    // Create a blank layer for the terrain
    const layer = this.map.createBlankLayer('terrain', this.tileset, 0, 0, GRID.MAP_WIDTH, GRID.MAP_HEIGHT);
    if (!layer) {
      console.error('Failed to create tilemap layer');
      return;
    }
    this.terrainLayer = layer;
    
    if (savedMap) {
      this.mapData = savedMap.terrainGrid;
      console.log('Loaded saved map');
    } else {
      this.generateTerrain(terrainParams);
      console.log('Generated new map');
    }
    
    this.renderTerrainTiles();
    
    // Create a grid overlay for debugging (semi-transparent)
    this.add.grid(
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

    // Create player
    this.player = this.physics.add.sprite(
      GRID.MAP_WIDTH * GRID.SIZE / 2, 
      GRID.MAP_HEIGHT * GRID.SIZE / 2, 
      'player'
    );
    
    // Set world bounds based on map size
    this.physics.world.bounds.width = GRID.MAP_WIDTH * GRID.SIZE;
    this.physics.world.bounds.height = GRID.MAP_HEIGHT * GRID.SIZE;
    this.player.setCollideWorldBounds(true);
    
    // Set up camera to follow player
    this.cameras.main.setBounds(0, 0, GRID.MAP_WIDTH * GRID.SIZE, GRID.MAP_HEIGHT * GRID.SIZE);
    this.cameras.main.startFollow(this.player);
    
    // Create ECS player entity
    this.playerEntity = createPlayerEntity(this.player.x, this.player.y);
    console.log('Created player entity with ID:', this.playerEntity);
    
    this.inputManager = new InputManager(this);
    
    // Display player position in UI
    this.positionText = this.add.text(10, 10, 'Position: 0,0', { 
      fontSize: '16px', 
      color: '#fff',
      backgroundColor: '#000'
    });
    this.positionText.setScrollFactor(0); // Fix to camera
    
    // Display terrain info for currrent tile (grass is placeholder)
    this.terrainText = this.add.text(10, 40, 'Terrain: Grass', {
      fontSize: '16px',
      color: '#fff',
      backgroundColor: '#000'
    });
    this.terrainText.setScrollFactor(0); // Fix to camera

    // Display player resources
    this.resourcesText = this.add.text(10, 130, 'Resources: Iron Ore: 0', {
      fontSize: '16px',
      color: '#fff',
      backgroundColor: '#000'
    });
    this.resourcesText.setScrollFactor(0); // Fix to camera

    // Initialize debug UI
    this.debugUI = new DebugUI(this, this.inputManager);
    
    // Add save/load UI text
    this.saveLoadText = this.add.text(10, this.game.canvas.height - 100, 
      'Press Z to save map\nPress X to load map\nPress N for new map', { 
      fontSize: '14px', 
      color: '#fff',
      backgroundColor: '#000'
    });
    this.saveLoadText.setScrollFactor(0);
    
    if (this.input.keyboard) {
      this.input.keyboard.on('keydown-Z', () => {
        this.saveCurrentMap();
      });
      
      this.input.keyboard.on('keydown-X', () => {
        this.loadSavedMap();
      });
      
      this.input.keyboard.on('keydown-N', () => {
        this.generateNewMap();
      });
    } else {
      console.error('Keyboard input not available');
    }
  }
  
  // Save the current map to localStorage
  private saveCurrentMap(): void {
    if (!this.currentMapData) {
      this.currentMapData = MapStorage.createEmptyMap();
    }
    
    // Update map data with current terrain
    this.currentMapData.terrainGrid = this.mapData;
    this.currentMapData.generationParameters = terrainExperiments.getParams();
    
    // Save buildings
    this.currentMapData.buildings = this._serializeBuildings();
    
    const success = MapStorage.saveMap(this.currentMapData);
    const message = success ? 'Map saved successfully!' : 'Failed to save map!';
    // Show result to user
    this.showTemporaryMessage(message);
  }
  
  // Load saved map from localStorage
  private loadSavedMap(): void {
    if (!MapStorage.hasSavedMap()) {
      this.showTemporaryMessage('No saved map found!');
      return;
    }
    const loadedMap = MapStorage.loadMap();
    if (!loadedMap) {
      this.showTemporaryMessage('Failed to load saved map!');
      return;
    }
    
    this.currentMapData = loadedMap;
    this.mapData = loadedMap.terrainGrid;
    this.renderTerrainTiles();
    
    // Load buildings
    this._deserializeBuildings(loadedMap.buildings || []);
    
    this.showTemporaryMessage('Map loaded successfully!');
  }
  
  /**
   * Serializes all buildings in the ECS world to BuildingData objects
   * @returns Array of BuildingData objects
   */
  private _serializeBuildings(): BuildingData[] {
    const buildings = productionBuildingQuery(this.world);
    
    return buildings.map(entity => ({
      type: Building.type[entity],
      gridX: Building.gridX[entity],
      gridY: Building.gridY[entity]
    }));
  }
  
  /**
   * Creates building entities from BuildingData objects
   * @param buildings Array of BuildingData objects
   */
  private _deserializeBuildings(buildings: BuildingData[]): void {
    // Remove all existing buildings first
    const existingBuildings = productionBuildingQuery(this.world);
    for (let i = 0; i < existingBuildings.length; i++) {
      removeEntity(this.world, existingBuildings[i]);
    }
    
    // Create new buildings from data
    buildings.forEach(building => {
      addBuilding(this.world, building.type, building.gridX, building.gridY);
    });
  }
  
  private generateNewMap(): void {
    const params = terrainExperiments.getParams();
    params.noiseSeed = Math.random() * 1000;
    
    this.generateTerrain(params);
    this.renderTerrainTiles();
    this.showTemporaryMessage('Generated new map!');
  }
  
  private showTemporaryMessage(message: string): void {
    const messageText = this.add.text(this.cameras.main.centerX, 100, message, {
      fontSize: '18px',
      backgroundColor: '#000',
      color: '#fff',
      padding: { x: 10, y: 5 }
    });
    messageText.setOrigin(0.5);
    messageText.setScrollFactor(0); // Fix to camera
    messageText.setDepth(100); // Ensure it's on top
    
    // Fade out and destroy after delay
    this.tweens.add({
      targets: messageText,
      alpha: 0,
      duration: 2000,
      ease: 'Power2',
      onComplete: () => {
        messageText.destroy();
      }
    });
  }

  // Generate terrain using Perlin noise
  generateTerrain(params: TerrainParams): void {
    // Get parameters from passed object or use defaults
    const {
      noiseSeed = Math.random() * 1000,
      noiseScale = 0.1, // Scale for noise (ranges from 0 to 1)
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
    const mapData = Array(GRID.MAP_HEIGHT).fill(0).map(() => Array(GRID.MAP_WIDTH).fill(TerrainType.GRASS));
    
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
    
    // Set depth to ensure it renders behind other objects
    this.terrainLayer.setDepth(-1);
  }

  update(): void {
    // Calculate delta time in seconds
    const deltaTime = this.game.loop.delta / 1000;
    
    // Create terrain provider for the movement system
    const terrainProvider = {
      getTerrainAt: this._getTerrainTypeAt.bind(this),
      isValidPosition: this.isValidPosition.bind(this)
    };
    
    // Run ECS systems
    playerInputSystem(this.world, this.inputManager);
    movementSystem(this.world, deltaTime, terrainProvider);
    buildingProductionSystem(this.world, deltaTime, terrainProvider);
    
    // Get current player position from ECS
    const playerX = Position.x[this.playerEntity];
    const playerY = Position.y[this.playerEntity];
    
    // Sync Phaser object position with ECS
    this.player.x = playerX;
    this.player.y = playerY;
    
    // Calculate current grid position
    const gridX = Math.floor(playerX / GRID.SIZE);
    const gridY = Math.floor(playerY / GRID.SIZE);
    
    // Update UI
    this.positionText.setText(`Position: ${gridX},${gridY}`);
    this._updateTerrainInfo(gridX, gridY);
    this._updateResourcesDisplay();
    this._handleAdditionalInput(gridX, gridY);
    
    // Update building sprites
    this._updateBuildingSprites();

    // Update debug UI
    this.debugUI.update();
  }
  
  /**
   * Handle additional input actions like interact and inventory
   */
  private _handleAdditionalInput(gridX: number, gridY: number): void {
    if (this.inputManager.wasActionJustPressed(InputAction.INTERACT)) {
      // For now, log interaction attempt
      console.log(`Attempting to interact at grid position ${gridX},${gridY}`);
    }

    if (this.inputManager.wasActionJustPressed(InputAction.TOGGLE_INVENTORY)) {
      // For now, log inventory toggle
      console.log('Toggling inventory');
    }
  }

  // Update the resources display with current player resources
  private _updateResourcesDisplay(): void {
    const resources = getPlayerResources(this.world);
    this.resourcesText.setText(`Resources: Iron Ore: ${resources.ironOre}`);
  }
  
  private _updateTerrainInfo(gridX: number, gridY: number): void {
    let terrainType = this._getTerrainTypeAt(gridX, gridY);
    let terrainName = "Unknown";
    
    switch (terrainType) {
      case TerrainType.WATER:
        terrainName = "Water";
        break;
      case TerrainType.SAND:
        terrainName = "Sand";
        break;
      case TerrainType.GRASS:
        terrainName = "Grass";
        break;
      case TerrainType.MOUNTAIN:
        terrainName = "Mountain";
        break;
      case TerrainType.IRON_ORE:
        terrainName = "Iron Ore";
        break;
    }

    this.terrainText.setText(`Terrain: ${terrainName}`);
  }
  
  private _getTerrainTypeAt(gridX: number, gridY: number): TerrainType {
    // Check if position is within map bounds
    if (gridX >= 0 && gridX < GRID.MAP_WIDTH && gridY >= 0 && gridY < GRID.MAP_HEIGHT) {
      return this.mapData[gridY][gridX];
    }
    return TerrainType.GRASS; // Default
  }
  
  // Check if grid pos is within bounds and not impassable (water/mountain)
  private isValidPosition(gridX: number, gridY: number): boolean {
    // Check bounds
    if (gridX < 0 || gridX >= GRID.MAP_WIDTH || gridY < 0 || gridY >= GRID.MAP_HEIGHT) {
      return false;
    }
    
    const terrainType = this.mapData[gridY][gridX];
    return terrainType !== TerrainType.WATER && terrainType !== TerrainType.MOUNTAIN;
  }
  
  /**
   * Updates all building sprite positions and visibility based on ECS state
   */
  private _updateBuildingSprites(): void {
    // Get all buildings from ECS
    const buildings = productionBuildingQuery(this.world);
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
            // Assuming mining drill is at frame 5 in the tileset
            frame = 5;
            break;
          default:
            frame = 5; // Default frame
        }
        
        sprite = this.add.sprite(pixelX, pixelY, 'terrain_tiles', frame);
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
   * Places a building at the specified grid coordinates
   * @param gridX Grid X position
   * @param gridY Grid Y position
   * @param type Type of building to place
   * @returns True if building was placed successfully, false otherwise
   */
  public placeBuilding(gridX: number, gridY: number, type: BuildingType): boolean {
    // Check if position is valid for building
    if (!this.isValidBuildPosition(gridX, gridY)) {
      return false;
    }
    
    // Add building to ECS world
    const entityId = addBuilding(this.world, type, gridX, gridY);
    return entityId !== -1;
  }
  
  /**
   * Removes a building at the specified grid coordinates
   * @param gridX Grid X position
   * @param gridY Grid Y position
   * @returns True if a building was removed, false otherwise
   */
  public removeBuilding(gridX: number, gridY: number): boolean {
    return removeBuilding(this.world, gridX, gridY);
  }
  
  /**
   * Checks if a position is valid for building placement
   * @param gridX Grid X position
   * @param gridY Grid Y position
   * @returns True if position is valid for building, false otherwise
   */
  private isValidBuildPosition(gridX: number, gridY: number): boolean {
    // Check if position is passable
    if (!this.isValidPosition(gridX, gridY)) {
      return false;
    }
    
    // Check if there's already a building here
    if (getBuildingAt(this.world, gridX, gridY) !== -1) {
      return false;
    }
    
    // For mining drills, check if they're on correct resource
    const terrainType = this._getTerrainTypeAt(gridX, gridY);
    
    // Mining drills should only be placed on iron ore
    return terrainType === TerrainType.IRON_ORE;
  }
}
