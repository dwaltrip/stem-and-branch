/**
 * Simple utility to generate a placeholder terrain tileset
 * Run with: node tools/generate-spritesheet.js
 */

const fs = require('fs');
const { createCanvas } = require('canvas');

// Import terrain colors from the game
const TERRAIN_COLORS = {
  WATER: 0x1a75ff,    // Bright blue
  SAND: 0xffd700,     // Gold/yellow
  GRASS: 0x32cd32,    // Lime green
  MOUNTAIN: 0x696969  // Dim gray
};

// Convert hex color to CSS format
function hexToRgb(hex) {
  return `#${hex.toString(16).padStart(6, '0')}`;
}

// Generate a simple tileset image
function generateTileset() {
  // Create a 2x2 tileset with 32px tiles
  const tileSize = 32;
  const canvas = createCanvas(tileSize * 2, tileSize * 2);
  const ctx = canvas.getContext('2d');

  // Water (top-left)
  ctx.fillStyle = hexToRgb(TERRAIN_COLORS.WATER);
  ctx.fillRect(0, 0, tileSize, tileSize);
  
  // Sand (top-right)
  ctx.fillStyle = hexToRgb(TERRAIN_COLORS.SAND);
  ctx.fillRect(tileSize, 0, tileSize, tileSize);
  
  // Grass (bottom-left)
  ctx.fillStyle = hexToRgb(TERRAIN_COLORS.GRASS);
  ctx.fillRect(0, tileSize, tileSize, tileSize);
  
  // Mountain (bottom-right)
  ctx.fillStyle = hexToRgb(TERRAIN_COLORS.MOUNTAIN);
  ctx.fillRect(tileSize, tileSize, tileSize, tileSize);

  // Add some simple identifying marks to each tile
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.lineWidth = 1;
  
  // Water - wavy lines
  ctx.beginPath();
  for (let i = 5; i < tileSize - 5; i += 8) {
    ctx.moveTo(5, i);
    ctx.quadraticCurveTo(tileSize/4, i+4, tileSize/2, i);
    ctx.quadraticCurveTo(3*tileSize/4, i-4, tileSize-5, i);
  }
  ctx.stroke();
  
  // Sand - dots
  for (let i = 8; i < tileSize; i += 8) {
    for (let j = 8; j < tileSize; j += 8) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.beginPath();
      ctx.arc(tileSize + i, j, 1, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  // Grass - small lines
  for (let i = 8; i < tileSize; i += 6) {
    ctx.beginPath();
    ctx.moveTo(i, tileSize + 5);
    ctx.lineTo(i, tileSize + 15);
    ctx.stroke();
  }
  
  // Mountain - triangles
  ctx.beginPath();
  ctx.moveTo(tileSize + tileSize/2, tileSize + 5);
  ctx.lineTo(tileSize + 5, tileSize + 25);
  ctx.lineTo(tileSize + tileSize - 5, tileSize + 25);
  ctx.closePath();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.stroke();

  // Save the result to a file
  const buffer = canvas.toBuffer('image/png');
  const outputDir = './assets/sprites';
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  fs.writeFileSync(`${outputDir}/terrain_tileset.png`, buffer);
  console.log(`Tileset generated at ${outputDir}/terrain_tileset.png`);
}

// Run the generator
generateTileset();