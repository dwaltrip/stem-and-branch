/**
 * Terrain Experiments Module
 * 
 * This module contains tools and utilities for experimenting with 
 * terrain generation parameters in development mode.
 * 
 * Usage:
 * 1. Include this file in your HTML after perlin.js and before app.js
 * 2. In your create() function, initialize with:
 *    const params = window.terrainExperiments.init(this, { initialParams });
 * 3. Generate terrain with:
 *    generateTerrain.call(this, params);
 * 
 * Controls added:
 * - R: Regenerate map with a new random seed
 * - Q/E: Decrease/increase noise scale
 * - 1/2: Decrease/increase octaves
 */

// Terrain generation parameters (initialized from app.js)
let params = {
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

// Reference to game scene for regeneration
let gameScene = null;

// Initialize the experiments module
function initExperiments(scene, initialParams = {}) {
    // Store reference to the game scene
    gameScene = scene;
    
    // Initialize parameters
    params = { ...params, ...initialParams };
    
    // Set up UI for parameter display
    setupUI(scene);
    
    // Set up keyboard controls
    setupControls(scene);
    
    return params;
}

// Set up the UI for displaying parameters
function setupUI(scene) {
    // Add noise parameters text
    scene.noiseText = scene.add.text(10, scene.game.config.height - 70, 
        getParamsDisplay(), { 
        fontSize: '12px', 
        fill: '#fff',
        backgroundColor: '#000'
    });
    scene.noiseText.setScrollFactor(0); // Fix to camera
    
    // Add help text
    scene.helpText = scene.add.text(10, 70, 
        'Controls: Arrow Keys to move, R to regenerate map\n' + 
        'Q/E to decrease/increase noise scale, 1/2 to decrease/increase octaves', { 
        fontSize: '14px', 
        fill: '#fff',
        backgroundColor: '#000'
    });
    scene.helpText.setScrollFactor(0); // Fix to camera
}

// Set up keyboard controls for adjusting parameters
function setupControls(scene) {
    // Add keys for map controls
    scene.input.keyboard.on('keydown-R', () => {
        console.log('Regenerating map...');
        // Generate new seed
        params.noiseSeed = Math.random() * 1000;
        // Trigger regeneration
        regenerateTerrain(scene);
    });
    
    // Keys to adjust noise scale
    scene.input.keyboard.on('keydown-Q', () => {
        params.noiseScale = Math.max(0.01, params.noiseScale - 0.01);
        regenerateTerrain(scene);
    });
    
    scene.input.keyboard.on('keydown-E', () => {
        params.noiseScale = params.noiseScale + 0.01;
        regenerateTerrain(scene);
    });
    
    // Keys to adjust octaves
    scene.input.keyboard.on('keydown-ONE', () => {
        params.noiseOctaves = Math.max(1, params.noiseOctaves - 1);
        regenerateTerrain(scene);
    });
    
    scene.input.keyboard.on('keydown-TWO', () => {
        params.noiseOctaves = params.noiseOctaves + 1;
        regenerateTerrain(scene);
    });
}

// Helper function to create parameter display string
function getParamsDisplay() {
    return `Noise Settings: Scale=${params.noiseScale.toFixed(3)}, ` +
           `Octaves=${params.noiseOctaves}, ` + 
           `Seed=${params.noiseSeed.toFixed(2)}`;
}

// Trigger terrain regeneration and UI update
function regenerateTerrain(scene) {
    // Call the external regenerate functions (defined in app.js)
    if (typeof window.generateTerrain === 'function' && typeof window.renderTerrain === 'function') {
        window.generateTerrain.call(scene, params);
        window.renderTerrain.call(scene);
        
        // Update the display
        scene.noiseText.setText(getParamsDisplay());
    } else {
        console.error('Terrain generation functions not available');
    }
}

/**
 * Generate a new terrain with current parameters
 */
function generateNewTerrain(scene) {
    regenerateTerrain(scene);
    return params;
}

// Export the module
window.terrainExperiments = {
    init: initExperiments,
    getParams: () => params,
    regenerate: regenerateTerrain,
    generateNew: generateNewTerrain
};
