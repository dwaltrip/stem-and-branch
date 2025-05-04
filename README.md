# Hand and Gear

A web-based factory and automation game, inspired by Factorio. Built with Phaser.js and TypeScript.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Generate placeholder sprite assets:
```bash
npm run generate-sprites
```

3. Start the development server:
```bash
npm run start
```

4. Open your browser at http://localhost:8080

## Development

### Important Scripts

- `npm run start` - Start the webpack dev server
- `npm run build` - Build for production
- `npm run generate-sprites` - Generate placeholder tileset
- `bash ./tools/run-dev.sh` - Run simple HTTP server (alternative to webpack dev server)

### Project Structure

- `src/` - Source code
  - `GameConstants.ts` - Game configuration constants
  - `index.ts` - Entry point and game initialization
  - `scenes/` - Phaser scenes
  - `utils/` - Utilities like terrain generation

### Performance Notes

This project uses Phaser's TileMap system for rendering the terrain, which provides significant performance improvements over individual game objects. This allows for much larger maps while maintaining good performance.

## Controls

- Arrow Keys / WASD - Move player
- R - Regenerate map
- Q/E - Decrease/Increase noise scale
- 1/2 - Decrease/Increase noise octaves