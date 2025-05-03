import Phaser from 'phaser';
import { terrainExperiments } from '../utils/TerrainExperiments';
import { PerlinNoise } from '../utils/PerlinNoise';
import { TerrainParams, TerrainType, TERRAIN_COLORS } from '../utils/TerrainTypes';
import { GRID, PLAYER } from '../GameConstants';

export class MainScene extends Phaser.Scene {

  // Game objects
  private player!: Phaser.Physics.Arcade.Sprite;
  private positionText!: Phaser.GameObjects.Text;
  private terrainText!: Phaser.GameObjects.Text;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };

  // Map data
  private mapData: TerrainType[][] = [];
  private terrainTiles: Phaser.GameObjects.Rectangle[] = [];

  constructor() {
    super({ key: 'MainScene' });
  }

  preload(): void {
    // We don't need to preload images for terrain since we'll use solid colors
    
    // Create a simple player rectangle
    const playerGraphics = this.make.graphics({ x: 0, y: 0 });
    playerGraphics.fillStyle(0xff0000); // Red color
    playerGraphics.fillRect(0, 0, GRID.SIZE, GRID.SIZE);
    playerGraphics.generateTexture('player', GRID.SIZE, GRID.SIZE);
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
    
    // Generate terrain using Perlin noise
    this.generateTerrain(terrainParams);
    
    // Render the terrain tiles
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
    
    // Set up keyboard input
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      
      // Set up WASD keys
      this.wasdKeys = {
        W: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        A: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        S: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        D: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
      };
    } else {
      console.error('Keyboard input not available');
      // Create dummy objects to prevent null references
      this.cursors = {
        up: { isDown: false } as Phaser.Input.Keyboard.Key,
        down: { isDown: false } as Phaser.Input.Keyboard.Key,
        left: { isDown: false } as Phaser.Input.Keyboard.Key,
        right: { isDown: false } as Phaser.Input.Keyboard.Key,
        space: { isDown: false } as Phaser.Input.Keyboard.Key,
        shift: { isDown: false } as Phaser.Input.Keyboard.Key
      };
      
      this.wasdKeys = {
        W: { isDown: false } as Phaser.Input.Keyboard.Key,
        A: { isDown: false } as Phaser.Input.Keyboard.Key,
        S: { isDown: false } as Phaser.Input.Keyboard.Key,
        D: { isDown: false } as Phaser.Input.Keyboard.Key
      };
    }
    
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
   * Render terrain tiles based on map data
   */
  renderTerrain(): void {
    // Clear any existing terrain tiles
    this.terrainTiles.forEach(tile => tile.destroy());
    this.terrainTiles = [];
    
    // Create a container for all terrain tiles for better performance
    const terrainContainer = this.add.container(0, 0);
    
    // Create a terrain layer
    for (let y = 0; y < GRID.MAP_HEIGHT; y++) {
      for (let x = 0; x < GRID.MAP_WIDTH; x++) {
        const terrainType = this.mapData[y][x];
        const color = TERRAIN_COLORS[terrainType];
        
        // Create a rectangle with the appropriate color
        const tile = this.add.rectangle(
          x * GRID.SIZE + GRID.SIZE / 2,
          y * GRID.SIZE + GRID.SIZE / 2,
          GRID.SIZE,
          GRID.SIZE,
          color
        );
        
        // Add to container and store reference
        if (terrainContainer) {
          terrainContainer.add(tile);
        }
        this.terrainTiles.push(tile);
      }
    }
    
    // Set container to back of display list so it renders behind other objects
    if (terrainContainer) {
      terrainContainer.setDepth(-1);
    }
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
    
    // Handle player movement with the keyboard
    let speed = PLAYER.BASE_SPEED;
    
    // Adjust speed based on terrain (slower in sand)
    if (terrainType === TerrainType.SAND) {
      speed = PLAYER.BASE_SPEED * PLAYER.SAND_SPEED_MULTIPLIER; // Slower in sand
    }
    
    // Calculate potential next positions
    let nextX = gridX;
    let nextY = gridY;
    let velocityX = 0;
    let velocityY = 0;
    
    // Horizontal movement with arrow keys or A/D
    if (this.cursors.left.isDown || this.wasdKeys.A.isDown) {
      nextX = Math.floor((this.player.x - speed * this.game.loop.delta / 1000) / GRID.SIZE);
      velocityX = -speed;
    } else if (this.cursors.right.isDown || this.wasdKeys.D.isDown) {
      nextX = Math.floor((this.player.x + speed * this.game.loop.delta / 1000) / GRID.SIZE);
      velocityX = speed;
    }
    
    // Vertical movement with arrow keys or W/S
    if (this.cursors.up.isDown || this.wasdKeys.W.isDown) {
      nextY = Math.floor((this.player.y - speed * this.game.loop.delta / 1000) / GRID.SIZE);
      velocityY = -speed;
    } else if (this.cursors.down.isDown || this.wasdKeys.S.isDown) {
      nextY = Math.floor((this.player.y + speed * this.game.loop.delta / 1000) / GRID.SIZE);
      velocityY = speed;
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
    
    // Update position text
    this.positionText.setText(`Position: ${gridX},${gridY}`);
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