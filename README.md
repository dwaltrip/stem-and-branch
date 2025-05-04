# Hand and Gear

A web-based factory and automation game, inspired by Factorio. Built with Phaser.js and TypeScript.

## Project Structure

The project is organized into frontend and backend directories to support future server functionality:

```
hand-and-gear/
├── frontend/             # Frontend application
│   ├── assets/           # Game assets (sprites, audio)
│   ├── css/              # Stylesheets
│   ├── dist/             # Built files
│   ├── src/              # Source code
│   │   ├── game/         # Game-specific code
│   │   │   ├── entities/ # Player and other game entities
│   │   │   ├── input/    # Input handling system
│   │   │   ├── scenes/   # Phaser game scenes
│   │   │   ├── terrain/  # Terrain generation and rendering
│   │   │   └── ui/       # User interface components
│   │   └── utils/        # General utilities
│   └── tools/            # Development tools
├── backend/              # Backend server (future)
└── README.md             # This file
```

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
npm run start:frontend
```

4. Open your browser at http://localhost:8080

## Development

### Important Scripts

- `npm run start:frontend` - Start the webpack dev server for frontend
- `npm run build:frontend` - Build frontend for production
- `npm run dev:frontend` - Run simple HTTP server (alternative to webpack dev server)
- `npm run generate-sprites` - Generate placeholder tileset

### Performance Notes

This project uses Phaser's TileMap system for rendering the terrain, which provides significant performance improvements over individual game objects. This allows for much larger maps while maintaining good performance.

## Controls

- Arrow Keys / WASD - Move player
- R - Regenerate map
- Q/E - Decrease/Increase noise scale
- 1/2 - Decrease/Increase noise octaves

## Future Backend Integration

The backend directory is reserved for future server-side code for multiplayer support, persistent worlds, and other server-based features.