// Configuration object for Phaser
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

// Preload game assets
function preload() {
    // Load player avatar
    this.load.setBaseURL('./assets/');
    
    // Example of loading sprites (you'll need to add these files to your assets folder)
    // this.load.image('player', 'sprites/player.png');
    // this.load.image('tile', 'sprites/tile.png');
    // this.load.image('factory', 'sprites/factory.png');
    
    // Placeholder colored rectangles for development
    this.load.image('player', 'https://via.placeholder.com/32/ff0000');
    this.load.image('tile', 'https://via.placeholder.com/32/00ff00');
    this.load.image('factory', 'https://via.placeholder.com/32/0000ff');
}

// Set up the game world
function create() {
    // Create a simple grid background
    this.add.grid(
        config.width / 2, 
        config.height / 2,
        config.width, 
        config.height,
        GRID_SIZE, 
        GRID_SIZE,
        0xeeeeee, 
        0, 
        0x333333, 
        0.2
    );

    // Create player
    this.player = this.physics.add.sprite(
        config.width / 2, 
        config.height / 2, 
        'player'
    );
    
    // Set up camera to follow player
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
}

// Game loop
function update() {
    // Reset player velocity
    this.player.setVelocity(0);
    
    // Handle player movement with the keyboard
    const speed = 200;
    
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
    
    // Calculate grid position
    const gridX = Math.floor(this.player.x / GRID_SIZE);
    const gridY = Math.floor(this.player.y / GRID_SIZE);
    
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
