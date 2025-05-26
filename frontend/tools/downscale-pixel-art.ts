import { createCanvas, loadImage } from 'canvas';
import { program } from 'commander';
import * as fs from 'fs';

interface ScaleOptions {
  inputPath: string;
  outputPath: string;
  targetWidth: number;
  targetHeight: number;
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
 * Scale a pixel art image
 */
async function scaleImage(options: ScaleOptions): Promise<void> {
  const { inputPath, outputPath, targetWidth, targetHeight } = options;

  // Validate input file exists
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Input file not found: ${inputPath}`);
  }

  // Check if output file exists
  if (fs.existsSync(outputPath)) {
    throw new Error(`Output file already exists: ${outputPath}`);
  }

  // Validate dimensions
  if (targetWidth <= 0 || targetHeight <= 0) {
    throw new Error('Width and height must be positive numbers');
  }

  try {
    // Load source image
    const sourceImage = await loadImage(inputPath);
    
    // Get source pixel data
    const sourceCanvas = createCanvas(sourceImage.width, sourceImage.height);
    const sourceCtx = sourceCanvas.getContext('2d');
    sourceCtx.drawImage(sourceImage, 0, 0);
    const sourceImageData = sourceCtx.getImageData(0, 0, sourceImage.width, sourceImage.height);
    
    // Scale pixels
    const scaledPixels = scalePixels(
      sourceImageData.data,
      sourceImage.width,
      sourceImage.height,
      targetWidth,
      targetHeight
    );
    
    // Create output image
    const targetCanvas = createCanvas(targetWidth, targetHeight);
    const targetCtx = targetCanvas.getContext('2d');
    const targetImageData = targetCtx.createImageData(targetWidth, targetHeight);
    targetImageData.data.set(scaledPixels);
    targetCtx.putImageData(targetImageData, 0, 0);
    
    // Save result
    const outputBuffer = targetCanvas.toBuffer('image/png');
    await fs.promises.writeFile(outputPath, outputBuffer);
    
    console.log(`Scaled ${inputPath} to ${targetWidth}x${targetHeight} → ${outputPath}`);
    
  } catch (error) {
    throw new Error(`Failed to process ${inputPath}: ${error.message}`);
  }
}

// CLI setup
program
  .name('scale')
  .description('Scale pixel art images using nearest neighbor sampling')
  .arguments('<input> <output>')
  .option('-w, --width <number>', 'target width', '32')
  .option('-h, --height <number>', 'target height', '32')
  .action(async (input: string, output: string, options: any) => {
    try {
      const width = parseInt(options.width);
      const height = parseInt(options.height);
      
      if (isNaN(width) || isNaN(height)) {
        throw new Error('Width and height must be valid numbers');
      }
      
      await scaleImage({
        inputPath: input,
        outputPath: output,
        targetWidth: width,
        targetHeight: height
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
export { scaleImage };
