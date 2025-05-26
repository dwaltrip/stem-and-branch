import { createCanvas, loadImage } from 'canvas';
import { program } from 'commander';
import * as fs from 'fs';

interface ScaleOptions {
  inputPath: string;
  outputPath: string;
  targetSize: number; // Changed to single size for square output
}

/**
 * Scales pixel data using nearest neighbor sampling
 */
function scalePixels(
  sourcePixels: Uint8ClampedArray,
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number
): Uint8ClampedArray {
  const targetPixels = new Uint8ClampedArray(targetWidth * targetHeight * 4);
  const scaleX = sourceWidth / targetWidth;
  const scaleY = sourceHeight / targetHeight;

  for (let targetY = 0; targetY < targetHeight; targetY++) {
    for (let targetX = 0; targetX < targetWidth; targetX++) {
      const sourceX = Math.min(Math.floor(targetX * scaleX), sourceWidth - 1);
      const sourceY = Math.min(Math.floor(targetY * scaleY), sourceHeight - 1);
      
      const sourceIndex = (sourceY * sourceWidth + sourceX) * 4;
      const targetIndex = (targetY * targetWidth + targetX) * 4;
      
      // Copy RGBA values
      targetPixels[targetIndex] = sourcePixels[sourceIndex];
      targetPixels[targetIndex + 1] = sourcePixels[sourceIndex + 1]; 
      targetPixels[targetIndex + 2] = sourcePixels[sourceIndex + 2];
      targetPixels[targetIndex + 3] = sourcePixels[sourceIndex + 3];
    }
  }

  return targetPixels;
}

/**
 * Calculate dimensions for scaling while preserving aspect ratio
 */
function calculateScaledDimensions(
  sourceWidth: number,
  sourceHeight: number,
  targetSize: number
): { scaledWidth: number; scaledHeight: number; offsetX: number; offsetY: number } {
  const sourceAspect = sourceWidth / sourceHeight;
  
  let scaledWidth: number;
  let scaledHeight: number;
  
  if (sourceAspect > 1) {
    // Image is wider than tall - fit to width
    scaledWidth = targetSize;
    scaledHeight = Math.round(targetSize / sourceAspect);
  } else {
    // Image is taller than wide or square - fit to height
    scaledHeight = targetSize;
    scaledWidth = Math.round(targetSize * sourceAspect);
  }
  
  // Calculate centering offsets
  const offsetX = Math.floor((targetSize - scaledWidth) / 2);
  const offsetY = Math.floor((targetSize - scaledHeight) / 2);
  
  return { scaledWidth, scaledHeight, offsetX, offsetY };
}

/**
 * Create a square canvas with transparent background and centered scaled image
 */
function createSquareImage(
  scaledPixels: Uint8ClampedArray,
  scaledWidth: number,
  scaledHeight: number,
  targetSize: number,
  offsetX: number,
  offsetY: number
): Uint8ClampedArray {
  const squarePixels = new Uint8ClampedArray(targetSize * targetSize * 4);
  
  // Initialize with transparent pixels (all values 0)
  squarePixels.fill(0);
  
  // Copy scaled image to center of square canvas
  for (let y = 0; y < scaledHeight; y++) {
    for (let x = 0; x < scaledWidth; x++) {
      const sourceIndex = (y * scaledWidth + x) * 4;
      const targetIndex = ((y + offsetY) * targetSize + (x + offsetX)) * 4;
      
      squarePixels[targetIndex] = scaledPixels[sourceIndex];
      squarePixels[targetIndex + 1] = scaledPixels[sourceIndex + 1];
      squarePixels[targetIndex + 2] = scaledPixels[sourceIndex + 2];
      squarePixels[targetIndex + 3] = scaledPixels[sourceIndex + 3];
    }
  }
  
  return squarePixels;
}

/**
 * Scale a pixel art image to a square format with transparent padding
 */
async function scaleImageToSquare(options: ScaleOptions): Promise<void> {
  const { inputPath, outputPath, targetSize } = options;

  // Validate input file exists
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Input file not found: ${inputPath}`);
  }

  // Check if output file exists
  if (fs.existsSync(outputPath)) {
    throw new Error(`Output file already exists: ${outputPath}`);
  }

  // Validate dimensions
  if (targetSize <= 0) {
    throw new Error('Size must be a positive number');
  }

  try {
    // Load source image
    const sourceImage = await loadImage(inputPath);
    
    // Get source pixel data
    const sourceCanvas = createCanvas(sourceImage.width, sourceImage.height);
    const sourceCtx = sourceCanvas.getContext('2d');
    sourceCtx.drawImage(sourceImage, 0, 0);
    const sourceImageData = sourceCtx.getImageData(0, 0, sourceImage.width, sourceImage.height);
    
    // Calculate scaling dimensions
    const { scaledWidth, scaledHeight, offsetX, offsetY } = calculateScaledDimensions(
      sourceImage.width,
      sourceImage.height,
      targetSize
    );
    
    console.log(`Scaling ${sourceImage.width}x${sourceImage.height} to ${scaledWidth}x${scaledHeight}, centered in ${targetSize}x${targetSize}`);
    
    // Scale pixels while preserving aspect ratio
    const scaledPixels = scalePixels(
      sourceImageData.data,
      sourceImage.width,
      sourceImage.height,
      scaledWidth,
      scaledHeight
    );
    
    // Create square image with transparent padding
    const squarePixels = createSquareImage(
      scaledPixels,
      scaledWidth,
      scaledHeight,
      targetSize,
      offsetX,
      offsetY
    );
    
    // Create output image
    const targetCanvas = createCanvas(targetSize, targetSize);
    const targetCtx = targetCanvas.getContext('2d');
    const targetImageData = targetCtx.createImageData(targetSize, targetSize);
    targetImageData.data.set(squarePixels);
    targetCtx.putImageData(targetImageData, 0, 0);
    
    // Save result
    const outputBuffer = targetCanvas.toBuffer('image/png');
    await fs.promises.writeFile(outputPath, outputBuffer);
    
    console.log(`Created square image ${targetSize}x${targetSize} → ${outputPath}`);
    
  } catch (error) {
    throw new Error(`Failed to process ${inputPath}: ${error.message}`);
  }
}

// CLI setup
program
  .name('scale-square')
  .description('Scale pixel art images to square format with transparent padding')
  .arguments('<input> <output>')
  .option('-s, --size <number>', 'target square size', '32')
  .action(async (input: string, output: string, options: any) => {
    try {
      const size = parseInt(options.size);
      
      if (isNaN(size)) {
        throw new Error('Size must be a valid number');
      }
      
      await scaleImageToSquare({
        inputPath: input,
        outputPath: output,
        targetSize: size
      });
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  });

// Show help if no arguments provided
if (process.argv.length === 2) {
  program.help();
}

program.parse();

// Export for use as module
export { scaleImageToSquare };
