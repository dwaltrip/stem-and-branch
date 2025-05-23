import Phaser from 'phaser';
import { GRID } from '../GameConstants';
import { InputManager, InputAction } from '../input/InputManager';
import { MapStorage, MapData, BuildingData } from '../world/MapStorage';
import { setMainSceneInstance } from '../../utils/DevTools';
import { TerrainType } from '../terrain/TerrainTypes';
import { WorldRenderer } from '../world/WorldRenderer';
import { getAssetPath } from '../config/GameConfig';
import { GameUI } from '../ui/GameUI';

import { world as ecsWorld, createPlayerEntity } from '../ecs/world';
import { movementSystem, processMovementIntents } from '../ecs/systems/movementSystem';
import { getPlayerResources } from '../ecs/systems/resourceSystem';
import { removeEntity } from 'bitecs';
import { Position, BuildingType, Building } from '../ecs/components/components';
import { 
  addBuilding, 
  removeBuilding, 
  getBuildingAt,
  productionBuildingQuery,
  buildingProductionSystem,
  processBuildIntents,
  processRemoveIntents
} from '../ecs/systems/buildingSystem';
import { intentSystem, cleanupIntents } from '../ecs/systems/intentSystem';

export class MainScene extends Phaser.Scene {
  // Game objects
  private player!: Phaser.Physics.Arcade.Sprite;
  
  // Core systems
  private inputManager!: InputManager;
  private worldRenderer!: WorldRenderer;
  private gameUI!: GameUI;
  
  // ECS properties
  private world = ecsWorld;
  private playerEntity: number = -1;

  // Map data
  private currentMapData: MapData | null = null;
  
  constructor() {
    super({ key: 'MainScene' });
  }

  preload(): void {
    // Load terrain tileset as a spritesheet with proper frame size
    this.load.spritesheet('terrain_tiles', 
      getAssetPath('TERRAIN_TILESHEET'),
      { 
        frameWidth: GRID.SIZE, 
        frameHeight: GRID.SIZE 
      }
    );
    
    // Load building tileset (same file for now, will split later)
    this.load.spritesheet('building_tiles', 
      getAssetPath('BUILDING_TILESHEET'),
      { 
        frameWidth: GRID.SIZE, 
        frameHeight: GRID.SIZE 
      }
    );
    
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
    
    // Initialize subsystems
    this.worldRenderer = new WorldRenderer(this);
    this.worldRenderer.initialize();
    
    this.inputManager = new InputManager(this);
    this.gameUI = new GameUI(this, this.inputManager);
    
    // Load or generate map
    this.initializeWorld();
    
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
    
    // Set up save/load handlers
    this.gameUI.setupSaveLoadHandlers(
      this.saveCurrentMap.bind(this),
      this.loadSavedMap.bind(this),
      this.generateNewMap.bind(this)
    );
  }
  
