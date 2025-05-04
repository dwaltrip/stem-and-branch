import Phaser from 'phaser';
import { terrainExperiments } from '../utils/TerrainExperiments';
import { PerlinNoise } from '../utils/PerlinNoise';
import { TerrainParams, TerrainType, TERRAIN_COLORS } from '../utils/TerrainTypes';
import { GRID, PLAYER } from '../GameConstants';
import { InputManager, InputAction } from '../utils/InputManager';
import { DebugUI } from '../utils/DebugUI';

export class MainScene extends Phaser.Scene {

  // Game objects
  private player!: Phaser.Physics.Arcade.Sprite;
  private positionText!: Phaser.GameObjects.Text;
  private terrainText!: Phaser.GameObjects.Text;
  private inputManager!: InputManager;
  private debugUI!: DebugUI;

  // Map data
  private mapData: TerrainType[][] = [];
  
  // TileMap objects
  private map!: Phaser.Tilemaps.Tilemap;
  private tileset!: Phaser.Tilemaps.Tileset;
  private terrainLayer!: Phaser.Tilemaps.TilemapLayer;

  constructor() {
    super({ key: 'MainScene' });
  }

  preload(): void {
    // Load tileset for terrain
    this.load.image('terrain_tiles', 'assets/sprites/terrain_tileset.png');
    
    // Create a simple player rectangle
    const playerSize = Math.floor(GRID.SIZE / 3);
    const playerGraphics = this.make.graphics({ x: 0, y: 0 });
    playerGraphics.fillStyle(0xff0000); // Red color
    playerGraphics.fillRect(0, 0, playerSize, playerSize);
    playerGraphics.generateTexture('player', playerSize, playerSize);
  }

  create(): void {
    // Initialize terrain experiments with default parameters
    const terrainParams = terrainExperiments.init(
      this,
      {
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
      },
      this.generateTerrain.bind(this),
      this.renderTerrain.bind(this)
    );
    
    // Create a blank tilemap
    this.map = this.make.tilemap({
      tileWidth: GRID.SIZE,
      tileHeight: GRID.SIZE,
      width: GRID.MAP_WIDTH,
      height: GRID.MAP_HEIGHT
    });
    
    // Add the tileset image we preloaded
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
    
    // Generate terrain using Perlin noise
    this.generateTerrain(terrainParams);
    
    // Render the terrain tiles using the tilemap
    this.renderTerrain();
    
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
    
    // Set up input manager with default bindings
    this.inputManager = new InputManager(this);
    
    // Add text to display position
    this.positionText = this.add.text(10, 10, 'Position: 0,0', { 
      fontSize: '16px', 
      color: '#fff',
      backgroundColor: '#000'
    });
    this.positionText.setScrollFactor(0); // Fix to camera
    
    // Add terrain info text
    this.terrainText = this.add.text(10, 40, 'Terrain: Grass', { 
      fontSize: '16px', 
      color: '#fff',
      backgroundColor: '#000'
    });
    this.terrainText.setScrollFactor(0); // Fix to camera
    
    // Initialize debug UI
    this.debugUI = new DebugUI(this, this.inputManager);
  }

  /**
   * Generate terrain using Perlin noise
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
    
    // Initialize Perlin noise generator with seed
    const perlin = new PerlinNoise(noiseSeed);
    
    // Initialize the map data array
    this.mapData = Array(GRID.MAP_HEIGHT).fill(0).map(() => Array(GRID.MAP_WIDTH).fill(TerrainType.GRASS));
    
    // Generate terrain using Perlin noise
    for (let y = 0; y < GRID.MAP_HEIGHT; y++) {
      for (let x = 0; x < GRID.MAP_WIDTH; x++) {
        // Get noise value at this coordinate (scaled and normalized to 0-1)
        const nx = x * noiseScale;
        const ny = y * noiseScale;
        const noiseValue = perlin.normalized(nx, ny, noiseOctaves, noisePersistence);
        
        // Determine terrain type based on noise value
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
        
        // Store terrain type in map data
        this.mapData[y][x] = terrainType;
      }
    }
  }

  /**
   * Render terrain tiles based on map data using TileMap
   */
  renderTerrain(): void {
    // Skip if tilemap components are not initialized
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
    
    // Fill the tilemap with the terrain data
    for (let y = 0; y < GRID.MAP_HEIGHT; y++) {
      for (let x = 0; x < GRID.MAP_WIDTH; x++) {
        const terrainType = this.mapData[y][x];
        const tileIndex = typeToTileIndex[terrainType];
        
        // Place the appropriate tile
        this.terrainLayer.putTileAt(tileIndex, x, y);
      }
    }
    
    // Set depth to ensure it renders behind other objects
    this.terrainLayer.setDepth(-1);
  }

  update(): void {
    // Reset player velocity
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
    
    // Handle player movement with the input manager
    let speed = PLAYER.BASE_SPEED;
    
    // Adjust speed based on terrain (slower in sand)
    if (terrainType === TerrainType.SAND) {
      speed = PLAYER.BASE_SPEED * PLAYER.SAND_SPEED_MULTIPLIER; // Slower in sand
    }
    
    // Get movement vector from input manager
    const movement = this.inputManager.getMovementVector();
    
    // Calculate potential next positions
    let nextX = gridX;
    let nextY = gridY;
    let velocityX = 0;
    let velocityY = 0;
    
    // Calculate horizontal movement
    if (movement.x !== 0) {
      const moveDirection = movement.x;
      nextX = Math.floor((this.player.x + moveDirection * speed * this.game.loop.delta / 1000) / GRID.SIZE);
      velocityX = moveDirection * speed;
    }
    
    // Calculate vertical movement
    if (movement.y !== 0) {
      const moveDirection = movement.y;
      nextY = Math.floor((this.player.y + moveDirection * speed * this.game.loop.delta / 1000) / GRID.SIZE);
      velocityY = moveDirection * speed;
    }
    
    // Check if next position is valid (within bounds and not water/mountain)
    const canMoveX = this.isValidPosition(nextX, gridY);
    const canMoveY = this.isValidPosition(gridX, nextY);
    
    // Apply movement if valid
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
  
  /**
   * Checks if a position is valid for player movement
   * @param gridX X coordinate in grid cells
   * @param gridY Y coordinate in grid cells
   * @returns Whether the position is valid (within bounds and not water/mountain)
   */
  private isValidPosition(gridX: number, gridY: number): boolean {
    // Check bounds
    if (gridX < 0 || gridX >= GRID.MAP_WIDTH || gridY < 0 || gridY >= GRID.MAP_HEIGHT) {
      return false;
    }
    
    // Check terrain type
    const terrainType = this.mapData[gridY][gridX];
    
    // Cannot move into water or mountains
    return terrainType !== TerrainType.WATER && terrainType !== TerrainType.MOUNTAIN;
  }
}
