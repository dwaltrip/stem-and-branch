import { Scene } from 'phaser';
import { TerrainParams, TerrainThresholds } from './TerrainTypes';

/**
 * Terrain Experiments Module
 * 
 * This module contains tools and utilities for experimenting with 
 * terrain generation parameters in development mode.
 */
export class TerrainExperiments {
  private params: TerrainParams = {
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

  private gameScene: Scene | null = null;
  private generateTerrainFn: ((params: TerrainParams) => void) | null = null;
  private renderTerrainFn: (() => void) | null = null;

  public init(
    scene: Scene, 
    initialParams: Partial<TerrainParams> = {},
    generateFn: (params: TerrainParams) => void,
    renderFn: () => void
  ): TerrainParams {
    this.gameScene = scene;
    this.generateTerrainFn = generateFn;
    this.renderTerrainFn = renderFn;
    
    // Initialize parameters
    this.params = { ...this.params, ...initialParams };
    this.setupUI(scene);
    this.setupControls(scene);
    return this.params;
  }

  private setupUI(scene: Scene): void {
    // Add noise parameters text
    const noiseText = scene.add.text(10, scene.game.canvas.height - 70, 
        this.getParamsDisplay(), { 
        fontSize: '12px', 
        color: '#fff',
        backgroundColor: '#000'
    });
    noiseText.setScrollFactor(0); // Fix to camera
    
    // Add help text
    const helpText = scene.add.text(10, 70, 
        'Controls: Arrow Keys/WASD to move, R to regenerate map\n' + 
        'Q/E to decrease/increase noise scale, 1/2 to decrease/increase octaves\n' +
        'Z to save map, X to load map, N to generate new map', { 
        fontSize: '14px', 
        color: '#fff',
        backgroundColor: '#000'
    });
    helpText.setScrollFactor(0); // Fix to camera

    // Store references in the scene for later updates
    (scene as any).noiseText = noiseText;
    (scene as any).helpText = helpText;
  }

  // Set up keyboard controls for adjusting parameters
  private setupControls(scene: Scene): void {
    if (!scene.input || !scene.input.keyboard) {
      console.error('Keyboard input not available');
      return;
    }
    
    // Generate a new map
    scene.input.keyboard.on('keydown-R', () => {
      console.log('Regenerating map...');
      this.params.noiseSeed = Math.random() * 1000;
      this.regenerateTerrain();
    });
    
    // Keys to adjust noise scale
    scene.input.keyboard.on('keydown-Q', () => {
      this.params.noiseScale = Math.max(0.01, this.params.noiseScale - 0.01);
      this.regenerateTerrain();
    });
    scene.input.keyboard.on('keydown-E', () => {
      this.params.noiseScale = this.params.noiseScale + 0.01;
      this.regenerateTerrain();
    });
    
    // Keys to adjust octaves
    scene.input.keyboard.on('keydown-ONE', () => {
      this.params.noiseOctaves = Math.max(1, this.params.noiseOctaves - 1);
      this.regenerateTerrain();
    });
    scene.input.keyboard.on('keydown-TWO', () => {
      this.params.noiseOctaves = this.params.noiseOctaves + 1;
      this.regenerateTerrain();
    });
  }

  private getParamsDisplay(): string {
    return `Noise Settings: Scale=${this.params.noiseScale.toFixed(3)}, ` +
           `Octaves=${this.params.noiseOctaves}, ` + 
           `Seed=${this.params.noiseSeed.toFixed(2)}`;
  }

  public regenerateTerrain(): void {
    if (!this.gameScene || !this.generateTerrainFn || !this.renderTerrainFn) {
      console.error('Scene or terrain functions not available');
      return;
    }
    
    this.generateTerrainFn(this.params);
    this.renderTerrainFn();
    
    // Update the UI
    const noiseText = (this.gameScene as any).noiseText;
    if (noiseText) {
      noiseText.setText(this.getParamsDisplay());
    }
  }

  public getParams(): TerrainParams {
    return this.params;
  }

  public generateNew(): TerrainParams {
    this.regenerateTerrain();
    return this.params;
  }
}

export const terrainExperiments = new TerrainExperiments();
