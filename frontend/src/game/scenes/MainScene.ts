import Phaser from 'phaser';
import { terrainExperiments } from '../terrain/TerrainExperiments';
import { PerlinNoise } from '../../utils/PerlinNoise';
import { TerrainParams, TerrainType, TERRAIN_COLORS } from '../terrain/TerrainTypes';
import { GRID, PLAYER } from '../GameConstants';
import { InputManager, InputAction } from '../input/InputManager';
import { DebugUI } from '../ui/DebugUI';
import { MapStorage, MapData } from '../world/MapStorage';

export class MainScene extends Phaser.Scene {

  // Game objects
  private player!: Phaser.Physics.Arcade.Sprite;
  private positionText!: Phaser.GameObjects.Text;
  private terrainText!: Phaser.GameObjects.Text;
  private inputManager!: InputManager;
  private debugUI!: DebugUI;
  private saveLoadText!: Phaser.GameObjects.Text;

  // Map data
  private mapData: TerrainType[][] = [];
  private currentMapData: MapData | null = null;
  
  // TileMap objects
  private map!: Phaser.Tilemaps.Tilemap;
  private tileset!: Phaser.Tilemaps.Tileset;
  private terrainLayer!: Phaser.Tilemaps.TilemapLayer;

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
    this.showTemporaryMessage('Map loaded successfully!');
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
    
    this.mapData = Array(GRID.MAP_HEIGHT).fill(0).map(() => Array(GRID.MAP_WIDTH).fill(TerrainType.GRASS));
    
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
          terrainType = TerrainType.GRASS;
        } else {
          terrainType = TerrainType.MOUNTAIN;
        }
        
        this.mapData[y][x] = terrainType;
      }
    }
  }

  renderTerrainTiles(): void {
    if (!this.terrainLayer || !this.tileset) {
      console.error('Tilemap components not initialized');
      return;
    }
    
    // Map TerrainType to tilemap indices
    // Our tileset has 4 tiles in a 2x2 grid:
    // 0: Water (top-left), 1: Sand (top-right),
    // 2: Grass (bottom-left), 3: Mountain (bottom-right)
    const typeToTileIndex = {
      [TerrainType.WATER]: 0,
      [TerrainType.SAND]: 1,
      [TerrainType.GRASS]: 2,
      [TerrainType.MOUNTAIN]: 3
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
    this.player.setVelocity(0);
    
    // Calculate current grid position
    const gridX = Math.floor(this.player.x / GRID.SIZE);
    const gridY = Math.floor(this.player.y / GRID.SIZE);
    
    // Get current terrain type at player's position
    let terrainType: TerrainType = TerrainType.GRASS; // Default
    let terrainName = "Unknown";
    
    // Check if player is within map bounds
    if (gridX >= 0 && gridX < GRID.MAP_WIDTH && gridY >= 0 && gridY < GRID.MAP_HEIGHT) {
      terrainType = this.mapData[gridY][gridX];
      
      // Set terrain name based on type
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
      }
    }
    
    // Update terrain text
    this.terrainText.setText(`Terrain: ${terrainName}`);
    
    let speed = PLAYER.BASE_SPEED;
    if (terrainType === TerrainType.SAND) {
      speed = PLAYER.BASE_SPEED * PLAYER.SAND_SPEED_MULTIPLIER; // Slower in sand
    }
    
    const movement = this.inputManager.getMovementVector();
    
    // Calculate potential next positions
    let nextX = gridX;
    let nextY = gridY;
    let velocityX = 0;
    let velocityY = 0;
    
    if (movement.x !== 0) {
      const moveDirection = movement.x;
      nextX = Math.floor((this.player.x + moveDirection * speed * this.game.loop.delta / 1000) / GRID.SIZE);
      velocityX = moveDirection * speed;
    }
    if (movement.y !== 0) {
      const moveDirection = movement.y;
      nextY = Math.floor((this.player.y + moveDirection * speed * this.game.loop.delta / 1000) / GRID.SIZE);
      velocityY = moveDirection * speed;
    }
    
    // Check if next position is valid (within bounds and not water/mountain)
    const canMoveX = this.isValidPosition(nextX, gridY);
    const canMoveY = this.isValidPosition(gridX, nextY);
    
    if (canMoveX) {
      this.player.setVelocityX(velocityX);
    }
    if (canMoveY) {
      this.player.setVelocityY(velocityY);
    }
    
    // Handle additional input actions
    if (this.inputManager.wasActionJustPressed(InputAction.INTERACT)) {
      // For now, log interaction attempt
      console.log(`Attempting to interact at grid position ${gridX},${gridY}`);
    }
    
    if (this.inputManager.wasActionJustPressed(InputAction.TOGGLE_INVENTORY)) {
      // For now, log inventory toggle
      console.log('Toggling inventory');
    }
    
    // Update position text
    this.positionText.setText(`Position: ${gridX},${gridY}`);
    
    // Update debug UI
    this.debugUI.update();
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
}
