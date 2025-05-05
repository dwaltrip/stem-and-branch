# Stem and Branch

A web-based factory and automation game, inspired by Factorio. Built with Phaser.js and TypeScript.

## Project Structure

The project is organized into frontend and backend directories. Here is the structure:

```
stem-and-branch/
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

4. Open your browser at http://localhost:1337

## Development

### Important Scripts

- `npm run start` - Start the webpack dev server for frontend
- `npm run build` - Build frontend for production
- `npm run dev` - Run simple HTTP server (alternative to webpack dev server)
- `npm run generate` - Generate placeholder tileset

## Controls

- Arrow Keys / WASD - Move player
- R - Regenerate map
- Q/E - Decrease/Increase noise scale
- 1/2 - Decrease/Increase noise octaves