  private initializeWorld(): void {
    // Check if we have a saved map first
    if (MapStorage.hasSavedMap()) {
      // Show loading indicator for saved map
      this.gameUI.showTemporaryMessage('Loading saved map...');
      
      const savedMap = MapStorage.loadMap();
      if (savedMap) {
        this.currentMapData = savedMap;
        
        // Initialize terrain experiments with saved parameters (no controls)
        const terrainParams = {
          ...savedMap.generationParameters,
          noiseSeed: savedMap.seed
        };
        this.worldRenderer.initTerrainExperiments(terrainParams, false);
        
        // Load the saved terrain data
        this.worldRenderer.loadMapData(savedMap.terrainGrid);
        
        // Load buildings
        this._deserializeBuildings(savedMap.buildings || []);
        
        console.log('Loaded saved map');
        return;
      }
    }
    
    // No saved map found, generate new terrain
    this.gameUI.showTemporaryMessage('Generating new map...');
    
    const defaultParams = {
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
    
    this.currentMapData = MapStorage.createEmptyMap();
    
    // Initialize terrain experiments with controls enabled for new terrain
    this.worldRenderer.initTerrainExperiments(defaultParams, true);
    this.worldRenderer.generateTerrain(defaultParams);
    this.worldRenderer.renderTerrainTiles();
    
    console.log('Generated new map');
  }

  // Save the current map to localStorage
  private saveCurrentMap(): void {
    if (!this.currentMapData) {
      this.currentMapData = MapStorage.createEmptyMap();
    }
    
    // Update map data with current terrain
    this.currentMapData.terrainGrid = this.worldRenderer.getMapData();
    this.currentMapData.generationParameters = this.worldRenderer.terrainExperiments.getParams();
    
    // Save buildings
    this.currentMapData.buildings = this._serializeBuildings();
    
    const success = MapStorage.saveMap(this.currentMapData);
    const message = success ? 'Map saved successfully!' : 'Failed to save map!';
    
    // Show result to user
    this.gameUI.showTemporaryMessage(message);
  }
  
  // Load saved map from localStorage
  private loadSavedMap(): void {
    if (!MapStorage.hasSavedMap()) {
      this.gameUI.showTemporaryMessage('No saved map found!');
      return;
    }
    
    const loadedMap = MapStorage.loadMap();
    if (!loadedMap) {
      this.gameUI.showTemporaryMessage('Failed to load saved map!');
      return;
    }
    
    this.currentMapData = loadedMap;
    this.worldRenderer.loadMapData(loadedMap.terrainGrid);
    
    // Load buildings
    this._deserializeBuildings(loadedMap.buildings || []);
    
    this.gameUI.showTemporaryMessage('Map loaded successfully!');
  }
  
  private _serializeBuildings(): BuildingData[] {
    const buildings = productionBuildingQuery(this.world);
    
    return buildings.map(entity => ({
      type: Building.type[entity],
      gridX: Building.gridX[entity],
      gridY: Building.gridY[entity]
    }));
  }
  
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
    const terrainExperiments = this.worldRenderer.terrainExperiments;
    const params = terrainExperiments.getParams();
    params.noiseSeed = Math.random() * 1000;
    
    this.worldRenderer.generateTerrain(params);
    this.worldRenderer.renderTerrainTiles();
    this.gameUI.showTemporaryMessage('Generated new map!');
  }

  update(): void {
    // Calculate delta time in seconds
    const deltaTime = this.game.loop.delta / 1000;
    
    // Create terrain provider for the systems
    const terrainProvider = {
      getTerrainAt: this.worldRenderer.getTerrainTypeAt.bind(this.worldRenderer),
      isValidPosition: this.worldRenderer.isValidPosition.bind(this.worldRenderer),
      isValidBuildPosition: this.worldRenderer.isValidBuildPosition.bind(this.worldRenderer)
    };
    
    // Run ECS systems
    
    // STEP 1: Process input and create intents
    intentSystem(this.world, this.inputManager);
    
    // STEP 2: Process intents and update game state
    processMovementIntents(this.world);
    processBuildIntents(this.world, terrainProvider);
    processRemoveIntents(this.world);
    
    // STEP 3: Run regular systems
    movementSystem(this.world, deltaTime, terrainProvider);
    buildingProductionSystem(this.world, deltaTime, terrainProvider);
    
    // STEP 4: Cleanup one-time intents
    cleanupIntents(this.world);
    
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
    this.gameUI.updatePositionDisplay(gridX, gridY);
    this.gameUI.updateTerrainInfo(this.worldRenderer.getTerrainTypeAt(gridX, gridY));
    this.gameUI.updateResourcesDisplay(getPlayerResources(this.world));
    
    // Update building sprites
    this.worldRenderer.updateBuildingSprites(this.world);
    
    // Update debug UI
    this.gameUI.updateDebugUI();
  }
  
  /**
   * Places a building at the specified grid coordinates
   * This method is now primarily used by DevTools and other external systems
   */
  public placeBuilding(gridX: number, gridY: number, type: BuildingType): boolean {
    // Check if position is valid for building
    if (!this.worldRenderer.isValidBuildPosition(this.world, gridX, gridY, type)) {
      return false;
    }
    
    // Add building to ECS world
    const entityId = addBuilding(this.world, type, gridX, gridY);
    return entityId !== -1;
  }
  
  /**
   * Removes a building at the specified grid coordinates
   * This method is now primarily used by DevTools and other external systems
   */
  public removeBuilding(gridX: number, gridY: number): boolean {
    return removeBuilding(this.world, gridX, gridY);
  }
}