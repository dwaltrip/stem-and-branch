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
  MOUNTAIN: 0x696969, // Dim gray
  IRON_ORE: 0x708090  // Slate gray for iron ore
};

// Convert hex color to CSS format
function hexToRgb(hex) {
  return `#${hex.toString(16).padStart(6, '0')}`;
}

// Generate a simple tileset image
function generateTileset() {
  // Create a 3x2 tileset with 32px tiles (now with 6 tiles total)
  const tileSize = 32;
  const canvas = createCanvas(tileSize * 3, tileSize * 2);
  const ctx = canvas.getContext('2d');

  // Row 1: Original terrain types
  // Water (top-left)
  ctx.fillStyle = hexToRgb(TERRAIN_COLORS.WATER);
  ctx.fillRect(0, 0, tileSize, tileSize);

  // Sand (top-middle)
  ctx.fillStyle = hexToRgb(TERRAIN_COLORS.SAND);
  ctx.fillRect(tileSize, 0, tileSize, tileSize);

  // Iron ore (top-right)
  ctx.fillStyle = hexToRgb(TERRAIN_COLORS.IRON_ORE);
  ctx.fillRect(tileSize * 2, 0, tileSize, tileSize);

  // Row 2: More terrain and entity types
  // Grass (bottom-left)
  ctx.fillStyle = hexToRgb(TERRAIN_COLORS.GRASS);
  ctx.fillRect(0, tileSize, tileSize, tileSize);

  // Mountain (bottom-middle)
  ctx.fillStyle = hexToRgb(TERRAIN_COLORS.MOUNTAIN);
  ctx.fillRect(tileSize, tileSize, tileSize, tileSize);

  // Miner (bottom-right) - transparent background
  // We don't fill this one since it needs to be transparent

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

  // Iron Ore - scattered chunks
  ctx.fillStyle = 'rgba(100, 100, 100, 0.8)';
  for (let i = 0; i < 7; i++) {
    const x = tileSize * 2 + 5 + Math.random() * (tileSize - 10);
    const y = 5 + Math.random() * (tileSize - 10);
    const size = 4 + Math.random() * 3;

    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }

  // Highlight bits in the ore
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  for (let i = 0; i < 8; i++) {
    const x = tileSize * 2 + 8 + Math.random() * (tileSize - 16);
    const y = 8 + Math.random() * (tileSize - 16);
    const size = 1 + Math.random() * 1.5;

    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }

  // Miner - simple machine on transparent background
  const minerX = tileSize * 2;
  const minerY = tileSize;

  // Draw a simple miner machine (box with details)
  ctx.fillStyle = '#555555'; // Dark gray base
  ctx.fillRect(minerX + 6, minerY + 10, tileSize - 12, tileSize - 16);

  // Machine top/hood
  ctx.fillStyle = '#777777'; // Lighter gray for top
  ctx.beginPath();
  ctx.moveTo(minerX + 4, minerY + 10);
  ctx.lineTo(minerX + tileSize - 4, minerY + 10);
  ctx.lineTo(minerX + tileSize - 7, minerY + 6);
  ctx.lineTo(minerX + 7, minerY + 6);
  ctx.closePath();
  ctx.fill();

  // Drill bit
  ctx.fillStyle = '#999999'; // Light gray for drill
  ctx.fillRect(minerX + 13, minerY + 3, 6, 7);

  // Control panel
  ctx.fillStyle = '#333333'; // Dark panel
  ctx.fillRect(minerX + 10, minerY + 15, 12, 8);

  // Indicator lights
  ctx.fillStyle = '#ff0000'; // Red light
  ctx.beginPath();
  ctx.arc(minerX + 13, minerY + 19, 1.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#00ff00'; // Green light
  ctx.beginPath();
  ctx.arc(minerX + 19, minerY + 19, 1.5, 0, Math.PI * 2);
  ctx.fill();

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
