// Game configuration
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    pixelArt: true,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

// Initialize the game with our configuration
const game = new Phaser.Game(config);

// Grid configuration
const GRID_SIZE = 32; // Size of each grid cell in pixels
const MAP_WIDTH = 50; // Width of the map in grid cells
const MAP_HEIGHT = 50; // Height of the map in grid cells

// Terrain generation configuration
const TERRAIN_TYPES = {
    WATER: 0,
    SAND: 1,
    GRASS: 2,
    MOUNTAIN: 3
};

// Map data
let mapData = [];
let terrainTiles = [];

// Make generate and render functions globally available for terrain experiments
window.generateTerrain = generateTerrain;
window.renderTerrain = renderTerrain;

// Preload game assets
function preload() {
    // We don't need to preload images for terrain since we'll use solid colors
    
    // Create a player sprite
    this.load.setBaseURL('./assets/');
    
    // Example of loading sprites (you'll need to add these files to your assets folder)
    // this.load.image('player', 'sprites/player.png');
    
    // Create a simple player rectangle
    const playerGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    playerGraphics.fillStyle(0xff0000); // Red color
    playerGraphics.fillRect(0, 0, GRID_SIZE, GRID_SIZE);
    playerGraphics.generateTexture('player', GRID_SIZE, GRID_SIZE);
}

// Set up the game world
function create() {
    // Initialize terrain experiments with default parameters
    const terrainParams = window.terrainExperiments.init(this, {
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
    });
    
    // Generate terrain using Perlin noise
    generateTerrain.call(this, terrainParams);
    
    // Render the terrain tiles
    renderTerrain.call(this);
    
    // Create a grid overlay for debugging (semi-transparent)
    this.add.grid(
        0, 
        0,
        MAP_WIDTH * GRID_SIZE, 
        MAP_HEIGHT * GRID_SIZE,
        GRID_SIZE, 
        GRID_SIZE,
        0x000000, 
        0, 
        0x000000, 
        0.1
    ).setOrigin(0, 0);

    // Create player
    this.player = this.physics.add.sprite(
        MAP_WIDTH * GRID_SIZE / 2, 
        MAP_HEIGHT * GRID_SIZE / 2, 
        'player'
    );
    
    // Set world bounds based on map size
    this.physics.world.bounds.width = MAP_WIDTH * GRID_SIZE;
    this.physics.world.bounds.height = MAP_HEIGHT * GRID_SIZE;
    this.player.setCollideWorldBounds(true);
    
    // Set up camera to follow player
    this.cameras.main.setBounds(0, 0, MAP_WIDTH * GRID_SIZE, MAP_HEIGHT * GRID_SIZE);
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

// Generate terrain using Perlin noise
function generateTerrain(params) {
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
    mapData = Array(MAP_HEIGHT).fill().map(() => Array(MAP_WIDTH).fill(0));
    
    // Generate terrain using Perlin noise
    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            // Get noise value at this coordinate (scaled and normalized to 0-1)
            const nx = x * noiseScale;
            const ny = y * noiseScale;
            const noiseValue = perlin.normalized(nx, ny, noiseOctaves, noisePersistence);
            
            // Determine terrain type based on noise value
            let terrainType;
            if (noiseValue < terrainThresholds.WATER) {
                terrainType = TERRAIN_TYPES.WATER;
            } else if (noiseValue < terrainThresholds.SAND) {
                terrainType = TERRAIN_TYPES.SAND;
            } else if (noiseValue < terrainThresholds.GRASS) {
                terrainType = TERRAIN_TYPES.GRASS;
            } else {
                terrainType = TERRAIN_TYPES.MOUNTAIN;
            }
            
            // Store terrain type in map data
            mapData[y][x] = terrainType;
        }
    }
}

// Render terrain tiles based on map data
function renderTerrain() {
    // Clear any existing terrain tiles
    terrainTiles.forEach(tile => tile.destroy());
    terrainTiles = [];
    
    // Create a container for all terrain tiles for better performance
    const terrainContainer = this.add.container(0, 0);
    
    // Define terrain colors
    const terrainColors = {
        [TERRAIN_TYPES.WATER]: 0x1a75ff,    // Bright blue
        [TERRAIN_TYPES.SAND]: 0xffd700,     // Gold/yellow
        [TERRAIN_TYPES.GRASS]: 0x32cd32,    // Lime green
        [TERRAIN_TYPES.MOUNTAIN]: 0x696969  // Dim gray
    };
    
    // Create a terrain layer
    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            const terrainType = mapData[y][x];
            const color = terrainColors[terrainType];
            
            // Create a rectangle with the appropriate color
            const tile = this.add.rectangle(
                x * GRID_SIZE + GRID_SIZE / 2,
                y * GRID_SIZE + GRID_SIZE / 2,
                GRID_SIZE,
                GRID_SIZE,
                color
            );
            
            // Add to container and store reference
            terrainContainer.add(tile);
            terrainTiles.push(tile);
        }
    }
    
    // Set container to back of display list so it renders behind other objects
    terrainContainer.setDepth(-1);
}

// Game loop
function update() {
    // Reset player velocity
    this.player.setVelocity(0);
    
    // Calculate grid position
    const gridX = Math.floor(this.player.x / GRID_SIZE);
    const gridY = Math.floor(this.player.y / GRID_SIZE);
    
    // Get current terrain type at player's position
    let terrainType = TERRAIN_TYPES.GRASS; // Default
    let terrainName = "Unknown";
    
    // Check if player is within map bounds
    if (gridX >= 0 && gridX < MAP_WIDTH && gridY >= 0 && gridY < MAP_HEIGHT) {
        terrainType = mapData[gridY][gridX];
        
        // Set terrain name based on type
        switch (terrainType) {
            case TERRAIN_TYPES.WATER:
                terrainName = "Water";
                break;
            case TERRAIN_TYPES.SAND:
                terrainName = "Sand";
                break;
            case TERRAIN_TYPES.GRASS:
                terrainName = "Grass";
                break;
            case TERRAIN_TYPES.MOUNTAIN:
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
    if (terrainType === TERRAIN_TYPES.WATER) {
        speed = baseSpeed * 0.5; // Slower in water
    } else if (terrainType === TERRAIN_TYPES.SAND) {
        speed = baseSpeed * 0.7; // Slower in sand
    } else if (terrainType === TERRAIN_TYPES.MOUNTAIN) {
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

// Add event listeners for window resizing
window.addEventListener('resize', () => {
    if (game) {
        // Adjust the game size to fit the window
        const width = window.innerWidth;
        const height = window.innerHeight;
        game.scale.resize(width, height);
    }
});
