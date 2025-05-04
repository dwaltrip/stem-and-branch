/**
 * A simple and efficient Perlin noise implementation for browser use
 */
export class PerlinNoise {
  private seed: number;
  private perm: Uint8Array;
  private gradP: number[][];

  constructor(seed: number = Math.random()) {
    this.seed = seed;
    
    // Initialize permutation table
    this.perm = new Uint8Array(512);
    this.gradP = new Array(512);
    
    this._initGrad(seed);
  }
  
  private _initGrad(seed: number): void {
    // Generate a random permutation table with seed
    const random = this._seededRandom(seed);
    
    // Fill the permutation table with values 0-255
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) {
      p[i] = i;
    }
    
    // Shuffle using Fisher-Yates
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [p[i], p[j]] = [p[j], p[i]];
    }
    
    // Duplicate to avoid buffer overruns
    for (let i = 0; i < 512; i++) {
      this.perm[i] = p[i & 255];
      
      // Pre-compute gradients
      const grad3 = [
        [1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0],
        [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
        [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1]
      ];
      
      this.gradP[i] = grad3[this.perm[i] % 12];
    }
  }
  
  private _seededRandom(seed: number): () => number {
    const m = 0x80000000; // 2**31
    const a = 1103515245;
    const c = 12345;
    let state = seed ? seed : Math.floor(Math.random() * m);
    
    return function() {
      state = (a * state + c) % m;
      return state / m;
    };
  }
  
  // Fade function for smoother interpolation
  private _fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }
  
  // Linear interpolation
  private _lerp(a: number, b: number, t: number): number {
    return (1 - t) * a + t * b;
  }
  
  // 2D dot product
  private _dot(g: number[], x: number, y: number): number {
    return g[0] * x + g[1] * y;
  }
  
  // 2D Perlin noise
  public noise(x: number, y: number): number {
    // Find unit grid cell containing point
    let X = Math.floor(x) & 255;
    let Y = Math.floor(y) & 255;
    
    // Get relative xy coordinates of point within cell
    x -= Math.floor(x);
    y -= Math.floor(y);
    
    // Compute fade curves
    const u = this._fade(x);
    const v = this._fade(y);
    
    // Hash coordinates of the 4 square corners
    const n00 = this._dot(this.gradP[this.perm[X] + this.perm[Y]], x, y);
    const n01 = this._dot(this.gradP[this.perm[X] + this.perm[Y + 1]], x, y - 1);
    const n10 = this._dot(this.gradP[this.perm[X + 1] + this.perm[Y]], x - 1, y);
    const n11 = this._dot(this.gradP[this.perm[X + 1] + this.perm[Y + 1]], x - 1, y - 1);
    
    // Interpolate the 4 results
    const x1 = this._lerp(n00, n10, u);
    const x2 = this._lerp(n01, n11, u);
    
    // Range [-1, 1]
    return this._lerp(x1, x2, v);
  }
  
  // Generate 2D noise at multiple octaves (for more natural looking noise)
  public octaveNoise(x: number, y: number, octaves: number = 4, persistence: number = 0.5): number {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0;
    
    for (let i = 0; i < octaves; i++) {
      total += this.noise(x * frequency, y * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= 2;
    }
    
    // Return in range [-1, 1]
    return total / maxValue;
  }
  
  // Map noise to [0, 1] range
  public normalized(x: number, y: number, octaves: number = 4, persistence: number = 0.5): number {
    return (this.octaveNoise(x, y, octaves, persistence) + 1) * 0.5;
  }
}