/**
 * Utility to create a tilesheet from individual tile images
 * Run with: node tools/create-tilesheet-from-images.js [options]
 * 
 * Options:
 *   --prefix=<prefix>: Only include files starting with this prefix
 *   --interactive: Run in interactive mode to select which images to include
 *   --help: Show help
 */

const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');
const readline = require('readline');

// Configuration
const TILE_SIZE = 32;
const SOURCE_DIR = path.join(__dirname, '../art-ideas/tilesheets');
const OUTPUT_DIR = path.join(__dirname, '../assets/sprites');
const OUTPUT_FILENAME = 'custom_terrain_tileset.png';

// Parse command line arguments
function parseArgs() {
  const args = {
    prefix: '',
    interactive: false,
    help: false
  };

  process.argv.slice(2).forEach(arg => {
    if (arg.startsWith('--prefix=')) {
      args.prefix = arg.split('=')[1];
    } else if (arg === '--interactive') {
      args.interactive = true;
    } else if (arg === '--help') {
      args.help = true;
    } else if (!arg.startsWith('--')) {
      // Legacy support for just providing prefix as positional arg
      args.prefix = arg;
    }
  });

  return args;
}

// Show help text
function showHelp() {
  console.log(`
Create a tilesheet from individual tile images.

Usage: node tools/create-tilesheet-from-images.js [options]

Options:
  --prefix=<prefix>   Only include files starting with this prefix
  --interactive       Run in interactive mode to select which images to include
  --help              Show this help message

Examples:
  node tools/create-tilesheet-from-images.js --prefix=ts0
  node tools/create-tilesheet-from-images.js --interactive
  `);
}

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

// Interactive file selection mode
async function interactiveFileSelection(allFiles) {
  return new Promise((resolve) => {
    if (allFiles.length === 0) {
      console.error('No PNG files found in the source directory.');
      process.exit(1);
    }
    
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    console.log('\n=== Interactive Tile Selection ===');
    console.log('Select tiles to include in the tilesheet:');
    
    const selectedFiles = new Set();
    
    // Display all files with numbers
    allFiles.forEach((file, index) => {
      console.log(`  ${index + 1}: ${file}`);
    });
    
    console.log('\nCommands:');
    console.log('  a <number>       - Add a file by number');
    console.log('  r <number>       - Remove a file by number');
    console.log('  add <pattern>    - Add all files matching a pattern');
    console.log('  remove <pattern> - Remove all files matching a pattern');
    console.log('  list             - List current selection');
    console.log('  all              - Select all files');
    console.log('  none             - Clear selection');
    console.log('  done             - Finish selection and proceed');
    console.log('  quit             - Exit without creating tilesheet');
    
    // Function to display current selection
    const listSelection = () => {
      if (selectedFiles.size === 0) {
        console.log('\nNo files selected.');
        return;
      }
      
      console.log('\nSelected files:');
      const selectedList = [...selectedFiles].sort();
      selectedList.forEach((file, index) => {
        console.log(`  ${index + 1}: ${file}`);
      });
      console.log(`Total: ${selectedFiles.size} files selected`);
    };
    
    // Interactive prompt loop
    const promptUser = () => {
      rl.question('\n> ', (answer) => {
        const parts = answer.trim().split(' ');
        const command = parts[0].toLowerCase();
        const arg = parts.slice(1).join(' ');
        
        switch (command) {
          case 'a':
          case 'add':
            if (/^\d+$/.test(arg)) {
              // Add by number
              const index = parseInt(arg) - 1;
              if (index >= 0 && index < allFiles.length) {
                selectedFiles.add(allFiles[index]);
                console.log(`Added: ${allFiles[index]}`);
              } else {
                console.log('Invalid number.');
              }
            } else {
              // Add by pattern
              const addedCount = allFiles.filter(file => {
                if (file.includes(arg) && !selectedFiles.has(file)) {
                  selectedFiles.add(file);
                  return true;
                }
                return false;
              }).length;
              console.log(`Added ${addedCount} files matching pattern: ${arg}`);
            }
            break;
            
          case 'r':
          case 'remove':
            if (/^\d+$/.test(arg)) {
              // Remove by number
              const index = parseInt(arg) - 1;
              if (index >= 0 && index < allFiles.length) {
                selectedFiles.delete(allFiles[index]);
                console.log(`Removed: ${allFiles[index]}`);
              } else {
                console.log('Invalid number.');
              }
            } else {
              // Remove by pattern
              const removedCount = [...selectedFiles].filter(file => {
                if (file.includes(arg)) {
                  selectedFiles.delete(file);
                  return true;
                }
                return false;
              }).length;
              console.log(`Removed ${removedCount} files matching pattern: ${arg}`);
            }
            break;
            
          case 'list':
            listSelection();
            break;
            
          case 'all':
            allFiles.forEach(file => selectedFiles.add(file));
            console.log(`Selected all ${allFiles.length} files.`);
            break;
            
          case 'none':
            selectedFiles.clear();
            console.log('Cleared selection.');
            break;
            
          case 'done':
            if (selectedFiles.size === 0) {
              console.log('No files selected. Please select at least one file.');
              promptUser();
              return;
            }
            rl.close();
            resolve([...selectedFiles].sort());
            return;
            
          case 'quit':
          case 'exit':
            console.log('Exiting without creating tilesheet.');
            rl.close();
            process.exit(0);
            
          default:
            console.log('Unknown command. Type "done" to proceed or "quit" to exit.');
        }
        
        promptUser();
      });
    };
    
    promptUser();
  });
}

