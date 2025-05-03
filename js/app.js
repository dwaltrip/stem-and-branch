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

// Terrain thresholds (adjust these to get different terrain distributions)
const TERRAIN_THRESHOLDS = {
    WATER: 0.3,    // 0.0 - 0.3 = Water
    SAND: 0.4,     // 0.3 - 0.4 = Sand
    GRASS: 0.8,    // 0.4 - 0.8 = Grass
    MOUNTAIN: 1.0  // 0.8 - 1.0 = Mountain
};

// Noise configuration
const NOISE_SCALE = 0.1; // Controls how zoomed in/out the noise is
const NOISE_OCTAVES = 4; // Number of layers of noise
const NOISE_PERSISTENCE = 0.5; // How much each layer contributes
let NOISE_SEED = Math.random() * 1000; // Random seed for reproducible maps

// Map data
let mapData = [];
let terrainTiles = [];

// Preload game assets
function preload() {
    // Load player avatar and terrain tiles
    this.load.setBaseURL('./assets/');
    
    // Example of loading sprites (you'll need to add these files to your assets folder)
    // this.load.image('player', 'sprites/player.png');
    
    // Placeholder colored rectangles for development
    this.load.image('player', 'https://via.placeholder.com/32/ff0000');
    
    // Terrain tiles (using placeholder colors for now)
    this.load.image('water', 'https://via.placeholder.com/32/0077be');
    this.load.image('sand', 'https://via.placeholder.com/32/f0e68c');
    this.load.image('grass', 'https://via.placeholder.com/32/228b22');
    this.load.image('mountain', 'https://via.placeholder.com/32/808080');
}

// Set up the game world
function create() {
    // Generate terrain using Perlin noise
    generateTerrain.call(this);
    
    // Render the terrain tiles
    renderTerrain.call(this);
    
    // Add keys for map controls
    this.input.keyboard.on('keydown-R', () => {
        console.log('Regenerating map...');
        // Generate new seed
        NOISE_SEED = Math.random() * 1000;
        // Regenerate and render terrain
        generateTerrain.call(this);
        renderTerrain.call(this);
        // Update noise text
        this.noiseText.setText(
            `Noise Settings: Scale=${NOISE_SCALE.toFixed(3)}, Octaves=${NOISE_OCTAVES}, Seed=${NOISE_SEED.toFixed(2)}`
        );
    });
    
    // Keys to adjust noise scale
    this.input.keyboard.on('keydown-Q', () => {
        NOISE_SCALE = Math.max(0.01, NOISE_SCALE - 0.01);
        generateTerrain.call(this);
        renderTerrain.call(this);
        this.noiseText.setText(
            `Noise Settings: Scale=${NOISE_SCALE.toFixed(3)}, Octaves=${NOISE_OCTAVES}, Seed=${NOISE_SEED.toFixed(2)}`
        );
    });
    
    this.input.keyboard.on('keydown-E', () => {
        NOISE_SCALE = NOISE_SCALE + 0.01;
        generateTerrain.call(this);
        renderTerrain.call(this);
        this.noiseText.setText(
            `Noise Settings: Scale=${NOISE_SCALE.toFixed(3)}, Octaves=${NOISE_OCTAVES}, Seed=${NOISE_SEED.toFixed(2)}`
        );
    });
    
    // Keys to adjust octaves
    this.input.keyboard.on('keydown-ONE', () => {
        NOISE_OCTAVES = Math.max(1, NOISE_OCTAVES - 1);
        generateTerrain.call(this);
        renderTerrain.call(this);
        this.noiseText.setText(
            `Noise Settings: Scale=${NOISE_SCALE.toFixed(3)}, Octaves=${NOISE_OCTAVES}, Seed=${NOISE_SEED.toFixed(2)}`
        );
    });
    
    this.input.keyboard.on('keydown-TWO', () => {
        NOISE_OCTAVES = NOISE_OCTAVES + 1;
        generateTerrain.call(this);
        renderTerrain.call(this);
        this.noiseText.setText(
            `Noise Settings: Scale=${NOISE_SCALE.toFixed(3)}, Octaves=${NOISE_OCTAVES}, Seed=${NOISE_SEED.toFixed(2)}`
        );
    });
    
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
    
    // Add help text
    this.helpText = this.add.text(10, 70, 
        'Controls: Arrow Keys to move, R to regenerate map\n' + 
        'Q/E to decrease/increase noise scale, 1/2 to decrease/increase octaves', { 
        fontSize: '14px', 
        fill: '#fff',
        backgroundColor: '#000'
    });
    this.helpText.setScrollFactor(0); // Fix to camera
    
    // Add noise parameters text
    this.noiseText = this.add.text(10, config.height - 70, 
        `Noise Settings: Scale=${NOISE_SCALE}, Octaves=${NOISE_OCTAVES}, Seed=${NOISE_SEED.toFixed(2)}`, { 
        fontSize: '12px', 
        fill: '#fff',
        backgroundColor: '#000'
    });
    this.noiseText.setScrollFactor(0); // Fix to camera
}

// Generate terrain using Perlin noise
function generateTerrain() {
    // Initialize Perlin noise generator with seed
    const perlin = new PerlinNoise(NOISE_SEED);
    
    // Initialize the map data array
    mapData = Array(MAP_HEIGHT).fill().map(() => Array(MAP_WIDTH).fill(0));
    
    // Generate terrain using Perlin noise
    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            // Get noise value at this coordinate (scaled and normalized to 0-1)
            const nx = x * NOISE_SCALE;
            const ny = y * NOISE_SCALE;
            const noiseValue = perlin.normalized(nx, ny, NOISE_OCTAVES, NOISE_PERSISTENCE);
            
            // Determine terrain type based on noise value
            let terrainType;
            if (noiseValue < TERRAIN_THRESHOLDS.WATER) {
                terrainType = TERRAIN_TYPES.WATER;
            } else if (noiseValue < TERRAIN_THRESHOLDS.SAND) {
                terrainType = TERRAIN_TYPES.SAND;
            } else if (noiseValue < TERRAIN_THRESHOLDS.GRASS) {
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
    
    // Create a terrain layer
    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            const terrainType = mapData[y][x];
            let terrainKey;
            
            // Map terrain type to sprite key
            switch (terrainType) {
                case TERRAIN_TYPES.WATER:
                    terrainKey = 'water';
                    break;
                case TERRAIN_TYPES.SAND:
                    terrainKey = 'sand';
                    break;
                case TERRAIN_TYPES.GRASS:
                    terrainKey = 'grass';
                    break;
                case TERRAIN_TYPES.MOUNTAIN:
                    terrainKey = 'mountain';
                    break;
            }
            
            // Create tile sprite and position it on the grid
            const tile = this.add.sprite(
                x * GRID_SIZE + GRID_SIZE / 2,
                y * GRID_SIZE + GRID_SIZE / 2,
                terrainKey
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
