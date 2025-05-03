import Phaser from 'phaser';
import { terrainExperiments } from '../utils/TerrainExperiments';
import { PerlinNoise } from '../utils/PerlinNoise';
import { TerrainParams, TerrainType, TERRAIN_COLORS } from '../utils/TerrainTypes';

export class MainScene extends Phaser.Scene {
  // Grid configuration
  private readonly GRID_SIZE: number = 32; // Size of each grid cell in pixels
  private readonly MAP_WIDTH: number = 50; // Width of the map in grid cells
  private readonly MAP_HEIGHT: number = 50; // Height of the map in grid cells

  // Game objects
  private player!: Phaser.Physics.Arcade.Sprite;
  private positionText!: Phaser.GameObjects.Text;
  private terrainText!: Phaser.GameObjects.Text;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

  // Map data
  private mapData: TerrainType[][] = [];
  private terrainTiles: Phaser.GameObjects.Rectangle[] = [];

  constructor() {
    super({ key: 'MainScene' });
  }

  preload(): void {
    // We don't need to preload images for terrain since we'll use solid colors
    
    // Create a simple player rectangle
    const playerGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    playerGraphics.fillStyle(0xff0000); // Red color
    playerGraphics.fillRect(0, 0, this.GRID_SIZE, this.GRID_SIZE);
    playerGraphics.generateTexture('player', this.GRID_SIZE, this.GRID_SIZE);
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
      this.MAP_WIDTH * this.GRID_SIZE, 
      this.MAP_HEIGHT * this.GRID_SIZE,
      this.GRID_SIZE, 
      this.GRID_SIZE,
      0x000000, 
      0, 
      0x000000, 
      0.1
    ).setOrigin(0, 0);

    // Create player
    this.player = this.physics.add.sprite(
      this.MAP_WIDTH * this.GRID_SIZE / 2, 
      this.MAP_HEIGHT * this.GRID_SIZE / 2, 
      'player'
    );
    
    // Set world bounds based on map size
    this.physics.world.bounds.width = this.MAP_WIDTH * this.GRID_SIZE;
    this.physics.world.bounds.height = this.MAP_HEIGHT * this.GRID_SIZE;
    this.player.setCollideWorldBounds(true);
    
    // Set up camera to follow player
    this.cameras.main.setBounds(0, 0, this.MAP_WIDTH * this.GRID_SIZE, this.MAP_HEIGHT * this.GRID_SIZE);
    this.cameras.main.startFollow(this.player);
    
    // Set up keyboard input
    this.cursors = this.input.keyboard.createCursorKeys();
    
    // Add text to display position
    this.positionText = this.add.text(10, 10, 'Position: 0,0', { 
      fontSize: '16px', 
      fill: '#fff',
      backgroundColor: '#000'
    });
    this.positionText.setScrollFactor(0); // Fix to camera
    
    // Add terrain info text
    this.terrainText = this.add.text(10, 40, 'Terrain: Grass', { 
      fontSize: '16px', 
      fill: '#fff',
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
    this.mapData = Array(this.MAP_HEIGHT).fill(0).map(() => Array(this.MAP_WIDTH).fill(TerrainType.GRASS));
    
    // Generate terrain using Perlin noise
    for (let y = 0; y < this.MAP_HEIGHT; y++) {
      for (let x = 0; x < this.MAP_WIDTH; x++) {
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
    for (let y = 0; y < this.MAP_HEIGHT; y++) {
      for (let x = 0; x < this.MAP_WIDTH; x++) {
        const terrainType = this.mapData[y][x];
        const color = TERRAIN_COLORS[terrainType];
        
        // Create a rectangle with the appropriate color
        const tile = this.add.rectangle(
          x * this.GRID_SIZE + this.GRID_SIZE / 2,
          y * this.GRID_SIZE + this.GRID_SIZE / 2,
          this.GRID_SIZE,
          this.GRID_SIZE,
          color
        );
        
        // Add to container and store reference
        terrainContainer.add(tile);
        this.terrainTiles.push(tile);
      }
    }
    
    // Set container to back of display list so it renders behind other objects
    terrainContainer.setDepth(-1);
  }

  update(): void {
    // Reset player velocity
    this.player.setVelocity(0);
    
    // Calculate grid position
    const gridX = Math.floor(this.player.x / this.GRID_SIZE);
    const gridY = Math.floor(this.player.y / this.GRID_SIZE);
    
    // Get current terrain type at player's position
    let terrainType: TerrainType = TerrainType.GRASS; // Default
    let terrainName = "Unknown";
    
    // Check if player is within map bounds
    if (gridX >= 0 && gridX < this.MAP_WIDTH && gridY >= 0 && gridY < this.MAP_HEIGHT) {
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
    const baseSpeed = 200;
    let speed = baseSpeed;
    
    // Adjust speed based on terrain (slower in water/sand, can't move on mountains)
    if (terrainType === TerrainType.WATER) {
      speed = baseSpeed * 0.5; // Slower in water
    } else if (terrainType === TerrainType.SAND) {
      speed = baseSpeed * 0.7; // Slower in sand
    } else if (terrainType === TerrainType.MOUNTAIN) {
      speed = 0; // Can't move on mountains
    }
    
    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-speed);
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(speed);
    }
    
    if (this.cursors.up.isDown) {
      this.player.setVelocityY(-speed);
    } else if (this.cursors.down.isDown) {
      this.player.setVelocityY(speed);
    }
    
    // Update position text
    this.positionText.setText(`Position: ${gridX},${gridY}`);
  }
}