// Get selected files either by prefix filter or interactive selection
async function getSelectedFiles(args) {
  // Get all PNG files from directory
  const allFiles = getPngFilesFromDirectory(SOURCE_DIR);
  
  if (args.interactive) {
    // In interactive mode, let user select files
    console.log(`Found ${allFiles.length} PNG files in ${SOURCE_DIR}`);
    return await interactiveFileSelection(allFiles);
  } else {
    // In non-interactive mode, filter by prefix
    const filteredFiles = getPngFilesFromDirectory(SOURCE_DIR, args.prefix);
    
    if (filteredFiles.length === 0) {
      console.error(`No PNG files found${args.prefix ? ` with prefix "${args.prefix}"` : ''}`);
      process.exit(1);
    }
    
    return filteredFiles;
  }
}

// Create the tilesheet from selected files
async function createTilesheet(selectedFiles, prefix) {
  console.log(`Creating tilesheet with ${selectedFiles.length} selected files`);

  // Generate output filename with prefix if provided
  const finalOutputFilename = prefix 
    ? `${prefix}_terrain_tileset.png`
    : OUTPUT_FILENAME;
  const outputPath = path.join(OUTPUT_DIR, finalOutputFilename);
    
  // Check if the output file already exists
  if (fs.existsSync(outputPath)) {
    console.log(`Output file already exists: ${outputPath}`);
    console.log('Please delete it or choose a different prefix.');
    process.exit(1);
  }

  // Create output directory if it doesn't exist
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  // Calculate dimensions for the tilesheet
  // We'll use a square or nearly-square layout
  const tilesPerRow = Math.ceil(Math.sqrt(selectedFiles.length));
  const rows = Math.ceil(selectedFiles.length / tilesPerRow);

  console.log(`Creating a tilesheet with ${tilesPerRow} columns and ${rows} rows`);

  // Create a canvas with the appropriate dimensions
  const canvas = createCanvas(tilesPerRow * TILE_SIZE, rows * TILE_SIZE);
  const ctx = canvas.getContext('2d');

  // Fill with a transparent background
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Load and draw each image
  for (let i = 0; i < selectedFiles.length; i++) {
    const row = Math.floor(i / tilesPerRow);
    const col = i % tilesPerRow;
    const x = col * TILE_SIZE;
    const y = row * TILE_SIZE;
    
    try {
      const fileName = selectedFiles[i];
      const filePath = path.join(SOURCE_DIR, fileName);
      const image = await loadImage(filePath);
      
      // Draw the image using our center crop function
      drawImageCenteredAndCropped(ctx, image, x, y, TILE_SIZE, TILE_SIZE);
      
      console.log(`Added ${fileName} at position (${col}, ${row})`);
    } catch (error) {
      console.error(`Error loading image ${selectedFiles[i]}:`, error);
    }
  }

  // Create a tilesheet mapping for easy reference
  const tileMapping = selectedFiles.map((file, index) => {
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

  // Save the tilesheet
  const buffer = canvas.toBuffer('image/png');
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

// Main function
async function main() {
  // Parse command line arguments
  const args = parseArgs();
  
  // Show help if requested
  if (args.help) {
    showHelp();
    return;
  }
  
  try {
    // Get selected files based on mode
    const selectedFiles = await getSelectedFiles(args);
    
    // Create tilesheet from selected files
    await createTilesheet(selectedFiles, args.prefix);
  } catch (err) {
    console.error('Error creating tilesheet:', err);
    process.exit(1);
  }
}

// Execute the main function
main();
