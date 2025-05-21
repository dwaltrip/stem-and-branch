/**
 * Utility to split a 2x2 tilesheet into individual tiles
 * Run with: node tools/split-tilesheet.js <input-file> [options]
 * 
 * Options:
 *   --size=<size>: Target tile size in pixels (default: 32)
 *   --output=<dir>: Output directory (default: art-ideas/tilesheets)
 *   --prefix=<prefix>: Prefix for output files (default: tile)
 *   --help: Show help
 */

const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

// Parse command line arguments
function parseArgs() {
  const args = {
    inputFile: '',
    tileSize: 32,
    outputDir: path.join(__dirname, '../art-ideas/tilesheets'),
    prefix: 'tile',
    help: false
  };

  // Get the input file (first non-option argument)
  const nonOptionArgs = process.argv.slice(2).filter(arg => !arg.startsWith('--'));
  if (nonOptionArgs.length > 0) {
    args.inputFile = nonOptionArgs[0];
  }

  // Parse options
  process.argv.slice(2).forEach(arg => {
    if (arg.startsWith('--size=')) {
      args.tileSize = parseInt(arg.split('=')[1]);
    } else if (arg.startsWith('--output=')) {
      args.outputDir = arg.split('=')[1];
    } else if (arg.startsWith('--prefix=')) {
      args.prefix = arg.split('=')[1];
    } else if (arg === '--help') {
      args.help = true;
    }
  });

  return args;
}

// Show help text
function showHelp() {
  console.log(`
Split a 2x2 tilesheet into individual tile images.

Usage: node tools/split-tilesheet.js <input-file> [options]

Arguments:
  <input-file>         Path to the 2x2 tilesheet image to split

Options:
  --size=<size>        Target tile size in pixels (default: 32)
  --output=<dir>       Output directory (default: art-ideas/tilesheets)
  --prefix=<prefix>    Prefix for output files (default: tile)
  --help               Show this help message

Examples:
  node tools/split-tilesheet.js art-ideas/tilesheets/my-tilesheet.png
  node tools/split-tilesheet.js art-ideas/tilesheets/my-tilesheet.png --size=64 --prefix=terrain
  `);
}

// Split the tilesheet into individual tiles
async function splitTilesheet(args) {
  try {
    console.log(`Splitting tilesheet: ${args.inputFile}`);
    
    // Load the source image
    const image = await loadImage(args.inputFile);
    console.log(`Loaded image: ${image.width}x${image.height} pixels`);
    
    // Check if it's roughly a 2x2 grid (allow some flexibility for borders, etc.)
    const isSquareish = Math.abs(image.width - image.height) < Math.min(image.width, image.height) * 0.2;
    if (!isSquareish) {
      console.warn('Warning: Input image is not square. Results may not be as expected.');
    }
    
    // Determine source tile size (half of the input dimensions)
    const sourceTileWidth = Math.floor(image.width / 2);
    const sourceTileHeight = Math.floor(image.height / 2);
    
    // Create output directory if it doesn't exist
    if (!fs.existsSync(args.outputDir)) {
      fs.mkdirSync(args.outputDir, { recursive: true });
    }
    
    // Extract and save each tile
    const positions = [
      { name: 'top-left', x: 0, y: 0 },
      { name: 'top-right', x: sourceTileWidth, y: 0 },
      { name: 'bottom-left', x: 0, y: sourceTileHeight },
      { name: 'bottom-right', x: sourceTileWidth, y: sourceTileHeight }
    ];
    
    const outputPaths = [];
    for (const pos of positions) {
      // Create a canvas for this tile
      const canvas = createCanvas(args.tileSize, args.tileSize);
      const ctx = canvas.getContext('2d');
      
      // try out no image smoothing for our pixel art style
      ctx.imageSmoothingEnabled = false;

      // Draw the tile portion, scaling to the target size
      ctx.drawImage(
        image,
        pos.x, pos.y, sourceTileWidth, sourceTileHeight,
        0, 0, args.tileSize, args.tileSize
      );
      
      // Save the tile
      const outputFileName = `${args.prefix}-${pos.name}.png`;
      const outputPath = path.join(args.outputDir, outputFileName);
      const buffer = canvas.toBuffer('image/png');
      fs.writeFileSync(outputPath, buffer);
      
      console.log(`Created tile: ${outputFileName}`);
      outputPaths.push(outputPath);
    }
    
    console.log('\nSuccessfully split tilesheet into 4 tiles:');
    outputPaths.forEach(p => console.log(`- ${p}`));
    
    return outputPaths;
  } catch (err) {
    console.error('Error splitting tilesheet:', err);
    process.exit(1);
  }
}

// Main function
async function main() {
  // Parse command line arguments
  const args = parseArgs();
  
  // Show help if requested or if no input file provided
  if (args.help || !args.inputFile) {
    showHelp();
    if (!args.inputFile && !args.help) {
      console.error('\nError: No input file provided.');
      process.exit(1);
    }
    return;
  }
  
  // Ensure input file exists
  if (!fs.existsSync(args.inputFile)) {
    console.error(`Error: Input file not found: ${args.inputFile}`);
    process.exit(1);
  }
  
  // Split the tilesheet
  await splitTilesheet(args);
}

// Execute the main function
main();
