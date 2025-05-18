/**
 * Utility to create a tilesheet from individual tile images
 * Run with: node tools/create-tilesheet-from-images.js [prefix]
 * 
 * Arguments:
 *   prefix: Optional - Only include files starting with this prefix
 */

const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

// Configuration
const TILE_SIZE = 32;
const SOURCE_DIR = path.join(__dirname, '../art-ideas/tilesheets');
const OUTPUT_DIR = path.join(__dirname, '../assets/sprites');
const OUTPUT_FILENAME = 'custom_terrain_tileset.png';

// Get prefix from command line args if provided
const PREFIX = process.argv[2] || '';

// Function to get PNG files from a directory, optionally filtered by prefix
function getPngFilesFromDirectory(dir, prefix = '') {
  return fs.readdirSync(dir)
    .filter(file => {
      return file.endsWith('.png') && 
             !file.includes('sources/') && 
             file.startsWith(prefix);
    })
    .sort();
}

// Function to draw an image with center cropping for non-square images
function drawImageCenteredAndCropped(ctx, image, destX, destY, destWidth, destHeight) {
  // Determine the source dimensions and positions for cropping
  const sourceSize = Math.min(image.width, image.height);
  const sourceX = (image.width - sourceSize) / 2;  // Center horizontally
  const sourceY = (image.height - sourceSize) / 2; // Center vertically
  
  // Draw the cropped and scaled image
  ctx.drawImage(
    image,
    sourceX, sourceY, sourceSize, sourceSize, // Source rectangle (centered crop)
    destX, destY, destWidth, destHeight        // Destination rectangle
  );
}

// Create the tilesheet
async function createTilesheet(prefix) {
  console.log(`Creating tilesheet${prefix ? ` with prefix filter: "${prefix}"` : ''}`);
  
  // Get PNG files, potentially filtered by prefix
  const pngFiles = getPngFilesFromDirectory(SOURCE_DIR, prefix);
  
  if (pngFiles.length === 0) {
    console.error(`No PNG files found${prefix ? ` with prefix "${prefix}"` : ''}`);
    process.exit(1);
  }

  console.log(`Found ${pngFiles.length} PNG files to include in tilesheet`);

  // Calculate dimensions for the tilesheet
  // We'll use a square or nearly-square layout
  const tilesPerRow = Math.ceil(Math.sqrt(pngFiles.length));
  const rows = Math.ceil(pngFiles.length / tilesPerRow);

  console.log(`Creating a tilesheet with ${tilesPerRow} columns and ${rows} rows`);

  // Create a canvas with the appropriate dimensions
  const canvas = createCanvas(tilesPerRow * TILE_SIZE, rows * TILE_SIZE);
  const ctx = canvas.getContext('2d');

  // Fill with a transparent background
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Load and draw each image
  for (let i = 0; i < pngFiles.length; i++) {
    const row = Math.floor(i / tilesPerRow);
    const col = i % tilesPerRow;
    const x = col * TILE_SIZE;
    const y = row * TILE_SIZE;
    
    try {
      const fileName = pngFiles[i];
      const filePath = path.join(SOURCE_DIR, fileName);
      const image = await loadImage(filePath);
      
      // Draw the image using our center crop function
      drawImageCenteredAndCropped(ctx, image, x, y, TILE_SIZE, TILE_SIZE);
      
      console.log(`Added ${fileName} at position (${col}, ${row})`);
    } catch (error) {
      console.error(`Error loading image ${pngFiles[i]}:`, error);
    }
  }

  // Create a tilesheet mapping for easy reference
  const tileMapping = pngFiles.map((file, index) => {
    const row = Math.floor(index / tilesPerRow);
    const col = index % tilesPerRow;
    return {
      name: file.replace('.png', ''),
      index: index,
      position: { row, col },
      x: col * TILE_SIZE,
      y: row * TILE_SIZE
    };
  });

  // Generate output filename with prefix if provided
  const finalOutputFilename = prefix 
    ? `${prefix}_terrain_tileset.png`
    : OUTPUT_FILENAME;

  // Save the tilesheet
  const buffer = canvas.toBuffer('image/png');
  
  // Create output directory if it doesn't exist
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  const outputPath = path.join(OUTPUT_DIR, finalOutputFilename);
  fs.writeFileSync(outputPath, buffer);
  console.log(`Tilesheet saved to ${outputPath}`);

  // Save the tile mapping as JSON for reference
  const mappingBasename = prefix 
    ? `${prefix}_tile_mapping.json`
    : 'tile_mapping.json';
    
  const mappingPath = path.join(OUTPUT_DIR, mappingBasename);
  fs.writeFileSync(mappingPath, JSON.stringify(tileMapping, null, 2));
  console.log(`Tile mapping saved to ${mappingPath}`);

  // Print out index-to-tile mapping for easy reference
  console.log('\nTile Mapping:');
  console.table(tileMapping.map(tile => ({ 
    name: tile.name,
    index: tile.index
  })));
}

// Execute the function with the optional prefix
createTilesheet(PREFIX).catch(err => {
  console.error('Error creating tilesheet:', err);
});